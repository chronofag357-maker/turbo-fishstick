// Independent mobile history screen; favourites are local and profile-specific.
(() => {
  const screen=document.createElement('section');screen.id='bet-history-screen';screen.hidden=true;screen.setAttribute('aria-label','История пари');document.querySelector('.app').append(screen);
  let name=null,data=null,tab='history',filter='all';const expanded=new Set();
  const money=n=>n.toLocaleString('ru-RU',{maximumFractionDigits:2});
  const key=()=> 'freebk-demo-favourites:'+name;
  function favourites(){try{return new Set(JSON.parse(localStorage.getItem(key())||'[]'))}catch{return new Set()}}
  const styles=document.createElement('style');styles.textContent=`
    #bet-history-screen{position:fixed;inset:0 0 calc(54px + env(safe-area-inset-bottom));width:min(100%,450px);margin:auto;z-index:8;background:var(--bg);overflow:auto;overscroll-behavior:contain;padding-top:env(safe-area-inset-top)}
    .history-header{position:sticky;top:0;background:var(--bg);z-index:2}.history-tabs{height:65px;display:flex;align-items:center;gap:8px;padding:0 10px;border-bottom:1px solid var(--line)}.history-tabs button{min-height:44px;font-size:20px;font-weight:700;color:#9b9db2;padding:4px}.history-tabs button[aria-selected=true]{color:var(--ink)}.history-tabs .history-icon{width:36px;flex-shrink:0;display:grid;place-items:center}.history-tabs .history-settings{margin-left:auto}.history-icon svg{width:22px;height:22px}
    .history-balance-row{padding:14px 16px;border-bottom:1px solid var(--line)}.history-balance{display:inline-flex;align-items:center;background:white;border:1px solid #d7d8df;border-radius:3px;font-size:13px;font-weight:700}.history-balance span{padding:4px 7px}.history-balance button{border-left:1px solid #d7d8df;width:36px;min-height:36px;font-size:24px}.history-filters{padding:8px 16px}.history-filters select{width:100%;padding:9px;background:white;border:1px solid var(--line)}.history-message{font-size:11px;padding:0 16px;color:#98536f}.history-message:empty{display:none}
    .history-list{padding:16px}.history-list>.empty{font-size:13px;padding:24px 0}
    #bet-history-screen .bet-record{position:relative;background:white;border:1px solid #d4d5dd;border-radius:5px;margin-bottom:10px;padding:0;overflow:hidden}.history-list .bet-record summary{padding:10px}.history-list .bet-card-title{padding-right:38px;color:#7a7f91;font-size:13px}.history-list .bet-card-meta{border-bottom:1px solid var(--line);padding-bottom:8px;margin:5px 0 10px}.history-list .bet-card-event{font-size:14px;margin:8px 0}.history-list .bet-card-numbers{border-top:1px solid var(--line);padding-top:9px}.history-list .bet-favourite{position:absolute;right:7px;top:7px;z-index:1;width:36px;height:40px;border:1px solid #d7d8df;border-radius:5px;color:#9b9db2;font-size:22px}.history-list .bet-favourite[aria-pressed=true]{color:#397eae;background:#edf5fb}.history-list .bet-card-title .bet-card-arrow{display:none}
    .history-list .bet-record[data-state=won] .bet-card-title{color:#567a22}.history-list .bet-record[data-state=lost] .bet-card-title{color:#98536f}.history-list .bet-record[data-state=void] .bet-card-title{color:#567a22}
    body:has(#bet-history-screen:not([hidden])){overflow:hidden}.app:has(#bet-history-screen:not([hidden])) #bet-coupon{visibility:hidden}
    @media(max-width:350px){.history-tabs{gap:5px}.history-tabs button{font-size:17px}.history-list{padding:12px}}
  `;document.head.append(styles);
  const stageCss=document.createElement('style');stageCss.textContent=`
    .history-balance-row{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:10px 12px}
    .history-stages{display:flex;flex:1;gap:4px;min-width:240px}
    .history-stages button{flex:1;white-space:nowrap;min-height:44px;background:#ebebf1;color:#858899;border:1px solid transparent;border-radius:4px;font-size:10px;font-weight:700;padding:4px}
    .history-stages button[aria-selected=true]{background:#E6F0CD;color:#567A22;border-color:#A3C85A}
    .history-tabs button[aria-selected=true]{color:#567A22}
    .history-outcome{display:block;font-size:17px;margin-top:12px}.history-schedule{position:relative;background:#f4f4f7;color:#9296a7;padding:6px 28px 6px 6px;text-align:center;margin:9px 0;font-size:11px}.history-schedule svg{position:absolute;right:4px;top:5px;width:18px;height:18px}
    .history-list .bet-card-numbers{display:flex;justify-content:space-between}.history-list .bet-card-numbers strong{font-size:17px}
    .history-list [data-state=won] .history-schedule{background:#F6FAED}.history-list [data-state=won] .bet-card-numbers{color:#567A22}
    .history-list [data-state=lost] .history-schedule{background:#F1E4EB;color:#98536F}
    .history-sale{width:100%;min-height:44px;background:#E6F0CD;color:#567A22;font-weight:700}
  `;document.head.append(stageCss);
  const navCss=document.createElement('style');navCss.textContent=`
    #bet-history-screen .history-tabs{gap:3px;padding:0 8px}
    #bet-history-screen .history-tabs button{font-size:15px;padding:3px;white-space:nowrap}
    #bet-history-screen .history-tabs .history-icon{width:30px}
    @media(max-width:350px){#bet-history-screen .history-tabs button{font-size:13px}#bet-history-screen .history-tabs .history-icon{width:26px}}
  `;document.head.append(navCss);
  const resultCss=document.createElement('style');resultCss.textContent=`
    .receipt-pick[data-result=won]{background:#edf8f0;border-left:3px solid #70BD8B;color:#257243;padding-left:8px}
    .receipt-pick[data-result=lost]{background:#E6F0CD;border-left:3px solid #A3C85A;color:#567A22;padding-left:8px}
    .receipt-pick[data-result=void]{background:#f4f4f7;border-left:3px solid #9b9db2;padding-left:8px}
    .pick-result{display:block;font-weight:700;margin-top:5px}
    .history-list [data-state=won] .history-schedule{background:#edf8f0;color:#257243}
    .history-list .bet-record[data-state=won] .bet-card-title,.history-list [data-state=won] .bet-card-numbers{color:#257243}
    .history-list [data-state=lost] .history-schedule{background:#E6F0CD;color:#567A22}
    .history-list .bet-record[data-state=lost] .bet-card-title{color:#567A22}
  `;document.head.append(resultCss);
  function state(b){return ['won','lost','void'].includes(b.status)?b.status:'pending'}
  const saleAvailable=b=>state(b)==='pending'&&Number.isFinite(b.cashoutOffer)&&b.cashoutOffer>0;
  const matches=b=>filter==='all'||filter==='sale'&&saleAvailable(b)||filter==='settled'&&state(b)!=='pending'||state(b)===filter;
  function paint(){
    const saved=favourites(),scroll=screen.scrollTop;
    screen.innerHTML=`<header class="history-header"><div class="history-tabs"><button class="history-icon" data-history-menu aria-label="Открыть меню"><svg><use href="#i-menu"/></svg></button><div role="tablist" style="display:contents"><button role="tab" data-history-tab="history" aria-selected="${tab==='history'}">История</button><button role="tab" data-history-tab="favourites" aria-selected="${tab==='favourites'}">Избранное</button></div><button type="button" data-action="menu-prematch">Прематч</button><button class="history-icon history-settings" data-history-settings aria-label="Фильтры истории"><svg><use href="#i-settings"/></svg></button></div><div class="history-balance-row"><div class="history-balance"><span>Баланс: ${data?money(data.balance):'0'}</span><button data-history-fund aria-label="Пополнить баланс">+</button></div></div><div class="history-filters" hidden><select aria-label="Статус пари"><option value="all">Все пари</option><option value="pending">Ожидают расчёта</option><option value="won">Выигрыш</option><option value="lost">Проигрыш</option><option value="void">Возврат</option></select></div><p class="history-message" role="status"></p></header><div class="history-list" role="tabpanel"></div>`;
    const list=screen.querySelector('.history-list');
    const stages=document.createElement('div');stages.className='history-stages';stages.setAttribute('role','tablist');stages.setAttribute('aria-label','Этап пари');
    for(const [value,label] of [['all','Все'],['pending','В игре'],['sale','На продажу'],['settled','Расчёт']]){
      const button=document.createElement('button');button.textContent=label;button.dataset.historyStage=value;button.setAttribute('role','tab');button.setAttribute('aria-selected',String(filter===value));stages.append(button);
    }
    screen.querySelector('.history-balance-row').append(stages);
    const bets=(data?.bets||[]).filter(b=>(tab==='history'||saved.has(b.id))&&matches(b));
    if(!bets.length){const p=document.createElement('p');p.className='empty';p.textContent=!name?'Войдите в профиль, чтобы увидеть свои пари.':tab==='favourites'?'В избранном пока нет купонов. Нажмите звёздочку на купоне в истории.':'Пари с выбранным статусом пока нет.';list.append(p)}
    for(const bet of bets){
      const card=window.createHistoryReceipt(bet);card.dataset.state=state(bet);card.open=expanded.has(name+bet.id);
      const summary=card.querySelector('summary'),title=card.querySelector('.bet-card-title>span');
      title.textContent=({pending:'Принято',won:'Выигрыш',lost:'Проигрыш',void:'Возврат'})[state(bet)]+' · '+(bet.picks.length===1?'Ординар':'Экспресс');
      const meta=card.querySelector('.bet-card-meta');summary.insertBefore(meta,card.querySelector('.bet-card-event'));
      const fight=bet.picks[0],eventLabel=card.querySelector('.bet-card-event');
      const outcome=document.createElement('strong');outcome.className='history-outcome';outcome.textContent=fight?.label||'Исход';summary.insertBefore(outcome,eventLabel);
      const schedule=document.createElement('div');schedule.className='history-schedule';
      schedule.textContent=state(bet)==='pending'?(fight?.startTime?new Date(fight.startTime).toLocaleString('ru-RU',{timeZone:'Europe/Moscow',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):fight?.date||'Время уточняется'):(bet.resultText||'Рассчитано');
      const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.innerHTML='<use href="#'+(fight?.sport==='boxing'?'i-box':'i-fist')+'"/>';schedule.append(icon);eventLabel.after(schedule);
      const numbers=card.querySelector('.bet-card-numbers');numbers.replaceChildren();
      const amounts=document.createElement('strong');amounts.textContent=money(bet.stake)+' → '+(state(bet)==='pending'?money(bet.payout):Number.isFinite(bet.settledPayout)?money(bet.settledPayout):state(bet)==='lost'?'0':state(bet)==='void'?money(bet.stake):'—');
      amounts.title=state(bet)==='pending'?'Возможная выплата':'Рассчитанная выплата';const odds=document.createElement('strong');odds.textContent=bet.odds.toFixed(2);numbers.append(amounts,odds);
      const note=card.querySelector('.bet-card-body>.receipt-meta');if(note)note.textContent=state(bet)==='pending'?'Пари · ожидает результата.':'Пари · результат из записи.';
      if(saleAvailable(bet)){const sale=document.createElement('button');sale.className='history-sale';sale.textContent='Продать пари за '+money(bet.cashoutOffer);sale.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();screen.querySelector('.history-message').textContent='Продажа пока не подключена. Баланс не изменён.'});summary.append(sale);}
      const more=document.createElement('span');more.className='bet-card-meta';more.style.cssText='border:0;margin:8px 0 0;padding:0;text-align:right';more.textContent=card.open?'Свернуть ⌃':'Развернуть ⌄';summary.append(more);
      card.addEventListener('toggle',()=>{if(!card.isConnected)return;if(card.open)expanded.add(name+bet.id);else expanded.delete(name+bet.id);more.textContent=card.open?'Свернуть ⌃':'Развернуть ⌄'});
      const star=document.createElement('button');star.className='bet-favourite';star.textContent=saved.has(bet.id)?'★':'☆';star.setAttribute('aria-label','Избранное');star.setAttribute('aria-pressed',String(saved.has(bet.id)));
      star.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const ids=favourites();if(ids.has(bet.id))ids.delete(bet.id);else ids.add(bet.id);try{localStorage.setItem(key(),JSON.stringify([...ids]));paint()}catch{screen.querySelector('.history-message').textContent='Не удалось сохранить избранное.'}});
      summary.append(star);list.append(card);
    }
    screen.querySelector('select').value=filter;screen.scrollTop=scroll;
  }
  window.BetHistory={show(n,d){name=n;data=d;screen.hidden=false;document.querySelector('.bottom-nav [data-action="bets"]').classList.add('active');paint()},hide(){screen.hidden=true;document.querySelector('.bottom-nav [data-action="bets"]').classList.remove('active')},get visible(){return !screen.hidden}};
  screen.addEventListener('click',e=>{if(e.target.closest('[data-history-menu]'))panel('Меню',window.freebkMenuContent());const t=e.target.closest('[data-history-tab]');if(t){tab=t.dataset.historyTab;paint();screen.scrollTop=0}if(e.target.closest('[data-history-settings]')){const f=screen.querySelector('.history-filters');f.hidden=!f.hidden}if(e.target.closest('[data-history-fund]'))screen.querySelector('.history-message').textContent='Пополнение и вывод денег не подключены.'});
  screen.addEventListener('change',e=>{if(e.target.matches('select')){filter=e.target.value;paint()}});
  screen.addEventListener('click',e=>{const button=e.target.closest('[data-history-stage]');if(button){filter=button.dataset.historyStage;paint();screen.scrollTop=0}});
  document.addEventListener('click',e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(['top','sport','menu-live','menu-prematch','broadcasts','games'].includes(action))window.BetHistory.hide()},true);
})();
