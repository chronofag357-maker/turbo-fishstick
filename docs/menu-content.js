// In-memory UI demo only: never send or persist credentials or use this balance for payments.
let freebkDemoSignedIn = false;
let freebkDemoPartner = '';
const freebkDemoPartners = ['Марсель Ла', 'Владимир Елков', 'Артем Попенков'];
const normalizeDemoPartner = value => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru').replace(/ё/g, 'е');
window.freebkMenuContent = () => `
  <div class="account-menu">
    <div class="menu-account-row ${freebkDemoSignedIn ? 'is-signed-in' : ''}">
      <div class="menu-avatar-block">
        <div class="menu-avatar ${freebkDemoSignedIn ? 'is-partner' : ''}" aria-label="${freebkDemoSignedIn ? 'Аватар партнера' : 'Место для фотографии профиля'}"><svg viewBox="0 0 32 32" aria-hidden="true">${freebkDemoSignedIn ? '<path d="M4 30c0-13 24-13 24 0" fill="#397eae" stroke="none"/><circle cx="16" cy="12" r="7" fill="#efd2b7" stroke="none"/><path d="M9 12V9c0-9 15-9 14 2l-4-4-10 5" fill="#29375f" stroke="none"/>' : '<circle cx="16" cy="11" r="5"/><path d="M6 28v-3c0-10 20-10 20 0v3"/>'}</svg></div>
        <strong>${window.localPreviewProfile?.name||(freebkDemoSignedIn ? freebkDemoPartner : 'Профиль')}</strong><small>Партнёр</small>
      </div>
    </div>
    <div class="menu-balance"><div><small>Баланс</small><strong>${freebkDemoSignedIn ? (window.DemoWallet?.balance(freebkDemoPartner) ?? 456000).toLocaleString('ru-RU') : '0'}</strong></div><button type="button" data-menu-demo="balance" aria-label="Пополнение — пока недоступно">+</button></div>
    <div class="menu-shortcuts" aria-label="Разделы боёв">
      <button type="button" data-action="top">Топ</button><button type="button" data-action="menu-live">Live</button><button type="button" data-action="menu-prematch">Прематч</button>
    </div>
    <div class="menu-links">
      <button type="button" data-action="games">Игры 24/7 <span aria-hidden="true">›</span></button>
      <button type="button" data-action="results">Результаты <span aria-hidden="true">›</span></button>
      <button type="button" data-action="broadcasts">Трансляции <span aria-hidden="true">›</span></button>
      <button type="button" data-menu-demo="contact">Контактный центр <span aria-hidden="true">›</span></button>
    </div>
    <p class="menu-demo-message" role="status" aria-live="polite"></p>
    ${freebkDemoSignedIn ? '<button type="button" class="menu-logout" data-menu-demo="logout">Выход из аккаунта</button>' : ''}
  </div>`;
(() => {
  const style=document.createElement('style');
  style.textContent=`
    #panel.hamburger-sheet{height:82vh;height:max(82dvh,calc(100dvh - 140px),580px);max-height:calc(100dvh - env(safe-area-inset-top) - 12px);padding-left:14px;padding-right:14px;padding-bottom:calc(12px + env(safe-area-inset-bottom))}
    #panel.hamburger-sheet:not(.welcome-auth){height:var(--profile-sheet-height,calc(100dvh - 206px));max-height:var(--profile-sheet-height,calc(100dvh - 206px))}
    #panel.hamburger-sheet:not(.welcome-auth)>.close{position:absolute;top:0;right:0;width:40px;height:40px;min-width:40px;min-height:40px;padding:0;display:grid;place-items:center;border:1px solid #677454;border-radius:50%;background:#252923;color:#c2d99a;font:300 25px/40px Arial;box-shadow:none;z-index:3}
    #panel.hamburger-sheet:not(.welcome-auth)>.close:hover{background:#343c2b;color:#e6f0cd}
    #panel.hamburger-sheet:not(.welcome-auth)>.close:focus-visible{outline:0;box-shadow:inset 0 0 0 2px #a3c85a}
    #panel.hamburger-sheet #panel-title{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%)}
    #panel.hamburger-sheet #panel-body{height:100%;max-height:100%;overflow:auto}
    .account-menu{font-size:12px;color:var(--ink)}
    #panel:not(.welcome-auth) .account-menu{display:grid;grid-template-columns:74px minmax(0,1fr);gap:12px;align-items:center}
    #panel:not(.welcome-auth) .account-menu> *{grid-column:1/-1;min-width:0}
    #panel:not(.welcome-auth) .account-menu>.menu-account-row{grid-column:1;grid-row:1;display:flex;flex-direction:column;min-height:0;margin:0;gap:6px;position:relative}
    #panel:not(.welcome-auth) .menu-account-row .menu-avatar-block{width:74px;min-width:0;overflow-wrap:anywhere}
    #panel:not(.welcome-auth) .menu-avatar-block small{color:#567A22;font-weight:700}
    #panel:not(.welcome-auth) .account-menu>.menu-balance{grid-column:2;grid-row:1;align-self:start;height:64px;margin:0;padding:10px;gap:6px}
    #panel:not(.welcome-auth) .account-menu>.menu-logout{position:static;justify-self:start;width:74px;min-width:0;min-height:44px;padding:4px;font-size:10px}
    #panel:not(.welcome-auth) .menu-balance strong{font-size:20px;overflow-wrap:anywhere}
    #panel:not(.welcome-auth) .menu-balance button{flex:none}
    #panel:not(.welcome-auth) .menu-account-row .menu-logout{position:static;min-width:0;padding:4px;font-size:10px}
    #panel:not(.welcome-auth) .account-menu>.menu-shortcuts{margin:0}
    .menu-account-row{display:grid;grid-template-columns:74px minmax(0,1fr);gap:14px;align-items:center;margin-bottom:12px}
    .menu-account-row.is-signed-in{position:relative;display:flex;justify-content:center;min-height:140px}
    .is-signed-in .menu-avatar-block{width:calc(100% - 150px);min-width:0;overflow-wrap:anywhere}
    .menu-logout{position:absolute;right:0;top:8px;min-width:66px;min-height:44px;padding:8px;border:1px solid var(--line);border-radius:6px;color:#397eae;font-size:12px}
    .menu-logout:focus-visible{outline:2px solid #5797c2;outline-offset:-3px}
    .menu-auth{display:grid;gap:8px;min-width:0}
    .menu-login{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px 8px;min-width:0}
    .menu-login>strong{grid-column:1/-1}
    .menu-telegram{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;align-items:end;min-width:0}
    .menu-telegram>div{display:grid;gap:3px}
    .menu-auth label{display:grid;gap:2px;font-size:10px;color:#777b92;min-width:0}
    .menu-auth input{box-sizing:border-box;width:100%;min-width:0;height:44px;border:1px solid var(--line);border-radius:5px;background:var(--bg);padding:7px;font-size:16px;opacity:1;color:var(--ink)}
    .menu-auth input:focus{outline:none;border-color:#5797c2;box-shadow:inset 0 0 0 1px #5797c2}
    .menu-password-field{display:grid;gap:2px;min-width:0}
    .menu-password-wrap{position:relative;min-width:0}
    .menu-password-wrap input{padding-right:42px}
    .menu-password-eye{position:absolute;right:0;top:0;width:40px;height:44px;display:grid;place-items:center;border-radius:5px;color:#777b92}
    .menu-password-eye svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.6}
    .menu-password-eye[aria-pressed="true"]{color:#397eae}
    .menu-password-eye:focus-visible{outline:2px solid #5797c2;outline-offset:-3px}
    .menu-password-wrap input::-ms-reveal{display:none}
    .menu-avatar.is-partner{background:#e8f1f6}
    .menu-avatar.is-partner svg{width:52px;height:52px}
    .menu-avatar-block{display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center}
    .menu-avatar{width:64px;height:64px;border:1px solid #5797c2;border-radius:50%;background:#f1f5f7;display:grid;place-items:center;color:#777b92}
    .menu-avatar svg{width:38px;height:38px;stroke-width:1.5}
    .menu-avatar-block small,.menu-nickname{font-size:10px;color:#777b92}
    .menu-telegram button{min-height:44px;padding:5px;border:1px solid var(--line);border-radius:5px;color:#397eae}
    .menu-telegram [data-menu-demo="telegram"]{transition:background-color .14s ease,color .14s ease,border-color .14s ease,box-shadow .14s ease;touch-action:manipulation}
    .menu-telegram [data-menu-demo="telegram"]:active,.menu-telegram [data-menu-demo="telegram"]:focus-visible{background:#E6F0CD;color:#567A22;border-color:#A3C85A;box-shadow:0 0 0 2px #A3C85A33}
    @media(hover:hover) and (pointer:fine){.menu-telegram [data-menu-demo="telegram"]:hover{background:#E6F0CD;color:#567A22;border-color:#A3C85A;box-shadow:0 0 0 2px #A3C85A33}}
    @media(prefers-reduced-motion:reduce){.menu-telegram [data-menu-demo="telegram"]{transition:none}}
    .menu-balance{display:flex;justify-content:space-between;align-items:center;background:var(--blue);color:white;border-radius:8px;padding:10px 14px}
    .menu-balance small{display:block;font-size:11px;opacity:.85}.menu-balance strong{display:block;font-size:22px;margin-top:3px}.menu-balance strong span{font-size:12px;font-weight:400}
    .menu-balance button{width:44px;min-height:44px;border-left:1px solid #ffffff55;font-size:27px}
    .menu-shortcuts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin:12px 0}
    .menu-shortcuts button{border:1px solid var(--line);border-radius:6px;min-height:44px;font-weight:700}
    .menu-shortcuts button:active,.menu-links button:active{background:var(--bg)}
    .menu-links{border:1px solid var(--line);border-radius:7px;overflow:hidden}
    .menu-links button{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:44px;text-align:left;padding:8px 12px}
    .menu-links button+button{border-top:1px solid var(--line)}.menu-links span{font-size:20px;color:#777b92}
    .menu-demo-message{font-size:11px;line-height:1.4;color:#777b92;margin:8px 0 0}.menu-demo-message:empty{display:none}
  `;
  document.head.append(style);
  let revealTimer;
  function hidePassword(){
    clearTimeout(revealTimer);
    const input=document.querySelector('[data-demo-surname]');
    const eye=document.querySelector('.menu-password-eye');
    if(input)input.type='password';
    if(eye){eye.setAttribute('aria-pressed','false');eye.setAttribute('aria-label','Показать пароль на 3 секунды');}
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)hidePassword();});
  document.addEventListener('close',hidePassword,true);
  function renderAccountTransition(){
    const oldRect=document.querySelector('.menu-avatar').getBoundingClientRect();
    document.querySelector('#panel-body').innerHTML=window.freebkMenuContent();
    const avatar=document.querySelector('.menu-avatar-block');
    const newRect=avatar.querySelector('.menu-avatar').getBoundingClientRect();
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
      avatar.animate([{transform:`translate(${oldRect.x-newRect.x}px,${oldRect.y-newRect.y}px)`},{transform:'translate(0,0)'}],{duration:380,easing:'cubic-bezier(.16,1,.3,1)'});
    }
    document.querySelector(freebkDemoSignedIn ? '.menu-logout' : '#panel .close')?.focus({preventScroll:true});
  }
  document.addEventListener('click',e=>{
    const eye=e.target.closest('.menu-password-eye');
    if(eye){
      const input=document.querySelector('[data-demo-surname]');
      if(input.type==='text'){hidePassword();return;}
      hidePassword();input.type='text';
      eye.setAttribute('aria-pressed','true');eye.setAttribute('aria-label','Скрыть пароль');
      revealTimer=setTimeout(hidePassword,3000);
      return;
    }
    const button=e.target.closest('[data-menu-demo]');if(!button)return;
    if(button.dataset.menuDemo==='logout'){
      hidePassword();freebkDemoSignedIn=false;freebkDemoPartner='';
      window.dispatchEvent(new Event('freebk-account-change'));
      document.querySelector('#panel').close();
      return;
    }
    if(button.dataset.menuDemo==='telegram'){
      const field=document.querySelector('[data-demo-partner]');
      const surname=document.querySelector('[data-demo-surname]');
      const partner=freebkDemoPartners.find(name=>{
        const [first,last]=name.split(' ');
        return normalizeDemoPartner(first)===normalizeDemoPartner(field.value)&&normalizeDemoPartner(last)===normalizeDemoPartner(surname.value);
      });
      hidePassword();surname.value='';
      if(!partner){
        field.setAttribute('aria-invalid','true');
        document.querySelector('.menu-demo-message').textContent='Введите имя в «Почта», фамилию в «Пароль». Неизвестная пара имени и фамилии.';
        field.focus({preventScroll:true});
        return;
      }
      freebkDemoPartner=partner;
      freebkDemoSignedIn=true;
      window.dispatchEvent(new Event('freebk-account-change'));
      // Replacing the demo fields also discards entered credentials immediately.
      renderAccountTransition();
      return;
    }
    if(button.dataset.menuDemo==='contact'){
      document.querySelector('.menu-demo-message').textContent='Контактный центр пока не подключён. Здесь появятся способы связи с поддержкой.';
      return;
    }
    document.querySelector('.menu-demo-message').textContent=button.dataset.menuDemo==='balance'
      ? 'Пополнение и вывод денег не подключены.'
      : 'Вход через Telegram пока не подключён. Никнейм сам по себе не подтверждает аккаунт.';
  });
})();
