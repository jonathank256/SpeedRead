// Pure reading logic: no DOM, no PDF code, so it can be tested on its own.

// Split text into words. Whitespace of any kind separates words.
export function toWords(text) {
  return text.split(/\s+/).filter(Boolean);
}

// Index of the letter the eye should land on (the "optimal recognition point").
// Slightly left of centre; these cut-offs are the common rule of thumb.
export function focusIndex(word) {
  const n = word.length;
  if (n <= 1) return 0;
  if (n <= 5) return 1;
  if (n <= 9) return 2;
  if (n <= 13) return 3;
  return 4;
}

// Split a word into the part before the focus letter, the letter, and the rest.
export function splitAtFocus(word) {
  const i = focusIndex(word);
  return [word.slice(0, i), word[i] ?? "", word.slice(i + 1)];
}

// How long to show a word, in milliseconds.
// Base time comes from WPM; punctuation and long words get extra time.
// Note: the extra pauses mean the real reading rate is a bit below the WPM setting.
export function wordDelay(word, wpm) {
  const base = 60000 / wpm;
  let factor = 1;
  if (/[.!?]["')\]]*$/.test(word)) factor = 2;        // end of sentence
  else if (/[,;:]["')\]]*$/.test(word)) factor = 1.5; // clause break
  if (word.length > 8) factor += 0.3;                 // long word
  return base * factor;
}
