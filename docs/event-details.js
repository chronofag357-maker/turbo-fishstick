// Shared event page. Provider data stays authoritative; no synthetic markets.
(() => {
  const root=document.createElement('section');root.id='event-detail';root.hidden=true;
  root.setAttribute('aria-label','Карточка события');document.querySelector('#app').append(root);
  let current=null,tab='match',origin=null,signature='';
  const text=(ru,en)=>window.AppLanguage?.current==='en'?en:ru;
  const number=v=>Number.isFinite(v)?String(v):'—';
  const status=s=>({inprogress:text('Live · идёт','Live · in progress'),live:text('Время начала по расписанию наступило','Scheduled start time has passed'),prematch:text('Прематч','Prematch'),finished:text('Завершён','Finished'),notstarted:text('Не начался','Not started'),delayed:text('Задержка','Delayed'),postponed:text('Перенесён','Postponed'),canceled:text('Отменён','Cancelled')})[s]||text('Статус уточняется','Status unavailable');
  function close(){current=null;root.hidden=true;root.replaceChildren();signature='';document.body.style.overflow='';if(origin?.isConnected)origin.focus({preventScroll:true});}
  function open(type,id){origin=document.activeElement;current={type,id};tab='match';signature='';root.hidden=false;root.scrollTop=0;document.body.style.overflow='hidden';update();root.querySelector('.ed-back')?.focus();}
  function combat(e){
    const context=e.cardInfo?.stage||e.title;
    const disabled=!!(e.unavailable||e.metadataUnavailable||e.cardInfo?.cancelled)||e.status==='finished';
    const cell=(label,v,kind,index)=>{
      const change=window.fightOddsChange?.(e.id,kind+index);
      return '<button class="'+(change?'odds-with-change odds-'+change.direction:'')+'" data-odd="'+esc(e.id)+'" data-index="'+index+'" data-coupon-market="'+kind+'" '+(disabled||!Number.isFinite(v)||v<=1?'disabled':'')+'><small>'+esc(label)+'</small><strong>'+fmt(v)+'</strong>'+(change?'<span class="odds-arrow" aria-hidden="true">'+(change.direction==='up'?'↑':'↓')+'</span>':'')+'</button>';
    };
    return '<div class="ed-hero"><div class="ed-context">'+esc(context||'')+'</div>'+e.fighters.map(n=>'<div class="ed-team"><span>'+esc(n)+'</span></div>').join('')+'<div class="ed-status">'+esc(e.date||'')+' · '+status(e.status)+'</div></div>'+
      '<nav class="ed-tabs">'+[['match',text('Бой','Fight')],['info',text('Информация','Information')]].map(([key,label])=>'<button data-ed-tab="'+key+'" aria-pressed="'+(tab===key)+'">'+label+'</button>').join('')+'</nav>'+
      (tab==='info'?'<div class="ed-section"><h3>'+text('О событии','Event information')+'</h3><p>'+esc(e.title)+'</p><p>'+esc(context||'')+'</p><p>'+esc(e.sourceNote||e.priceNote||'')+'</p></div>':
      '<section class="ed-section"><h3>'+text('Исход боя','Fight winner')+'</h3><div class="ed-prices ed-three">'+[text('Победа 1','Win 1'),text('Ничья','Draw'),text('Победа 2','Win 2')].map((label,i)=>cell(label,e.odds?.[i],'outcomes',i)).join('')+'</div></section>'+
      '<section class="ed-section"><h3>'+text('Тотал раундов','Total rounds')+'</h3>'+(e.totals?'<p>'+text('Раунды','Rounds')+': '+number(e.totals.line)+'</p><div class="ed-prices">'+cell(text('Больше','Over'),e.totals.over,'totals',1)+cell(text('Меньше','Under'),e.totals.under,'totals',2)+'</div>':'<p>'+text('Линия пока не опубликована','No line published yet')+'</p>')+'</section>')+
      '<details class="ed-section" data-ed-group="source"><summary>'+text('Источник и актуальность','Source and freshness')+'</summary><p>'+esc(e.priceNote||'')+'</p><p>'+esc(e.totalNote||'')+'</p><div data-ed-sources></div></details>'+
      '<div class="ed-notice">'+(disabled?text('Приём приостановлен. Сохранённые коэффициенты недоступны для выбора.','Betting suspended. Saved prices cannot be selected.'):text('Показаны только рынки, полученные от нашего источника.','Only markets received from our provider are shown.'))+'</div>';
  }
  function esports(e){
    const maps=e.details?.games||[],validScore=['inprogress','finished'].includes(e.status);
    const map=maps.find(g=>String(g.number)===tab);
    const tabs=[['match',text('Матч','Match')],...maps.filter(g=>g.number!=null).map(g=>[String(g.number),text('Карта ','Map ')+g.number])];
    let html='<div class="ed-hero"><div class="ed-context">'+esc(e.game+' · '+e.tournament)+(e.details?.bestOf?' · Bo'+e.details.bestOf:'')+'</div>'+e.teams.map((n,i)=>'<div class="ed-team"><span>'+esc(n)+'</span><b class="ed-score">'+(validScore?number(e.score?.[i]):'—')+'</b></div>').join('')+'<div class="ed-status">'+status(e.status)+'</div><ul class="ed-maps">'+maps.map(g=>'<li>'+text('Карта ','Map ')+number(g.number)+': <b>'+g.score.map(number).join(' : ')+'</b> · '+status(g.status)+'</li>').join('')+'</ul></div>'+
      '<nav class="ed-tabs">'+tabs.map(([key,label])=>'<button data-ed-tab="'+key+'" aria-pressed="'+(tab===key)+'">'+esc(label)+'</button>').join('')+'</nav>';
    if(map){
      html+='<section class="ed-section"><h3>'+text('Карта ','Map ')+number(map.number)+(map.map?' · '+esc(map.map):'')+'</h3><p>'+status(map.status)+(map.duration!=null?' · '+Math.floor(map.duration/60)+':'+String(Math.floor(map.duration%60)).padStart(2,'0'):'')+'</p><div class="ed-stat"><b>'+number(map.score?.[0])+'</b><span>'+text('Счёт карты','Map score')+'</span><b>'+number(map.score?.[1])+'</b></div>';
      if(map.winner)html+='<p>'+text('Победитель карты: ','Map winner: ')+esc(e.teams[map.winner-1])+'</p>';
      const labels={kills:['Убийства','Kills'],goldEarned:['Золото','Gold'],towerKills:['Башни','Towers'],dragonKills:['Драконы','Dragons'],nashorKills:['Барон','Baron'],towersDestroyed:['Башни','Towers']};
      html+='<div class="ed-stats">'+Object.entries(map.statistics||{}).filter(([,pair])=>pair.some(Number.isFinite)).map(([key,pair])=>'<div class="ed-stat"><b>'+number(pair[0])+'</b><span>'+esc(text(...(labels[key]||[key,key])))+'</span><b>'+number(pair[1])+'</b></div>').join('')+'</div></section><div class="ed-notice">'+text('Это статистика карты. Отдельная линия на карту от поставщика не подтверждена.','Map statistics. A separate map betting market has not been confirmed by our provider.')+'</div>';
    }else{
      html+=e.markets.map(m=>'<details class="ed-section" data-ed-group="'+esc(m.key)+'" open><summary>'+esc(m.name)+'</summary><div class="ed-prices">'+m.stakes.map(s=>window.EsportsFeed.priceCell(e,m,s)).join('')+'</div></details>').join('');
      if(!maps.length)html+='<div class="ed-notice">'+text('Данные по картам пока не получены. Live включается кнопкой «Обновить» в списке.','Map details have not arrived yet. Start Live with Refresh in the list.')+'</div>';
    }
    const state=window.EsportsFeed.connection(),states={stopped:text('остановлен','stopped'),connecting:text('подключение','connecting'),connected:text('подключён','connected'),reconnecting:text('переподключение','reconnecting'),error:text('ошибка','error')};
    return html+'<div class="ed-notice">API-Sport · Pari · '+text('Состояние потока: ','Stream status: ')+esc(states[state]||state)+'</div>';
  }
  function update(){
    if(!current)return;
    const e=current.type==='esports'?window.EsportsFeed?.event(current.id):events.find(e=>e.id===current.id);
    const next=JSON.stringify([e,tab,window.AppLanguage?.current,current.type==='esports'?[window.EsportsFeed.connection(),window.EsportsFeed.wanted(),window.EsportsFeed.movements()]:selected.size]);
    if(next===signature)return;signature=next;
    const scroll=root.scrollTop,groups=new Map([...root.querySelectorAll('[data-ed-group]')].map(el=>[el.dataset.edGroup,el.open]));
    const focused=root.contains(document.activeElement)?document.activeElement.dataset.edTab:null;
    root.dataset.sport=current.type==='esports'?'esports':'combat';
    const refresh=e?(current.type==='esports'?'<button class="ed-refresh" data-es-refresh>'+ (window.EsportsFeed.wanted()?text('Live · Стоп','Live · Stop'):text('Обновить ↻','Refresh ↻'))+'</button>':'<button class="ed-refresh refresh-line" data-ed-refresh data-refresh-event="'+esc(e.id)+'" title="'+text('Обновить этот бой — расходует квоту источника','Refresh this fight — uses provider quota')+'">'+text('Обновить ↻','Refresh ↻')+'</button>'):'';
    root.innerHTML='<header class="ed-bar"><button class="ed-back" aria-label="'+text('Назад к событиям','Back to events')+'">‹</button><strong>'+text('Карточка события','Event details')+'</strong>'+refresh+'</header>'+(e?(current.type==='esports'?esports(e):combat(e)):'<p class="ed-notice">'+text('Событие больше недоступно. Вернитесь к списку.','This event is no longer available. Return to the list.')+'</p>');
    for(const el of root.querySelectorAll('[data-ed-group]'))if(groups.has(el.dataset.edGroup))el.open=groups.get(el.dataset.edGroup);
    if(e&&current.type!=='esports'&&window.fightSourceLinks)root.querySelector('[data-ed-sources]')?.append(window.fightSourceLinks(e));
    if(focused)root.querySelector('[data-ed-tab="'+focused+'"]')?.focus({preventScroll:true});root.scrollTop=scroll;
  }
  root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.classList.contains('ed-back'))close();if(b.hasAttribute('data-ed-refresh')){const event=events.find(e=>e.id===current?.id);if(event)window.refreshBookmakerLine?.(event.sport,event.id);}if(b.dataset.edTab){tab=b.dataset.edTab;signature='';update();}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&current&&!document.querySelector('dialog[open]')){e.preventDefault();close();}});
  document.addEventListener('click',e=>{if(e.target.closest('.bottom-nav button'))close();});
  window.addEventListener('freebk-account-change',()=>{if(!freebkDemoSignedIn)close();});
  window.EventDetail={open,close,update};window.openFight=id=>open('combat',id);
  const originalRender=render;render=function(){originalRender();update();};
  window.addEventListener('esports-summary-change',update);
  document.addEventListener('click',e=>{if(e.target.closest('[data-language]')){signature='';update();}});
})();
