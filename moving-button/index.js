// ===== The Impossible Button =====
// A button that dodges the cursor when you get close — until it gets tired
// and finally lets you win. Vanilla JS, no libraries.

// ---- Config ----
const DODGE_RADIUS = 120;     // how close (px) the cursor can get before it bolts
const WIN_ATTEMPTS = 12;      // dodges before the button gives up and is catchable
const EDGE_PADDING = 12;      // keep this much space from the arena edges

// Cheeky labels swapped in as it runs away
const RUN_WORDS = [
    "Nope!", "Too slow!", "Missed!", "Try again", "Catch me!",
    "Not today", "So close", "Nice try", "Almost!", "Hah!"
];

// Escalating taunts based on how many times you've failed
const TAUNTS = [
    { at: 0, text: "It won't bite. Probably." },
    { at: 3, text: "Warming up, are we?" },
    { at: 6, text: "Your mouse skills are... something." },
    { at: 9, text: "It's getting tired. Keep pushing!" },
    { at: 11, text: "Almost there — one more!" }
];

const EMOJIS = ["✨", "💨", "😜", "🏃", "⚡", "🌀"];
const CONFETTI_COLORS = ["#7c5cff", "#ff5c9d", "#5cffd6", "#ffd65c", "#5c9dff"];

// ---- Elements ----
const arena = document.getElementById("arena");
const btn = document.getElementById("btn");
const attemptsEl = document.getElementById("attempts");
const tauntEl = document.getElementById("taunt");
const hintEl = document.getElementById("hint");
const winEl = document.getElementById("win");
const winText = document.getElementById("win-text");
const replayBtn = document.getElementById("replay");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---- State ----
let attempts = 0;
let tired = false;

// Clamp a value between a min and max.
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Move the button to an absolute (left, top) inside the arena, keeping it
// fully within the visible bounds regardless of screen size.
function placeButton(left, top) {
    const maxLeft = arena.clientWidth - btn.offsetWidth - EDGE_PADDING;
    const maxTop = arena.clientHeight - btn.offsetHeight - EDGE_PADDING;
    btn.style.left = clamp(left, EDGE_PADDING, maxLeft) + "px";
    btn.style.top = clamp(top, EDGE_PADDING, maxTop) + "px";
    // Once positioned manually we drop the centering transform.
    btn.style.transform = "none";
}

// Update the taunt line to match the current attempt count.
function updateTaunt() {
    const match = [...TAUNTS].reverse().find(t => attempts >= t.at);
    if (match) tauntEl.textContent = match.text;
}

// Spawn a few emoji particles that fly outward from a point in the arena.
function emojiBurst(x, y) {
    if (reduceMotion) return;
    for (let i = 0; i < 5; i++) {
        const p = document.createElement("span");
        p.className = "particle";
        p.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
        p.style.left = x + "px";
        p.style.top = y + "px";
        const angle = Math.random() * Math.PI * 2;
        const dist = 40 + Math.random() * 50;
        p.style.setProperty("--dx", `calc(-50% + ${Math.cos(angle) * dist}px)`);
        p.style.setProperty("--dy", `calc(-50% + ${Math.sin(angle) * dist}px)`);
        arena.appendChild(p);
        p.addEventListener("animationend", () => p.remove());
    }
}

// The core dodge: leap away from the pointer, clamped inside the arena.
function dodge(pointerX, pointerY) {
    if (tired) return;

    const rect = btn.getBoundingClientRect();
    const arenaRect = arena.getBoundingClientRect();

    // Button center relative to the arena.
    const btnCenterX = rect.left + rect.width / 2 - arenaRect.left;
    const btnCenterY = rect.top + rect.height / 2 - arenaRect.top;

    // Pointer relative to the arena.
    const px = pointerX - arenaRect.left;
    const py = pointerY - arenaRect.top;

    // Direction away from the pointer (normalized).
    let dx = btnCenterX - px;
    let dy = btnCenterY - py;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;

    const jump = 160 + Math.random() * 120;
    const newLeft = btnCenterX + dx * jump - btn.offsetWidth / 2;
    const newTop = btnCenterY + dy * jump - btn.offsetHeight / 2;

    placeButton(newLeft, newTop);
    btn.textContent = RUN_WORDS[Math.floor(Math.random() * RUN_WORDS.length)];
    emojiBurst(btnCenterX, btnCenterY);

    // Wobble animation (retriggered by removing/re-adding the class).
    if (!reduceMotion) {
        btn.classList.remove("dodging");
        void btn.offsetWidth; // force reflow so the animation restarts
        btn.classList.add("dodging");
    }

    attempts++;
    attemptsEl.textContent = attempts;
    updateTaunt();

    // After enough failed attempts, the button gives up.
    if (attempts >= WIN_ATTEMPTS) makeTired();
}

// The button surrenders: stops dodging and becomes catchable.
function makeTired() {
    tired = true;
    btn.classList.add("tired");
    btn.textContent = "Okay… catch me 😮‍💨";
    hintEl.textContent = "It's exhausted. Click it now!";
}

// ---- Win / celebration ----
function launchConfetti() {
    if (reduceMotion) return;
    for (let i = 0; i < 80; i++) {
        const piece = document.createElement("div");
        piece.className = "confetti";
        piece.style.left = Math.random() * 100 + "vw";
        piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        piece.style.animationDuration = 2 + Math.random() * 2 + "s";
        piece.style.animationDelay = Math.random() * 0.5 + "s";
        document.body.appendChild(piece);
        piece.addEventListener("animationend", () => piece.remove());
    }
}

function win() {
    winText.textContent = `Caught after ${attempts} attempt${attempts === 1 ? "" : "s"}. Legend.`;
    winEl.hidden = false;
    launchConfetti();
}

function reset() {
    attempts = 0;
    tired = false;
    attemptsEl.textContent = "0";
    btn.classList.remove("tired");
    btn.textContent = "Click Me!";
    hintEl.textContent = "Tip: chase it long enough and it gets tired…";
    tauntEl.textContent = TAUNTS[0].text;
    winEl.hidden = true;
    // Recenter the button.
    btn.style.left = "50%";
    btn.style.top = "50%";
    btn.style.transform = "translate(-50%, -50%)";
}

// ---- Events ----

// Proximity dodge: react to the pointer moving anywhere over the arena.
arena.addEventListener("pointermove", (e) => {
    if (tired) return;
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    if (Math.hypot(e.clientX - cx, e.clientY - cy) < DODGE_RADIUS) {
        dodge(e.clientX, e.clientY);
    }
});

// Touch devices can't hover — tapping near the button makes it dodge,
// and the tired-button win path still works via the click handler below.
arena.addEventListener("pointerdown", (e) => {
    if (tired || e.pointerType !== "touch") return;
    dodge(e.clientX, e.clientY);
});

// Keyboard users get a fair shot: focusing then activating counts as a
// dodge until it's tired, so it's challenging but never truly impossible.
btn.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && !tired) {
        e.preventDefault();
        const rect = btn.getBoundingClientRect();
        dodge(rect.left - 1, rect.top - 1);
    }
});

// The actual catch — only lands once the button is tired.
btn.addEventListener("click", () => {
    if (tired) win();
});

replayBtn.addEventListener("click", reset);

// Start with the intro taunt.
updateTaunt();
