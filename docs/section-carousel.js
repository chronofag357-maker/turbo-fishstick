// Navigation-only sections: no feeds, requests or simulated product data.
(() => {
  const app=document.getElementById('app'),nav=app.querySelector('.sports');
  const broadcast=nav.querySelector('.broadcast-tab');
  if(broadcast){app.querySelector('.modes').after(broadcast);app.querySelector('.topbar').classList.add('has-broadcast');}
  const sections=[
    ['p2p','P2P Betting','<path d="M4 7h15m-4-4 4 4-4 4M20 17H5m4-4-4 4 4 4"/>'],
    ['poker','Poker','<rect x="4" y="3" width="16" height="18" rx="3"/><path d="m12 7 4 5-4 5-4-5Z"/>'],
    ['trading','Trading','<path d="M3 3v18h18M6 16l5-6 4 3 6-8M16 5h5v5"/>']
  ];
  const screen=document.createElement('section');screen.className='extra-section-screen';screen.hidden=true;
  app.querySelector('.header').after(screen);
  let selected='',previous=[];
  sections.forEach(([id,label,icon])=>{
    const b=document.createElement('button');b.type='button';b.className='sport extra-section-tab';b.dataset.section=id;b.setAttribute('aria-pressed','false');
    b.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg><span class="sport-label">${label}</span>`;nav.append(b);
  });
  const trainer=nav.querySelector('.live-trainer-tab');if(trainer)nav.append(trainer);
  function leave(){
    if(!selected)return;
    selected='';app.classList.remove('extra-section-open');screen.hidden=true;
    nav.querySelectorAll('.extra-section-tab').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});
    previous.forEach(([b,active,pressed])=>{b.classList.toggle('active',active);if(pressed===null)b.removeAttribute('aria-pressed');else b.setAttribute('aria-pressed',pressed);});
  }
  nav.addEventListener('click',e=>{
    if(suppressClick){suppressClick=false;e.preventDefault();e.stopImmediatePropagation();return;}
    const b=e.target.closest('.sport');if(!b)return;
    if(!b.dataset.section){leave();return;}
    e.stopImmediatePropagation();
    if(!selected)previous=[...nav.querySelectorAll('.sport:not(.extra-section-tab)')].map(n=>[n,n.classList.contains('active'),n.getAttribute('aria-pressed')]);
    selected=b.dataset.section;app.classList.add('extra-section-open');screen.hidden=false;
    screen.setAttribute('aria-label',sections.find(s=>s[0]===selected)[1]);
    nav.querySelectorAll('.sport').forEach(n=>{n.classList.toggle('active',n===b);n.setAttribute('aria-pressed',String(n===b));});
  },true);
  nav.classList.add('section-carousel');nav.setAttribute('aria-label','Разделы — листайте влево и вправо');
  const resetPosition=()=>{nav.scrollLeft=0;};
  resetPosition();window.addEventListener('pageshow',resetPosition);
  const gate=document.getElementById('welcome-gate');
  if(gate)new MutationObserver(()=>{if(gate.hidden)resetPosition();}).observe(gate,{attributes:true,attributeFilter:['hidden']});
  nav.addEventListener('keydown',e=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
    const items=[...nav.querySelectorAll('.sport')],i=items.indexOf(document.activeElement);if(i<0)return;
    e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?items.length-1:Math.max(0,Math.min(items.length-1,i+(e.key==='ArrowRight'?1:-1)));
    items[next].focus({preventScroll:true});items[next].scrollIntoView({block:'nearest',inline:'nearest'});
    if(e.key==='Home')nav.scrollLeft=0;
    if(e.key==='End')nav.scrollLeft=nav.scrollWidth;
  });
  // Touch uses native scrolling/inertia; also allow dragging with a mouse.
  let drag=null,suppressClick=false;
  nav.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;suppressClick=false;drag={id:e.pointerId,x:e.clientX,left:nav.scrollLeft,moved:false};});
  nav.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x;if(Math.abs(dx)>5&&!drag.moved){drag.moved=true;nav.setPointerCapture(e.pointerId);}if(drag.moved){e.preventDefault();nav.scrollLeft=drag.left-dx;}});
  nav.addEventListener('pointerup',()=>{suppressClick=!!drag?.moved;drag=null;});
  nav.addEventListener('pointercancel',()=>{drag=null;suppressClick=false;});
})();
