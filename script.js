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
  const timestamp = String(t.getMinutes()).padStart(2, "0") + ":" + String(t.getSeconds()).padStart(2, "0");
  p.textContent = "[" + timestamp + "] " + text;
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

// ---------- input ----------

window.addEventListener("keydown", (e) => {
  if (e.code !== "Space") return;
  e.preventDefault();
  if (holding) return;
  holding = true;
  stage.classList.add("is-holding");

  if (!running) return;

  if (light === "red") {
    eliminate("You took off during red.");
  }
});

window.addEventListener("keyup", (e) => {
  if (e.code !== "Space") return;
  e.preventDefault();
  holding = false;
  stage.classList.remove("is-holding");
});

// ---------- main loop ----------

function frame(now) {
  if (!running) return;

  const dt = Math.min(now - lastFrame, 60) / 1000;
  lastFrame = now;

  if (holding && light === "green") {
    distance = Math.min(WIN_DISTANCE, distance + SPEED * dt);
    runner.style.left = distance + "%";
    distanceValue.textContent = Math.floor(distance) + "%";

    if (distance >= WIN_DISTANCE) {
      win();
      return;
    }
  }

  requestAnimationFrame(frame);
}

// ---------- sound (tiny WebAudio beeps, no assets) ----------

let audioCtx = null;

function playTone(freq) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = "square";
    gain.gain.value = 0.05;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
    osc.stop(audioCtx.currentTime + 0.2);
  } catch (err) {
    // audio isn't essential, fail silently
  }
}

// ---------- end states ----------

function endRound() {
  running = false;
  stopScheduler();
  attempts += 1;
  localStorage.setItem("rlgl_attempts", attempts);
  attemptsValue.textContent = attempts;

  if (distance > best) {
    best = Math.floor(distance);
    localStorage.setItem("rlgl_best", best);
    bestValue.textContent = best + "%";
  }
}

function win() {
  distance = WIN_DISTANCE;
  runner.style.left = "100%";
  distanceValue.textContent = "100%";
  logLine("You crossed the line. Survived!", "is-good");
  endRound();

  stamp.textContent = "SURVIVED";
  stamp.classList.add("is-win");
  overlay.classList.add("is-visible");
  startBtn.textContent = "RUN AGAIN";
}

function eliminate(reason) {
  logLine(reason + " Eliminated.", "is-bad");
  endRound();

  stamp.textContent = "ELIMINATED";
  stamp.classList.remove("is-win");
  overlay.classList.add("is-visible");
  startBtn.textContent = "TRY AGAIN";
}

// ---------- start / restart ----------

function startGame() {
  overlay.classList.remove("is-visible");
  distance = 0;
  holding = false;
  runner.style.left = "0%";
  distanceValue.textContent = "0%";
  log.innerHTML = "";
  running = true;
  lastFrame = performance.now();
  setLight("red");
  scheduleNextLight();
  requestAnimationFrame(frame);
}

startBtn.addEventListener("click", startGame);
