// Compare only identical fighters, bookmakers and total lines.
window.oddsMovement = function(previous, next) {
  const result = {};
  if (!previous || previous.unavailable || next.unavailable || previous.fighters.join('|') !== next.fighters.join('|')) return result;
  const compare = (key, a, b) => {
    if (Number.isFinite(a) && Number.isFinite(b) && a !== b) result[key] = {direction: b > a ? 'up' : 'down', from: a, to: b};
  };
  if (previous.priceKey && previous.priceKey === next.priceKey) next.odds.forEach((n,i) => compare('outcomes'+i,previous.odds[i],n));
  if (previous.totalKey && previous.totalKey === next.totalKey && previous.totals && next.totals && previous.totals.line === next.totals.line) {
    compare('totals1',previous.totals.over,next.totals.over);
    compare('totals2',previous.totals.under,next.totals.under);
  }
  return result;
};
(() => {
  let previous = new Map(), movements = new Map(), opened = null;
  const screen = window.FightScreen, baseSet = screen.setEvents, baseRender = render;
  const decorate = (button, change) => {
    if (!change) return;
    button.classList.add('odds-'+change.direction);
    button.title = 'Было '+fmt(change.from)+' → '+fmt(change.to);
    const arrow = document.createElement('small');
    arrow.className = 'odds-arrow'; arrow.textContent = change.direction === 'up' ? '▲' : '▼';
    button.append(arrow);
  };
  function details() {
    const root = document.getElementById('fight-live-details');
    if (!root || !document.getElementById('panel').open) return;
    const e = events.find(e => e.id === opened);
    if (!e) {root.textContent='Бой отсутствует в последнем ответе. Линия недоступна.';return;}
    root.replaceChildren();
    const heading=document.createElement('div');heading.className='fight-sticky-heading';root.append(heading);
    let lineTarget=heading;
    const line = text => {const p=document.createElement('p');p.textContent=text;lineTarget.append(p)};
    line(e.title+' · '+e.date);
    if(e.cardInfo?.originalTitle&&e.cardInfo.originalTitle!==e.title)line(e.cardInfo.originalTitle);
    line(e.fighters.join(' — '));
    if(e.originalFighters&&e.originalFighters.join(' — ')!==e.fighters.join(' — '))line(e.originalFighters.join(' — '));
    lineTarget=root;
    if(e.cardInfo){line(e.cardInfo.stage);const p=document.createElement('p'),a=document.createElement('a');a.href=e.cardInfo.source;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Источник турнира · проверен '+e.cardInfo.checked;p.append(a);root.append(p);line(e.cardInfo.note||'Место в карде может измениться. Справочник обновляется отдельно от коэффициентов.');if(e.cardInfo.stale)line('Последняя автоматическая проверка источника не удалась.');}
    if(e.metadataUnavailable)line('По дополнительному источнику бой отменён или требует проверки. Выбор исходов отключён.');
    if(e.unavailable)line('Обновление недоступно. Ниже — сохранённые значения, не текущая линия.');
    const group = (labels,values,kind) => {
      const row=document.createElement('div');row.className='fight-prices';
      labels.forEach((label,i)=>{const cell=document.createElement('button');cell.type='button';cell.className='fight-price';cell.dataset.odd=e.id;cell.dataset.index=i;cell.dataset.couponMarket=kind;cell.disabled=!Number.isFinite(values[i])||values[i]<=1||kind==='totals'&&i===0||!!(e.unavailable||e.metadataUnavailable||e.cardInfo?.cancelled)||e.status==='finished';cell.setAttribute('aria-pressed',String(selected.has(e.id+kind+i)));const title=document.createElement('small');title.textContent=label;const value=document.createElement('strong');value.textContent=fmt(values[i]);decorate(value,movements.get(e.id)?.[kind+i]);cell.append(title,value);row.append(cell)});root.append(row);
    };
    group(['Победа 1','Ничья','Победа 2'],e.odds,'outcomes');line(e.priceNote);
    if(e.totals){line('Тотал '+e.totals.line+' раунда');group(['Раунды','Больше','Меньше'],[e.totals.line,e.totals.over,e.totals.under],'totals');line(e.totalNote)}
    else line('Тотал раундов пока не опубликован');
  }
  window.openFight = id => {opened=id;panel('Линия боя','<div id="fight-live-details" aria-live="polite"></div>');details()};
  render = function() {
    baseRender();
    document.querySelectorAll('#events [data-odd]').forEach(button => {
      const e=events.find(e=>e.id===button.dataset.odd);
      if(e?.unavailable){button.disabled=true;button.title='Сохранённая линия: обновление недоступно';button.classList.add('odds-stale');return;}
      decorate(button,movements.get(button.dataset.odd)?.[market+button.dataset.index]);
    });
    details();
  };
  screen.setEvents = function(data) {
    const updated = new Map();
    for(const e of data){
      const old=previous.get(e.id), change=window.oddsMovement(old,e);
      // Keep the last movement visible across repeated reads of the same snapshot.
      const unchanged=old && old.priceKey===e.priceKey && old.totalKey===e.totalKey && JSON.stringify(old.odds)===JSON.stringify(e.odds) && JSON.stringify(old.totals)===JSON.stringify(e.totals);
      updated.set(e.id,e.unavailable?{}:Object.keys(change).length?change:unchanged?movements.get(e.id)||{}:{});
    }
    movements=updated;previous=new Map(data.map(e=>[e.id,e]));baseSet.call(screen,data);
  };
  const css=document.createElement('style');
  css.textContent='.odds-up{color:#147342!important;background:#e5f5ec!important}.odds-down{color:#bd2940!important;background:#fce9ec!important}.odds-arrow{display:block;font-size:10px;line-height:14px}.odds-stale{opacity:.45}.fight-prices{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.fight-price{text-align:center;background:#f5f5f9;padding:10px 2px;border-radius:5px}.fight-price small{display:block;font-size:11px}.fight-price strong{display:block;font-size:21px;padding:8px 0}';
  document.head.append(css);
  const stickyCss=document.createElement('style');
  stickyCss.textContent='.fight-sticky-heading{position:sticky;top:0;z-index:2;background:#fff;padding:1px 0 6px;border-bottom:1px solid var(--line)}.fight-sticky-heading p{margin:6px 0;font-size:12px;line-height:1.3}';
  document.head.append(stickyCss);
})();
