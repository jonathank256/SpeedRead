# Speed Reader

![Tests](https://github.com/jonathank256/SpeedRead/actions/workflows/test.yml/badge.svg)

Load a PDF and read it one word at a time (RSVP), at 50 to 750 words per minute.
Each word is aligned on a highlighted focus letter so that your eyes don't have to move.

## Run it

**In your browser:** https://jonathank256.github.io/SpeedRead/

No installations are needed. PDFs are processed entirely in your browser and never uploaded.

**Locally:** the page uses JavaScript modules, which browsers block on pages opened
straight from disk, so serve the folder over HTTP. From the project folder, either:

```
python -m http.server 8000
```

or, with Node installed:

```
npx serve
```

Then open http://localhost:8000 (or the address `npx serve` prints).

## Features

Keyboard controls allow for pause/play, skipping forwards and backwards, and adjusting WPM.
The space bar controls play/pause, the up/down arrow keys control WPM, and left/right arrow
keys control skipping.

Variable pauses are introduced depending on word length (longer words allow for more time), and
clause breaks (e.g. ",") and sentence ends (".") also increase the delay before the next word is
shown. These occur when a reader would naturally slow down.

A chapter select menu finds headings written as numbers (`Chapter 12`), Roman numerals
(`Chapter XII`) or words (`Chapter Twelve`). It is able to avoid false matches in three ways:
"Chapter" must start a line, which skips in-text mentions like "see Chapter 3"; runs of chapter 
mentions close together are treated as the table of contents and skipped; and only the first instance 
of each chapter is kept, which skips running headers.

## Tests

```
npm install
npm test
```

## Files

- `reader.js`: splitting text into words, picking the focus letter, how long to show each word, chapter select handling
- `extract.js`: getting text out of a PDF with pdf.js
- `app.js`: the page: loading, playback, controls
- `index.html`, `style.css`: layout

## Limitations

- Text is read in the order pdf.js returns it, so two-column papers may interleave columns.
- Running headers, footers, page numbers and reference lists are read out like body text.
- Chapters are only found when the heading starts with the word "Chapter"; headings like "1. The Beginning" or just "XII" are missed.
- (Intended) pauses after punctuation and long words make the real reading rate slightly lower than the WPM setting.
- Scanned PDFs (images, no text layer) aren't supported.

## How this was built
Claude Code was used as a coding assistant. All code has been reviewed in full, and the 
included tests cover the core logic.
