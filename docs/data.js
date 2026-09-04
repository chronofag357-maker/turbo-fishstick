/*
 * Demo data and calculations mirroring the Python mock adapters and the
 * analytics engine (bot/services/adapters/mock_*.py, bot/services/analytics.py).
 * Kept in lock-step with those files on purpose: same numbers, same math,
 * so the Mini App and the chat bot never disagree about a result.
 */

const SPORTS = [
  { code: "football", name: "Футбол", icon: "⚽" },
  { code: "tennis", name: "Теннис", icon: "🎾" },
  { code: "basketball", name: "Баскетбол", icon: "🏀" },
  { code: "hockey", name: "Хоккей", icon: "🏒" },
  { code: "boxing", name: "Бокс", icon: "🥊" },
  { code: "mma", name: "MMA", icon: "🥋" },
];

const HAS_DRAW = new Set(["football", "hockey"]);

const COMPETITORS = {
  football: [
    { id: "fc_alpha", name: "ФК Альфа", rating: 78.0 },
    { id: "fc_beta", name: "ФК Бета", rating: 71.5 },
    { id: "fc_gamma", name: "ФК Гамма", rating: 65.0 },
    { id: "fc_delta", name: "ФК Дельта", rating: 69.0 },
  ],
  tennis: [
    { id: "t_ivanov", name: "И. Иванов", rating: 82.0 },
    { id: "t_petrov", name: "П. Петров", rating: 75.0 },
    { id: "t_sidorov", name: "С. Сидоров", rating: 70.0 },
    { id: "t_orlov", name: "А. Орлов", rating: 68.0 },
  ],
  basketball: [
    { id: "b_orel", name: "БК Орёл", rating: 74.0 },
    { id: "b_bars", name: "БК Барс", rating: 77.0 },
    { id: "b_volk", name: "БК Волк", rating: 66.0 },
    { id: "b_sokol", name: "БК Сокол", rating: 70.0 },
  ],
  hockey: [
    { id: "h_stal", name: "ХК Сталь", rating: 73.0 },
    { id: "h_led", name: "ХК Лёд", rating: 69.0 },
    { id: "h_moroz", name: "ХК Мороз", rating: 71.0 },
    { id: "h_iskra", name: "ХК Искра", rating: 64.0 },
  ],
  boxing: [
    { id: "box_kuznetsov", name: "Кузнецов", rating: 80.0 },
    { id: "box_volkov", name: "Волков", rating: 76.0 },
  ],
  mma: [
    { id: "mma_gromov", name: "Громов", rating: 79.0 },
    { id: "mma_lisov", name: "Лисов", rating: 74.0 },
  ],
};

const EVENTS = {
  football: [
    { id: "f_e1", league: "Премьер-лига", home: "ФК Альфа", away: "ФК Бета", time: "2026-09-02 19:00", status: "scheduled" },
    { id: "f_e2", league: "Премьер-лига", home: "ФК Гамма", away: "ФК Дельта", time: "2026-09-03 21:00", status: "scheduled" },
  ],
  tennis: [
    { id: "t_e1", league: "ATP 250", home: "И. Иванов", away: "П. Петров", time: "2026-09-02 15:00", status: "scheduled" },
  ],
  basketball: [
    { id: "b_e1", league: "Суперлига", home: "БК Орёл", away: "БК Барс", time: "2026-09-02 18:30", status: "scheduled" },
  ],
  hockey: [
    { id: "h_e1", league: "КХЛ", home: "ХК Сталь", away: "ХК Лёд", time: "2026-09-02 17:00", status: "live", score: "1:0" },
  ],
  boxing: [
    { id: "box_e1", league: "Гала-вечер", home: "Кузнецов", away: "Волков", time: "2026-09-05 22:00", status: "scheduled" },
  ],
  mma: [
    { id: "mma_e1", league: "Турнир", home: "Громов", away: "Лисов", time: "2026-09-06 23:00", status: "scheduled" },
  ],
};

const BOOKMAKERS = {
  BookOne: { margin: 1.06, bias: [1.00, 1.00, 1.00] },
  BookTwo: { margin: 1.04, bias: [1.05, 0.93, 0.99] },
  BookThree: { margin: 1.07, bias: [0.97, 1.05, 1.04] },
};

const HOME_ADVANTAGE = 3.0;

function round(value, digits) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function findEvent(eventId) {
  for (const sport of Object.keys(EVENTS)) {
    const event = EVENTS[sport].find((e) => e.id === eventId);
    if (event) return { ...event, sport };
  }
  return null;
}

// null (not a default 70) for an unknown competitor — a real event fetched
// live has no strength rating behind it, and analysis/odds/arbitrage should
// say so rather than quietly compute numbers off a made-up rating.
function ratingOf(sport, name) {
  const competitor = (COMPETITORS[sport] || []).find((c) => c.name === name);
  return competitor ? competitor.rating : null;
}

// Mirrors analytics.calculate_probabilities — includes home advantage.
function calculateProbabilities(homeRating, awayRating, hasDraw) {
  homeRating += HOME_ADVANTAGE;
  const drawWeight = hasDraw ? 0.24 * Math.min(homeRating, awayRating) : 0.0;
  const total = homeRating + awayRating + drawWeight;
  return {
    homeWin: round((homeRating / total) * 100, 1),
    draw: hasDraw ? round((drawWeight / total) * 100, 1) : null,
    awayWin: round((awayRating / total) * 100, 1),
  };
}

// Mirrors analytics.compare_competitors.
function compareCompetitors(nameA, ratingA, nameB, ratingB) {
  const total = ratingA + ratingB;
  const edge = total ? round(((ratingA - ratingB) / total) * 100, 1) : 0.0;
  return { nameA, nameB, ratingA, ratingB, edge };
}

// Mirrors mock_odds.MockOddsAdapter.get_odds — no home advantage here,
// same as the Python adapter (the bias/margin already model book behaviour).
function getOdds(event) {
  const homeRating = ratingOf(event.sport, event.home);
  const awayRating = ratingOf(event.sport, event.away);
  if (homeRating === null || awayRating === null) return [];
  const hasDraw = HAS_DRAW.has(event.sport);

  const drawWeight = hasDraw ? 0.24 * Math.min(homeRating, awayRating) : 0.0;
  const total = homeRating + awayRating + drawWeight;
  const pHome = homeRating / total;
  const pAway = awayRating / total;
  const pDraw = hasDraw ? drawWeight / total : 0.0;

  const quotes = [];
  for (const [bookmaker, params] of Object.entries(BOOKMAKERS)) {
    const [biasHome, biasDraw, biasAway] = params.bias;
    let bHome = pHome * biasHome;
    let bDraw = hasDraw ? pDraw * biasDraw : 0.0;
    let bAway = pAway * biasAway;
    const bTotal = bHome + bDraw + bAway;
    bHome /= bTotal;
    bDraw /= bTotal;
    bAway /= bTotal;

    quotes.push({
      bookmaker,
      homeWin: round(1 / (bHome * params.margin), 2),
      draw: hasDraw ? round(1 / (bDraw * params.margin), 2) : null,
      awayWin: round(1 / (bAway * params.margin), 2),
      updatedAt: "только что",
    });
  }
  return quotes;
}

// Mirrors analytics.find_arbitrage.
function findArbitrage(quotes) {
  if (!quotes.length) return null;
  const hasDraw = quotes.some((q) => q.draw !== null);
  const outcomes = hasDraw ? ["П1", "X", "П2"] : ["П1", "П2"];

  const bestOdds = {};
  const bestBookmakers = {};
  for (const outcome of outcomes) {
    let bestQuote = null;
    let bestValue = 0.0;
    for (const quote of quotes) {
      const value = outcome === "П1" ? quote.homeWin : outcome === "X" ? quote.draw : quote.awayWin;
      if (value !== null && value > bestValue) {
        bestValue = value;
        bestQuote = quote;
      }
    }
    if (!bestQuote) return null;
    bestOdds[outcome] = bestValue;
    bestBookmakers[outcome] = bestQuote.bookmaker;
  }

  const impliedSum = Object.values(bestOdds).reduce((sum, odd) => sum + 1 / odd, 0);
  const marginPct = round((impliedSum - 1) * 100, 2);
  const stakeSplit = {};
  for (const [outcome, odd] of Object.entries(bestOdds)) {
    stakeSplit[outcome] = round((1 / odd / impliedSum) * 100, 1);
  }

  return {
    market: hasDraw ? "1X2" : "П1/П2",
    bestOdds,
    bestBookmakers,
    impliedSum: round(impliedSum, 4),
    marginPct,
    stakeSplit,
  };
}

// Base URL of the bot's own read-only API (bot/web/api.py) — set on
// window.MINI_APP_API_BASE in index.html once the bot is hosted somewhere
// with a public HTTPS URL. Left empty, the app just keeps using the demo
// data above forever, exactly like before this existed.
const MINI_APP_API_BASE = (typeof window !== "undefined" && window.MINI_APP_API_BASE) || "";

// Replaces EVENTS[sport] with the bot's real schedule for that sport, if the
// API is configured and reachable. Silently keeps the demo data on any
// failure (not hosted yet, network hiccup, bot down) — this is a progressive
// enhancement, never a hard requirement to use the app.
//
// Returns true only when the fetched schedule actually differs from what's
// already in EVENTS[sport] — callers re-render on a true result, so a stable
// "false" once the data settles is what stops that from looping forever.
async function refreshLiveEvents(sport) {
  if (!MINI_APP_API_BASE) return false;
  try {
    const res = await fetch(`${MINI_APP_API_BASE}/api/events?sport=${encodeURIComponent(sport)}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return false;
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) return false;
    if (JSON.stringify(rows) === JSON.stringify(EVENTS[sport])) return false;
    EVENTS[sport] = rows;
    return true;
  } catch {
    return false;
  }
}

function getNews(subject) {
  const label = subject || "команды/спортсмена";
  return [
    {
      title: `Официальный источник: изменений в составе ${label} не зафиксировано`,
      source: "официальный сайт",
      confirmed: true,
      publishedAt: "сегодня",
    },
    {
      title: `СМИ сообщают о возможной ротации состава перед матчем (${label})`,
      source: "СМИ",
      confirmed: false,
      publishedAt: "сегодня",
    },
  ];
}
