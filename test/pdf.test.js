import test from "node:test";
import assert from "node:assert/strict";
import zlib from "node:zlib";
import { pdfToText } from "../src/pdf.js";

function pdfWith(streamBody, { filter = false, image = false } = {}) {
  const payload = Buffer.from(streamBody);
  const data = filter ? zlib.deflateSync(payload) : payload;
  const dict = image
    ? `<< /Subtype /Image /Length ${data.length} >>`
    : filter
      ? `<< /Length ${data.length} /Filter /FlateDecode >>`
      : `<< /Length ${data.length} >>`;
  return Buffer.concat([
    Buffer.from("%PDF-1.4\n"),
    Buffer.from(`${dict}\nstream\n`),
    data,
    Buffer.from("\nendstream\n%%EOF\n"),
  ]);
}

test("reads plain and compressed PDF text and skips images", () => {
  const sentence = "Steph John has 11 years with Shopify and Amazon Seller Central.";
  const plain = pdfToText(pdfWith(`BT (${sentence}) Tj ET`));
  assert.match(plain, /Steph John/);
  assert.match(plain, /Shopify/);
  const packed = pdfToText(pdfWith(`BT (${sentence}) Tj ET`, { filter: true }));
  assert.match(packed, /Amazon Seller Central/);
  const mixed = pdfToText(Buffer.concat([
    pdfWith("(Secret pixels)", { image: true }),
    pdfWith(`BT (${sentence}) Tj ET`),
  ]));
  assert.match(mixed, /Steph John/);
  assert.doesNotMatch(mixed, /Secret pixels/);
});
