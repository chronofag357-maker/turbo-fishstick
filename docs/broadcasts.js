(() => {
'use strict';
const host=document.getElementById('player'), status=document.getElementById('player-status');
const shell=document.getElementById('player-shell'), expand=document.getElementById('expand');
let timer, frame;
function setExpanded(value){shell.classList.toggle('is-expanded',value);document.body.classList.toggle('is-expanded',value);expand.setAttribute('aria-expanded',String(value));expand.textContent=value?'Свернуть ✕':'Развернуть ⛶';}
expand.addEventListener('click',()=>setExpanded(!shell.classList.contains('is-expanded')));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&shell.classList.contains('is-expanded')){e.preventDefault();setExpanded(false);expand.focus();}});
if(window.parent!==window&&new URLSearchParams(location.search).get('embedded')==='1'){
document.querySelector('.back').addEventListener('click',e=>{e.preventDefault();window.parent.postMessage({type:'freebk-close-broadcast'},location.origin);});
}
function unmount(){clearTimeout(timer);host.replaceChildren();frame=null;}
function mount(){
unmount();status.textContent='Подключаем плеер TrillerTV…';
frame=document.createElement('iframe');frame.title='TrillerTV 24/7 — официальный плеер';
frame.allow='autoplay; fullscreen; encrypted-media; picture-in-picture';frame.allowFullscreen=true;
frame.referrerPolicy='strict-origin-when-cross-origin';
frame.addEventListener('load',()=>{clearTimeout(timer);status.textContent='Нажмите ▶ внутри плеера. Если видео недоступно, откройте источник.';});
frame.addEventListener('error',()=>{clearTimeout(timer);status.textContent='Не удалось загрузить плеер. Откройте источник или повторите загрузку.';});
frame.src='https://www.trillertv.com/embed/v1/2p6mu/';host.append(frame);
timer=setTimeout(()=>{status.textContent='Плеер долго загружается. Попробуйте перезагрузить или открыть источник.';},15000);
}
for(const name of ['tv','stream'])document.getElementById(name+'-tab').addEventListener('click',()=>{
for(const target of ['tv','stream']){document.getElementById(target+'-tab').setAttribute('aria-pressed',String(target===name));document.getElementById(target+'-panel').hidden=target!==name;}
setExpanded(false);if(name==='stream')unmount();else if(!frame)mount();
});
document.getElementById('reload').addEventListener('click',mount);
window.addEventListener('pagehide',unmount);
window.addEventListener('pageshow',e=>{if(e.persisted&&!document.getElementById('tv-panel').hidden)mount();});
mount();
})();
