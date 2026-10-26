import { test } from "node:test";
import assert from "node:assert/strict";
import { toWords, focusIndex, splitAtFocus, wordDelay } from "../reader.js";
import { cleanText } from "../extract.js";

test("toWords splits on any whitespace", () => {
  assert.deepEqual(toWords("  one two\n\tthree "), ["one", "two", "three"]);
});
test("focus letter sits left of centre", () => {
  assert.equal(focusIndex("a"), 0);
  assert.equal(focusIndex("read"), 1);
  assert.equal(focusIndex("pipeline"), 2);
  assert.deepEqual(splitAtFocus("reading"), ["re", "a", "ding"]);
});
test("delay matches WPM at the ends of the range", () => {
  assert.equal(wordDelay("cat", 50), 1200);
  assert.equal(wordDelay("cat", 750), 80);
});
test("punctuation adds pauses", () => {
  assert.equal(wordDelay("end.", 60), 2000);
  assert.equal(wordDelay("end.)", 60), 2000);
  assert.equal(wordDelay("so,", 60), 1500);
});
test("cleanText joins hyphenated line breaks and ligatures", () => {
  assert.equal(cleanText("classi-\nfication of ﬁles"), "classification of files");
  assert.equal(cleanText("Leave-One-Subject"), "Leave-One-Subject");
});
