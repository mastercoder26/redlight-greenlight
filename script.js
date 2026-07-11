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
