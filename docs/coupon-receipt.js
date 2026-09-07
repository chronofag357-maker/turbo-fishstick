// Receipt export contains accepted demo-bet data, never login fields or wallet balance.
(() => {
  let current=null,previousFocus=null;
  const money=n=>n.toLocaleString('ru-RU',{maximumFractionDigits:2});
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const receipt=document.createElement('section');receipt.id='coupon-receipt';receipt.hidden=true;
  receipt.setAttribute('aria-label','Принятый купон');receipt.tabIndex=-1;document.body.append(receipt);
  const css=document.createElement('style');css.textContent=`
    #coupon-receipt{position:fixed;z-index:15;left:50%;bottom:calc(70px + env(safe-area-inset-bottom));transform:translateX(-50%);width:calc(100% - 24px);max-width:366px;max-height:calc(100dvh - 120px);overflow:auto;background:#f6fcf8;border:1px solid #9dceb0;border-radius:14px;box-shadow:0 12px 45px #193c352e;padding:14px;color:#20243f;font:12px/1.4 Arial,sans-serif}
    .receipt-heading{display:flex;align-items:center;justify-content:space-between;color:#257243;font-size:17px;font-weight:700}.receipt-heading button{min-width:44px;min-height:44px;font-size:22px;color:#567b64}.receipt-meta{font-size:10px;color:#728379;margin:0 0 8px}.receipt-list{max-height:24dvh;overflow:auto;overscroll-behavior:contain}.receipt-pick{border-top:1px dashed #cedfd3;padding:7px 0;font-size:11px}.receipt-pick strong{display:flex;justify-content:space-between;gap:10px}.receipt-totals{border-top:1px solid #cedfd3;padding-top:8px;margin-top:4px;display:grid;grid-template-columns:1fr auto;gap:4px}.receipt-totals strong{text-align:right}.receipt-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px}.receipt-actions button,.receipt-actions a{display:flex;align-items:center;justify-content:center;gap:4px;min-height:44px;border:1px solid #c9ded0;border-radius:6px;background:white;color:#32684a;text-decoration:none;font-size:11px;padding:4px}.receipt-actions svg{width:17px;height:17px}.receipt-hint,.receipt-status{font-size:10px;color:#728379;margin:7px 0 0}.receipt-status:empty{display:none}
    @media(prefers-reduced-motion:no-preference){#coupon-receipt:not([hidden]){animation:receipt-appear .45s cubic-bezier(.16,1,.3,1)}@keyframes receipt-appear{from{opacity:0;transform:translate(-50%,28px) scale(.98)}to{opacity:1;transform:translate(-50%,0) scale(1)}}}
  `;document.head.append(css);
  const acceptedCss=document.createElement('style');acceptedCss.textContent=`
    #coupon-receipt{background:white;border-color:#d7d8df;border-radius:12px}
    #coupon-receipt .receipt-heading{font-size:13px;color:#567A22}
    #coupon-receipt .receipt-totals[hidden]{display:none}
    .receipt-accepted{display:block;width:100%;min-height:44px;border-radius:4px;background:#E6F0CD;color:#567A22;border:1px solid #A3C85A;font-weight:700;margin-top:10px}
    .receipt-notifications{margin-top:8px}.receipt-notifications label{display:flex;align-items:center;justify-content:space-between;min-height:44px;font-size:11px;cursor:pointer;gap:10px}.receipt-notifications small{font-size:10px;color:#9296a7}
    .receipt-switch{position:relative;display:block;width:44px;height:44px;flex:none}
    .receipt-switch input{position:absolute;inset:0;width:44px;height:44px;margin:0;opacity:0;cursor:pointer;z-index:1}
    .receipt-switch-track{position:absolute;top:12px;left:2px;width:40px;height:20px;border-radius:12px;background:#d7d8df;transition:background .18s ease}
    .receipt-switch-track:after{content:'';position:absolute;left:2px;top:2px;width:16px;height:16px;border-radius:50%;background:white;box-shadow:0 1px 3px #0002;transition:transform .18s ease}
    .receipt-switch input:checked+.receipt-switch-track{background:#A3C85A}.receipt-switch input:checked+.receipt-switch-track:after{transform:translateX(20px)}
    .receipt-switch input:focus-visible+.receipt-switch-track{outline:2px solid #567A22;outline-offset:3px}
    @media(prefers-reduced-motion:reduce){.receipt-switch-track,.receipt-switch-track:after{transition:none}}
  `;document.head.append(acceptedCss);
  function text(b){return ['P2P Market · Учебный купон принят','№ '+b.id,new Date(b.created).toLocaleString('ru-RU'),...b.picks.map(p=>p.fighters.join(' — ')+' | '+p.label+' | '+p.value.toFixed(2)), 'Ставка: '+money(b.stake),'Коэффициент: '+b.odds.toFixed(2),'Возможная выплата: '+money(b.payout),'Учебное пари, не реальные деньги. Результат не рассчитан.'].join('\n')}
  function dismiss(){receipt.hidden=true;current=null;if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true})}
  const receiptMarkup=bet=>`<div class="receipt-heading"><span role="status">✓ Купон принят</span><button data-receipt-close aria-label="Закрыть уведомление">×</button></div><p class="receipt-meta">${bet.picks.length===1?'Ординар':'Экспресс'} · № ${escape(bet.id.slice(0,8))} · ${escape(new Date(bet.created).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}))}</p><div class="receipt-list">${bet.picks.map(p=>`<div class="receipt-pick"><strong><span>${escape(p.label)}</span><span>${p.value.toFixed(2)}</span></strong>${escape(p.fighters.join(' — '))}</div>`).join('')}</div><div class="receipt-totals"><span>Ставка</span><strong>${money(bet.stake)}</strong><span>Общий коэффициент</span><strong>${bet.odds.toFixed(2)}</strong><span>Возможная выплата</span><strong>${money(bet.payout)}</strong></div><div class="receipt-actions"><button data-receipt-download><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4"/></svg>Скачать</button><button data-receipt-share><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11v9h14v-9M12 16V3M8 7l4-4 4 4"/></svg>Отправить</button><a data-receipt-email href="mailto:?subject=${encodeURIComponent('P2P Market — учебный купон '+bet.id.slice(0,8))}&body=${encodeURIComponent(text(bet))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v14H3zM3 5l9 8 9-8"/></svg>Почта</a></div><p class="receipt-hint">Сохранён в «Мои пари» · учебный купон.<br>Нажмите на карточку, чтобы скрыть.</p><p class="receipt-status" role="status"></p>`;
  window.showDemoReceipt=bet=>{
    current=bet;previousFocus=document.activeElement;
    receipt.innerHTML=receiptMarkup(bet);
    receipt.querySelector('.receipt-totals').hidden=true;
    const accepted=document.createElement('button');accepted.className='receipt-accepted';accepted.textContent='✓ Пари принято';accepted.setAttribute('aria-label','Пари принято — закрыть');
    const options=document.createElement('div');options.className='receipt-notifications';
    let preferences={};const preferenceKey='p2p-receipt-notifications:'+bet.id;
    try{preferences=JSON.parse(localStorage.getItem(preferenceKey)||'{}')||{}}catch{}
    for(const [key,label] of [['start','На начало события'],['result','На результат пари']]){
      const row=document.createElement('label');row.textContent=label;
      const control=document.createElement('span');control.className='receipt-switch';
      const toggle=document.createElement('input');toggle.type='checkbox';toggle.setAttribute('role','switch');toggle.dataset.notification=key;toggle.checked=preferences[key]===true;
      const track=document.createElement('span');track.className='receipt-switch-track';track.setAttribute('aria-hidden','true');control.append(toggle,track);row.append(control);options.append(row);
      toggle.addEventListener('change',()=>{const old=preferences[key]===true;preferences[key]=toggle.checked;try{localStorage.setItem(preferenceKey,JSON.stringify(preferences))}catch{preferences[key]=old;toggle.checked=old;receipt.querySelector('.receipt-status').textContent='Не удалось сохранить настройку.'}});
    }
    const note=document.createElement('small');note.textContent='Уведомления пока не подключены';options.append(note);
    receipt.querySelector('.receipt-list').after(options);options.after(accepted);
    receipt.hidden=false;receipt.focus({preventScroll:true});
  };
  function svg(b){
    const lines=text(b).split('\n').flatMap(line=>line.match(/.{1,45}(?:\s|$)|.{1,45}/gu)||['']);
    const height=80+lines.length*24;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="${height}" viewBox="0 0 600 ${height}"><rect width="600" height="${height}" rx="18" fill="#f6fcf8"/><rect x="10" y="10" width="580" height="${height-20}" rx="12" fill="none" stroke="#9dceb0"/>${lines.map((line,i)=>`<text x="28" y="${42+i*24}" font-family="Arial,sans-serif" font-size="18" fill="${i===0?'#257243':'#20243f'}">${escape(line)}</text>`).join('')}</svg>`;
  }
  async function exportAction(e,b,container){
    if(e.target.closest('[data-receipt-email]'))return true;
    const status=container.querySelector('.receipt-status');
    if(e.target.closest('[data-receipt-download]')){
      const url=URL.createObjectURL(new Blob([svg(b)],{type:'image/svg+xml;charset=utf-8'}));
      const a=document.createElement('a');a.href=url;a.download='P2P Market-'+b.id.slice(0,8)+'.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='Купон сохранён как SVG-изображение.';return true;
    }
    if(e.target.closest('[data-receipt-share]')){
      try{if(navigator.share)await navigator.share({title:'P2P Market — учебный купон',text:text(b)});else{await navigator.clipboard.writeText(text(b));status.textContent='Купон скопирован — вставьте его в сообщение или письмо.'}}catch(err){if(err.name!=='AbortError')status.textContent='Отправка недоступна. Используйте «Скачать» или «Почта».'}return true;
    }
    return false;
  }
  receipt.addEventListener('click',async e=>{
    if(e.target.closest('.receipt-notifications'))return;
    const b=current;if(!b)return;
    if(!await exportAction(e,b,receipt))dismiss();
  });
  const historyCss=document.createElement('style');historyCss.textContent=`
    #panel .bet-record{border:1px solid #9dceb0;border-radius:12px;background:#f6fcf8;padding:0;margin:0 0 10px;font:12px/1.4 Arial,sans-serif;overflow:hidden}
    .bet-record summary{list-style:none;cursor:pointer;padding:12px;position:relative}.bet-record summary::-webkit-details-marker{display:none}
    .bet-record .bet-card-title{display:flex;align-items:center;justify-content:space-between;color:#257243;font-size:13px;font-weight:700;gap:10px}.bet-card-arrow{font-size:22px;transition:transform .2s}.bet-record[open] .bet-card-arrow{transform:rotate(90deg)}
    .bet-record .bet-card-event{display:block;font-size:12px;margin:5px 0;overflow-wrap:anywhere}.bet-record .bet-card-meta{display:block;font-size:10px;color:#728379}
    .bet-record .bet-card-numbers{display:flex;justify-content:space-between;gap:8px;margin-top:8px;font-size:11px}.bet-card-numbers span{display:grid;gap:2px}.bet-card-numbers strong{font-size:12px}
    .bet-record .bet-card-body{padding:0 12px 12px}.bet-card-body .receipt-list{max-height:none;overflow:visible}.bet-card-body .receipt-pick{overflow-wrap:anywhere}.bet-card-body .receipt-hint{display:none}
    @media(prefers-reduced-motion:reduce){.bet-card-arrow{transition:none}}
  `;document.head.append(historyCss);
  window.createHistoryReceipt=bet=>{
    const card=document.createElement('details');card.className='bet-record';card.dataset.betId=bet.id;
    card.innerHTML=`<summary><span class="bet-card-title"><span>✓ ${bet.picks.length===1?'Ординар':'Экспресс'} · Принят</span><span class="bet-card-arrow" aria-hidden="true">›</span></span><strong class="bet-card-event">${escape(bet.picks[0]?.fighters.join(' — ')||'Купон')}${bet.picks.length>1?' · ещё '+(bet.picks.length-1):''}</strong><span class="bet-card-meta">${escape(new Date(bet.created).toLocaleString('ru-RU'))} · № ${escape(bet.id.slice(0,8))}</span><span class="bet-card-numbers"><span>Ставка<strong>${money(bet.stake)}</strong></span><span>Коэфф.<strong>${bet.odds.toFixed(2)}</strong></span><span>Выплата возможна<strong>${money(bet.payout)}</strong></span></span></summary><div class="bet-card-body">${receiptMarkup(bet)}</div>`;
    const body=card.querySelector('.bet-card-body');body.querySelector('.receipt-heading').remove();body.querySelector('.receipt-meta').remove();
    body.querySelector('.receipt-hint').remove();
    const note=document.createElement('p');note.className='receipt-meta';note.textContent='Учебное пари · результат ещё не рассчитан.';body.append(note);
    body.addEventListener('click',e=>{void exportAction(e,bet,body)});
    return card;
  };
  receipt.addEventListener('keydown',e=>{if(e.key==='Escape'||e.target===receipt&&['Enter',' '].includes(e.key)){e.preventDefault();dismiss()}});
  window.addEventListener('freebk-account-change',dismiss);
})();
