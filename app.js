// Wires the page together. loads a PDF, then show its words one at a time.
// Webpage imports due to Node application.
import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs";
import { extractText } from "./extract.js";
import { toWords, splitAtFocus, wordDelay } from "./reader.js";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

const $ = (id) => document.getElementById(id);
const ui = {
  file: $("file"), fileLabel: $("file-label"),
  before: $("before"), focus: $("focus"), after: $("after"),
  progress: $("progress"), status: $("status"),
  play: $("play"), back: $("back"), forward: $("forward"),
  wpm: $("wpm"), wpmValue: $("wpm-value"),
};

const state = {
  words: [],
  index: 0, // word currently on screen
  playing: false,
  timer: null,
  nextAt: 0, // when the next word is due (ms, performance.now clock)
};

// ---------- display ----------

function showWord() {
  const word = state.words[state.index] ?? "";
  const [before, focus, after] = splitAtFocus(word); // split into focus to render in unique color
  // establish text content to be displayed by split at each time
  ui.before.textContent = before;
  ui.focus.textContent = focus;
  ui.after.textContent = after;
  ui.progress.value = state.index; // uses direct index from state to determine total progress
  const n = state.words.length; // progress through document
  ui.status.textContent = n ? `Word ${state.index + 1} of ${n}` : "No document loaded";
}

// ---------- playback ----------

// Each word is scheduled against an absolute time, so small timer lateness doesn't add up over a long document.
function tick() {
  showWord();
  const delay = wordDelay(state.words[state.index], Number(ui.wpm.value)); // delay varies as a function of word length and sentence position for comprehension
  state.nextAt += delay;
  state.timer = setTimeout(advance, Math.max(0, state.nextAt - performance.now()));
}
// advance through wordlist, end if end of document, factor delays
function advance() {
  if (state.index >= state.words.length - 1) return pause();
  state.index++;
  tick();
}
// feature to start/resume text display, resets to beginning if document finished
function play() {
  if (!state.words.length) return;
  if (state.index >= state.words.length - 1) state.index = 0; // restart at end
  state.playing = true;
  ui.play.textContent = "Pause";
  state.nextAt = performance.now();
  tick();
}
// stop playback
function pause() {
  state.playing = false;
  clearTimeout(state.timer);
  ui.play.textContent = "Play";
}

function togglePlay() {
  state.playing ? pause() : play();
}
// seek a specific position in the document, relative to if was playing. Pauses during seek process then resumes play iff was playing
function seek(to) {
  const wasPlaying = state.playing;
  pause();
  state.index = Math.min(Math.max(0, to), Math.max(0, state.words.length - 1));
  showWord();
  if (wasPlaying) play();
}
// set the current wpm
function setWpm(value) {
  ui.wpm.value = value; // the browser clamps to min/max/step
  ui.wpmValue.textContent = ui.wpm.value;
}

// ---------- loading ----------
// handles errors for no words and no pdf, loads the pdf to the application with a pause buffer
async function loadPdf(file) {
  pause();
  ui.fileLabel.textContent = file.name;
  ui.status.textContent = "Reading PDF…";
  ui.play.disabled = true;
  try {
    const data = new Uint8Array(await file.arrayBuffer());
    state.words = toWords(await extractText(pdfjsLib, data));
  } catch (err) {
    console.error(err);
    state.words = [];
    ui.status.textContent = "Unable to read the given PDF.";
    return;
  }
  if (!state.words.length) {
    ui.status.textContent = "No text found in this PDF.";
    return;
  }
  state.index = 0;
  ui.progress.max = state.words.length - 1;
  ui.play.disabled = false;
  showWord();
}

// ---------- events ----------

ui.file.addEventListener("change", () => {
  const file = ui.file.files[0];
  if (file) loadPdf(file);
});
ui.play.addEventListener("click", togglePlay);
ui.back.addEventListener("click", () => seek(state.index - 10));
ui.forward.addEventListener("click", () => seek(state.index + 10));
ui.progress.addEventListener("input", () => seek(Number(ui.progress.value)));
ui.wpm.addEventListener("input", () => setWpm(ui.wpm.value));

document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" && e.target.type !== "range") return;
  const actions = {
    " ": togglePlay,
    ArrowLeft: () => seek(state.index - 10),
    ArrowRight: () => seek(state.index + 10),
    ArrowUp: () => setWpm(Number(ui.wpm.value) + 25),
    ArrowDown: () => setWpm(Number(ui.wpm.value) - 25),
  };
  const action = actions[e.key];
  if (action && state.words.length) {
    e.preventDefault(); // stop space from clicking buttons and arrows from moving sliders
    action();
  }
});

setWpm(ui.wpm.value);
