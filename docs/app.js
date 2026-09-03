/*
 * Navigation and rendering for the Spортивный аналитик Mini App.
 * Single-page, no framework: a small view stack + one render() per screen,
 * wired to Telegram's BackButton so back-navigation feels native.
 */

const tg = window.Telegram && window.Telegram.WebApp;

const app = document.getElementById("app");
const stack = [];

function applyTheme() {
  if (!tg) return;
  const root = document.documentElement;
  const params = tg.themeParams || {};
  const map = {
    "--tg-bg": params.bg_color,
    "--tg-secondary-bg": params.secondary_bg_color,
    "--tg-text": params.text_color,
    "--tg-hint": params.hint_color,
    "--tg-link": params.link_color,
    "--tg-button": params.button_color,
    "--tg-button-text": params.button_text_color,
  };
  for (const [key, value] of Object.entries(map)) {
    if (value) root.style.setProperty(key, value);
  }
}

function navigate(view, params = {}) {
  stack.push({ view, params });
  render();
}

function goBack() {
  if (stack.length > 1) {
    stack.pop();
    render();
  }
}

function goHome() {
  stack.length = 0;
  stack.push({ view: "home", params: {} });
  render();
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "html") node.innerHTML = value;
    else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }
  for (const child of [].concat(children)) {
    if (child) node.appendChild(child);
  }
  return node;
}

let activeCleanup = null;

function onCleanup(fn) {
  activeCleanup = fn;
}

function render() {
  if (activeCleanup) {
    activeCleanup();
    activeCleanup = null;
  }
  const current = stack[stack.length - 1];
  app.innerHTML = "";

  if (tg) {
    if (stack.length > 1) {
      tg.BackButton.show();
    } else {
      tg.BackButton.hide();
    }
  }

  const screens = {
    home: renderHome,
    sports: renderSports,
    sportMenu: renderSportMenu,
    events: renderEvents,
    eventDetail: renderEventDetail,
    analysis: renderAnalysis,
    odds: renderOdds,
    arbitrage: renderArbitrage,
    statsPick: renderStatsPick,
    statsDetail: renderStatsDetail,
    comparePick1: renderComparePick1,
    comparePick2: renderComparePick2,
    compareResult: renderCompareResult,
    news: renderNews,
    casino: renderCasino,
    slots: renderSlots,
    roulette: renderRoulette,
    reactionGame: renderReactionGame,
    placeholder: renderPlaceholder,
    sportTiles: renderSportTiles,
    freeExpress: renderFreeExpress,
  };

  const renderer = screens[current.view] || renderHome;
  app.appendChild(renderer(current.params));
}

function topbar(title, showBack = true) {
  const bar = el("header", { class: "topbar" });
  if (showBack) {
    bar.appendChild(el("button", { class: "back-btn", text: "‹", onclick: goBack }));
  }
  bar.appendChild(el("h1", { text: title }));
  return bar;
}

// ---- Home ----

function renderHome() {
  const wrap = el("div");
  wrap.appendChild(topbar("Спортивный аналитик", false));
  wrap.appendChild(
    el("p", {
      class: "subtitle",
      text: "Анализ матчей, статистика, коэффициенты и поиск вилок — на демо-данных.",
    })
  );
  const main = el("main");
  main.appendChild(el("button", { class: "btn", text: "🏆 Виды спорта", onclick: () => navigate("sports") }));
  main.appendChild(el("button", { class: "btn secondary", text: "🎰 Казино (виртуальные очки)", onclick: () => navigate("casino") }));
  renderHomeNote(main);
  wrap.appendChild(main);
  return wrap;
}

function renderHomeNote(main) {
  main.appendChild(
    el("div", {
      class: "card",
      html:
        '<div class="card-title">О демо-версии</div>' +
        '<div class="card-sub">Вероятности и коэффициенты считаются по модельным рейтингам, ' +
        "это не реальные котировки букмекеров и не финансовая рекомендация.</div>",
    })
  );
}

// ---- Sports list ----

function renderSports() {
  const wrap = el("div");
  wrap.appendChild(topbar("Виды спорта"));
  const main = el("main");
  const grid = el("div", { class: "grid-2" });
  for (const sport of SPORTS) {
    grid.appendChild(
      el(
        "button",
        { class: "tile", onclick: () => navigate("sportMenu", { sport: sport.code }) },
        [el("span", { class: "icon", text: sport.icon }), el("span", { text: sport.name })]
      )
    );
  }
  main.appendChild(grid);
  wrap.appendChild(main);
  return wrap;
}

// ---- Per-sport menu ----

function renderSportMenu({ sport }) {
  const meta = SPORTS.find((s) => s.code === sport);
  const wrap = el("div");
  wrap.appendChild(topbar(`${meta.icon} ${meta.name}`));
  const main = el("main");
  main.appendChild(row("📅 События и анализ", "", () => navigate("events", { sport })));
  main.appendChild(row("📊 Статистика", "", () => navigate("statsPick", { sport })));
  main.appendChild(row("⚖️ Сравнение", "", () => navigate("comparePick1", { sport })));
  main.appendChild(row("📰 Новости", "", () => navigate("news", { sport })));
  wrap.appendChild(main);
  return wrap;
}

function row(title, sub, onclick, badge) {
  const main = el("div", { class: "row-main" }, [
    el("span", { text: (badge ? "" : "") + title }),
    sub ? el("span", { class: "row-sub", text: sub }) : null,
  ]);
  return el("button", { class: "list-row", onclick }, [main, el("span", { class: "chev", text: "›" })]);
}

// ---- Events ----

function renderEvents({ sport }) {
  const meta = SPORTS.find((s) => s.code === sport);
  const wrap = el("div");
  wrap.appendChild(topbar(`${meta.name}: события`));
  const main = el("main");
  const events = EVENTS[sport] || [];
  if (!events.length) {
    main.appendChild(el("div", { class: "empty-hint", text: "Событий пока нет." }));
  }
  for (const event of events) {
    const liveBadge = event.status === "live" ? "🔴 LIVE  " : "";
    main.appendChild(
      row(
        `${liveBadge}${event.home} — ${event.away}`,
        `${event.league} · ${event.time}${event.score ? " · " + event.score : ""}`,
        () => navigate("eventDetail", { eventId: event.id })
      )
    );
  }
  wrap.appendChild(main);

  // Fire-and-forget: swap in the bot's real schedule for this sport if it's
  // configured and reachable, then re-render this same screen if we're still
  // on it by the time the fetch resolves.
  refreshLiveEvents(sport).then((changed) => {
    const top = stack[stack.length - 1];
    if (changed && top && top.view === "events" && top.params.sport === sport) render();
  });

  return wrap;
}

function renderEventDetail({ eventId }) {
  const event = findEvent(eventId);
  const wrap = el("div");
  wrap.appendChild(topbar(`${event.home} — ${event.away}`));
  const main = el("main");
  main.appendChild(
    el("div", {
      class: "card",
      html: `<div class="card-title">${event.league}</div><div class="card-sub">${event.time}${
        event.score ? " · счёт " + event.score : ""
      }</div>`,
    })
  );
  main.appendChild(el("button", { class: "btn", text: "🔍 Анализ и вероятности", onclick: () => navigate("analysis", { eventId }) }));
  main.appendChild(el("button", { class: "btn", text: "💰 Коэффициенты", onclick: () => navigate("odds", { eventId }) }));
  main.appendChild(el("button", { class: "btn", text: "🎯 Поиск вилки", onclick: () => navigate("arbitrage", { eventId }) }));
  wrap.appendChild(main);
  return wrap;
}

// ---- Analysis (probabilities) ----

function renderAnalysis({ eventId }) {
  const event = findEvent(eventId);
  const hasDraw = HAS_DRAW.has(event.sport);
  const homeRating = ratingOf(event.sport, event.home);
  const awayRating = ratingOf(event.sport, event.away);

  const wrap = el("div");
  wrap.appendChild(topbar("Анализ и вероятности"));
  const main = el("main");
  main.appendChild(
    el("div", { class: "card", html: `<div class="card-title">${event.home} — ${event.away}</div><div class="card-sub">${event.league}</div>` })
  );

  if (homeRating === null || awayRating === null) {
    main.appendChild(
      el("div", {
        class: "empty-hint",
        text: "Для этого события пока нет рейтинга силы участников — анализ недоступен.",
      })
    );
    wrap.appendChild(main);
    return wrap;
  }

  const probs = calculateProbabilities(homeRating, awayRating, hasDraw);
  main.appendChild(probBar(event.home, probs.homeWin));
  if (hasDraw) main.appendChild(probBar("Ничья", probs.draw));
  main.appendChild(probBar(event.away, probs.awayWin));

  main.appendChild(
    el("p", {
      class: "subtitle",
      text: "Модельная оценка на основе рейтингов участников, с учётом преимущества своего поля. Не гарантия результата.",
    })
  );
  wrap.appendChild(main);
  return wrap;
}

function probBar(label, value) {
  const row = el("div", { class: "prob-bar-row" });
  row.appendChild(
    el("div", { class: "prob-bar-label" }, [el("span", { text: label }), el("span", { text: `${value}%` })])
  );
  const track = el("div", { class: "prob-bar-track" });
  track.appendChild(el("div", { class: "prob-bar-fill", style: `width:${value}%` }));
  row.appendChild(track);
  return row;
}

// ---- Odds ----

function renderOdds({ eventId }) {
  const event = findEvent(eventId);
  const hasDraw = HAS_DRAW.has(event.sport);
  const quotes = getOdds(event);

  const wrap = el("div");
  wrap.appendChild(topbar("Коэффициенты"));
  const main = el("main");
  main.appendChild(
    el("div", {
      class: "card",
      html: `<div class="card-title">${event.home} — ${event.away}</div><div class="card-sub">${
        quotes.length ? "3 демо-букмекера" : "нет источника котировок"
      }</div>`,
    })
  );

  if (!quotes.length) {
    main.appendChild(
      el("div", { class: "empty-hint", text: "Коэффициенты недоступны — нет источника котировок для этого события." })
    );
    wrap.appendChild(main);
    return wrap;
  }

  const bestHome = Math.max(...quotes.map((q) => q.homeWin));
  const bestAway = Math.max(...quotes.map((q) => q.awayWin));
  const bestDraw = hasDraw ? Math.max(...quotes.map((q) => q.draw)) : null;

  const table = el("table", { class: "odds-table" });
  const head = el("tr");
  head.appendChild(el("th", { text: "Букмекер" }));
  head.appendChild(el("th", { text: "П1" }));
  if (hasDraw) head.appendChild(el("th", { text: "X" }));
  head.appendChild(el("th", { text: "П2" }));
  table.appendChild(head);

  for (const quote of quotes) {
    const tr = el("tr");
    tr.appendChild(el("td", { text: quote.bookmaker }));
    tr.appendChild(el("td", { class: quote.homeWin === bestHome ? "best-odd" : "", text: quote.homeWin.toFixed(2) }));
    if (hasDraw) tr.appendChild(el("td", { class: quote.draw === bestDraw ? "best-odd" : "", text: quote.draw.toFixed(2) }));
    tr.appendChild(el("td", { class: quote.awayWin === bestAway ? "best-odd" : "", text: quote.awayWin.toFixed(2) }));
    table.appendChild(tr);
  }
  main.appendChild(table);
  main.appendChild(el("p", { class: "subtitle", text: "Зелёным выделена лучшая котировка по каждому исходу." }));
  wrap.appendChild(main);
  return wrap;
}

// ---- Arbitrage ----

function renderArbitrage({ eventId }) {
  const event = findEvent(eventId);
  const quotes = getOdds(event);
  const arb = findArbitrage(quotes);

  const wrap = el("div");
  wrap.appendChild(topbar("Поиск вилки"));
  const main = el("main");
  main.appendChild(
    el("div", { class: "card", html: `<div class="card-title">${event.home} — ${event.away}</div><div class="card-sub">Рынок ${arb ? arb.market : ""}</div>` })
  );

  if (!arb || arb.marginPct >= 0) {
    main.appendChild(
      el("div", {
        class: "card",
        html: `<div class="arb-no">Вилки нет.</div><div class="card-sub">Сумма обратных лучших коэффициентов ${
          arb ? arb.impliedSum : "—"
        } ≥ 1 — гарантированной прибыли не найдено.</div>`,
      })
    );
    wrap.appendChild(main);
    return wrap;
  }

  main.appendChild(
    el("div", {
      class: "card",
      html: `<div class="arb-yes">Вилка найдена! Маржа ${arb.marginPct}%</div><div class="card-sub">Сумма обратных лучших коэффициентов: ${arb.impliedSum}</div>`,
    })
  );

  for (const [outcome, odd] of Object.entries(arb.bestOdds)) {
    const stakeRow = el("div", { class: "stake-row" });
    stakeRow.appendChild(el("span", { text: `${outcome} @ ${odd.toFixed(2)} (${arb.bestBookmakers[outcome]})` }));
    stakeRow.appendChild(el("span", { text: `${arb.stakeSplit[outcome]}% банка` }));
    main.appendChild(stakeRow);
  }
  main.appendChild(
    el("p", { class: "subtitle", text: "Распределение банка по исходам, чтобы зафиксировать прибыль независимо от результата (демо-расчёт)." })
  );
  wrap.appendChild(main);
  return wrap;
}

// ---- Stats ----

function renderStatsPick({ sport }) {
  const wrap = el("div");
  wrap.appendChild(topbar("Статистика: выберите"));
  const main = el("main");
  for (const competitor of COMPETITORS[sport] || []) {
    main.appendChild(row(competitor.name, `Рейтинг: ${competitor.rating}`, () => navigate("statsDetail", { sport, id: competitor.id })));
  }
  wrap.appendChild(main);
  return wrap;
}

function renderStatsDetail({ sport, id }) {
  const competitor = (COMPETITORS[sport] || []).find((c) => c.id === id);
  const wrap = el("div");
  wrap.appendChild(topbar(competitor.name));
  const main = el("main");
  main.appendChild(
    el("div", {
      class: "card",
      html: `<div class="card-title">Модельный рейтинг: ${competitor.rating}</div><div class="card-sub">Чем выше рейтинг относительно соперника, тем выше расчётная вероятность победы.</div>`,
    })
  );
  const events = (EVENTS[sport] || []).filter((e) => e.home === competitor.name || e.away === competitor.name);
  if (events.length) {
    main.appendChild(el("div", { class: "card-title", text: "Ближайшие матчи" }));
    for (const event of events) {
      main.appendChild(row(`${event.home} — ${event.away}`, `${event.league} · ${event.time}`, () => navigate("eventDetail", { eventId: event.id })));
    }
  }
  wrap.appendChild(main);
  return wrap;
}

// ---- Compare ----

function renderComparePick1({ sport }) {
  const wrap = el("div");
  wrap.appendChild(topbar("Сравнение: первый участник"));
  const main = el("main");
  for (const competitor of COMPETITORS[sport] || []) {
    main.appendChild(row(competitor.name, "", () => navigate("comparePick2", { sport, firstId: competitor.id })));
  }
  wrap.appendChild(main);
  return wrap;
}

function renderComparePick2({ sport, firstId }) {
  const wrap = el("div");
  wrap.appendChild(topbar("Сравнение: второй участник"));
  const main = el("main");
  for (const competitor of COMPETITORS[sport] || []) {
    if (competitor.id === firstId) continue;
    main.appendChild(row(competitor.name, "", () => navigate("compareResult", { sport, firstId, secondId: competitor.id })));
  }
  wrap.appendChild(main);
  return wrap;
}

function renderCompareResult({ sport, firstId, secondId }) {
  const a = COMPETITORS[sport].find((c) => c.id === firstId);
  const b = COMPETITORS[sport].find((c) => c.id === secondId);
  const result = compareCompetitors(a.name, a.rating, b.name, b.rating);

  const wrap = el("div");
  wrap.appendChild(topbar("Результат сравнения"));
  const main = el("main");
  const favoured = result.edge > 0 ? a.name : result.edge < 0 ? b.name : "ничья по рейтингу";
  main.appendChild(
    el("div", {
      class: "card",
      html: `<div class="card-title">${a.name} (${a.rating}) vs ${b.name} (${b.rating})</div><div class="card-sub">Фаворит по рейтингу: ${favoured}</div>`,
    })
  );
  main.appendChild(probBar(a.name, 50 + result.edge / 2));
  main.appendChild(probBar(b.name, 50 - result.edge / 2));
  wrap.appendChild(main);
  return wrap;
}

// ---- News ----

function renderNews({ sport }) {
  const meta = SPORTS.find((s) => s.code === sport);
  const news = getNews(meta.name);
  const wrap = el("div");
  wrap.appendChild(topbar("Новости"));
  const main = el("main");
  for (const item of news) {
    const flag = item.confirmed
      ? el("span", { class: "news-flag confirmed", text: "Подтверждено" })
      : el("span", { class: "news-flag unconfirmed", text: "Не подтверждено" });
    const card = el("div", { class: "card news-item" });
    card.appendChild(flag);
    card.appendChild(el("div", { class: "card-title", text: item.title }));
    card.appendChild(el("div", { class: "card-sub", text: `${item.source} · ${item.publishedAt}` }));
    main.appendChild(card);
  }
  wrap.appendChild(main);
  return wrap;
}

// ---- Casino ----

let casinoBet = BET_STEPS[1]; // default bet, remembered between screens

function betPicker(onPick) {
  const row = el("div", { class: "grid-2" });
  const buttons = [];
  for (const amount of BET_STEPS) {
    const btn = el("button", {
      class: "tile" + (amount === casinoBet ? " tile-selected" : ""),
      text: `${amount} 🪙`,
      onclick: () => {
        casinoBet = amount;
        buttons.forEach((b) => b.classList.toggle("tile-selected", Number(b.dataset.amount) === amount));
        if (onPick) onPick(amount);
      },
    });
    btn.dataset.amount = String(amount);
    buttons.push(btn);
    row.appendChild(btn);
  }
  return row;
}

function renderCasino() {
  const wrap = el("div");
  wrap.appendChild(topbar("🎰 Казино"));
  const main = el("main");
  main.appendChild(el("div", { class: "mascot-bounce", text: "🎲" }));
  main.appendChild(
    el("div", {
      class: "card",
      html: `<div class="card-title">Баланс: ${casinoGetBalance()} 🪙</div><div class="card-sub">Виртуальные очки, реальных денег тут нет.</div>`,
    })
  );
  main.appendChild(el("button", { class: "btn", text: "🎰 Слоты", onclick: () => navigate("slots") }));
  main.appendChild(el("button", { class: "btn", text: "🎡 Рулетка", onclick: () => navigate("roulette") }));
  main.appendChild(el("button", { class: "btn", text: "⚡ Лови коэффициент", onclick: () => navigate("reactionGame") }));
  main.appendChild(
    el("button", {
      class: "btn secondary",
      text: `+${CASINO_TOPUP_AMOUNT} 🪙 Пополнить бесплатно`,
      onclick: () => {
        casinoTopUp();
        render();
      },
    })
  );
  main.appendChild(
    el("p", { class: "subtitle", text: "Игра ради развлечения: очки виртуальные, ни на что реальное не обмениваются." })
  );
  wrap.appendChild(main);
  return wrap;
}

const SLOT_SYMBOL_HEIGHT = 64;
const SLOT_STRIP_FILLER = 16; // extra random symbols scrolled through before landing

function buildSlotStrip(finalSymbol) {
  const symbols = Array.from({ length: SLOT_STRIP_FILLER }, () => slotSpinReel());
  symbols.push(finalSymbol);
  return symbols;
}

function renderSlots() {
  const wrap = el("div");
  wrap.appendChild(topbar("🎰 Слоты"));
  const main = el("main");

  const balanceEl = el("div", { class: "card-title", text: `Баланс: ${casinoGetBalance()} 🪙` });
  main.appendChild(el("div", { class: "card" }, [balanceEl]));

  const reelEls = [0, 1, 2].map(() => el("div", { class: "slot-reel" }));
  const reelsRow = el("div", { class: "slot-reels" }, reelEls);
  main.appendChild(reelsRow);

  const messageEl = el("div", { class: "subtitle", text: "Выбери ставку и крути барабан." });
  main.appendChild(messageEl);
  main.appendChild(betPicker());

  const spinBtn = el("button", { class: "btn", text: "🎲 Крутить" });
  spinBtn.addEventListener("click", () => {
    const balance = casinoGetBalance();
    if (balance < casinoBet) {
      messageEl.textContent = "Недостаточно очков — пополни баланс в казино.";
      return;
    }
    spinBtn.disabled = true;
    casinoSetBalance(balance - casinoBet);
    balanceEl.textContent = `Баланс: ${casinoGetBalance()} 🪙`;
    messageEl.textContent = "Крутим...";

    const result = slotSpin();
    let settled = 0;

    reelEls.forEach((reelEl, i) => {
      reelEl.innerHTML = "";
      const symbols = buildSlotStrip(result.reels[i]);
      const strip = el(
        "div",
        { class: "slot-reel-strip" },
        symbols.map((s) => el("div", { class: "slot-reel-symbol", text: s }))
      );
      reelEl.appendChild(strip);
      const finalOffset = (symbols.length - 1) * SLOT_SYMBOL_HEIGHT;
      const duration = 900 + i * 280;

      requestAnimationFrame(() => {
        strip.style.transition = `transform ${duration}ms cubic-bezier(0.15, 0.8, 0.15, 1)`;
        strip.style.transform = `translateY(-${finalOffset}px)`;
      });

      strip.addEventListener("transitionend", () => {
        settled += 1;
        if (settled < reelEls.length) return;

        if (result.winMultiplier > 0) {
          const winAmount = Math.round(casinoBet * result.winMultiplier);
          casinoSetBalance(casinoGetBalance() + winAmount);
          messageEl.textContent = `${result.message} Выигрыш: +${winAmount} 🪙`;
          floatingText(reelsRow, `+${winAmount} 🪙`, "good");
          if (result.winMultiplier >= 8) burstConfetti(36);
        } else {
          messageEl.textContent = result.message;
        }
        balanceEl.textContent = `Баланс: ${casinoGetBalance()} 🪙`;
        spinBtn.disabled = false;
      });
    });
  });
  main.appendChild(spinBtn);

  wrap.appendChild(main);
  return wrap;
}

const ROULETTE_SEGMENT_ANGLE = 360 / ROULETTE_WHEEL_ORDER.length;
const ROULETTE_SEGMENT_COLOR = { red: "#c0392b", black: "#1c1c1c", green: "#2ecc71" };

function buildRouletteWheelGradient() {
  const stops = ROULETTE_WHEEL_ORDER.map((number, i) => {
    const color = ROULETTE_SEGMENT_COLOR[rouletteColorOf(number)];
    const start = i * ROULETTE_SEGMENT_ANGLE;
    const end = (i + 1) * ROULETTE_SEGMENT_ANGLE;
    return `${color} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

function renderRoulette() {
  const wrap = el("div");
  wrap.appendChild(topbar("🎡 Рулетка"));
  const main = el("main");

  const balanceEl = el("div", { class: "card-title", text: `Баланс: ${casinoGetBalance()} 🪙` });
  main.appendChild(el("div", { class: "card" }, [balanceEl]));

  const wheelEl = el("div", { class: "roulette-wheel" });
  wheelEl.style.background = buildRouletteWheelGradient();
  const wheelWrap = el("div", { class: "roulette-wheel-wrap" }, [
    el("div", { class: "roulette-pointer" }),
    wheelEl,
  ]);
  main.appendChild(wheelWrap);

  const resultBadge = el("div", { class: "roulette-result-badge", text: "?" });
  main.appendChild(resultBadge);

  let wheelRotation = 0;

  const messageEl = el("div", { class: "subtitle", text: "Выбери ставку, цвет и крути колесо." });
  main.appendChild(messageEl);
  main.appendChild(betPicker());

  let selectedColor = "red";
  const colorButtons = {};
  const colorRow = el("div", { class: "grid-2" });
  for (const [color, label] of [
    ["red", "🔴 Красное · x2"],
    ["black", "⚫ Чёрное · x2"],
  ]) {
    const btn = el("button", {
      class: "tile" + (color === selectedColor ? " tile-selected" : ""),
      text: label,
      onclick: () => {
        selectedColor = color;
        Object.entries(colorButtons).forEach(([c, b]) => b.classList.toggle("tile-selected", c === color));
      },
    });
    colorButtons[color] = btn;
    colorRow.appendChild(btn);
  }
  main.appendChild(colorRow);
  main.appendChild(
    el("button", {
      class: "tile",
      text: "🟢 Зелёное (0) · x14",
      onclick: () => {
        selectedColor = "green";
        Object.values(colorButtons).forEach((b) => b.classList.remove("tile-selected"));
      },
    })
  );

  const spinBtn = el("button", { class: "btn", text: "🎡 Крутить" });
  spinBtn.addEventListener("click", () => {
    const balance = casinoGetBalance();
    if (balance < casinoBet) {
      messageEl.textContent = "Недостаточно очков — пополни баланс в казино.";
      return;
    }
    spinBtn.disabled = true;
    casinoSetBalance(balance - casinoBet);
    balanceEl.textContent = `Баланс: ${casinoGetBalance()} 🪙`;
    messageEl.textContent = "Крутим колесо...";
    resultBadge.textContent = "?";
    resultBadge.className = "roulette-result-badge";

    const result = rouletteSpin(selectedColor);

    // Rotate the wheel so the winning segment's centre lands under the
    // fixed pointer at the top, plus a few full spins for effect.
    const index = ROULETTE_WHEEL_ORDER.indexOf(result.number);
    const targetAngle = index * ROULETTE_SEGMENT_ANGLE + ROULETTE_SEGMENT_ANGLE / 2;
    const desiredEffective = (360 - targetAngle) % 360;
    const currentEffective = wheelRotation % 360;
    let delta = desiredEffective - currentEffective;
    if (delta <= 0) delta += 360;
    wheelRotation += 5 * 360 + delta;
    wheelEl.style.transform = `rotate(${wheelRotation}deg)`;

    wheelEl.addEventListener(
      "transitionend",
      () => {
        resultBadge.textContent = String(result.number);
        resultBadge.className = `roulette-result-badge roulette-${result.color}`;
        if (result.winMultiplier > 0) {
          const winAmount = Math.round(casinoBet * result.winMultiplier);
          casinoSetBalance(casinoGetBalance() + winAmount);
          messageEl.textContent = `Выпало ${result.number} (${result.color}). Выигрыш: +${winAmount} 🪙`;
          floatingText(resultBadge, `+${winAmount} 🪙`, "good");
          if (result.winMultiplier >= 14) burstConfetti(36);
        } else {
          messageEl.textContent = `Выпало ${result.number} (${result.color}). Не повезло.`;
        }
        balanceEl.textContent = `Баланс: ${casinoGetBalance()} 🪙`;
        spinBtn.disabled = false;
      },
      { once: true }
    );
  });
  main.appendChild(spinBtn);

  wrap.appendChild(main);
  return wrap;
}

// ---- Sound (synthesised, no audio files needed) ----

let sharedAudioCtx = null;

function getAudioContext() {
  if (sharedAudioCtx) return sharedAudioCtx;
  try {
    sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) {
    sharedAudioCtx = null;
  }
  return sharedAudioCtx;
}

function playTone(frequency, durationMs, type) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch (e) {
    /* audio not available in this WebView — game still works silently */
  }
}

function playCorrectSound() {
  playTone(880, 120, "sine");
  setTimeout(() => playTone(1318.5, 150, "sine"), 90);
}

function playWrongSound() {
  playTone(190, 260, "sawtooth");
}

function renderReactionGame() {
  const wrap = el("div");
  wrap.appendChild(topbar("⚡ Лови коэффициент"));
  const main = el("main");

  main.appendChild(
    el("p", {
      class: "subtitle",
      text: "Сверху падают три коэффициента. Успей нажать на самый большой, пока он не долетел до низа.",
    })
  );

  const hud = el("div", { class: "reaction-hud" });
  const livesEl = el("span", { text: "❤️❤️❤️" });
  const scoreEl = el("span", { text: "Очки: 0" });
  hud.appendChild(livesEl);
  hud.appendChild(scoreEl);
  main.appendChild(hud);

  const arena = el("div", { class: "reaction-arena" });
  const messageEl = el("div", { class: "subtitle reaction-message", text: "Приготовься..." });
  const playArea = el("div", {}, [arena, messageEl]);
  main.appendChild(playArea);

  const overArea = el("div");
  overArea.style.display = "none";
  main.appendChild(overArea);

  wrap.appendChild(main);

  const START_DURATION = 1700;
  const MIN_DURATION = 750;

  let lives = 3;
  let score = 0;
  let duration = START_DURATION;
  let roundActive = false;
  let missTimer = null;
  let nextRoundTimer = null;

  function updateHud() {
    livesEl.textContent = "❤️".repeat(Math.max(0, lives)) + "🖤".repeat(Math.max(0, 3 - lives));
    scoreEl.textContent = `Очки: ${score}`;
  }

  function spawnRound() {
    arena.innerHTML = "";
    roundActive = true;
    messageEl.textContent = "Лови самый большой!";
    const odds = reactionGenerateRound();
    const maxOdd = Math.max(...odds);

    odds.forEach((odd, i) => {
      const box = el("button", { class: "odd-box", text: odd.toFixed(2) });
      // Random offset inside its lane, plus a side-to-side sway while
      // falling, so the three boxes don't just drop in straight lines.
      const laneJitter = Math.random() * 6 - 3;
      box.style.left = `${i * 33.33 + 2 + laneJitter}%`;
      box.style.top = "0%";
      box.style.setProperty("--sway", `${6 + Math.random() * 10}px`);
      box.style.animationDuration = `${0.35 + Math.random() * 0.35}s`;
      box.addEventListener("click", () => {
        if (!roundActive) return;
        endRound(odd === maxOdd ? "correct" : "wrong");
      });
      arena.appendChild(box);
      requestAnimationFrame(() => {
        box.style.transition = `top ${duration}ms linear`;
        box.style.top = "82%";
      });
    });

    missTimer = setTimeout(() => {
      if (roundActive) endRound("miss");
    }, duration + 150);
  }

  function endRound(outcome) {
    if (missTimer) clearTimeout(missTimer);
    roundActive = false;
    if (outcome === "correct") {
      score += 1;
      duration = Math.max(MIN_DURATION, duration - 70);
      messageEl.textContent = "✅ Верно!";
      playCorrectSound();
      if (score % 3 === 0) burstConfetti(16);
    } else if (outcome === "wrong") {
      lives -= 1;
      messageEl.textContent = "❌ Не тот коэффициент.";
      playWrongSound();
    } else {
      lives -= 1;
      messageEl.textContent = "⌛ Не успел.";
      playWrongSound();
    }
    updateHud();
    arena.innerHTML = "";
    if (lives <= 0) {
      gameOver();
      return;
    }
    nextRoundTimer = setTimeout(spawnRound, 500);
  }

  function gameOver() {
    playArea.style.display = "none";
    const earned = score * 10;
    if (earned > 0) casinoSetBalance(casinoGetBalance() + earned);
    overArea.innerHTML = "";
    overArea.style.display = "";
    overArea.appendChild(
      el("div", {
        class: "card",
        html: `<div class="card-title">Игра окончена</div><div class="card-sub">Поймано верно: ${score} · Начислено: +${earned} 🪙</div>`,
      })
    );
    overArea.appendChild(el("button", { class: "btn", text: "🔄 Играть снова", onclick: restart }));
  }

  function restart() {
    lives = 3;
    score = 0;
    duration = START_DURATION;
    updateHud();
    overArea.style.display = "none";
    playArea.style.display = "";
    nextRoundTimer = setTimeout(spawnRound, 400);
  }

  onCleanup(() => {
    if (missTimer) clearTimeout(missTimer);
    if (nextRoundTimer) clearTimeout(nextRoundTimer);
    roundActive = false;
  });

  updateHud();
  nextRoundTimer = setTimeout(spawnRound, 600);

  return wrap;
}

// ---- Sport tiles ("MMAboxing" main-menu button) ----

const SPORT_TILE_ICONS = {
  ufc: '<svg viewBox="0 0 24 24" fill="none"><path d="M8 2H16L22 8V16L16 22H8L2 16V8L8 2Z" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  mma: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 10V7a2 2 0 1 1 4 0v3M10 10V6a2 2 0 1 1 4 0v4M14 10V7a2 2 0 1 1 4 0v5M18 12v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-4l-1-4a1.5 1.5 0 0 1 3-1l.5 2" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  boxing:
    '<svg viewBox="0 0 24 24" fill="none"><path d="M7 3C5 3 3.5 4.5 3.5 6.5V12C3.5 15 5.5 17 8 17H9V21H16V13.5C16 13.5 17.5 13 17.5 10.5V7C17.5 5 16 3.5 14 3.5C13 3.5 12.2 3.9 11.6 4.5C11 3.9 10.2 3.5 9.2 3.5C8.5 3.5 7.8 3.7 7 3Z" fill="#fff"/></svg>',
};

// UFC has no mock roster of its own yet (it's a single MMA promotion, not a
// separate sport in COMPETITORS/EVENTS) — its tile stays a placeholder while
// MMA and boxing already have demo fighters/events/odds to show.
const SPORT_TILE_TARGETS = {
  mma: () => navigate("events", { sport: "mma" }),
  boxing: () => navigate("events", { sport: "boxing" }),
  ufc: () => navigate("placeholder", { title: PLACEHOLDER_TITLES.ufc }),
};

function renderSportTiles() {
  const wrap = el("div");
  wrap.appendChild(topbar("🥋 MMAboxing", false));
  const main = el("main");
  const tiles = [
    { key: "ufc", label: "UFC", cls: "sport-tile-ufc" },
    { key: "mma", label: "MMA", cls: "sport-tile-mma" },
    { key: "boxing", label: "БОКС", cls: "sport-tile-boxing" },
  ];
  const list = el("div", { class: "sport-tiles" });
  for (const tile of tiles) {
    list.appendChild(
      el("button", {
        class: `sport-tile ${tile.cls}`,
        html: SPORT_TILE_ICONS[tile.key] + `<span class="sport-tile-label">${tile.label}</span>`,
        onclick: SPORT_TILE_TARGETS[tile.key],
      })
    );
  }
  main.appendChild(list);
  main.appendChild(
    el("p", { class: "subtitle", text: "MMA и бокс — предматчевые события и коэффициенты (демо-данные). UFC — раздел в разработке." })
  );
  wrap.appendChild(main);
  return wrap;
}

// ---- Free express example screen ----

function renderFreeExpress() {
  const wrap = el("div");
  wrap.appendChild(topbar("🎁 Бесплатный экспресс", false));
  const main = el("main");
  main.appendChild(
    el("p", { class: "subtitle", text: "Пример того, как будет выглядеть бесплатный экспресс (демо, без реальных событий)." })
  );

  const examples = [
    { title: "Одиночная ставка", sub: "1 событие", odd: "@2.10" },
    { title: "Экспресс из 2 событий", sub: "футбол + баскетбол", odd: "@4.85" },
    { title: "Экспресс из 3 событий", sub: "футбол + теннис + хоккей", odd: "@12.30" },
  ];
  for (const ex of examples) {
    const card = el("div", { class: "express-example-card" });
    card.appendChild(el("div", { class: "express-example-title", text: ex.title }));
    card.appendChild(el("div", { class: "card-sub", text: ex.sub }));
    card.appendChild(el("div", { class: "express-example-odd", text: ex.odd }));
    main.appendChild(card);
  }
  main.appendChild(el("p", { class: "subtitle", text: "🚧 Раздел в разработке — скоро здесь будут реальные подборки." }));
  wrap.appendChild(main);
  return wrap;
}

// ---- Placeholder (sections opened from the bot's express-bet buttons,
// content still to come) ----

function renderPlaceholder({ title }) {
  const wrap = el("div");
  wrap.appendChild(topbar(title, false));
  const main = el("main");
  main.appendChild(
    el("div", {
      class: "card",
      html: '<div class="card-title">🚧 Скоро здесь появится контент</div><div class="card-sub">Этот раздел ещё в разработке.</div>',
    })
  );
  wrap.appendChild(main);
  return wrap;
}

// ---- Boot ----

if (tg) {
  tg.ready();
  tg.expand();
  applyTheme();
  tg.onEvent("themeChanged", applyTheme);
  tg.BackButton.onClick(goBack);
}

// Opened via the bot's native Game card (sendGame -> answerCallbackQuery
// url=...?view=reaction) jumps straight into the standalone reaction game
// (not the casino hub — a deliberately separate entry point), the casino
// button opens the casino hub (?view=casino), and the express-bet buttons
// (?view=ufc/boxing/express) open their own (currently placeholder)
// screens the same way.
const PLACEHOLDER_TITLES = {
  ufc: "🥋 UFC — предматч",
  boxing: "🥊 Boxing — предматч",
  express: "🧮 Экспресс (до 10 событий)",
};
const startView = new URLSearchParams(window.location.search).get("view");
if (startView === "casino") {
  navigate("casino");
} else if (startView === "reaction") {
  navigate("reactionGame");
} else if (startView === "sportstiles") {
  navigate("sportTiles");
} else if (startView === "freeexpress") {
  navigate("freeExpress");
} else if (startView in PLACEHOLDER_TITLES) {
  navigate("placeholder", { title: PLACEHOLDER_TITLES[startView] });
} else {
  goHome();
}
