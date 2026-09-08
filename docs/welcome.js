(() => {
  const gate=document.getElementById('welcome-gate');
  const app=document.getElementById('app');
  const dialog=document.getElementById('panel');
  const login=gate.querySelector('.welcome-login');
  // Temporary local preview control. Never changes authentication or server settings.
  const tuning=document.createElement('label');
  tuning.className='welcome-tuning';
  tuning.innerHTML='Размытие <output>3,5 px</output><input type="range" min="0" max="10" step="0.1" value="3.5" aria-label="Размытие стекла"><small>Чётче ← → Размытее</small>';
  gate.querySelector('.welcome-actions').after(tuning);
  const slider=tuning.querySelector('input');
  function setBlur(value){
    const n=Number(value);
    if(!Number.isFinite(n)||n<0||n>10)return;
    slider.value=String(n);
    gate.style.backdropFilter=`blur(${n}px)`;
    gate.style.webkitBackdropFilter=`blur(${n}px)`;
    tuning.querySelector('output').textContent=n.toLocaleString('ru-RU')+' px';
  }
  try{const saved=localStorage.getItem('p2p-welcome-blur-preview');if(saved!==null)setBlur(saved);}catch{}
  slider.addEventListener('input',()=>{
    setBlur(slider.value);
    try{localStorage.setItem('p2p-welcome-blur-preview',slider.value);}catch{}
  });
  const tintTuning=document.createElement('label');
  tintTuning.className='welcome-tuning';
  tintTuning.innerHTML='Чёрная тонировка <output>58%</output><input type="range" min="0" max="90" step="1" value="58" aria-label="Чёрная тонировка стекла"><small>Светлее ← → Темнее</small>';
  tuning.after(tintTuning);
  const tintSlider=tintTuning.querySelector('input');
  function setTint(value){
    const n=Number(value);
    if(!Number.isFinite(n)||n<0||n>90)return;
    tintSlider.value=String(n);
    gate.style.setProperty('--welcome-tint',String(n/100));
    tintTuning.querySelector('output').textContent=n+'%';
  }
  try{const saved=localStorage.getItem('p2p-welcome-tint-preview');if(saved!==null)setTint(saved);}catch{}
  tintSlider.addEventListener('input',()=>{
    setTint(tintSlider.value);
    try{localStorage.setItem('p2p-welcome-tint-preview',tintSlider.value);}catch{}
  });
  const tuners=document.createElement('div');
  tuners.className='welcome-tuners';
  gate.append(tuners);
  tuners.append(tuning,tintTuning);
  for(const [name,key,min,max,step,initial,unit,variable] of [
    ['Ширина бликов','width',10,300,1,140,'px','--ray-width'],
    ['Длина бликов','length',10,180,1,130,'%','--ray-length'],
    ['Размытие бликов','blur',0,100,.5,3,'px','--ray-blur'],
    ['Рассеивание бликов','diffusion',0,100,1,0,'px','--ray-diffusion']
  ]){
    const label=document.createElement('label');label.className='welcome-tuning';
    label.append(document.createTextNode(name));
    const output=document.createElement('output'),input=document.createElement('input');
    input.type='range';input.min=min;input.max=max;input.step=step;input.setAttribute('aria-label',name);
    label.append(output,input);tuners.append(label);
    const storageKey='p2p-welcome-ray-'+key;
    function update(value){
      const n=Number(value);if(!Number.isFinite(n)||n<min||n>max)return;
      input.value=n;output.textContent=n.toLocaleString('ru-RU')+' '+unit;
      gate.style.setProperty(variable,n+unit);
      if(key==='diffusion')gate.style.setProperty('--ray-halo-opacity',String(n/100*.6));
    }
    update(initial);
    try{const saved=localStorage.getItem(storageKey);if(saved!==null)update(saved);}catch{}
    input.addEventListener('input',()=>{update(input.value);try{localStorage.setItem(storageKey,input.value);}catch{}});
  }
  const typeTuners=document.createElement('details');
  typeTuners.className='welcome-type-tuners';
  const summary=document.createElement('summary');summary.textContent='Настройка букв';
  typeTuners.append(summary);tuners.append(typeTuners);
  for(const [name,key,min,max,step,initial,variable] of [
    ['P2P Market: размер','first',16,48,1,28,'--brand-first-size'],
    ['Между строками: ближе ← → дальше','rows',-30,20,1,6,'--brand-row-gap'],
    ['Между буквами','letters',-2,5,.1,-.8,'--brand-spacing'],
  ]){
    const label=document.createElement('label');label.className='welcome-tuning';
    label.append(document.createTextNode(name));
    const output=document.createElement('output'),input=document.createElement('input');
    input.type='range';input.min=min;input.max=max;input.step=step;input.setAttribute('aria-label',name);
    label.append(output,input);typeTuners.append(label);
    const storageKey='p2p-welcome-type-'+key;
    function update(value){const n=Number(value);if(!Number.isFinite(n)||n<min||n>max)return;input.value=n;output.textContent=n.toLocaleString('ru-RU')+' px';gate.style.setProperty(variable,n+'px');}
    update(initial);
    try{const saved=localStorage.getItem(storageKey);if(saved!==null)update(saved);}catch{}
    input.addEventListener('input',()=>{update(input.value);try{localStorage.setItem(storageKey,input.value);}catch{}});
  }
  // Decorative copy preserves the exact typography and gift geometry.
  const brand=gate.querySelector('.welcome-brand');
  const brightnessLabel=document.createElement('label');brightnessLabel.className='welcome-tuning';
  brightnessLabel.innerHTML='Яркость букв <output>100%</output><input type="range" min="50" max="220" step="1" value="100" aria-label="Яркость букв">';
  typeTuners.append(brightnessLabel);
  const brightnessInput=brightnessLabel.querySelector('input');
  function setBrightness(value){const n=Number(value);if(!Number.isFinite(n)||n<50||n>220)return;brightnessInput.value=n;brightnessLabel.querySelector('output').textContent=n+'%';gate.style.setProperty('--letter-brightness',String(n/100));}
  try{const saved=localStorage.getItem('p2p-welcome-letter-brightness');if(saved!==null)setBrightness(saved);}catch{}
  brightnessInput.addEventListener('input',()=>{setBrightness(brightnessInput.value);try{localStorage.setItem('p2p-welcome-letter-brightness',brightnessInput.value);}catch{}});
  // Keep applying the saved appearance, but retire the temporary tuning panel.
  tuners.remove();
  const backline=document.createElement('div');
  backline.className='welcome-backline';
  backline.textContent=brand.firstChild.textContent;
  brand.firstChild.replaceWith(backline);
  const frontLine=document.createElement('span');
  frontLine.textContent='Freebet';
  brand.querySelector('span').replaceWith(frontLine);
  brand.classList.add('usb-wordmark');
  const symbol=document.createElementNS('http://www.w3.org/2000/svg','svg');
  symbol.setAttribute('viewBox','0 0 60 90');symbol.setAttribute('aria-hidden','true');symbol.classList.add('usb-wordmark-symbol');
  symbol.innerHTML='<path class="usb-head" fill="currentColor" fill-rule="evenodd" d="M2 18H27V12H37V64H27V70H2ZM8 29V36H12V29ZM8 49V56H12V49Z"/><path class="usb-lower" pathLength="100" d="M32 66V73Q32 82 41 82H54V58H69" fill="none" stroke="currentColor" stroke-width="10"/><path class="usb-upper" pathLength="100" d="M54 58V12H69" fill="none" stroke="currentColor" stroke-width="10"/>';
  brand.insertBefore(symbol,backline);
  const badge=document.createElementNS(symbol.namespaceURI,'svg');badge.classList.add('usb-branch-badge');badge.setAttribute('viewBox','0 0 32 32');badge.setAttribute('aria-hidden','true');
  badge.innerHTML='<rect x="1" y="1" width="30" height="30" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 24V8M16 15L10 11V8M16 20L23 15V12" fill="none" stroke="currentColor" stroke-width="2"/><path d="M13 8L16 3L19 8Z" fill="currentColor"/><circle cx="16" cy="25" r="3" fill="currentColor"/><rect x="21" y="8" width="4" height="4" fill="currentColor"/>';
  frontLine.append(badge);
  const glint=document.createElement('div');
  glint.className='welcome-brand welcome-glint';
  glint.setAttribute('aria-hidden','true');
  glint.innerHTML=brand.innerHTML;
  brand.append(glint);
  const terminal=document.createElement('div');
  terminal.className='welcome-terminal';
  brand.before(terminal);terminal.append(brand);
  frontLine.classList.add('welcome-terminal-last');
  const outline=document.createElementNS('http://www.w3.org/2000/svg','svg');
  outline.classList.add('welcome-usb-body');outline.setAttribute('aria-hidden','true');
  outline.innerHTML='<path class="usb-fill"/><path/><path/>';
  terminal.append(outline);
  const drawing=document.createElementNS('http://www.w3.org/2000/svg','svg');
  drawing.classList.add('welcome-lock-drawing');drawing.setAttribute('aria-hidden','true');
  drawing.innerHTML='<path pathLength="100"/><path pathLength="100"/><path pathLength="100"/>';
  terminal.append(drawing);
  const unlock=document.createElement('label');
  unlock.className='welcome-unlock-control';
  unlock.innerHTML='<span>Прозрачность знака <output>100%</output></span><input type="range" min="0" max="100" value="100" aria-label="Прозрачность знака">';
  terminal.append(unlock);
  const unlockInput=unlock.querySelector('input');
  function setUnlock(){
    const p=Number(unlockInput.value)/100;
    terminal.style.setProperty('--lock-open',String(p));
    unlock.querySelector('output').textContent=Math.round(p*100)+'%';
  }
  unlockInput.addEventListener('input',setUnlock);setUnlock();
  unlock.remove();
  gate.querySelector('[data-welcome-register]')?.remove();
  const edge=document.createElementNS('http://www.w3.org/2000/svg','svg');
  edge.classList.add('terminal-loading-edge');edge.setAttribute('aria-hidden','true');
  edge.innerHTML='<path pathLength="100"/><path pathLength="100"/>';
  terminal.append(edge);
  const edgeSize=new ResizeObserver(()=>{
    const w=terminal.clientWidth-1,h=terminal.clientHeight-1,r=11;
    const a=h*.28,b=h*.72;
    const paths=[`M${w/2} ${h} H20 Q1 ${h} 1 ${h-20} V20 Q1 1 20 1 H${w-20} Q${w} 1 ${w} 20 V${a} H${w+30} Q${w+33} ${a} ${w+33} ${a+3} V${b-3} Q${w+33} ${b} ${w+30} ${b} H${w} V${h-20} Q${w} ${h} ${w-20} ${h} Z`,
      `M20 9 H${w-20} Q${w-9} 9 ${w-9} 20 V${h-20} Q${w-9} ${h-9} ${w-20} ${h-9} H20 Q9 ${h-9} 9 ${h-20} V20 Q9 9 20 9 Z`,
      `M${w+12} ${a+8} h10 v6 h-10 Z M${w+12} ${b-14} h10 v6 h-10 Z`];
    for(const svg of [drawing,outline]){svg.setAttribute('viewBox',`0 0 ${w+34} ${h+1}`);paths.forEach((d,i)=>svg.children[i].setAttribute('d',d));}
    // Complementary halves: top-left down/bottom; bottom-right up/top.
    edge.children[0].setAttribute('d',`M ${r} 1 Q 1 1 1 ${r} L 1 ${h-r} Q 1 ${h} ${r} ${h} L ${w-r} ${h}`);
    edge.children[1].setAttribute('d',`M ${w-r} ${h} Q ${w} ${h} ${w} ${h-r} L ${w} ${r} Q ${w} 1 ${w-r} 1 L ${r} 1`);
  });
  edgeSize.observe(terminal);
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    terminal.classList.add('is-drawing-lock');
    setTimeout(()=>terminal.classList.remove('is-drawing-lock'),1950);
  }
  // Reveal the final DOM itself: no outline copy or end-of-animation swap.
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  edgeSize.disconnect();edge.remove();
  function alignBranches(){
    const sr=symbol.getBoundingClientRect();
    if(!sr.width||!sr.height)return;
    const matrix=symbol.getScreenCTM();if(!matrix)return;
    const inverse=matrix.inverse();
    const point=el=>{
      const box=el.getBoundingClientRect(),style=getComputedStyle(el);
      const size=parseFloat(style.fontSize),lh=parseFloat(style.lineHeight);
      const ctx=document.createElement('canvas').getContext('2d');
      ctx.font=style.fontWeight+' '+style.fontSize+' '+style.fontFamily;
      const m=ctx.measureText(el.firstChild.textContent[0]);
      const asc=m.fontBoundingBoxAscent||size*.9,desc=m.fontBoundingBoxDescent||size*.2;
      const baseline=(lh-asc-desc)/2+asc;
      // SVG uses xMidYMid meet: its viewBox can be letterboxed inside the CSS box.
      // Convert screen coordinates through the actual matrix, not width/height ratios.
      const thickness=size*.18;
      const target=new DOMPoint(box.left+size*.22,box.top+baseline-m.actualBoundingBoxAscent+thickness/2).matrixTransform(inverse);
      return {x:target.x,y:target.y,stroke:thickness/Math.hypot(matrix.a,matrix.b)};
    };
    const f=point(frontLine),p=point(backline);
    for(const icon of [symbol,glint.querySelector('.usb-wordmark-symbol')]){
      // The connector neck and outgoing line share exactly the same side edges.
      const neckRight=27+f.stroke,neckCenter=27+f.stroke/2;
      icon.querySelector('.usb-head').setAttribute('d',`M2 18H27V12H${neckRight}V64H27V70H2ZM8 29V36H12V29ZM8 49V56H12V49Z`);
      icon.querySelector('.usb-lower').setAttribute('d',`M${neckCenter} 60V73Q${neckCenter} 82 ${neckCenter+9} 82H54V${f.y}H${f.x}`);
      icon.querySelector('.usb-upper').setAttribute('d',`M54 ${f.y}V${p.y}H${p.x}`);
      icon.querySelector('.usb-lower').setAttribute('stroke-width',String(f.stroke));
      icon.querySelector('.usb-upper').setAttribute('stroke-width',String(p.stroke));
    }
  }
  const branchResize=new ResizeObserver(alignBranches);branchResize.observe(brand);
  glint.style.visibility='hidden';
  if(!reduced.matches)brand.classList.add('line-building');
  document.fonts.ready.then(()=>{
    alignBranches();
    if(reduced.matches){brand.classList.remove('line-building');return;}
    brand.classList.add('reveal-ready');
    let finished=false;
    function finish(){
      if(finished)return;finished=true;
      brand.classList.remove('line-building');
      glint.style.animation='none';void glint.offsetWidth;
      if(!reduced.matches){glint.style.visibility='';glint.style.animation='welcome-contour-glint 3s 2s ease-in-out infinite both';}
      reduced.removeEventListener('change',finish);
    }
    reduced.addEventListener('change',finish,{once:true});setTimeout(finish,2600);
  });
  const localPreview=['127.0.0.1','localhost','[::1]'].includes(location.hostname)&&new URLSearchParams(location.search).get('preview')==='1'&&!window.ServerAccount?.enabled;
  let previewEntered=false;
  const signedIn=()=>window.ServerAccount?.enabled ? !!window.ServerAccount.current : typeof freebkDemoSignedIn!=='undefined' && freebkDemoSignedIn;
  function sync(){
    const entered=signedIn();
    gate.hidden=entered;
    app.inert=!entered;
    if(entered && dialog.classList.contains('welcome-auth'))dialog.close();
    if(!entered && !dialog.open)login.focus({preventScroll:true});
  }
  login.addEventListener('click',()=>{
    dialog.classList.add('welcome-auth');
    const height=Math.max(120,(window.visualViewport?.height||innerHeight)-login.getBoundingClientRect().bottom-16);
    dialog.style.setProperty('--welcome-sheet-height',height+'px');
    panel('Профиль',`<div class="account-menu welcome-guest-card"><div class="welcome-guest-avatar"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="10" r="6"/><path d="M5 30c0-14 22-14 22 0"/></svg></div><strong class="welcome-guest-name">Гость</strong><p class="welcome-id-hint">Вход по Telegram ID</p><div class="welcome-code-row"><input data-code-source readonly aria-label="Сгенерированный код" placeholder="Код"><button data-code-generate>Генератор кода</button><button data-code-copy>Скопировать</button></div><input class="welcome-code-input" data-code-entry inputmode="numeric" maxlength="4" autocomplete="off" aria-label="Вставьте код" placeholder="Вставьте код"><div class="welcome-verify" hidden><div class="welcome-verify-label">Проведите для входа <output>0%</output></div><input type="range" min="0" max="100" value="0" aria-label="Подтверждение входа" data-verify-slider></div><button hidden class="welcome-id-entry" ${window.ServerAccount?.enabled?'data-server-login':'data-welcome-telegram'}>Войти через Telegram</button><p class="menu-demo-message" role="status"></p></div>`);
    dialog.classList.add('hamburger-sheet');
    dialog.querySelector(':scope > .welcome-guest-avatar')?.remove();
    dialog.append(dialog.querySelector('.welcome-guest-card .welcome-guest-avatar'));
    dialog.querySelector(':scope > .welcome-guest-heading')?.remove();
    const heading=document.createElement('div');heading.className='welcome-guest-heading';
    heading.innerHTML='<strong>Гость:</strong> <span>Вход по Telegram ID</span>';
    dialog.append(heading);
    dialog.querySelector('.welcome-guest-name')?.remove();
    dialog.querySelector('.welcome-id-hint')?.remove();
    const source=dialog.querySelector('[data-code-source]'),entry=dialog.querySelector('[data-code-entry]'),verify=dialog.querySelector('.welcome-verify'),range=dialog.querySelector('[data-verify-slider]'),status=dialog.querySelector('.menu-demo-message');
    let code='',attempted=false,drag=null;
    source.placeholder='Code';
    const hint=document.createElement('span');hint.className='welcome-verify-hint';hint.textContent='Проведите для входа';
    verify.querySelector('.welcome-verify-label').firstChild.replaceWith(hint);
    verify.hidden=false;range.disabled=true;verify.classList.remove('is-ready');
    dialog.querySelector('[data-code-generate]').textContent='Генерация кода';
    brand.querySelector('.welcome-login-fill')?.remove();
    const fill=glint.cloneNode(true);fill.classList.remove('welcome-glint');fill.classList.add('welcome-login-fill');fill.style.cssText='';brand.append(fill);
    function progress(n){range.value=String(n);range.style.setProperty('--verify-progress',n+'%');hint.style.opacity=String(Math.max(0,1-n/20));verify.querySelector('output').style.opacity=String(Math.min(1,(100-n)/10));verify.querySelector('output').textContent=n+'%';fill.style.clipPath='inset(0 '+(100-n)+'% 0 0)';if(n===100)complete();}
    function reset(){attempted=false;progress(0);}
    dialog.querySelector('[data-code-generate]').addEventListener('click',()=>{code=String(1000+crypto.getRandomValues(new Uint32Array(1))[0]%9000);source.value=code;entry.value='';range.disabled=true;verify.classList.remove('is-ready');status.textContent='';reset();});
    dialog.querySelector('[data-code-copy]').addEventListener('click',async()=>{if(!code)return;try{await navigator.clipboard.writeText(code);status.textContent='Код скопирован';}catch{source.focus();source.select();status.textContent='Скопируйте выделенный код вручную';}});
    entry.addEventListener('input',()=>{range.disabled=!code||entry.value!==code;verify.classList.toggle('is-ready',!range.disabled);reset();status.textContent='';});
    function complete(){if(Number(range.value)!==100||attempted||entry.value!==code)return;attempted=true;dialog.querySelector('.welcome-id-entry').click();setTimeout(()=>{if(dialog.open){attempted=false;}},1000);}
    range.addEventListener('pointerdown',e=>{if(range.disabled)return;const rect=range.getBoundingClientRect(),thumb=rect.left+22+(rect.width-44)*Number(range.value)/100;e.preventDefault();if(Math.abs(e.clientX-thumb)>24)return;drag=e.pointerId;range.setPointerCapture(e.pointerId);});
    range.addEventListener('pointermove',e=>{if(drag!==e.pointerId)return;const rect=range.getBoundingClientRect();progress(Math.max(0,Math.min(100,Math.round((e.clientX-rect.left-22)/(rect.width-44)*100))));});
    range.addEventListener('pointerup',e=>{if(drag!==e.pointerId)return;drag=null;complete();});
    range.addEventListener('pointercancel',()=>{drag=null;});
    range.addEventListener('input',()=>progress(Number(range.value)));
    range.addEventListener('keyup',()=>complete());
    progress(0);
    dialog.querySelector('[data-welcome-telegram]')?.addEventListener('click',async()=>{
      if(localPreview){
        range.disabled=true;
        const duration=reduced.matches?0:450;
        await dialog.animate([{opacity:1},{opacity:0,transform:'translateY(20px)'}],{duration,easing:'ease-out'}).finished;
        dialog.close();
        await gate.animate([{opacity:1},{opacity:0}],{duration:reduced.matches?0:650,easing:'ease-in-out'}).finished;
        previewEntered=true;window.localPreviewProfile={name:'Ла Марсель'};freebkDemoPartner='Марсель Ла';freebkDemoSignedIn=true;window.dispatchEvent(new Event('freebk-account-change'));sync();
        const notice=document.createElement('div');notice.textContent='Локальный предпросмотр · без авторизации';notice.style.cssText='position:fixed;bottom:0;left:50%;transform:translateX(-50%);z-index:99;background:#171918;color:#c8e394;padding:3px 8px;font:10px Arial;white-space:nowrap;pointer-events:none';document.body.append(notice);
        return;
      }
      dialog.querySelector('.menu-demo-message').textContent='Telegram ID недоступен в этом браузере.';
    });
  });
  gate.querySelector('[data-welcome-register]')?.addEventListener('click',()=>{
    document.getElementById('welcome-note').textContent='Сейчас доступ по приглашению. Для регистрации обратитесь к администратору — он добавит ваш Telegram ID.';
  });
  dialog.addEventListener('close',()=>{
    dialog.querySelector(':scope > .welcome-guest-avatar')?.remove();
    dialog.querySelector(':scope > .welcome-guest-heading')?.remove();
    brand.querySelector('.welcome-login-fill')?.remove();
    dialog.classList.remove('welcome-auth');
    if(!gate.hidden)login.focus({preventScroll:true});
  });
  window.addEventListener('freebk-account-change',sync);
  window.addEventListener('p2p-wallet-update',sync);
  sync();
})();
