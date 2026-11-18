import { randomBytes } from "node:crypto";
import path from "node:path";

function wrapBase64(value) {
  const text = Buffer.from(value).toString("base64");
  return text.replace(/.{1,76}/g, "$&\r\n").trim();
}

function headerValue(value) {
  const text = String(value || "").replace(/[\r\n]+/g, " ").trim();
  if (/^[\x20-\x7e]*$/.test(text)) return text;
  return `=?UTF-8?B?${Buffer.from(text, "utf8").toString("base64")}?=`;
}

export function buildEml({ fromName, fromEmail, to, subject, body, attachment }) {
  const boundary = `daybook_${randomBytes(8).toString("hex")}`;
  const from = fromEmail
    ? `${headerValue(fromName || "Applicant")} <${fromEmail}>`
    : headerValue(fromName || "Applicant");
  const lines = [
    `From: ${from}`,
    `To: ${to ? headerValue(to) : ""}`,
    `Subject: ${headerValue(subject)}`,
    "MIME-Version: 1.0",
    "X-Unsent: 1",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    String(body || "").replace(/\r?\n/g, "\r\n"),
    "",
  ];
  if (attachment?.content) {
    const filename = path.basename(attachment.filename || "resume.txt").replace(/[^\w.\-]+/g, "_");
    const type = attachment.contentType || "application/octet-stream";
    lines.push(
      `--${boundary}`,
      `Content-Type: ${type}; name="${filename}"`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${filename}"`,
      "",
      wrapBase64(attachment.content),
      "",
    );
  }
  lines.push(`--${boundary}--`, "");
  return lines.join("\r\n");
}

export function subjectFor(job, profile) {
  const who = profile.name ? ` - ${profile.name}` : "";
  return `Application: ${job.title}${who}`.replace(/\s+/g, " ").trim();
}
