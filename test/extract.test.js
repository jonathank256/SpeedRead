import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { extractText } from "../extract.js";
import { toWords } from "../reader.js";

test("extracts words from a two-page PDF in order", async () => {
  const data = new Uint8Array(await readFile(new URL("./fixtures/sample.pdf", import.meta.url)));
  const words = toWords(await extractText(pdfjsLib, data));
  assert.equal(words[0], "The");
  assert.ok(words.includes("classification"), "hyphen at line break should be joined");
  assert.ok(words.includes("twenty-four"), "real hyphens should stay");
  assert.equal(words.at(-1), "here.");
  assert.equal(words.length, 30);
});
