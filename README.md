# Speed Reader

Load a PDF and read it one word at a time (RSVP), at 50 to 750 words per minute.
Each word is aligned on a highlighted focus letter so your eyes don't have to move.

## Run it

The page uses ES modules, so it has to be served over HTTP (opening the file directly won't work):

```
python -m http.server 8000
```

Then open http://localhost:8000.

## Tests

```
npm install
npm test
```

## Files

- `reader.js`: splitting text into words, picking the focus letter, how long to show each word
- `extract.js`: getting text out of a PDF with pdf.js
- `app.js`: the page: loading, playback, controls
- `index.html`, `style.css`: layout

## Known limitations

- Text is read in the order pdf.js returns it, so two-column papers may interleave columns.
- Running headers, footers, page numbers and reference lists are read out like body text.
- Pauses after punctuation and long words make the real reading rate slightly lower than the WPM setting.
- Scanned PDFs (images, no text layer) aren't supported.
