// Reuse the existing broadcast document without rebuilding its player or coupon.
(() => {
  const sports=document.querySelector('.sports');
  const tab=document.createElement('button');
  tab.className='sport broadcast-tab';tab.type='button';tab.setAttribute('aria-haspopup','dialog');
  tab.setAttribute('aria-controls','broadcast-screen');
  tab.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="13" rx="3" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m10 9 5 3-5 3V9ZM8 21h8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg><span>Трансляции</span>';
  sports.append(tab);
  // Configured live channel count, not inferred from an iframe load event.
  const liveBadge=document.createElement('small');liveBadge.className='broadcast-live-badge';
  tab.append(liveBadge);
  window.setBroadcastLiveCount=count=>{
    const value=Number.isFinite(count)?Math.max(0,Math.floor(count)):0;
    liveBadge.hidden=value===0;liveBadge.textContent=String(value);
    tab.setAttribute('aria-label',value?'Трансляции: активных эфиров '+value:'Трансляции');
    liveBadge.title='Количество эфиров задано в настройках; доступность плеера проверяется при открытии';
  };
  window.setBroadcastLiveCount(1);
  const badgeStyle=document.createElement('style');badgeStyle.textContent=`
    .broadcast-caption{display:flex;align-items:center;justify-content:center;gap:4px;white-space:nowrap}.broadcast-live-badge{display:inline-flex;align-items:center;gap:3px;color:#567A22;font:700 10px/1.2 Arial,sans-serif;white-space:nowrap}
    .broadcast-live-badge[hidden]{display:none}.broadcast-live-badge:before{content:'';width:6px;height:6px;border-radius:50%;background:#A3C85A;animation:broadcast-live-pulse 1.8s ease-in-out infinite}
    @keyframes broadcast-live-pulse{50%{opacity:.35}}
    @media(prefers-reduced-motion:reduce){.broadcast-live-badge:before{animation:none}}
  `;document.head.append(badgeStyle);
  // Local SVG gradients preserve the existing outline geometry of each icon.
  sports.querySelectorAll('.sport').forEach((button,index)=>{
    for(const node of [...button.childNodes])if(node.nodeType===Node.TEXT_NODE&&node.textContent.trim()){
      const label=document.createElement('span');label.textContent=node.textContent;node.replaceWith(label);
    }
    button.querySelector('span')?.classList.add('sport-label');
    const svg=button.querySelector('svg'),use=svg.querySelector('use');
    if(use){const symbol=document.querySelector(use.getAttribute('href'));if(symbol){svg.setAttribute('viewBox',symbol.getAttribute('viewBox'));svg.innerHTML=symbol.innerHTML;}}
    const size=Number(svg.getAttribute('viewBox').split(' ')[2]),id='sport-time-gradient-'+index;
    const ns='http://www.w3.org/2000/svg',defs=document.createElementNS(ns,'defs');
    defs.innerHTML=`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${size*.42}" x2="${size}" y2="${size*.59}"><stop stop-color="#397eae"/><stop offset=".55" stop-color="#5797c2"/><stop offset="1" stop-color="#70963d"/></linearGradient>`;
    button.style.setProperty('--sport-gradient',`url(#${id})`);
    svg.prepend(defs);svg.style.stroke='var(--sport-stroke,#777b92)';
    svg.querySelectorAll('[stroke="currentColor"]').forEach(node=>node.setAttribute('stroke','var(--sport-stroke,#777b92)'));
  });
  const caption=document.createElement('div');caption.className='broadcast-caption';
  caption.append(tab.querySelector('.sport-label'),liveBadge);tab.append(caption);
  const style=document.createElement('style');
  style.textContent=`
    #app .sports{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;padding-left:8px;padding-right:8px}
    #app .sports>.sport{min-width:0;width:100%;font-size:12px}
    #app .sports>.sport{--sport-stroke:#777b92}
    #app .sports .sport-label{color:#777b92;background:none}
    #app .sports:not(.broadcast-open)>.sport.active,#app .sports.broadcast-open>.broadcast-tab{--sport-stroke:var(--sport-gradient)}
    #app .sports:not(.broadcast-open)>.sport.active .sport-label,#app .sports.broadcast-open>.broadcast-tab .sport-label{color:#397eae;text-decoration:underline;text-decoration-color:#5797c2;text-underline-offset:4px}
    @supports ((background-clip:text) or (-webkit-background-clip:text)){
      #app .sports:not(.broadcast-open)>.sport.active .sport-label,#app .sports.broadcast-open>.broadcast-tab .sport-label{background:linear-gradient(100deg,#397eae 0%,#5797c2 55%,#70963d 100%);background-clip:text;-webkit-background-clip:text;color:transparent}
    }
    @media(forced-colors:active){#app .sports .sport-label{background:none;color:ButtonText}#app .sports svg,#app .sports svg [stroke]{stroke:ButtonText!important}}
    dialog#broadcast-screen{position:fixed;inset:0;margin:0 auto;width:min(100%,450px);height:100dvh;max-height:100dvh;max-width:100%;padding:0;border:0;border-radius:0;overflow:hidden;background:var(--bg,#f7f7f8)}
    #broadcast-screen::backdrop{background:#171b3655}
    #broadcast-screen iframe{display:block;width:100%;height:100%;border:0}
  `;
  document.head.append(style);
  const screen=document.createElement('dialog');screen.id='broadcast-screen';
  screen.setAttribute('aria-label','Трансляции');document.body.append(screen);
  let motion=null,closing=false,opener=null;
  function animate(to,done){
    const from=getComputedStyle(screen).transform;
    motion?.cancel();
    motion=screen.animate([{transform:from==='none'?'translateY(0)':from},{transform:to}],{
      duration:matchMedia('(prefers-reduced-motion:reduce)').matches?0:420,
      easing:'cubic-bezier(.16,1,.3,1)',fill:'forwards'
    });
    motion.finished.then(done).catch(()=>{});
  }
  function close(){
    if(!screen.open||closing)return;closing=true;
    animate('translateY(100%)',()=>screen.close());
  }
  screen.addEventListener('close',()=>{
    sports.classList.remove('broadcast-open');tab.setAttribute('aria-expanded','false');
    motion?.cancel();motion=null;closing=false;screen.replaceChildren();
    // Removing the frame also stops playback and releases its resources.
    opener?.focus({preventScroll:true});
  });
  screen.addEventListener('cancel',e=>{e.preventDefault();close()});
  window.addEventListener('message',e=>{
    if(e.origin===location.origin&&e.source===screen.querySelector('iframe')?.contentWindow&&e.data?.type==='freebk-close-broadcast')close();
  });
  function open(){
    if(screen.open)return;
    sports.classList.add('broadcast-open');tab.setAttribute('aria-expanded','true');
    opener=document.activeElement;
    const menu=document.getElementById('panel');if(menu?.open)menu.close();
    const frame=document.createElement('iframe');frame.title='Экран трансляций P2P Market';
    frame.allow='autoplay; fullscreen; picture-in-picture';frame.allowFullscreen=true;
    frame.addEventListener('load',()=>{
      const doc=frame.contentDocument;if(!doc)return;
      doc.querySelector('.back')?.addEventListener('click',e=>{e.preventDefault();close()});
      doc.addEventListener('keydown',e=>{
        if(e.key==='Escape'&&!doc.getElementById('watch-sheet')?.open){e.preventDefault();close()}
      });
    });
    frame.src='broadcasts.html?v=84&embedded=1';screen.append(frame);
    screen.style.transform='translateY(100%)';screen.showModal();
    animate('translateY(0)',()=>{screen.style.transform='translateY(0)';motion?.cancel();motion=null});
  }
  tab.addEventListener('click',open);
  window.openBroadcastScreen=open;
})();
