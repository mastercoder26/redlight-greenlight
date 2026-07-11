// ---------- refs ----------

const stage = document.getElementById("stage");
const doll = document.getElementById("doll");
const signal = document.getElementById("signal");
const signalText = document.getElementById("signalText");
const runner = document.getElementById("runner");
const distanceValue = document.getElementById("distanceValue");
const bestValue = document.getElementById("bestValue");
const attemptsValue = document.getElementById("attemptsValue");
const log = document.getElementById("log");
const overlay = document.getElementById("overlay");
const stamp = document.getElementById("stamp");
const startBtn = document.getElementById("startBtn");

// ---------- state ----------

const SPEED = 26;          // % of track per second while running
const GRACE_MS = 220;      // ms of leniency after light turns red
const WIN_DISTANCE = 100;  // %

let light = "red";         // "red" | "green"
let holding = false;
let running = false;       // is a round currently in progress
let distance = 0;
let lastFrame = 0;
let best = Number(localStorage.getItem("rlgl_best") || 0);
let attempts = Number(localStorage.getItem("rlgl_attempts") || 0);

bestValue.textContent = best + "%";
attemptsValue.textContent = attempts;

// ---------- log ticker ----------

function logLine(text, tone) {
  const p = document.createElement("p");
  const t = new Date();
  const stamp = String(t.getMinutes()).padStart(2, "0") + ":" + String(t.getSeconds()).padStart(2, "0");
  p.textContent = "[" + stamp + "] " + text;
  if (tone) p.className = tone;
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
}

// ---------- light scheduler ----------
// Flips between green/red on a random interval and fires a grace-period
// check whenever it switches to red, so a held key isn't punished instantly.

let lightTimer = null;
let graceTimer = null;

function randomDuration() {
  return 1200 + Math.random() * 2600; // 1.2s - 3.8s
}

function setLight(next) {
  light = next;
  signal.classList.toggle("is-green", next === "green");
  signal.classList.toggle("is-red", next === "red");
  signalText.textContent = next === "green" ? "RUN" : "STOP";
  doll.classList.toggle("is-facing", next === "green");
  playTone(next === "green" ? 660 : 220);
  logLine(next === "green" ? "Light turns GREEN." : "Light turns RED. Freeze!");

  if (next === "red") {
    clearTimeout(graceTimer);
    graceTimer = setTimeout(() => {
      if (holding && running) eliminate("You moved on red.");
    }, GRACE_MS);
  }
}

function scheduleNextLight() {
  clearTimeout(lightTimer);
  lightTimer = setTimeout(() => {
    setLight(light === "green" ? "red" : "green");
    scheduleNextLight();
  }, randomDuration());
}

function stopScheduler() {
  clearTimeout(lightTimer);
  clearTimeout(graceTimer);
}
