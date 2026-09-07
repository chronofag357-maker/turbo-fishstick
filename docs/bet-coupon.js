// Local play-money prototype. No bookmaker submission or real authentication.
(() => {
  const storageKey='freebk-demo-wallet-v1', picks=new Map();
  let expanded=false, stake='', notice='', historyOpen=false, settingsOpen=false;
  const money=n=>n.toLocaleString('ru-RU',{maximumFractionDigits:2});
  const account=()=>freebkDemoSignedIn?freebkDemoPartner:null;
  const read=()=>{try{return JSON.parse(localStorage.getItem(storageKey)||'{}')}catch{return {}}};
  const wallet=name=>{if(window.ServerAccount?.enabled)return window.ServerAccount.current||{balance:0,bets:[]};const data=read();return data[name]||{balance:456000,bets:[]}};
  window.DemoWallet={balance:name=>wallet(name).balance};
  const root=document.createElement('section');root.id='bet-coupon';root.setAttribute('aria-label','Купон');root.hidden=true;document.querySelector('.app').append(root);
  const style=document.createElement('style');style.textContent=`
    #bet-coupon{position:fixed;bottom:calc(54px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);width:min(100%,450px);z-index:9;background:white;border:1px solid var(--line);border-radius:14px 14px 0 0;box-shadow:0 -4px 20px #20243f15;color:var(--ink);font-size:12px}
    .coupon-handle{width:100%;min-height:48px;display:flex;justify-content:space-between;align-items:center;padding:18px 14px 6px;position:relative;touch-action:none;font-weight:700}
    .coupon-handle:before{content:'';position:absolute;top:7px;left:calc(50% - 19px);width:38px;height:4px;background:#9b9db2;border-radius:3px}
    .coupon-handle strong{color:#397eae;font-size:15px}.coupon-body{padding:4px 12px 12px;max-height:65dvh;overflow:auto;overscroll-behavior:contain}
    .coupon-items{max-height:30dvh;overflow:auto;overscroll-behavior:contain}.coupon-item{position:relative;border-bottom:1px solid var(--line);padding:9px 44px 9px 0;line-height:1.4}.coupon-item strong{display:flex;justify-content:space-between;gap:8px}.coupon-item small{display:block;color:#777b92;font-size:10px}.coupon-item button{position:absolute;right:0;top:5px;width:44px;height:44px;font-size:21px;color:#777b92}
    .coupon-tools,.coupon-summary{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:6px 0}.coupon-tools button{min-height:44px;color:#397eae}.coupon-entry{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px}.coupon-entry label{display:grid;gap:4px;font-size:11px}.coupon-entry input{width:100%;min-width:0;height:44px;font-size:16px;padding:8px;border:1px solid var(--line);border-radius:5px}.coupon-place{align-self:end;min-height:44px;border-radius:5px;background:var(--blue);color:white;font-weight:700}.coupon-place:disabled{opacity:.45}.coupon-notice{color:#98536f;font-size:11px;line-height:1.3;margin:6px 0 0}.coupon-notice:empty{display:none}.coupon-summary strong{font-variant-numeric:tabular-nums}.coupon-demo{font-size:10px;color:#777b92;margin:6px 0 0}
    .app:has(#bet-coupon:not([hidden])){padding-bottom:calc(120px + env(safe-area-inset-bottom))}.bet-record{padding:12px 0;border-bottom:1px solid var(--line);font-size:12px;line-height:1.5}.bet-record p{margin:4px 0}.bet-record ul{padding-left:18px}.bet-record small{color:#777b92}
  `;document.head.append(style);
  const referenceStyle=document.createElement('style');referenceStyle.textContent=`
    #bet-coupon:not(.is-expanded){width:min(calc(100% - 24px),426px);border-radius:13px;background:#ebebf1;box-shadow:0 2px 10px #20243f12;bottom:calc(66px + env(safe-area-inset-bottom))!important;overflow:hidden}
    #bet-coupon:not(.is-expanded) .coupon-handle{padding:0 12px 0 0;min-height:52px;gap:10px;text-align:left}
    #bet-coupon:not(.is-expanded) .coupon-handle:before{display:none}
    .coupon-brand{align-self:stretch;display:flex;align-items:center;padding:0 22px 0 12px;background:white;clip-path:polygon(0 0,100% 0,88% 100%,0 100%);font-size:13px;font-style:italic;font-weight:800;color:#397eae}
    .coupon-count{flex:1;font-size:12px}.coupon-handle strong{font-size:21px}
    .coupon-wallet-row .coupon-confirm{color:#397eae;font-weight:700}.coupon-wallet-row .coupon-confirm.is-confirmed{background:#E6F0CD;color:#567A22;border-color:#A3C85A}
    #bet-coupon{font-family:Arial,Helvetica,sans-serif;border-radius:10px 10px 0 0}
    #bet-coupon.is-expanded .coupon-handle{min-height:44px;height:44px;padding:0;margin-top:-24px}
    #bet-coupon.is-expanded .coupon-handle:before{top:31px}
    #bet-coupon.is-expanded .coupon-handle>span,#bet-coupon.is-expanded .coupon-handle>strong{display:none}
    .coupon-handle:before{background:#e7e7ed;width:44px;left:calc(50% - 22px)}
    .coupon-body{padding:0 16px 10px;max-height:72dvh}
    .coupon-items{max-height:38dvh;display:grid;gap:9px;padding:0}
    .coupon-item{border:1px solid #d7d8df;border-radius:5px;padding:8px 44px 8px 9px;min-height:80px;background:#fff;overflow:hidden;line-height:1.4}
    .coupon-item strong{font-size:16px;line-height:1.3;margin-bottom:6px}
    .coupon-item>div{font-size:12px;overflow-wrap:anywhere}.coupon-item small{font-size:11px;color:#9699aa}
    .coupon-item button{top:0;bottom:0;right:0;height:100%;width:28px;min-height:44px;background:#ebebf1;border-left:1px solid #e7e7ed;font-size:25px;color:#9b9db2}
    .coupon-card-foot{display:flex;justify-content:space-between;align-items:center;gap:5px;margin-top:3px}
    .coupon-card-foot svg{width:16px;height:16px;color:#bf2048;stroke-width:2}
    .coupon-tools{margin:10px 0 14px;gap:8px}.coupon-type{display:flex;gap:8px}.coupon-type button{border:1px solid #0866ba;border-radius:4px;padding:7px 9px;font-size:14px;font-weight:700;color:#0866ba;min-height:36px}.coupon-type .active{background:#075dc7;color:white}.coupon-total{margin-left:auto;color:#0866ba;font-size:17px}.coupon-tools .coupon-settings-icon{width:28px;min-height:36px;border:1px solid #d7d8df;border-radius:5px;display:grid;place-items:center}.coupon-settings-icon svg{width:18px;height:18px}
    .coupon-wallet-row{display:flex;gap:5px;align-items:stretch;margin:0 0 16px;overflow-x:auto;padding-bottom:1px}
    .coupon-wallet{display:flex;align-items:center;gap:7px;padding:5px 8px;background:#075dc7;color:white;border-radius:4px;flex-shrink:0}.coupon-wallet small{display:block;font-size:10px}.coupon-wallet strong{font-size:11px;white-space:nowrap}.coupon-wallet button{border-left:1px solid #fff9;font-size:23px;min-width:25px;height:28px;padding-left:7px}
    .coupon-wallet-row>button{border:1px solid #d7d8df;border-radius:4px;min-height:36px;flex-shrink:0;padding:4px 7px}.coupon-share svg{width:19px;height:19px}.coupon-limit{text-align:left;color:#9699aa;font-size:10px}.coupon-limit strong{display:block;font-size:12px}.coupon-wallet-row .coupon-config{border-color:#0866ba;color:#0866ba;font-weight:700;font-size:13px}
    .coupon-entry{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:0;border-radius:5px;overflow:hidden;background:#f0f0f5}
    .coupon-entry .coupon-amount{display:flex;align-items:center;min-width:0;height:44px;padding-left:6px;gap:4px;cursor:text;touch-action:manipulation}
    .coupon-entry input{width:auto;max-width:55%;flex:0 1 auto;min-width:12px;height:44px;padding:6px 0;border:0;border-radius:0;background:transparent;outline:none;box-shadow:none;font-size:16px}.coupon-amount:focus-within{box-shadow:inset 0 -2px #5797c2}.coupon-notice.is-neutral{color:var(--text,#252840)}
    .coupon-amount output{color:#9699aa;font-size:14px;white-space:nowrap;overflow:auto;min-width:0;line-height:1.1}.coupon-amount>span{color:#9699aa;font-size:17px;flex:none}.coupon-amount [hidden]{display:none}
    .coupon-place{height:44px;align-self:stretch;border-radius:0;font-size:12px;background:#075dc7;padding:4px}.coupon-place:disabled{background:#9b9db2;opacity:1}.coupon-entry.has-error{background:#f3dde5}
    .coupon-extra{display:flex;gap:10px;align-items:center;padding:6px 0}.coupon-extra button,[data-coupon-accept]{min-height:44px;color:#0866ba}
    .coupon-accepted{padding:15px;border:1px solid #70bd8b;background:#edf8f0;border-radius:8px;color:#257243;margin-bottom:12px;font-size:14px}.coupon-accepted strong{display:block;font-size:20px;margin-bottom:6px}.bet-record.just-accepted{background:#f3fbf5;border:1px solid #b6dfc4;padding:12px;border-radius:8px}
    @media(max-width:350px){.coupon-body{padding-left:12px;padding-right:12px}.coupon-type button{font-size:12px;padding:6px}.coupon-item strong{font-size:15px}}
  `;document.head.append(referenceStyle);
  const compactStyle=document.createElement('style');compactStyle.textContent=`
    #bet-coupon:not(.is-expanded) .coupon-handle{padding-right:44px;gap:6px}
    .coupon-dismiss{position:absolute;right:0;top:0;width:44px;height:100%;min-height:44px;font-size:24px;color:#777b92}
    .coupon-wallet-row{display:flex;overflow:visible;gap:8px}
    .coupon-wallet-row .coupon-wallet{flex:1;justify-content:space-between;min-width:0}
    .coupon-wallet-row>button{min-height:44px;flex:1;min-width:0}
    .coupon-wallet-row .coupon-share{display:grid;place-items:center}
  `;document.head.append(compactStyle);
  // Keep the stake controls above the mobile keyboard without moving the site navigation.
  function keyboardLayout(){
    const viewport=window.visualViewport;
    const gap=viewport?Math.max(0,innerHeight-viewport.height-viewport.offsetTop):0;
    root.style.bottom=gap>100?gap+'px':'';
    const body=root.querySelector('.coupon-body');
    if(body)body.style.maxHeight=gap>100?Math.max(120,viewport.height-80)+'px':'';
  }
  window.visualViewport?.addEventListener('resize',keyboardLayout);
  window.visualViewport?.addEventListener('scroll',keyboardLayout);
  function snapshot(e,kind,index){
    if(!e||e.unavailable||e.metadataUnavailable||e.cardInfo?.cancelled||['finished','cancelled'].includes(e.status))return null;
    if(e.startTime&&Date.parse(e.startTime)<=Date.now()&&e.status!=='live')return null;
    const value=kind==='outcomes'?e.odds[index]:index===1?e.totals?.over:index===2?e.totals?.under:null;
    if(!Number.isFinite(value)||value<=1||kind==='totals'&&index===0)return null;
    return {id:e.id,kind,index,value,fighters:[...e.fighters],title:e.title,date:e.date,sport:e.sport,startTime:e.startTime,
      label:kind==='outcomes'?['Победа: '+e.fighters[0],'Ничья','Победа: '+e.fighters[1]][index]:(index===1?'Больше ':'Меньше ')+e.totals.line+' раундов',
      line:kind==='totals'?e.totals.line:null,source:kind==='outcomes'?e.priceNote:e.totalNote,sourceKey:kind==='outcomes'?e.priceKey:e.totalKey};
  }
  const latest=p=>snapshot(events.find(e=>e.id===p.id),p.kind,p.index);
  const changed=(a,b)=>!b||a.value!==b.value||a.sourceKey!==b.sourceKey||a.line!==b.line||a.fighters.join('|')!==b.fighters.join('|');
  const total=()=>[...picks.values()].reduce((n,p)=>n*p.value,1);
  function amount(){const v=stake.trim().replace(',','.');return /^\d+(?:\.\d{1,2})?$/.test(v)?Math.round(Number(v)*100):0}
  function validity(){
    if(!account())return 'Войдите в профиль, чтобы оформить пари.';
    if([...picks.values()].some(p=>!latest(p)))return 'Один из исходов недоступен. Удалите его из купона.';
    if([...picks.values()].some(p=>changed(p,latest(p))))return 'Линия изменилась. Проверьте и примите новые коэффициенты.';
    if(!amount())return 'Введите сумму от 1 000 до 10 000, не более двух знаков после запятой.';
    if(amount()<100000)return 'Минимальная сумма — 1 000.';
    if(amount()>1000000)return 'Максимальная сумма — 10 000.';
    if(amount()>Math.round(wallet(account()).balance*100))return 'Недостаточно баланса.';
    if(!Number.isFinite(total())||!Number.isSafeInteger(Math.round(amount()*total())))return 'Слишком большая сумма или коэффициент.';
    return '';
  }
  function summary(){
    const payout=root.querySelector('[data-payout]'),button=root.querySelector('.coupon-place');
    const hasStake=!!stake.trim(),input=root.querySelector('[data-coupon-stake]');
    if(payout){payout.textContent=money(Math.round(amount()*total())/100);payout.hidden=!hasStake;payout.previousElementSibling.hidden=!hasStake;}
    if(input){const context=document.createElement('canvas').getContext('2d');context.font=getComputedStyle(input).font;input.style.width=Math.ceil(context.measureText(hasStake?stake:'Сумма').width+3)+'px';}
    if(button)button.disabled=!!validity();
    const message=root.querySelector('.coupon-notice');if(message){message.textContent=notice||(hasStake?validity():'1 000 – 10 000');message.classList.toggle('is-neutral',!notice&&!hasStake);}
    root.querySelector('.coupon-entry')?.classList.toggle('has-error',!!stake&&!!validity());
  }
  function draw(){
    const wasHidden=root.hidden;
    const oldTop=wasHidden?0:root.getBoundingClientRect().top;
    root.getAnimations().forEach(animation=>animation.cancel());
    root.hidden=!picks.size;
    root.classList.toggle('is-expanded',expanded);
    if(!picks.size){root.replaceChildren();return;}
    const needsAccept=[...picks.values()].some(p=>changed(p,latest(p)));
    root.innerHTML=`<button class="coupon-handle" aria-label="Развернуть или свернуть купон" aria-expanded="${expanded}"><span class="coupon-brand">P2P Market</span><span class="coupon-count">${picks.size} пари</span><strong>${fmt(total())}</strong></button>${!expanded?'<button class="coupon-dismiss" data-coupon-dismiss aria-label="Закрыть и очистить купон">×</button>':''}${expanded?`<div class="coupon-body"><div class="coupon-items">${[...picks.values()].map(p=>`<div class="coupon-item" title="${esc(p.source||'')}"><strong><span>${esc(p.kind==='outcomes'?['Поб 1','Ничья','Поб 2'][p.index]:p.label)}</span><span>${fmt(p.value)}</span></strong><div>${esc(p.fighters.join(' – '))}</div><div class="coupon-card-foot"><small>${esc(p.startTime?new Date(p.startTime).toLocaleString('ru-RU',{timeZone:'Europe/Moscow',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):p.date)}</small><svg viewBox="0 0 48 48" aria-hidden="true"><use href="#${p.sport==='boxing'?'i-box':'i-fist'}"/></svg></div>${changed(p,latest(p))?'<small>Линия изменилась или недоступна</small>':''}<button data-coupon-remove="${esc(p.id)}" aria-label="Удалить исход">×</button></div>`).join('')}</div><div class="coupon-tools"><div class="coupon-type"><button class="${picks.size>1?'active':''}" aria-pressed="${picks.size>1}">Экспресс</button><button data-coupon-system>Система</button></div><strong class="coupon-total">${fmt(total())}</strong></div><div class="coupon-wallet-row"><div class="coupon-wallet"><div><small>Баланс</small><strong>${account()?money(wallet(account()).balance):'0'}</strong></div><button data-coupon-fund aria-label="Пополнить баланс">+</button></div>${picks.size===1?'<button class="coupon-confirm" data-coupon-confirm>В купон</button>':''}<button class="coupon-share" data-coupon-copy aria-label="Скопировать купон"><svg viewBox="0 0 24 24"><path d="M5 11v9h14v-9M12 16V3M8 7l4-4 4 4"/></svg></button></div>${settingsOpen?'<div class="coupon-extra"><span>Один исход на бой</span><button data-coupon-clear>Очистить купон</button></div>':''}${needsAccept?'<button data-coupon-accept>Принять обновлённую линию</button>':''}<div class="coupon-entry"><label class="coupon-amount"><input aria-label="Сумма ставки" data-coupon-stake inputmode="decimal" placeholder="Сумма" value="${esc(stake)}" autocomplete="off"><span aria-hidden="true">→</span><output data-payout aria-label="Возможная выплата" aria-live="polite"></output></label><button class="coupon-place" data-coupon-place>Заключить пари</button></div><p class="coupon-notice" role="status"></p></div>`:''}`;
    summary();keyboardLayout();
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
      const offset=wasHidden?root.offsetHeight+60:oldTop-root.getBoundingClientRect().top;
      if(Math.abs(offset)>1)root.animate([
        {transform:`translate(-50%, ${offset}px)`,opacity:wasHidden?.65:1},
        {transform:'translate(-50%, 0)',opacity:1}
      ],{duration:wasHidden?480:360,easing:'cubic-bezier(.16,1,.3,1)'});
    }
  }
  function sync(){
    selected.clear();for(const p of picks.values())selected.set(p.id+p.kind+p.index,p);
  }
  const baseRender=render;
  render=function(){sync();baseRender();draw()};
  function toggle(id,kind,index){
    if(submitting)return;
    const p=snapshot(events.find(e=>e.id===id),kind,index);if(!p)return;
    const old=picks.get(id);
    window.ServerAccount?.track(old&&old.kind===kind&&old.index===index?'remove':'select',{event:id,market:kind,index});
    if(old&&old.kind===kind&&old.index===index)picks.delete(id);else picks.set(id,p);
    notice='';if(picks.size===1&&!old)expanded=true;
    render();
  }
  function history(){
    window.ServerAccount?.track('open_history');
    historyOpen=true;
    if(document.querySelector('#panel').open)document.querySelector('#panel').close();
    window.BetHistory.show(account(),account()?wallet(account()):null);
  }
  let submitting=false, requestKey=null, requestBody=null;
  async function place(){
    if(submitting)return;
    if(!picks.size)return;
    const issue=validity();if(issue){notice=issue;draw();return;}
    if(window.ServerAccount?.enabled){
      const body={stake:amount(),picks:[...picks.values()].map(p=>({id:p.id,sport:p.sport,kind:p.kind,index:p.index,value:p.value,line:p.line,sourceKey:p.sourceKey}))};
      const signature=JSON.stringify(body);
      const pendingKey='p2p-pending-submission:'+account();
      if(signature!==requestBody){
        let saved=null;try{saved=JSON.parse(sessionStorage.getItem(pendingKey)||'null')}catch{}
        requestBody=signature;requestKey=saved?.body===signature?saved.key:crypto.randomUUID();
      }
      submitting=true;
      root.querySelectorAll('button,input').forEach(e=>e.disabled=true);
      try{
        sessionStorage.setItem(pendingKey,JSON.stringify({body:signature,key:requestKey}));
        const bet=await window.ServerAccount.api('bets',{...body,key:requestKey});
        sessionStorage.removeItem(pendingKey);
        picks.clear();stake='';notice='';expanded=false;requestKey=null;requestBody=null;
        render();window.showDemoReceipt(bet);
        await window.ServerAccount.refresh().catch(()=>{});
      }catch(error){notice=error.message||'Нет подтверждения сервера. Повторите запрос: двойного списания не будет.';draw();}
      finally{submitting=false;draw();}
      return;
    }
    const name=account(),data=read(),w=wallet(name),cents=amount();
    const bet={id:crypto.randomUUID(),created:new Date().toISOString(),stake:cents/100,odds:total(),payout:Math.round(cents*total())/100,picks:[...picks.values()].map(p=>({...p}))};
    data[name]={balance:(Math.round(w.balance*100)-cents)/100,bets:[bet,...w.bets]};
    try{localStorage.setItem(storageKey,JSON.stringify(data))}catch{notice='Не удалось сохранить пари. Баланс не списан.';draw();return;}
    picks.clear();stake='';notice='';expanded=false;render();window.showDemoReceipt(bet);
  }
  root.addEventListener('input',e=>{if(e.target.matches('[data-coupon-stake]')){stake=e.target.value;notice='';summary()}});
  let drag=null,suppressClick=false;
  const dismiss=()=>{picks.clear();stake='';notice='';expanded=false;render()};
  root.addEventListener('pointerdown',e=>{const handle=e.target.closest('.coupon-handle');if(!handle)return;root.getAnimations().forEach(a=>a.cancel());drag={x:e.clientX,y:e.clientY,time:performance.now(),handle};handle.setPointerCapture(e.pointerId)});
  root.addEventListener('pointermove',e=>{if(!drag)return;if(expanded)root.style.marginBottom=-Math.max(0,e.clientY-drag.y)+'px';else root.style.translate=(e.clientX-drag.x)+'px 0'});
  const release=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y,elapsed=performance.now()-drag.time;root.style.marginBottom='';root.style.translate='';drag=null;if(e.type==='pointercancel')return;if(Math.max(Math.abs(dx),Math.abs(dy))>25){suppressClick=true;setTimeout(()=>suppressClick=false,400);if(!expanded&&Math.abs(dx)>Math.abs(dy)&&(Math.abs(dx)>70||Math.abs(dx)/elapsed>.5)){dismiss();return;}if(dy>65||dy>25&&dy/elapsed>.5)expanded=false;else if(dy< -35)expanded=true;draw()}};
  root.addEventListener('pointerup',release);root.addEventListener('pointercancel',release);
  root.addEventListener('click',async e=>{
    if(e.target.closest('[data-coupon-dismiss]')){dismiss();return;}
    const confirm=e.target.closest('[data-coupon-confirm]');
    if(confirm&&picks.size===1){
      if(confirm.disabled)return;
      confirm.disabled=true;confirm.classList.add('is-confirmed');confirm.textContent='✓ В купоне';
      const pick=[...picks.values()][0];
      setTimeout(()=>{if(confirm.isConnected&&picks.size===1&&[...picks.values()][0]===pick){expanded=false;draw()}},350);
      return;
    }
    const amountArea=e.target.closest('.coupon-amount');
    if(amountArea){
      const input=amountArea.querySelector('[data-coupon-stake]');
      if(e.target!==input){input.focus();input.setSelectionRange(input.value.length,input.value.length);}
      return;
    }
    if(e.target.closest('.coupon-handle')){if(!suppressClick){expanded=!expanded;draw()}return;}
    const remove=e.target.closest('[data-coupon-remove]');if(remove){picks.delete(remove.dataset.couponRemove);notice='';render();return;}
    if(e.target.closest('[data-coupon-settings]')){settingsOpen=!settingsOpen;draw();return;}
    if(e.target.closest('[data-coupon-system]')){notice='Система пока не подключена. Доступны ординар и экспресс.';summary();return;}
    if(e.target.closest('[data-coupon-fund]')){notice='Пополнение и вывод денег не подключены.';summary();return;}
    if(e.target.closest('[data-coupon-min]')){stake='1000';notice='';draw();return;}
    if(e.target.closest('[data-coupon-max]')){stake='10000';notice='';draw();return;}
    if(e.target.closest('[data-coupon-copy]')){
      const text=[...picks.values()].map(p=>p.fighters.join(' — ')+' · '+p.label+' · '+fmt(p.value)).join('\n')+'\nОбщий коэффициент: '+fmt(total());
      try{await navigator.clipboard.writeText(text);notice='Купон скопирован.'}catch{notice='Браузер не разрешил копирование.'}summary();return;
    }
    if(e.target.closest('[data-coupon-clear]')){picks.clear();stake='';notice='';render();return;}
    if(e.target.closest('[data-coupon-accept]')){for(const [id,p] of picks){const n=latest(p);if(n)picks.set(id,n)}notice='';render();return;}
    if(e.target.closest('[data-coupon-place]'))place();
  });
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.odd){e.preventDefault();e.stopImmediatePropagation();if(b.closest('#fight-live-details'))document.querySelector('#panel').close();toggle(b.dataset.odd,b.dataset.couponMarket||market,Number(b.dataset.index));return;}
    if(b.dataset.action==='bets'){e.preventDefault();e.stopImmediatePropagation();history();return;}
    if(b.dataset.action==='profile'){e.preventDefault();e.stopImmediatePropagation();panel('Меню',window.freebkMenuContent());}
  },true);
  window.addEventListener('freebk-account-change',()=>{picks.clear();stake='';notice='';render();if(window.BetHistory.visible)window.BetHistory.show(account(),account()?wallet(account()):null)});
  window.addEventListener('p2p-wallet-update',()=>{summary();if(window.BetHistory.visible)window.BetHistory.show(account(),account()?wallet(account()):null)});
  window.addEventListener('storage',e=>{if(e.key===storageKey||e.key?.startsWith('freebk-demo-favourites:')){draw();if(window.BetHistory.visible)history()}});
  draw();
})();
