// ---------- refs ----------

const lightEl = document.getElementById("light");
const lightLabel = document.getElementById("light-label");
const bulbs = {
  red: lightEl.querySelector(".bulb.red"),
  yellow: lightEl.querySelector(".bulb.yellow"),
  green: lightEl.querySelector(".bulb.green"),
};
const runner = document.getElementById("runner");
const stats = document.getElementById("stats");
const startBtn = document.getElementById("startBtn");

// ---------- state ----------

const SPEED = 26;          // % of track per second while running
const GRACE_MS = 220;      // ms of leniency after light turns red
const WIN_DISTANCE = 100;  // %

let light = "red";
let holding = false;
let running = false;
let distance = 0;
let lastFrame = 0;
let best = Number(localStorage.getItem("rlgl_best") || 0);
let attempts = Number(localStorage.getItem("rlgl_attempts") || 0);

let lightTimer = null;
let graceTimer = null;

updateStats();

function updateStats() {
  stats.textContent =
    "distance: " + Math.floor(distance) + "%   best: " + best + "%   attempts: " + attempts;
}

// ---------- light scheduler ----------

function randomDuration() {
  return 1200 + Math.random() * 2600; // 1.2s - 3.8s
}

function showBulb(color) {
  bulbs.red.classList.toggle("on", color === "red");
  bulbs.yellow.classList.toggle("on", color === "yellow");
  bulbs.green.classList.toggle("on", color === "green");
  lightLabel.textContent = color + " light";
}

function setLight(next) {
  light = next;
  showBulb(next);
  playTone(next === "green" ? 660 : next === "yellow" ? 440 : 220);

  if (next === "red") {
    clearTimeout(graceTimer);
    graceTimer = setTimeout(() => {
      if (holding && running) eliminate("you moved during red light");
    }, GRACE_MS);
  }
}

function scheduleNextLight() {
  clearTimeout(lightTimer);
  lightTimer = setTimeout(() => {
    if (light === "green") {
      setLight("yellow");
      lightTimer = setTimeout(() => {
        setLight("red");
        scheduleNextLight();
      }, 500);
    } else {
      setLight("green");
      scheduleNextLight();
    }
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

  if (!running) return;
  if (light === "red" || light === "yellow") eliminate("you took off on red");
});

window.addEventListener("keyup", (e) => {
  if (e.code !== "Space") return;
  e.preventDefault();
  holding = false;
});

// ---------- main loop ----------

function frame(now) {
  if (!running) return;

  const dt = Math.min(now - lastFrame, 60) / 1000;
  lastFrame = now;

  if (holding && light === "green") {
    distance = Math.min(WIN_DISTANCE, distance + SPEED * dt);
    runner.style.left = distance + "%";
    updateStats();

    if (distance >= WIN_DISTANCE) {
      win();
      return;
    }
  }

  requestAnimationFrame(frame);
}

// ---------- sound ----------

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
    // not important if it fails
  }
}

// ---------- end states ----------

function endRound() {
  running = false;
  stopScheduler();
  attempts++;
  localStorage.setItem("rlgl_attempts", attempts);

  if (distance > best) {
    best = Math.floor(distance);
    localStorage.setItem("rlgl_best", best);
  }
  updateStats();
}

function win() {
  distance = WIN_DISTANCE;
  runner.style.left = "100%";
  endRound();
  alert("you made it! you win");
  startBtn.textContent = "play again";
}

function eliminate(reason) {
  endRound();
  alert("eliminated - " + reason);
  startBtn.textContent = "try again";
}

// ---------- start ----------

function startGame() {
  distance = 0;
  holding = false;
  runner.style.left = "0%";
  running = true;
  lastFrame = performance.now();
  setLight("red");
  scheduleNextLight();
  updateStats();
  requestAnimationFrame(frame);
}

startBtn.addEventListener("click", startGame);
