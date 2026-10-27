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
  const n = core.length;
  if (n <= 1) i = 0;
  if (n <= 5) i = 1;
  if (n <= 9) i = 2;
  if (n <= 13) i = 3;
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
