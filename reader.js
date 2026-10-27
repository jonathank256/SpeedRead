// Reading logic: no DOM, no PDF code, so it can be tested on its own.

// Splits the text into words. Whitespace of any kind separates words, and is used as the delimiter. Boolean filter to remove empty string returns.
export function toWords(text) {
  return text.split(/\s+/).filter(Boolean);
}

// Index of the letter the eye should land on (the "optimal recognition point").
// Slightly left of centre, these cut-offs are a common rule of thumb and ignore leading or trailing punctuation.
export function focusIndex(word) {
  const lead = word.match(/^\W*/)[0].length; // skips "(" or quote marks
  const core = word.slice(lead).replace(/\W+$/, ""); // letters without trailing punctuation
  let i;
  const n = core.length;
  if (n <= 1) i = 0;
  else if (n <= 5) i = 1;
  else if (n <= 9) i = 2;
  else if (n <= 13) i = 3;
  else i = 4;
  return lead + i;
}

// Split a word into the part before the focus letter, the letter, and the rest, for display purposes.
// Returns three portions separately
export function splitAtFocus(word) {
  const i = focusIndex(word);
  return [word.slice(0, i), word[i] ?? "", word.slice(i + 1)];
}

// How long to show a word, in milliseconds.
// Base time comes from WPM, punctuation and longer words receive extra time.
// Due to extra pauses real reading rate is below what is set, but helps comprehension.
// Also grants additional time for end of sentence, and clause break indicated by punctuation.
export function wordDelay(word, wpm) {
  const base = 60000 / wpm;
  let factor = 1;
  if (/[.!?]["')\]]*$/.test(word)) factor = 2; // end of sentence
  else if (/[,;:]["')\]]*$/.test(word)) factor = 1.5; // clause break
  if (word.length > 8) factor = 1.3; // long word
  return base * factor;
}

// ---------- chapters ----------

const ONES = "one|two|three|four|five|six|seven|eight|nine";
const TEENS = "ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen";
const TENS = "twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety";
// Ensures any number of chapters work, and later chapters are not mis-recognized
const NUMBER_WORDS = `(?:${TENS})(?:[-\\s](?:${ONES}))?|${TEENS}|${ONES}`;

// "Chapter" at the start of a line, then a number: 12, XII, or Twelve.
const CHAPTER_LINE = new RegExp(`^\\s*chapter\\s+(\\d+|[ivxlcdm]+|${NUMBER_WORDS})\\b`, "i");

// Ensure we do not detect the table of contents by ensuring a minimal level of separation
const MIN_CHAPTER_GAP = 50;

// Find chapter starts. Returns [{ label, index }] where index is a word position
// that lines up with toWords(text).
export function findChapters(text) {
  const matches = [];
  let wordCount = 0;
  for (const line of text.split("\n")) {
    const m = line.match(CHAPTER_LINE);
    if (m) matches.push({ label: `Chapter ${m[1]}`, index: wordCount });
    wordCount += toWords(line).length;
  }

  // Group matches into runs: consecutive matches close together, each a different
  // chapter. A run of two or more is a table of contents. A repeated chapter
  // ends the run, because a contents list names each chapter only once.
  const runs = [];
  let run = [];
  for (const m of matches) {
    const last = run.at(-1);
    const continuesRun = last
      && m.index - last.index < MIN_CHAPTER_GAP
      && !run.some((r) => r.label.toLowerCase() === m.label.toLowerCase());
    if (!continuesRun) {
      if (run.length) runs.push(run);
      run = [];
    }
    run.push(m);
  }
  if (run.length) runs.push(run);
  const notContents = runs.filter((r) => r.length === 1).map((r) => r[0]);

  // Keep the first occurrence of each chapter (later ones are running headers).
  const seen = new Set();
  return notContents.filter((m) => {
    const key = m.label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}