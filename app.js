// Wires the page together: load a PDF, then show its words one at a time.
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
  index: 0,      // word currently on screen
  playing: false,
  timer: null,
  nextAt: 0,     // when the next word is due (ms, performance.now clock)
};

// ---------- display ----------

function showWord() {
  const word = state.words[state.index] ?? "";
  const [before, focus, after] = splitAtFocus(word);
  ui.before.textContent = before;
  ui.focus.textContent = focus;
  ui.after.textContent = after;
  ui.progress.value = state.index;
  const n = state.words.length;
  ui.status.textContent = n ? `Word ${state.index + 1} of ${n}` : "No document loaded";
}

// ---------- playback ----------

// Each word is scheduled against an absolute time, not "delay after the last
// timer fired", so small timer lateness doesn't add up over a long document.
function tick() {
  showWord();
  const delay = wordDelay(state.words[state.index], Number(ui.wpm.value));
  state.nextAt += delay;
  state.timer = setTimeout(advance, Math.max(0, state.nextAt - performance.now()));
}

function advance() {
  if (state.index >= state.words.length - 1) return pause();
  state.index++;
  tick();
}

function play() {
  if (!state.words.length) return;
  if (state.index >= state.words.length - 1) state.index = 0; // restart at end
  state.playing = true;
  ui.play.textContent = "Pause";
  state.nextAt = performance.now();
  tick();
}

function pause() {
  state.playing = false;
  clearTimeout(state.timer);
  ui.play.textContent = "Play";
}

function togglePlay() {
  state.playing ? pause() : play();
}

function seek(to) {
  const wasPlaying = state.playing;
  pause();
  state.index = Math.min(Math.max(0, to), Math.max(0, state.words.length - 1));
  showWord();
  if (wasPlaying) play();
}

function setWpm(value) {
  ui.wpm.value = value; // the browser clamps to min/max/step
  ui.wpmValue.textContent = ui.wpm.value;
}

// ---------- loading ----------

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
    ui.status.textContent = "Couldn't read that PDF.";
    return;
  }
  if (!state.words.length) {
    ui.status.textContent = "No text found (the PDF may be scanned images).";
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
