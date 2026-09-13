// Entry UI only. The slider is NOT a server-side anti-bot mechanism.
(() => {
  const sheet=document.createElement('dialog');
  sheet.id='welcome-entry';
  sheet.setAttribute('aria-label','Вход в FreeBetting');
  document.body.append(sheet);
  const style=document.createElement('style');
  style.textContent=`
  #welcome-entry{inset:0;margin:auto;width:min(100%,450px);height:100dvh;max-height:100dvh;max-width:100%;border:0;border-radius:0;padding:calc(24px + env(safe-area-inset-top)) 24px calc(24px + env(safe-area-inset-bottom));background:#f7f7f8;color:#20243f;overflow:auto}
  #welcome-entry::backdrop{background:#171b36cc}
  #welcome-entry .entry-layout{min-height:100%;display:flex;flex-direction:column;gap:18px}
  #welcome-entry button{min-height:48px}
  #welcome-entry .entry-back{align-self:start;padding:0;text-align:left}
  #welcome-entry h2{font-size:38px;line-height:1.08;letter-spacing:-1.5px;font-weight:600;margin:24px 0 0}
  #welcome-entry p{font-size:13px;line-height:1.6;margin:0;color:#65697c}
  #welcome-entry .entry-profile{display:flex;align-items:center;gap:14px;border-block:1px solid #e0e1e7;padding:18px 0}
  #welcome-entry .entry-avatar{display:grid;place-items:center;flex:0 0 44px;height:44px;border-radius:50%;background:#293870;color:white}
  #welcome-entry .entry-profile strong{display:block;overflow-wrap:anywhere}
  #welcome-entry small{display:block;font-size:11px;color:#65697c;margin-top:6px}
  #welcome-entry .entry-primary{margin-top:auto;background:#c52044;color:white;border-radius:4px;padding:14px 18px;width:100%;font-weight:600}
  #welcome-entry button:disabled{opacity:.45;cursor:default}
  #welcome-entry .entry-ticket{border:1px solid #d8d9e1;padding:18px 14px;border-radius:12px;background:white}
  #welcome-entry .entry-ticket header{font-size:10px;letter-spacing:1.4px;border-bottom:1px dashed #b8bac7;padding-bottom:16px;margin-bottom:18px}
  #welcome-entry .entry-track{position:relative;height:72px;background:#f5f5f9;border-radius:8px;margin:18px 0}
  #welcome-entry .entry-piece,#welcome-entry .entry-target{position:absolute;top:10px;width:64px;height:52px;border-radius:7px;display:grid;place-items:center;font-size:20px;font-weight:700;font-variant-numeric:tabular-nums}
  #welcome-entry .entry-piece{right:0;background:#c52044;color:white}
  #welcome-entry .entry-target{border:2px dashed #777b92;color:#777b92}
  #welcome-entry .entry-slide{position:relative;height:48px;border-radius:6px;background:#f1e4eb;overflow:hidden}
  #welcome-entry .entry-slide-hint{position:absolute;left:8px;top:0;height:100%;display:flex;align-items:center;font-size:10px;color:#777b92;pointer-events:none}
  #welcome-entry .entry-handle{position:absolute;right:0;top:0;width:45%;height:48px;min-height:48px;background:#257243;color:white;border-radius:0;padding:0 4px;font-size:12px;font-weight:700;touch-action:none;user-select:none;cursor:grab}
  #welcome-entry .entry-handle:active{cursor:grabbing}
  #welcome-entry .entry-consent{display:flex;gap:10px;font-size:12px;line-height:1.5}
  #welcome-entry .entry-consent input{width:22px;height:22px;flex-shrink:0}
  #welcome-entry .entry-policy{margin-top:14px;font-size:12px}#welcome-entry .entry-policy summary{cursor:pointer;min-height:44px;padding:12px 0;text-decoration:underline}#welcome-entry .entry-policy p{font-size:12px}
  #welcome-entry .menu-demo-message{min-height:32px}
  @media(prefers-reduced-motion:no-preference){#welcome-entry[open]{animation:entry-reveal .25s ease-out}@keyframes entry-reveal{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}}
  `;
  document.head.append(style);
  let options;
  function close(){sheet.close();document.querySelector('.welcome-login')?.focus()}
  function layout(title){
    sheet.innerHTML='<div class="entry-layout"><button class="entry-back" type="button">← Назад</button><h2></h2><div class="entry-body"></div><p class="menu-demo-message" role="status"></p><button class="entry-primary" type="button">Продолжить →</button></div>';
    sheet.querySelector('h2').textContent=title;
    sheet.querySelector('.entry-back').onclick=close;
    return sheet.querySelector('.entry-body');
  }
  function profile(){
    const body=layout('Вы в своей команде.');
    const user=window.Telegram?.WebApp?.initDataUnsafe?.user;
    // Display-only Telegram hints; never use these as trusted identity.
    const browserLogin=!options.localPreview&&!window.Telegram?.WebApp?.initData;
    const available=options.localPreview||!!window.Telegram?.WebApp?.initData;
    body.innerHTML='<p>Продолжите с вашим профилем.</p><div class="entry-profile"><span class="entry-avatar"></span><div><strong></strong><small></small></div></div><label class="entry-consent"><input type="checkbox" data-server-consent>Я согласен с политикой конфиденциальности.</label><details class="entry-policy"><summary>Политика конфиденциальности</summary><p>При входе сервер проверяет данные Telegram.</p></details>';
    const name=options.localPreview?'Ла Марсель':user?.first_name||'Пользователь Telegram';
    body.querySelector('strong').textContent=name;
    body.querySelector('.entry-avatar').textContent=Array.from(name)[0];
    body.querySelector('small').textContent=options.localPreview?'Локальный предпросмотр · без авторизации':'Профиль Telegram · сервер проверит данные при входе';
    const next=sheet.querySelector('.entry-primary');
    next.disabled=true;
    body.querySelector('input').onchange=e=>next.disabled=!e.target.checked||!available;
    if(!available)sheet.querySelector('.menu-demo-message').textContent='Откройте приложение кнопкой бота в Telegram. В этом браузере Telegram ID недоступен.';
    next.onclick=()=>{if(!next.disabled)puzzle()};
    if(browserLogin){
      body.querySelector('strong').textContent='Вход через Telegram';
      body.querySelector('small').textContent='Подтвердите профиль в защищённом окне Telegram.';
      const status=sheet.querySelector('.menu-demo-message');status.textContent='Подготовка защищённого входа…';
      next.textContent='Войти через Telegram';
      let challenge;
      body.querySelector('input').onchange=e=>next.disabled=!e.target.checked||!challenge;
      window.prepareBrowserLogin().then(c=>{challenge=c;status.textContent='';next.disabled=!body.querySelector('input').checked;}).catch(e=>{status.textContent=e.message});
      next.onclick=()=>{if(next.disabled)return;next.disabled=true;status.textContent='Подтвердите вход в Telegram…';window.runBrowserLogin(challenge).catch(e=>{status.textContent=e.message;});};
    }
  }
  function puzzle(){
    const body=layout('Соберите купон');
    body.innerHTML='<div class="entry-ticket"><header>FREEBETTING / ВХОД</header><p>Совместите коэффициент с пустой ячейкой и отпустите ползунок.</p><div class="entry-track"><div class="entry-target" aria-hidden="true">1.85</div><div class="entry-piece" aria-hidden="true">1.85</div></div><div class="entry-slide"><span class="entry-slide-hint">← Соберите купон</span><button class="entry-handle" type="button" role="slider" aria-label="Заключить пари — проверка входа" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">Заключить пари</button></div><small>Клавиатура: стрелки, затем Enter.</small></div><small>Проверка интерфейса, не ставка. Серверная антибот-защита пока не подключена.</small><input type="checkbox" data-server-consent checked hidden><button data-server-login hidden type="button">Войти через Telegram</button>';
    const next=sheet.querySelector('.entry-primary'),slider=body.querySelector('.entry-handle'),piece=body.querySelector('.entry-piece'),track=body.querySelector('.entry-track'),status=sheet.querySelector('.menu-demo-message');
    next.textContent='Открыть кабинет →';next.disabled=true;
    const goal=65+crypto.getRandomValues(new Uint32Array(1))[0]%21;
    body.querySelector('.entry-target').style.right='calc((100% - 64px) * '+goal/100+')';
    let solved=false,drag=null;
    slider.value='0';
    const rail=body.querySelector('.entry-slide');
    const paint=()=>{
      const value=Number(slider.value);
      piece.style.right='calc((100% - 64px) * '+value/100+')';
      slider.style.transform='translateX('+(-(rail.clientWidth-slider.offsetWidth)*value/100)+'px)';
      slider.setAttribute('aria-valuenow',String(Math.round(value)));
      slider.setAttribute('aria-valuetext',Math.round(value)+' процентов влево');
    };
    function check(){if(solved)return;if(Math.abs(Number(slider.value)-goal)*(track.clientWidth-64)/100<=7){
      solved=true;slider.value=goal;paint();slider.disabled=true;next.disabled=false;status.textContent='Купон собран.';next.focus();
    }else{slider.value=0;paint();status.textContent='Чуть мимо. Попробуйте ещё раз.'}}
    slider.onpointerdown=e=>{if(solved)return;e.preventDefault();drag={id:e.pointerId,x:e.clientX,value:Number(slider.value)};slider.setPointerCapture(e.pointerId)};
    slider.onpointermove=e=>{if(drag?.id!==e.pointerId)return;const travel=rail.clientWidth-slider.offsetWidth;if(travel<=0)return;slider.value=Math.max(0,Math.min(100,drag.value+(drag.x-e.clientX)*100/travel));paint()};
    slider.onpointerup=e=>{if(drag?.id!==e.pointerId)return;drag=null;check()};
    slider.onpointercancel=()=>{drag=null;if(!solved){slider.value=0;paint()}};
    slider.onlostpointercapture=()=>{if(drag){drag=null;if(!solved){slider.value=0;paint()}}};
    slider.onkeydown=e=>{
      if(solved)return;
      if(e.key==='Enter'||e.key===' '){e.preventDefault();check();return}
      if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){
        e.preventDefault();slider.value=e.key==='Home'?0:e.key==='End'?100:Math.max(0,Math.min(100,Number(slider.value)+(e.key==='ArrowLeft'?1:-1)));paint();
      }
    };
    paint();
    sheet.querySelector('.entry-back').onclick=profile;
    next.onclick=()=>{
      if(!solved||next.disabled)return;
      if(options.localPreview){options.onPreview();sheet.close();return}
      // Existing handler validates signed initData and allowlist on the backend.
      body.querySelector('[data-server-login]').click();
    };
    slider.focus();
  }
  window.openWelcomeEntry=o=>{options=o;profile();if(!sheet.open)sheet.showModal()};
  window.addEventListener('freebk-account-change',()=>{if(window.ServerAccount?.current&&sheet.open)sheet.close()});
})();
