import { test } from "node:test";
import assert from "node:assert/strict";
import { findChapters, toWords } from "../reader.js";

const filler = (n) => Array(n).fill("word").join(" ");

test("finds chapters at the start of lines", () => {
  const text = `Chapter 1\n${filler(100)}\nChapter 2\n${filler(100)}`;
  assert.deepEqual(findChapters(text), [
    { label: "Chapter 1", index: 0 },
    { label: "Chapter 2", index: 102 },
  ]);
});

test("index points at the word 'Chapter' in the full word list", () => {
  const text = `Title page\n${filler(80)}\nCHAPTER XII\n${filler(80)}`;
  const [ch] = findChapters(text);
  assert.equal(toWords(text)[ch.index], "CHAPTER");
  assert.equal(ch.label, "Chapter XII");
});

test("accepts spelled-out numbers", () => {
  const [ch] = findChapters(`Chapter Three: The Storm\n${filler(60)}`);
  assert.equal(ch.label, "Chapter Three");
});

test("ignores references in the middle of a line", () => {
  const text = `${filler(60)} as shown in Chapter 3 earlier\n${filler(60)}`;
  assert.deepEqual(findChapters(text), []);
});

test("ignores the table of contents", () => {
  const toc = "Contents\nChapter 1 Beginnings 1\nChapter 2 Middles 20\nChapter 3 Ends 40\n";
  const body = `Chapter 1\n${filler(100)}\nChapter 2\n${filler(100)}\nChapter 3\n${filler(100)}`;
  const labels = findChapters(toc + filler(200) + "\n" + body).map((c) => c.label);
  assert.deepEqual(labels, ["Chapter 1", "Chapter 2", "Chapter 3"]);
  // they point at the body, not the contents page
  const first = findChapters(toc + filler(200) + "\n" + body)[0];
  assert.ok(first.index > 200);
});

test("ignores running headers that repeat the chapter", () => {
  const page = (n) => `Chapter ${n}\n${filler(300)}\n`;
  const text = page(1) + page(1) + page(1) + page(2) + page(2);
  assert.deepEqual(findChapters(text).map((c) => c.index), [0, 906]);
});

test("does not match words that merely start with 'chapter'", () => {
  assert.deepEqual(findChapters(`Chapters 1 to 4 cover\n${filler(60)}`), []);
});

test("keeps chapter 1 when it follows the contents page closely", () => {
  const filler = Array(100).fill("word").join(" ");
  const toc = "Contents\nChapter 1 Beginnings\nChapter 2 Middles\nChapter 3 Ends\n";
  const body = `Chapter 1\n${filler}\nChapter 2\n${filler}\nChapter 3\n${filler}`;
  const chapters = findChapters(toc + "For my parents\n" + body);
  assert.deepEqual(chapters.map((c) => c.label), ["Chapter 1", "Chapter 2", "Chapter 3"]);
  assert.ok(chapters[0].index > 10, "Chapter 1 should point at the body, not the contents");
});