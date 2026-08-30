/*
 * Fun-only casino mini-game: slot machine + roulette on virtual points.
 * No real money anywhere — balance lives in localStorage on the player's
 * own device, and can always be topped up for free ("Пополнить").
 */

const CASINO_BALANCE_KEY = "sport_analyst_casino_balance";
const CASINO_START_BALANCE = 1000;
const CASINO_TOPUP_AMOUNT = 500;
const BET_STEPS = [10, 50, 100, 500];

function casinoGetBalance() {
  try {
    const raw = localStorage.getItem(CASINO_BALANCE_KEY);
    if (raw === null) return CASINO_START_BALANCE;
    const value = parseInt(raw, 10);
    return Number.isFinite(value) ? value : CASINO_START_BALANCE;
  } catch (e) {
    return CASINO_START_BALANCE;
  }
}

function casinoSetBalance(value) {
  try {
    localStorage.setItem(CASINO_BALANCE_KEY, String(Math.max(0, Math.round(value))));
  } catch (e) {
    /* private mode / storage blocked — game still works, just doesn't persist */
  }
}

function casinoTopUp() {
  casinoSetBalance(casinoGetBalance() + CASINO_TOPUP_AMOUNT);
  return casinoGetBalance();
}

// ---- Slots ----

const SLOT_SYMBOLS = [
  { icon: "🍒", weight: 30 },
  { icon: "🍋", weight: 24 },
  { icon: "🍊", weight: 18 },
  { icon: "🔔", weight: 12 },
  { icon: "⭐", weight: 8 },
  { icon: "💎", weight: 5 },
  { icon: "7️⃣", weight: 3 },
];

const SLOT_PAYOUTS = {
  "🍒": 3,
  "🍋": 4,
  "🍊": 5,
  "🔔": 8,
  "⭐": 10,
  "💎": 20,
  "7️⃣": 50,
};

function slotSpinReel() {
  const totalWeight = SLOT_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const symbol of SLOT_SYMBOLS) {
    if (roll < symbol.weight) return symbol.icon;
    roll -= symbol.weight;
  }
  return SLOT_SYMBOLS[0].icon;
}

// Returns { reels: [a,b,c], winMultiplier, message }
function slotSpin() {
  const reels = [slotSpinReel(), slotSpinReel(), slotSpinReel()];
  const [a, b, c] = reels;

  if (a === b && b === c) {
    return { reels, winMultiplier: SLOT_PAYOUTS[a], message: `Три ${a} подряд!` };
  }
  if (a === b || b === c || a === c) {
    return { reels, winMultiplier: 1.5, message: "Две одинаковые — маленький выигрыш." };
  }
  return { reels, winMultiplier: 0, message: "Без выигрыша, повезёт в другой раз." };
}

// ---- Roulette ----

// Standard European wheel order, used only to render the strip; colour is
// what actually decides the bet, not the position.
const ROULETTE_WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

const ROULETTE_RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

function rouletteColorOf(number) {
  if (number === 0) return "green";
  return ROULETTE_RED.has(number) ? "red" : "black";
}

const ROULETTE_PAYOUTS = { red: 2, black: 2, green: 14 };

// Returns { number, color, winMultiplier }
function rouletteSpin(betColor) {
  const number = ROULETTE_WHEEL_ORDER[Math.floor(Math.random() * ROULETTE_WHEEL_ORDER.length)];
  const color = rouletteColorOf(number);
  const winMultiplier = color === betColor ? ROULETTE_PAYOUTS[betColor] : 0;
  return { number, color, winMultiplier };
}

// ---- Reaction game ("Лови коэффициент") ----
// Three bookmaker-style odds boxes fall down the screen; the player has to
// tap the current highest one before it lands. Skill/reflex game, not a
// bet — points are only awarded for correct catches.

function reactionRandomOdd() {
  const r = Math.random();
  if (r < 0.55) return +(1.1 + Math.random() * 1.9).toFixed(2); // common: 1.10-3.00
  if (r < 0.85) return +(3.0 + Math.random() * 4.0).toFixed(2); // 3.00-7.00
  if (r < 0.97) return +(7.0 + Math.random() * 8.0).toFixed(2); // 7.00-15.00
  return +(15.0 + Math.random() * 20.0).toFixed(2); // rare spike: 15.00-35.00
}

// Three distinct odds with the top two at least 0.05 apart, so there is
// always one unambiguous "biggest" box.
function reactionGenerateRound() {
  while (true) {
    const odds = [reactionRandomOdd(), reactionRandomOdd(), reactionRandomOdd()];
    const sorted = [...odds].sort((a, b) => b - a);
    if (new Set(odds).size === 3 && sorted[0] - sorted[1] >= 0.05) return odds;
  }
}
