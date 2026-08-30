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

function render() {
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
  const probs = calculateProbabilities(homeRating, awayRating, hasDraw);

  const wrap = el("div");
  wrap.appendChild(topbar("Анализ и вероятности"));
  const main = el("main");
  main.appendChild(
    el("div", { class: "card", html: `<div class="card-title">${event.home} — ${event.away}</div><div class="card-sub">${event.league}</div>` })
  );

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
    el("div", { class: "card", html: `<div class="card-title">${event.home} — ${event.away}</div><div class="card-sub">3 демо-букмекера</div>` })
  );

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
  main.appendChild(
    el("div", {
      class: "card",
      html: `<div class="card-title">Баланс: ${casinoGetBalance()} 🪙</div><div class="card-sub">Виртуальные очки, реальных денег тут нет.</div>`,
    })
  );
  main.appendChild(el("button", { class: "btn", text: "🎰 Слоты", onclick: () => navigate("slots") }));
  main.appendChild(el("button", { class: "btn", text: "🎡 Рулетка", onclick: () => navigate("roulette") }));
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

function renderSlots() {
  const wrap = el("div");
  wrap.appendChild(topbar("🎰 Слоты"));
  const main = el("main");

  const balanceEl = el("div", { class: "card-title", text: `Баланс: ${casinoGetBalance()} 🪙` });
  main.appendChild(el("div", { class: "card" }, [balanceEl]));

  const reelEls = [0, 1, 2].map(() => el("div", { class: "slot-reel", text: "❔" }));
  main.appendChild(el("div", { class: "slot-reels" }, reelEls));

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

    const result = slotSpin();
    let step = 0;
    const spinInterval = setInterval(() => {
      reelEls.forEach((r) => (r.textContent = slotSpinReel()));
      step += 1;
      if (step >= 8) {
        clearInterval(spinInterval);
        reelEls.forEach((r, i) => (r.textContent = result.reels[i]));
        if (result.winMultiplier > 0) {
          const winAmount = Math.round(casinoBet * result.winMultiplier);
          casinoSetBalance(casinoGetBalance() + winAmount);
          messageEl.textContent = `${result.message} Выигрыш: +${winAmount} 🪙`;
        } else {
          messageEl.textContent = result.message;
        }
        balanceEl.textContent = `Баланс: ${casinoGetBalance()} 🪙`;
        spinBtn.disabled = false;
      }
    }, 80);
  });
  main.appendChild(spinBtn);

  wrap.appendChild(main);
  return wrap;
}

function renderRoulette() {
  const wrap = el("div");
  wrap.appendChild(topbar("🎡 Рулетка"));
  const main = el("main");

  const balanceEl = el("div", { class: "card-title", text: `Баланс: ${casinoGetBalance()} 🪙` });
  main.appendChild(el("div", { class: "card" }, [balanceEl]));

  const wheelEl = el("div", { class: "roulette-number", text: "?" });
  main.appendChild(wheelEl);

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

    const result = rouletteSpin(selectedColor);
    let step = 0;
    const spinInterval = setInterval(() => {
      wheelEl.textContent = String(ROULETTE_WHEEL_ORDER[Math.floor(Math.random() * ROULETTE_WHEEL_ORDER.length)]);
      step += 1;
      if (step >= 10) {
        clearInterval(spinInterval);
        wheelEl.textContent = String(result.number);
        wheelEl.className = `roulette-number roulette-${result.color}`;
        if (result.winMultiplier > 0) {
          const winAmount = Math.round(casinoBet * result.winMultiplier);
          casinoSetBalance(casinoGetBalance() + winAmount);
          messageEl.textContent = `Выпало ${result.number} (${result.color}). Выигрыш: +${winAmount} 🪙`;
        } else {
          messageEl.textContent = `Выпало ${result.number} (${result.color}). Не повезло.`;
        }
        balanceEl.textContent = `Баланс: ${casinoGetBalance()} 🪙`;
        spinBtn.disabled = false;
      }
    }, 80);
  });
  main.appendChild(spinBtn);

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

goHome();
