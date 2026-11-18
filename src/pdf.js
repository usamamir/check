import zlib from "node:zlib";

function stringsFromContent(content) {
  const found = [];
  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    if (char === "(") {
      const read = readLiteral(content, index);
      if (read.text.trim()) found.push(decodeText(read.text));
      index = read.next - 1;
    } else if (char === "<" && content[index + 1] !== "<") {
      const read = readHex(content, index);
      if (read.text.trim()) found.push(read.text);
      index = read.next - 1;
    }
  }
  return found.join(" ");
}

function readLiteral(content, start) {
  let text = "";
  let depth = 1;
  for (let index = start + 1; index < content.length; index += 1) {
    const char = content[index];
    if (char === "\\") {
      const next = content[index + 1] || "";
      const mapped = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", "(": "(", ")": ")", "\\": "\\" }[next];
      if (mapped !== undefined) {
        text += mapped;
        index += 1;
        continue;
      }
      if (/[0-7]/.test(next)) {
        const octal = content.slice(index + 1, index + 4).match(/^[0-7]{1,3}/)?.[0] || "";
        text += String.fromCharCode(parseInt(octal, 8));
        index += octal.length;
        continue;
      }
      text += next;
      index += 1;
      continue;
    }
    if (char === "(") {
      depth += 1;
      text += char;
      continue;
    }
    if (char === ")") {
      depth -= 1;
      if (depth === 0) return { text, next: index + 1 };
      text += char;
      continue;
    }
    text += char;
  }
  return { text, next: content.length };
}

function readHex(content, start) {
  const end = content.indexOf(">", start + 1);
  if (end < 0) return { text: "", next: content.length };
  const hex = content.slice(start + 1, end).replace(/\s+/g, "");
  if (!hex || hex.length < 4 || /[^0-9a-f]/i.test(hex)) return { text: "", next: end + 1 };
  const bytes = [];
  for (let index = 0; index + 1 < hex.length; index += 2) {
    bytes.push(parseInt(hex.slice(index, index + 2), 16));
  }
  let text = "";
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    for (let index = 2; index + 1 < bytes.length; index += 2) {
      text += String.fromCharCode((bytes[index] << 8) | bytes[index + 1]);
    }
  } else {
    text = Buffer.from(bytes).toString("latin1");
  }
  return { text, next: end + 1 };
}

function decodeText(text) {
  if (text.charCodeAt(0) === 0xfe && text.charCodeAt(1) === 0xff) {
    let out = "";
    for (let index = 2; index + 1 < text.length; index += 2) {
      out += String.fromCharCode((text.charCodeAt(index) << 8) | text.charCodeAt(index + 1));
    }
    return out;
  }
  if (text.includes("\u0000")) return text.replace(/\u0000/g, "");
  return text;
}

function tidy(text) {
  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function dictBefore(buffer, marker) {
  let end = marker;
  while (end > 0 && (buffer[end - 1] === 32 || buffer[end - 1] === 10 || buffer[end - 1] === 13 || buffer[end - 1] === 9)) {
    end -= 1;
  }
  if (end < 2 || buffer[end - 1] !== 62 || buffer[end - 2] !== 62) return "";
  const start = buffer.lastIndexOf(Buffer.from("<<"), end - 1);
  if (start < 0 || end - start > 4000) return "";
  return buffer.slice(start, end).toString("latin1");
}

export function pdfToText(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  const parts = [];
  let cursor = 0;
  const streamToken = Buffer.from("stream");
  while (cursor < buffer.length) {
    const marker = buffer.indexOf(streamToken, cursor);
    if (marker < 0) break;
    if (marker >= 3 && buffer.slice(marker - 3, marker).toString("latin1") === "end") {
      cursor = marker + streamToken.length;
      continue;
    }
    const header = dictBefore(buffer, marker);
    let dataStart = marker + streamToken.length;
    if (buffer[dataStart] === 0x0d) dataStart += 1;
    if (buffer[dataStart] === 0x0a) dataStart += 1;
    const lengthMatch = header.match(/\/Length\s+(\d+)/);
    let data;
    let next;
    if (lengthMatch) {
      const length = Number(lengthMatch[1]);
      data = buffer.slice(dataStart, dataStart + length);
      next = dataStart + length;
    } else {
      const end = buffer.indexOf(Buffer.from("endstream"), dataStart);
      if (end < 0) break;
      data = buffer.slice(dataStart, end);
      if (data[data.length - 1] === 0x0a) data = data.subarray(0, -1);
      if (data[data.length - 1] === 0x0d) data = data.subarray(0, -1);
      next = end + "endstream".length;
    }
    if (/\/Subtype\s*\/Image/.test(header)) {
      cursor = Math.max(next, marker + streamToken.length);
      continue;
    }
    let decoded = data;
    if (/FlateDecode/.test(header)) {
      try {
        decoded = zlib.inflateSync(data);
      } catch {
        try {
          decoded = zlib.inflateRawSync(data);
        } catch {
          decoded = Buffer.alloc(0);
        }
      }
    }
    const text = stringsFromContent(decoded.toString("latin1"));
    if (text.trim()) parts.push(text);
    cursor = Math.max(next, marker + streamToken.length);
  }
  return tidy(parts.join("\n"));
}
