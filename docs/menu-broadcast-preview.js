// Static, local artwork: no stream, autoplay or external requests.
(() => {
  const panel=document.getElementById('panel');
  const icon='<svg class="menu-air-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M8 8a5.7 5.7 0 0 0 0 8m8-8a5.7 5.7 0 0 1 0 8M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14"/></svg>';
  const style=document.createElement('style');
  style.textContent=`
  #panel .menu-air-label{display:flex;align-items:center;gap:8px;font:inherit;color:inherit}
  #panel .menu-broadcast-block{margin-top:auto;padding-top:10px;border-top:1px solid #e7e7ed}
  #panel .menu-broadcast-block>button:not(.menu-stream-preview){display:flex;align-items:center;justify-content:space-between;width:100%;min-height:36px;padding:5px 4px;text-align:left}
  #panel.menu-drawer:not(.welcome-auth) .account-menu:has(.menu-broadcast-block)>.menu-logout{margin-top:0}
  #panel .menu-air-icon{width:20px;height:20px;color:#257243;flex:none;animation:menu-air-pulse 2s ease-in-out infinite}
  #panel .menu-broadcast-block .menu-stream-preview{position:relative;display:block;width:100%;height:100px;min-height:100px;padding:0;border:0;border-radius:8px;overflow:hidden;background:#171b36;color:white;text-align:left;margin:0 0 5px}
  #panel .menu-stream-art{position:absolute;inset:0;width:100%;height:100%;stroke:none;fill:none}
  #panel .menu-stream-preview .menu-stream-demo{position:absolute;top:7px;left:8px;background:#171b36cf;color:#e6f0cd;padding:3px 6px;border-radius:3px;font:9px Arial;letter-spacing:1px}
  #panel .menu-stream-preview .menu-stream-play{position:absolute;top:29px;left:calc(50% - 18px);width:36px;height:36px;display:grid;place-items:center;border-radius:50%;background:#ffffffed;color:#293870;font-size:17px;padding-left:2px;box-shadow:0 2px 12px #0004}
  #panel .menu-stream-preview .menu-stream-caption{position:absolute;bottom:0;left:0;right:0;padding:15px 9px 7px;background:linear-gradient(transparent,#101426);color:white;font:10px Arial}
  @keyframes menu-air-pulse{50%{opacity:.45}}
  @media(prefers-reduced-motion:reduce){#panel .menu-air-icon{animation:none}}
  @media(max-height:650px){#panel .menu-broadcast-block .menu-stream-preview{height:76px;min-height:76px}#panel .menu-stream-preview .menu-stream-play{top:20px;width:30px;height:30px;left:calc(50% - 15px)}}
  @media(max-height:650px){
    #panel.menu-drawer:not(.welcome-auth) .account-menu{gap:3px}
    #panel .menu-broadcast-block{position:relative;padding-top:4px}
    #panel .menu-broadcast-block>button:not(.menu-stream-preview){padding-right:68px}
    #panel .menu-broadcast-block .menu-stream-preview{position:absolute;right:0;top:5px;width:60px;height:32px;min-height:32px;margin:0}
    #panel .menu-stream-preview .menu-stream-demo,#panel .menu-stream-preview .menu-stream-caption{display:none}
    #panel .menu-stream-preview .menu-stream-play{top:6px;left:20px;width:20px;height:20px;font-size:11px}
  }
  `;document.head.append(style);
  function decorate(){
    const button=panel.querySelector('.menu-links [data-action="broadcasts"]');
    if(!button||button.dataset.previewReady)return;
    button.dataset.previewReady='1';
    button.innerHTML='<span class="menu-air-label">'+icon+'Трансляции</span><span aria-hidden="true">›</span>';
    const preview=document.createElement('button');
    preview.type='button';preview.className='menu-stream-preview';preview.dataset.action='broadcasts';
    preview.setAttribute('aria-label','Открыть трансляции — демонстрационное превью боя, не прямой эфир');
    preview.innerHTML=`<svg class="menu-stream-art" viewBox="0 0 300 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><linearGradient id="ring-light"><stop stop-color="#344761"/><stop offset="1" stop-color="#161c2a"/></linearGradient></defs>
    <path fill="url(#ring-light)" d="M0 0h300v100H0z"/>
    <path fill="#9aa9b4" opacity=".17" d="M35 0h20l75 100H0ZM245 0h20l35 100H170Z"/>
    <path fill="#667789" d="m26 75 62-34h124l62 34-62 40H88Z"/>
    <path stroke="#c6d6e2" stroke-width="1" opacity=".5" d="m26 75 62-34h124l62 34M26 60l62-34h124l62 34M26 45 88 11h124l62 34M26 45v38m62-72v30m124-30v30m62-7v49"/>
    <g fill="#bd9983"><circle cx="111" cy="29" r="9"/><path d="m100 40 18-1 10 21-17 9-16-12Z"/><path stroke="#bd9983" stroke-width="9" stroke-linecap="round" d="m101 43-9 13 19 1m7-14 17 5 9-12m-35 31-9 23m18-24 11 22"/></g>
    <path fill="#293870" d="m99 58 24 1-4 15h-19Z"/><circle fill="#c52044" cx="142" cy="35" r="6"/><circle fill="#c52044" cx="112" cy="56" r="6"/>
    <g fill="#aa7e67"><circle cx="195" cy="29" r="9"/><path d="m184 40 18 1 5 20-19 7-10-13Z"/><path stroke="#aa7e67" stroke-width="9" stroke-linecap="round" d="m183 43-15 8-10-11m42 3 10 10-18 3m-3 11-11 22m22-22 10 23"/></g>
    <path fill="#262933" d="m183 59 23-1-3 16h-21Z"/><circle fill="#397eae" cx="157" cy="39" r="6"/><circle fill="#397eae" cx="190" cy="56" r="6"/>
    </svg><span class="menu-stream-demo">ДЕМО · ПРЕВЬЮ</span><span class="menu-stream-play" aria-hidden="true">▶</span><span class="menu-stream-caption">Трансляции единоборств · Бокс / MMA</span>`;
    button.after(preview);
    const streams=document.createElement('button');
    streams.type='button';streams.dataset.menuStreams='1';
    streams.innerHTML='Стримы <span aria-hidden="true">›</span>';
    preview.after(streams);
    const block=document.createElement('section');
    block.className='menu-broadcast-block';block.setAttribute('aria-label','Трансляции единоборств');
    const account=button.closest('.account-menu');
    block.append(button,preview);
    const logout=account.querySelector(':scope > .menu-logout');
    if(logout)logout.before(block);else account.append(block);
  }
  panel.addEventListener('click',e=>{
    if(!e.target.closest('[data-menu-streams]'))return;
    if(window.PartnerRoom){panel.close();window.PartnerRoom.open();}
  });
  new MutationObserver(decorate).observe(panel,{childList:true,subtree:true});
  decorate();
})();
