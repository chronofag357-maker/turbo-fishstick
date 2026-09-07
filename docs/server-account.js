// Server identity and play-money ledger. Demo storage is used only on localhost.
(() => {
  const local=['127.0.0.1','localhost','[::1]'].includes(location.hostname);
  const enabled=!local||!!window.Telegram?.WebApp?.initData;
  let token=sessionStorage.getItem('p2p-session')||'', current=null, busy=false;
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=n=>Number(n||0).toLocaleString('ru-RU',{maximumFractionDigits:2});
  async function api(path,body){
    const response=await fetch('/api/private/'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(15000)});
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||'Сервер временно недоступен.');
    return data;
  }
  function repaint(){
    const container=document.querySelector('#panel-body .account-menu');
    if(container)container.outerHTML=window.freebkMenuContent();
  }
  async function refresh(){
    if(!token)return;
    current=await api('me');freebkDemoSignedIn=true;freebkDemoPartner=String(current.id);
    window.dispatchEvent(new Event('p2p-wallet-update'));repaint();
    return current;
  }
  function track(kind,details={}){if(enabled&&current)api('actions',{kind,...details}).catch(()=>{});}
  window.ServerAccount={enabled,get current(){return current},api,refresh,track};
  if(!enabled)return;
  window.freebkMenuContent=()=>{
    const stats=current?.stats;
    return `<div class="account-menu"><div class="menu-account-row ${current?'is-signed-in':''}"><div class="menu-avatar-block"><div class="menu-avatar is-partner"><svg viewBox="0 0 32 32"><circle cx="16" cy="10" r="6"/><path d="M5 30c0-14 22-14 22 0"/></svg></div><strong>${escape(current?.name||'Профиль')}</strong><small>${current?'Партнер':'Гость'}</small></div>${current?'<button class="menu-logout" data-server-logout>Выйти</button>':`<div class="menu-auth"><p>Вход через ваш аккаунт Telegram</p><label><input type="checkbox" data-server-consent style="width:22px;height:22px">Согласен на журнал действий в приложении для отчётов администратора. Поля ввода не записываются.</label><button data-server-login>Войти через Telegram</button></div>`}</div><div class="menu-balance"><div><small>Учебный баланс</small><strong>${money(current?.balance)}</strong></div></div>${stats?`<div class="server-stats"><span>В игре <b>${money(stats.inPlay)}</b></span><span>Поставлено <b>${money(stats.placed)}</b></span><span>Выплачено <b>${money(stats.paid)}</b></span><span>Плюс / минус <b>${money(stats.profit)}</b></span></div><button data-server-ledger>История операций</button>`:''}<div class="menu-shortcuts"><button data-action="top">Топ</button><button data-action="menu-live">Live</button><button data-action="menu-prematch">Прематч</button></div><div class="menu-links"><button data-action="games">Игры 24/7 ›</button><button data-action="results">Результаты ›</button><button data-action="broadcasts">Трансляции ›</button>${current?.admin?'<button data-server-admin>Панель администратора ›</button>':''}</div><p class="menu-demo-message" role="status"></p></div>`;
  };
  const css=document.createElement('style');css.textContent=`
    .server-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px 0;font-size:11px}.server-stats b{display:block;font-size:14px}
    .account-menu [data-server-login],.account-menu [data-server-ledger]{min-height:44px;padding:6px 12px;border:1px solid #A3C85A;border-radius:5px;color:#567A22;background:#E6F0CD}
    #server-admin{width:min(100%,450px);max-width:100%;height:95dvh;max-height:95dvh;border:1px solid #d7d8df;border-radius:12px;padding:14px;color:#252840;font:12px Arial;overflow:auto}
    #server-admin::backdrop{background:#0006}#server-admin header{display:flex;justify-content:space-between;align-items:center;position:sticky;top:-14px;background:white;z-index:1;padding:6px 0}
    #server-admin button,#server-admin select,#server-admin input:not([type=checkbox]){min-height:44px;max-width:100%;box-sizing:border-box}#server-admin input:not([type=checkbox]),#server-admin select{width:100%;border:1px solid #d7d8df;padding:6px;border-radius:4px}
    #server-admin button{color:#567A22;background:#E6F0CD;border:1px solid #A3C85A;border-radius:4px;padding:6px 10px}
    #server-admin section{padding:10px 0;border-bottom:1px solid #d7d8df}#server-admin h3{font-size:14px;margin:6px 0}#server-admin p{line-height:1.5;overflow-wrap:anywhere}#server-admin summary{min-height:44px;padding:8px 0;cursor:pointer}#server-admin label{display:block;margin:8px 0}#server-admin pre{white-space:pre-wrap;overflow-wrap:anywhere;font:11px Arial}#server-admin .admin-status{color:#98536F;position:sticky;bottom:0;background:white;padding:6px}#server-admin [data-result-form]{border-top:1px solid #ddd;padding:8px 0}
    #server-admin input{accent-color:#A3C85A}
  `;document.head.append(css);
  const dialog=document.createElement('dialog');dialog.id='server-admin';document.body.append(dialog);
  function shell(title){dialog.innerHTML=`<header><strong>${escape(title)}</strong><button data-admin-close aria-label="Закрыть">×</button></header><div data-admin-body>Загрузка…</div><p class="admin-status" role="status"></p>`;if(!dialog.open)dialog.showModal();}
  async function showAdmin(){
    shell('Панель администратора');
    try{
      const report=await api('admin/report');
      const {policy,accounts,actions}=report;
      const markets=new Map();for(const a of accounts)for(const b of a.bets)for(const p of b.picks)if(p.status==='pending')markets.set(p.resultKey,p);
      dialog.querySelector('[data-admin-body]').innerHTML=`<section><h3>Участники</h3><label>Числовой Telegram ID<input data-allow-id inputmode="numeric" placeholder="Telegram ID"></label><button data-allow>Добавить участника</button><p>Каждый новый участник получает 456 000 учебных единиц один раз. Старые браузерные купоны сюда не переносятся автоматически.</p></section><section><h3>Обновление коэффициентов</h3><label><input type="checkbox" data-policy-enabled ${policy.enabled?'checked':''}> Автообновление</label><input type="range" min="0" max="1000" data-policy-range value="${Math.round(Math.log(policy.seconds/40)/Math.log(2160)*1000)}" aria-label="Интервал обновления"><label>Интервал в секундах (40–86400)<input type="number" min="40" max="86400" data-policy-seconds value="${policy.seconds}"></label><p>Prematch — не чаще 60 секунд; основные рынки Live — 40 секунд. При двух видах спорта, пяти регионах и двух рынках опрос раз в 40 секунд может расходовать до 43 200 кредитов в сутки. Частота обновления не гарантирует наличие Live-линии.</p><label><input type="checkbox" data-policy-confirm> Понимаю расход квоты API</label><button data-policy-save>Сохранить</button></section><section><h3>Статистика и купоны</h3>${accounts.map(a=>`<details><summary>${escape(a.name||'Ожидает входа')} · ${a.id} · баланс ${money(a.balance)}</summary><p>Поставлено: ${money(a.stats.placed)} · В игре: ${money(a.stats.inPlay)} · Выплаты: ${money(a.stats.paid)} · Итог: ${money(a.stats.profit)}<br>Выиграно: ${a.stats.won} · Проиграно: ${a.stats.lost}</p><p>Отчёт показывает факты по рассчитанным купонам. По нажатиям нельзя достоверно определить качество прогноза или гарантировать прибыль.</p>${a.bets.map(b=>`<p>№ ${escape(b.id)}<br>${escape(b.status)} · ${money(b.stake)} → ${money(b.settledPayout??b.payout)}<br>${b.picks.map(p=>escape(p.fighters.join(' — '))+' · '+escape(p.label)+' · '+escape(p.status)).join('<br>')}</p>`).join('')}</details>`).join('')}</section><section><h3>Подтверждение результатов</h3><p>Ручное подтверждение по проверенному источнику. После подтверждения расчёт и зачисление выполняются автоматически, без повторной выплаты. Исправление уже подтверждённого результата здесь запрещено.</p>${[...markets].map(([key,p])=>`<form data-result-form data-key="${escape(key)}"><strong>${escape(p.fighters.join(' — '))}</strong><p>${escape(p.sourceKey)} · ${escape(p.marketKey)} ${escape(p.line??'')}</p><select aria-label="Результат"><option value="">Выберите подтверждённый исход</option>${(p.kind==='totals'?['Over','Under','void']:[...p.fighters,'Draw','void']).map(s=>`<option value="${escape(s)}">${escape(s==='void'?'Отмена / возврат':s)}</option>`).join('')}</select><input type="url" required placeholder="https:// — источник результата" aria-label="Источник результата"><label><input type="checkbox" required> Я проверил результат именно этого рынка и букмекера</label><button>Подтвердить и рассчитать</button></form>`).join('')||'<p>Нет ожидающих исходов.</p>'}</section><section><h3>Последние действия (до 200)</h3>${actions.map(a=>`<p>${escape(new Date(a.created*1000).toLocaleString('ru-RU'))} · ${a.uid} · ${escape(a.kind)}<br>${escape(a.payload)}</p>`).join('')}</section>`;
    }catch(error){dialog.querySelector('.admin-status').textContent=error.message;}
  }
  dialog.addEventListener('input',e=>{
    if(e.target.matches('[data-policy-range]'))dialog.querySelector('[data-policy-seconds]').value=Math.round(40*Math.pow(2160,e.target.value/1000));
    if(e.target.matches('[data-policy-seconds]')&&Number(e.target.value)>=40)dialog.querySelector('[data-policy-range]').value=Math.round(Math.log(Number(e.target.value)/40)/Math.log(2160)*1000);
  });
  dialog.addEventListener('click',async e=>{
    if(e.target.closest('[data-admin-close]')){dialog.close();return;}
    const button=e.target.closest('button');if(!button||button.disabled)return;
    try{
      if(button.matches('[data-allow]')){button.disabled=true;await api('admin/allow',{id:Number(dialog.querySelector('[data-allow-id]').value)});await showAdmin();}
      if(button.matches('[data-policy-save]')){
        const enabled=dialog.querySelector('[data-policy-enabled]').checked;
        if(enabled&&!dialog.querySelector('[data-policy-confirm]').checked)throw new Error('Подтвердите расход квоты перед включением.');
        button.disabled=true;await api('admin/policy',{enabled,seconds:Number(dialog.querySelector('[data-policy-seconds]').value)});dialog.querySelector('.admin-status').textContent='Настройка сохранена на сервере.';
      }
    }catch(error){dialog.querySelector('.admin-status').textContent=error.message;}finally{button.disabled=false;}
  });
  dialog.addEventListener('submit',async e=>{
    e.preventDefault();const form=e.target;if(!form.matches('[data-result-form]'))return;
    const button=form.querySelector('button');if(button.disabled)return;
    if(!confirm('Подтвердить результат? Связанные купоны будут рассчитаны, выплаты поступят на учебный баланс.'))return;
    button.disabled=true;
    try{await api('admin/result',{key:form.dataset.key,result:form.querySelector('select').value,source:form.querySelector('[type=url]').value,confirmed:form.querySelector('[type=checkbox]').checked});await refresh();await showAdmin();}catch(error){dialog.querySelector('.admin-status').textContent=error.message;button.disabled=false;}
  });
  document.addEventListener('click',async e=>{
    const button=e.target.closest('[data-server-login],[data-server-logout],[data-server-admin],[data-server-ledger]');if(!button)return;
    e.preventDefault();e.stopImmediatePropagation();if(busy)return;
    try{
      if(button.hasAttribute('data-server-admin')){await showAdmin();return;}
      if(button.hasAttribute('data-server-ledger')){
        shell('История операций');await refresh();dialog.querySelector('[data-admin-body]').innerHTML=(current?.transactions||[]).map(t=>`<p>${escape(new Date(t.created*1000).toLocaleString('ru-RU'))} · ${escape(t.kind)}<br>${t.amount>0?'+':''}${money(t.amount/100)} · ${escape(t.bet_id||'Начальный учебный баланс')}</p>`).join('');return;
      }
      busy=true;button.disabled=true;
      if(button.hasAttribute('data-server-logout')){await api('logout',{});token='';sessionStorage.removeItem('p2p-session');current=null;freebkDemoSignedIn=false;freebkDemoPartner='';}
      else{
        if(!document.querySelector('[data-server-consent]')?.checked)throw new Error('Подтвердите согласие на журнал действий.');
        const initData=window.Telegram?.WebApp?.initData;
        if(!initData)throw new Error('Откройте приложение кнопкой бота в Telegram.');
        token=(await api('login',{initData,consent:true})).token;sessionStorage.setItem('p2p-session',token);await refresh();
      }
      window.dispatchEvent(new Event('freebk-account-change'));repaint();
    }catch(error){const msg=document.querySelector('.menu-demo-message');if(msg)msg.textContent=error.message;}finally{busy=false;button.disabled=false;}
  },true);
  if(token)refresh().then(()=>window.dispatchEvent(new Event('freebk-account-change'))).catch(()=>{token='';sessionStorage.removeItem('p2p-session');});
  document.addEventListener('click',e=>{
    const button=e.target.closest('button');if(!button||button.disabled)return;
    if(button.dataset.event||button.dataset.fighter)track('open_fight',{event:button.dataset.event||button.dataset.fighter});
    if(button.dataset.action)track('section',{section:button.dataset.action});
    if(button.dataset.couponRemove)track('remove',{event:button.dataset.couponRemove});
    if(button.hasAttribute('data-coupon-dismiss')||button.hasAttribute('data-coupon-clear'))track('clear');
  },true);
  setInterval(()=>{if(!document.hidden&&token)refresh().catch(()=>{});},15000);
})();
