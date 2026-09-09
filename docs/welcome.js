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
  // Published glass preset: identical on fresh devices and browsers with old
  // experimental slider values. Those values remain stored, but cannot change
  // the released appearance. Calibrated against the approved desktop capture.
  setBlur(.7);
  setTint(90);
  for(const [key,value] of Object.entries({
    '--ray-width':'300px', '--ray-length':'30%', '--ray-blur':'30px',
    '--ray-diffusion':'30px', '--ray-halo-opacity':'.18'
  }))gate.style.setProperty(key,value);
  // Retire the temporary tuning panel.
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
  if(localPreview){try{if(sessionStorage.getItem('p2p-local-preview-entered')==='1'){
    window.localPreviewProfile={name:'Ла Марсель'};freebkDemoPartner='Марсель Ла';freebkDemoSignedIn=true;
  }}catch{}}
  const signedIn=()=>window.ServerAccount?.enabled ? !!window.ServerAccount.current : typeof freebkDemoSignedIn!=='undefined' && freebkDemoSignedIn;
  function sync(){
    const entered=signedIn();
    if(localPreview){try{if(entered)sessionStorage.setItem('p2p-local-preview-entered','1');else sessionStorage.removeItem('p2p-local-preview-entered');}catch{}}
    gate.hidden=entered;
    app.inert=!entered;
    if(entered && dialog.classList.contains('welcome-auth'))dialog.close();
    if(!entered && !dialog.open)login.focus({preventScroll:true});
  }
  login.addEventListener('click',()=>{
    dialog.classList.add('welcome-auth');
    const viewport=window.visualViewport?.height||innerHeight;
    const available=viewport-brand.getBoundingClientRect().bottom-12;
    const height=Math.max(0,available);
    dialog.style.setProperty('--welcome-sheet-height',height+'px');
    panel('Вход',`<div class="account-menu welcome-coupon">
      <button type="button" class="auth-generate" data-code-generate><span class="auth-placeholder">Генерация кода</span><span class="auth-card-end" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M6 12a10 10 0 0 1 20 0M3 17v-3M29 14v3M8 27c3-4 3-8 3-13a5 5 0 0 1 10 0c0 7-1 12-4 16M5 23c2-3 2-6 2-9a9 9 0 0 1 18 0c0 5 0 8-2 12M12 29c3-5 3-10 3-15a1 1 0 0 1 2 0c0 4 0 8-1 11M26 22l1-4"/></svg></span></button>
      <div class="auth-quote"><output data-code-source aria-label="Код для входа" aria-live="polite"></output><span class="auth-card-end auth-lock" role="img" aria-label="Код не подтверждён"><svg viewBox="0 0 32 32" aria-hidden="true"><path class="auth-lock-shackle" d="M8 20V11a8 8 0 0 1 16 0v5"/><rect x="5" y="15" width="22" height="15" rx="3"/></svg></span></div>
      <div class="auth-entry-row"><input data-code-entry readonly inputmode="none" aria-label="Введите сгенерированный код" placeholder="Введите сгенерированный код"><span class="auth-entry-caret" aria-hidden="true"></span><span data-auth-percent>0%</span></div>
<div class="auth-keypad" aria-label="Цифровая клавиатура">${['1','2','3','4','5','6','7','8','9','0','⌫'].map(k=>`<button type="button" data-auth-key="${k}" aria-label="${k==='⌫'?'Удалить цифру':k}">${k==='⌫'?'<svg class="auth-backspace-icon" viewBox="0 0 28 24" aria-hidden="true"><path d="M10 4H25V20H10L2 12Z"/><path d="m14 9 6 6m0-6-6 6"/></svg>':k}</button>`).join('')}<span class="auth-dial-dots" aria-hidden="true"><svg viewBox="0 0 24 30"><circle cx="5" cy="5" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="12" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><circle cx="12" cy="26" r="2"/></svg></span></div>
      <div class="auth-slide"><div class="auth-trail"></div><span class="auth-slide-hint">← Проведите до конца</span><button type="button" data-verify-slider role="slider" aria-label="Заключить пари — вход" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" disabled>Заключить пари</button></div>
      <button hidden class="welcome-id-entry" ${window.ServerAccount?.enabled?'data-server-login':'data-welcome-telegram'}>Войти через Telegram</button><p class="menu-demo-message" role="status"></p>
    </div>`);
    dialog.classList.add('hamburger-sheet','welcome-coupon-sheet');
    const source=dialog.querySelector('[data-code-source]'),entry=dialog.querySelector('[data-code-entry]'),range=dialog.querySelector('[data-verify-slider]'),status=dialog.querySelector('.menu-demo-message'),verify=dialog.querySelector('.auth-slide'),keypad=dialog.querySelector('.auth-keypad');
    let code='',attempted=false,drag=null,typed='',busy=false;
    range.value='0';
    brand.querySelector('.welcome-login-fill')?.remove();
    const fill=glint.cloneNode(true);fill.classList.remove('welcome-glint');fill.classList.add('welcome-login-fill');fill.style.cssText='';brand.append(fill);
    const format=n=>n.toFixed(2);
    function progress(n){
      range.value=String(n);range.setAttribute('aria-valuenow',String(n));
      const travel=verify.clientWidth-range.offsetWidth;
      range.style.transform='translateX('+(-travel*n/100)+'px)';
      verify.style.setProperty('--auth-progress',n+'%');
      dialog.querySelector('[data-auth-percent]').textContent=n+'%';
      entry.value=n?format(Number(code.replace(',','.'))*(1+n/100)):typed;
      entry.parentElement.classList.toggle('is-empty',!entry.value);
      entry.parentElement.classList.toggle('is-awaiting-code',!code);
      fill.style.clipPath='inset(0 '+(100-n)+'% 0 0)';
    }
    function updateEntry(){
      entry.value=typed;range.disabled=!code||typed!==code||busy;
      verify.classList.toggle('is-ready',!range.disabled);
      dialog.querySelector('.auth-entry-row').classList.toggle('is-ready',!range.disabled);
      const lock=dialog.querySelector('.auth-lock');
      lock.classList.toggle('is-unlocked',!range.disabled);
      lock.setAttribute('aria-label',range.disabled?'Код не подтверждён':'Код подтверждён');
      progress(0);status.textContent='';
    }
    const generator=dialog.querySelector('[data-code-generate]');
    const rolling=generator.querySelector('.auth-placeholder');
    generator.disabled=true;generator.setAttribute('aria-label','Генерация кода');
    rolling.classList.add('auth-rolling-code');rolling.setAttribute('aria-hidden','true');
    const randomCode=()=>format((110+crypto.getRandomValues(new Uint32Array(1))[0]%790)/100);
    rolling.textContent=randomCode();
    keypad.querySelectorAll('button').forEach(b=>b.disabled=true);
    const shuffle=reduced.matches?null:setInterval(()=>{rolling.textContent=randomCode();},80);
    const finishGeneration=setTimeout(()=>{
      clearInterval(shuffle);
      if(!dialog.open||!source.isConnected)return;
      code=randomCode();rolling.textContent=code;
      generator.classList.add('is-generated');
      dialog.querySelector('.auth-quote').classList.add('is-generated');
      source.textContent=code;typed='';attempted=false;
      keypad.querySelectorAll('button').forEach(b=>b.disabled=false);
      updateEntry();entry.focus({preventScroll:true});
    },3000);
    dialog.addEventListener('close',()=>{clearInterval(shuffle);clearTimeout(finishGeneration);},{once:true});
    function key(k){
      if(!code||busy)return;
      let digits=typed.replace(/\D/g,'');
      if(k==='⌫')digits=digits.slice(0,-1);
      else if(/^\d$/.test(k)&&digits.length<3)digits+=k;
      typed=digits?digits[0]+'.'+digits.slice(1):'';
      updateEntry();
    }
    keypad.addEventListener('click',e=>{const b=e.target.closest('[data-auth-key]');if(b)key(b.dataset.authKey);});
    entry.addEventListener('keydown',e=>{if(/^[0-9.,]$/.test(e.key)||e.key==='Backspace'){e.preventDefault();key(e.key==='Backspace'?'⌫':e.key);}});
    function complete(){
      if(Number(range.value)!==100||attempted||typed!==code||!code)return;
      attempted=true;busy=true;range.disabled=true;status.textContent='Проверяем Telegram ID…';
      dialog.querySelector('.welcome-id-entry').click();
      function release(){
        if(!dialog.open||!range.isConnected)return;
        if(dialog.querySelector('.welcome-id-entry').disabled){setTimeout(release,250);return;}
        attempted=false;busy=false;progress(0);range.disabled=false;
      }
      setTimeout(release,1500);
    }
    range.addEventListener('pointerdown',e=>{if(range.disabled||busy)return;e.preventDefault();drag={id:e.pointerId,x:e.clientX,n:Number(range.value)};range.setPointerCapture(e.pointerId);});
    range.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;const travel=verify.clientWidth-range.offsetWidth;progress(Math.max(0,Math.min(100,Math.round(drag.n+(drag.x-e.clientX)/travel*100))));});
    range.addEventListener('pointerup',e=>{if(drag?.id!==e.pointerId)return;drag=null;complete();});
    range.addEventListener('pointercancel',()=>{drag=null;progress(0);});
    range.addEventListener('keydown',e=>{if(range.disabled)return;if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();progress(e.key==='Home'?0:e.key==='End'?100:Math.max(0,Math.min(100,Number(range.value)+(e.key==='ArrowLeft'?5:-5))));}});
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
    dialog.classList.remove('welcome-auth','welcome-coupon-sheet');
    gate.querySelector('.welcome-content').style.transform='';
    if(!gate.hidden)login.focus({preventScroll:true});
  });
  window.addEventListener('freebk-account-change',sync);
  window.addEventListener('p2p-wallet-update',sync);
  sync();
})();
