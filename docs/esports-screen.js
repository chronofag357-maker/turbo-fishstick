// Separate provider view: combat feeds, coupons and their stored IDs stay unchanged.
(() => {
  const nav=document.querySelector('.sports');
  const tab=document.createElement('button');
  tab.type='button';tab.className='sport';tab.dataset.sport='esports';tab.setAttribute('aria-pressed','false');
  tab.style.setProperty('--sport-gradient','url(#nav-time-gradient)');
  tab.innerHTML='<svg viewBox="0 0 28 26" aria-hidden="true"><path d="M2 20V10C2 5 5 3 8 3c3 0 4 2 6 2s3-2 6-2c3 0 6 2 6 7v10c0 3-3 4-5 1l-4-6h-6l-4 6c-2 3-5 2-5-1Z"/><path d="M6 8h5M8.5 5.5v5"/><circle cx="20" cy="6.5" r=".75"/><circle cx="17.5" cy="9" r=".75"/><circle cx="22.5" cy="9" r=".75"/><circle cx="20" cy="11.5" r=".75"/></svg><span class="sport-label">Киберспорт</span>';
  nav.insertBefore(tab,nav.querySelector('.broadcast-tab'));
  const view=document.createElement('section');view.id='esports-events';view.hidden=true;
  view.setAttribute('aria-label','Киберспортивные матчи');view.setAttribute('aria-live','polite');
  document.querySelector('#events').after(view);
  let data=null,busy=false,problem='',game='all',kind='result';
  const expanded=new Set();
  const baseRender=render;
  const usableMarkets=e=>(e.markets||[]).map(m=>({...m,stakes:(m.stakes||[]).filter(s=>Number.isFinite(s.price)&&s.price>1)})).filter(m=>m.stakes.length);
  const time=ms=>Number.isFinite(ms)?new Date(ms).toLocaleString('ru-RU',{timeZone:'Europe/Moscow',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+' МСК':'Время уточняется';
  function draw(){
    const active=sport==='esports'&&!topOnly;
    document.querySelector('#events').hidden=active;
    document.querySelector('.data-notice').hidden=active;
    document.querySelector('.fight-list-toolbar').hidden=active;
    document.querySelector('.markets').hidden=active;
    document.querySelector('#search').placeholder=active?'Команда или турнир':'Боец или турнир';
    view.hidden=!active;
    if(!active)return;
    const all=(data?.events||[]).map(e=>({...e,markets:usableMarkets(e)}));
    const games=[...new Set(all.map(e=>e.game))].sort();
    const list=all.filter(e=>(kind==='unlined'?e.markets.length===0:e.markets.some(m=>m.key===kind))&&(game==='all'||e.game===game)&&
      (mode==='live'?e.status==='inprogress':mode==='finished'?e.status==='finished':['notstarted','delayed','postponed'].includes(e.status))&&
      (!query||(e.tournament+' '+e.teams.join(' ')).toLocaleLowerCase('ru').includes(query)));
    const stale=data?.fetched_at&&(Date.now()/1000-data.fetched_at>1800);
    view.innerHTML='<div class="es-controls"><div class="es-games" aria-label="Дисциплина">'+[['all','Все'],...games.map(g=>[g,g==='Counter Strike'?'CS2':g])].map(([id,label])=>'<button data-es-game="'+esc(id)+'" aria-pressed="'+(game===id)+'">'+esc(label)+'</button>').join('')+'</div><div class="es-games es-markets" aria-label="Рынки">'+[['result','ИСХОДЫ'],['total','ТОТАЛЫ'],['handicap','ФОРЫ']].map(([id,label])=>'<button data-es-kind="'+id+'" aria-pressed="'+(kind===id)+'">'+label+'</button>').join('')+'</div></div>'+
      '<div class="es-source"><span>API-Sport · Pari · '+list.length+' матчей</span><button data-es-refresh '+(busy?'disabled':'')+'>'+ (busy?'Загрузка…':'Обновить ↻')+'</button><small>'+esc(problem||data?.error||(!data?'Получаем расписание…':(stale?'Сохранённые данные · ':'Получено ')+time(data.fetched_at*1000)))+'</small><details><summary>Об источнике и обновлении</summary>Пробный режим: один букмекер, расписание на три дня. Без фонового опроса; обновление не чаще 30 минут, до 10 запросов в сутки. Коэффициенты — для просмотра, оформление киберспортивных купонов пока не подключено. Тоталы и форы показаны с названием поставщика; отсутствующую линию не заменяем. '+(data?.partial?'Показана первая страница расписания. ':'')+esc(data?.message||'')+'</details></div>'+
      (list.length?list.map(e=>{
        const markets=e.markets.filter(m=>m.key===kind);
        const score=['inprogress','finished'].includes(e.status)&&e.score.every(Number.isFinite)?' · '+e.score.join(' : '):'';
        return '<article class="es-card"><button class="es-title" data-es-expand="'+esc(e.id)+'" aria-expanded="'+expanded.has(e.id)+'"><span><time>'+esc(time(e.start))+'</time><strong>'+esc(e.game+' · '+e.tournament)+'</strong></span><span class="es-chevron">'+(expanded.has(e.id)?'⌄':'›')+'</span></button><div class="es-match"><div class="es-teams">'+e.teams.map(t=>'<strong>'+esc(t)+'</strong>').join('')+'<small>'+esc((e.status==='inprogress'?'Live':e.status==='postponed'?'Перенесён':e.status==='delayed'?'Задержка':'Прематч')+score)+'</small></div><div class="es-prices">'+(markets.length?markets.flatMap(m=>m.stakes).map(s=>'<div class="es-price"><small>'+esc(s.label+(s.argument==null?'':' '+s.argument))+'</small><strong>'+s.price.toFixed(2)+'</strong></div>').join(''):'<span class="es-no-line">Линии пока нет</span>')+'</div></div>'+(!e.active&&markets.length?'<small class="es-muted">Приём у букмекера приостановлен · сохранённая линия</small>':'')+
        (expanded.has(e.id)?'<div class="es-details">'+e.markets.map(m=>'<strong>'+esc(m.name)+'</strong><div>'+m.stakes.map(s=>esc(s.label+(s.argument==null?'':' '+s.argument))+' — '+s.price.toFixed(2)).join(' · ')+'</div>').join('')+'<small>Линия Pari: '+esc(time(e.updated))+'</small></div>':'')+'</article>';
      }).join(''):'<div class="empty"><strong>'+ (busy?'Загрузка матчей…':'Нет матчей')+'</strong>'+esc(problem?'Попробуйте обновить позже.':query?'Измените поиск.':'Для выбранной дисциплины и режима матчей в полученном расписании нет.')+'</div>');
  }
  // Keep this fourth filter alongside the market tabs, including after every redraw.
  function addUnlinedTab(){
    const row=view.querySelector('.es-markets');if(!row||row.querySelector('[data-es-kind="unlined"]'))return;
    const button=document.createElement('button');button.dataset.esKind='unlined';
    button.setAttribute('aria-pressed',String(kind==='unlined'));button.textContent='В ОЖИДАНИИ ЛИНИИ';row.append(button);
  }
  const drawMarkets=draw;
  draw=function(){drawMarkets();addUnlinedTab();};
  render=function(){baseRender();draw();};
  async function load(refresh=false){
    if(busy)return;busy=true;problem='';draw();
    try{
      if(refresh&&window.ServerAccount?.enabled){data=await window.ServerAccount.api('esports-refresh',{});}
      else {const r=await fetch(window.FREEBK_API_BASE.replace(/\/$/,'')+'/api/esports'+(refresh?'?refresh=1':''),{cache:'no-store',signal:AbortSignal.timeout(35000)});if(!r.ok)throw new Error('Источник недоступен.');data=await r.json();}
      if(!Array.isArray(data.events))throw new Error('Не удалось прочитать расписание.');
      const summaryRows=data.events.filter(e=>e.status!=='finished'&&e.status!=='cancelled');
      window.esportsSummary={total:new Set(summaryRows.map(e=>e.id)).size,lined:new Set(summaryRows.filter(e=>usableMarkets(e).length).map(e=>e.id)).size};
      window.dispatchEvent(new Event('esports-summary-change'));
    }catch(e){problem=e.name==='TimeoutError'?'Сервер не ответил вовремя.':e.message;}
    finally{busy=false;draw();}
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.sport==='esports'){if(!data)load();else draw();}
    if(b.hasAttribute('data-es-refresh'))load(true);
    if(b.dataset.esGame){game=b.dataset.esGame;draw();}
    if(b.dataset.esKind){kind=b.dataset.esKind;draw();}
    if(b.dataset.esExpand){expanded.has(b.dataset.esExpand)?expanded.delete(b.dataset.esExpand):expanded.add(b.dataset.esExpand);draw();}
  });
  const originalSetSport=window.FightScreen.setSport;
  window.FightScreen.setSport=value=>{if(value!=='esports')return originalSetSport(value);sport=value;topOnly=false;render();if(!data)load();};
  if(new URLSearchParams(location.search).get('view')==='esports')window.FightScreen.setSport('esports');
})();
