// Jitsi stays cross-origin: no third-party script receives our account/session data.
(() => {
 'use strict';
 const room=document.getElementById('stream-room'), status=document.getElementById('stream-status');
 const browser=document.getElementById('stream-browser'), call=document.getElementById('stream-call');
 const meeting=document.getElementById('stream-meeting'), form=document.getElementById('stream-form');
 const grid=document.querySelector('.stream-grid');
 let timer;
 const storageKey='p2p-stream-room';
 const meetingConfig={
  'config.deeplinking.disabled':true,
  'config.disableDeepLinking':true,
  'config.startWithAudioMuted':false,
  'config.startWithVideoMuted':false,
  'config.prejoinConfig.enabled':true,
  'config.tileView.numberOfVisibleTiles':3,
  'interfaceConfig.TILE_VIEW_MAX_COLUMNS':2,
  'config.toolbarButtons':['microphone','camera','chat','tileview','participants-pane','security','settings','fullscreen','hangup'],
  'config.toolbarConfig.alwaysVisible':true
 };
 const meetingHash=Object.entries(meetingConfig).map(([key,value])=>key+'='+encodeURIComponent(JSON.stringify(value))).join('&');
 function remember(value){try{localStorage.setItem(storageKey,value);}catch{}}
 function url(){
  try{
   const value=new URL(room.value.trim());
   if(value.origin!=='https://meet.jit.si'||value.username||value.password||!/^\/[a-zA-Z0-9_-]{10,120}$/.test(value.pathname))return null;
   return value.origin+value.pathname;
  }catch{return null;}
 }
 function update(){
  const value=url();browser.hidden=!value;
  if(value){browser.href=value+'#'+meetingHash;remember(value);}else browser.removeAttribute('href');
  return value;
 }
 function leave(message='Подключение завершено.'){
  clearTimeout(timer);meeting.replaceChildren();call.hidden=true;form.hidden=false;grid.hidden=false;
  if(message)status.textContent=message;
 }
 function newRoom(){
  leave('');
  const bytes=crypto.getRandomValues(new Uint8Array(16));
  room.value='https://meet.jit.si/P2PMarket-'+Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');
  update();status.textContent='Ссылка подготовлена. Отправьте её друзьям; все должны войти в одну комнату.';
 }
 room.addEventListener('input',update);
 document.getElementById('stream-new').addEventListener('click',newRoom);
 document.getElementById('stream-copy').addEventListener('click',async()=>{
  const value=update();if(!value){status.textContent='Создайте комнату или вставьте ссылку https://meet.jit.si/…';return;}
  try{await navigator.clipboard.writeText(value);status.textContent='Ссылка скопирована. Отправьте её двум участникам.';}
  catch{room.focus();room.select();status.textContent='Скопируйте выделенную ссылку и отправьте друзьям.';}
 });
 form.addEventListener('submit',e=>{
  e.preventDefault();const value=update();
  if(!value){status.textContent='Нужна ссылка комнаты https://meet.jit.si/… (название от 10 символов).';return;}
  if(!window.isSecureContext){status.textContent='Для камеры и микрофона нужен HTTPS. Откройте комнату в браузере по ссылке ниже.';return;}
  leave('');form.hidden=true;grid.hidden=true;call.hidden=false;
  status.textContent='Открываем общую комнату. Проверьте камеру и микрофон на экране входа Jitsi, затем присоединитесь.';
  const frame=document.createElement('iframe');
  frame.title='Jitsi — видео, голос и чат участников';
  frame.allow='camera; microphone; fullscreen; display-capture; autoplay';
  frame.allowFullscreen=true;frame.referrerPolicy='no-referrer';
  frame.src=value+'#'+meetingHash;
  // Loading a document does not prove that the user has joined a call.
  frame.addEventListener('load',()=>{clearTimeout(timer);status.textContent='Завершите вход в Jitsi внутри окна. Если оно пустое или вход не работает — откройте комнату в браузере.';});
  meeting.append(frame);
  timer=setTimeout(()=>{status.textContent='Jitsi долго загружается. Можно завершить подключение и открыть комнату в браузере.';},20000);
 });
 document.getElementById('stream-leave').addEventListener('click',()=>leave());
 document.getElementById('tv-tab').addEventListener('click',()=>leave());
 browser.addEventListener('click',()=>leave('Комната открывается отдельно. Здесь камера и микрофон отключены.'));
 window.addEventListener('pagehide',()=>leave(''));
 let saved;try{saved=localStorage.getItem(storageKey);}catch{}
 if(saved){room.value=saved;}
 if(update())status.textContent='Последняя комната восстановлена. Все участники должны использовать эту же ссылку.';
 else newRoom();
})();
