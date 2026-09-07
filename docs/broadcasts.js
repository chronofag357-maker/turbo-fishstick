(() => {
  'use strict';
  if(window.parent!==window&&new URLSearchParams(location.search).get('embedded')==='1'){
    document.querySelector('.back').addEventListener('click',event=>{
      event.preventDefault();window.parent.postMessage({type:'freebk-close-broadcast'},location.origin);
    });
  }
  // Published by TrillerTV as this channel's schema.org embedUrl.
  const embedUrl = 'https://www.trillertv.com/embed/v1/2p6mu/';
  const host = document.getElementById('player');
  const status = document.getElementById('player-status');
  const sheet = document.getElementById('watch-sheet');
  const watch = document.getElementById('watch');
  const drag = document.getElementById('sheet-drag');
  const toggle = document.getElementById('sheet-toggle');
  const content = document.getElementById('sheet-content');
  let collapsed = false;
  let gesture = null;
  let suppressClick = false;
  function setCollapsed(value) {
    collapsed = value;
    sheet.classList.toggle('is-collapsed', value);
    content.inert = value;
    content.setAttribute('aria-hidden', String(value));
    for (const button of [drag, toggle]) {
      button.setAttribute('aria-expanded', String(!value));
      button.setAttribute('aria-label', value ? 'Развернуть купон' : 'Свернуть купон');
    }
    toggle.textContent = value ? '⌃' : '⌄';
    watch.setAttribute('aria-expanded', String(!value));
  }
  function openSheet() {
    if (!sheet.open) sheet.show();
    document.body.classList.add('has-coupon');
    setCollapsed(false);
  }
  watch.addEventListener('click', openSheet);
  toggle.addEventListener('click', () => setCollapsed(!collapsed));
  drag.addEventListener('click', () => { if (suppressClick) { suppressClick = false; return; } setCollapsed(!collapsed); });
  sheet.addEventListener('click', event => {
    if (collapsed && !event.target.closest('button')) setCollapsed(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && sheet.open && !collapsed) { setCollapsed(true); drag.focus({preventScroll:true}); }
  });
  drag.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    suppressClick = false;
    gesture = { y: event.clientY, height: content.getBoundingClientRect().height, collapsed };
    drag.setPointerCapture(event.pointerId);
    sheet.classList.add('is-dragging');
  });
  drag.addEventListener('pointermove', event => {
    if (!gesture) return;
    const delta = event.clientY - gesture.y;
    if (Math.abs(delta) > 5) suppressClick = true;
    content.style.maxHeight = Math.max(0, Math.min(content.scrollHeight, gesture.height - delta)) + 'px';
  });
  function finishDrag(event, cancelled = false) {
    if (!gesture) return;
    const delta = event.clientY - gesture.y;
    const value = cancelled || Math.abs(delta) < 40 ? gesture.collapsed : delta > 0;
    gesture = null;
    sheet.classList.remove('is-dragging');
    content.style.maxHeight = '';
    setCollapsed(value);
  }
  drag.addEventListener('pointerup', event => finishDrag(event));
  drag.addEventListener('pointercancel', event => finishDrag(event, true));
  let timer;
  function mount() {
    clearTimeout(timer);
    host.replaceChildren();
    status.textContent = 'Подключаем плеер TrillerTV…';
    const frame = document.createElement('iframe');
    frame.title = 'TrillerTV 24/7 — официальный плеер';
    frame.allow = 'autoplay; fullscreen; encrypted-media; picture-in-picture';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.addEventListener('load', () => {
      clearTimeout(timer);
      // An iframe load is NOT evidence that the video is playing.
      status.textContent = 'Если плеер доступен, нажмите ▶. Нет изображения? Откройте TrillerTV по ссылке ниже.';
    });
    frame.addEventListener('error', () => {
      clearTimeout(timer);
      status.textContent = 'Не удалось загрузить плеер. Попробуйте ещё раз или откройте TrillerTV.';
    });
    frame.src = embedUrl;
    host.append(frame);
    timer = setTimeout(() => {
      status.textContent = 'Плеер долго загружается. Можно перезагрузить его или открыть TrillerTV по ссылке ниже.';
    }, 15000);
  }
  document.getElementById('reload').addEventListener('click', mount);
  window.addEventListener('pagehide', () => { clearTimeout(timer); if (sheet.open) sheet.close(); document.body.classList.remove('has-coupon'); host.replaceChildren(); });
  window.addEventListener('pageshow', event => { if (event.persisted) mount(); });
  mount();
})();
