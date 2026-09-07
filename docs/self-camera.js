(() => {
 'use strict';
 const button=document.getElementById('self-camera'), video=document.getElementById('self-video');
 const label=document.querySelector('#self-slot span'), status=document.getElementById('self-status');
 let stream=null, generation=0;
 function stop(){
  generation++;stream?.getTracks().forEach(t=>t.stop());stream=null;
  video.srcObject=null;video.hidden=true;button.disabled=false;
  button.textContent='Проверить мою камеру';button.setAttribute('aria-pressed','false');
  label.textContent='Вы · камера выключена';status.textContent='Камера выключена. Записи и передачи видео нет.';
 }
 button.addEventListener('click',async()=>{
  if(stream){stop();status.textContent='Камера выключена.';return;}
  if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){
   status.textContent='Камера недоступна. Откройте приложение по HTTPS или в браузере телефона.';return;
  }
  const attempt=++generation;button.disabled=true;status.textContent='Разрешите доступ к камере. Записи и передачи видео нет.';
  try{
   const media=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});
   if(attempt!==generation){media.getTracks().forEach(t=>t.stop());return;}
   stream=media;video.srcObject=media;video.hidden=false;await video.play();
   if(attempt!==generation)return;
   button.textContent='Выключить мою камеру';button.setAttribute('aria-pressed','true');
   label.textContent='Вы · предпросмотр';status.textContent='Это изображение с вашей камеры. Видно только вам, без записи.';
   media.getVideoTracks()[0]?.addEventListener('ended',()=>{if(stream===media){stop();status.textContent='Камера отключена устройством.';}});
  }catch(error){
   if(attempt!==generation)return;
   stop();status.textContent=error.name==='NotAllowedError'?'Доступ к камере не разрешён. Проверьте разрешения Telegram/браузера в настройках телефона.':error.name==='NotFoundError'?'Камера не найдена.':'Не удалось включить камеру. Закройте другие приложения с камерой и повторите.';
  }finally{if(attempt===generation)button.disabled=false;}
 });
 document.getElementById('tv-tab').addEventListener('click',stop);
 document.getElementById('stream-form').addEventListener('submit',stop);
 document.getElementById('stream-browser').addEventListener('click',stop);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
 window.addEventListener('pagehide',stop);
 new MutationObserver(()=>{
  const active=!document.getElementById('stream-call').hidden;
  button.hidden=active;status.hidden=active;
  if(active)stop();
 }).observe(document.getElementById('stream-call'),{attributes:true,attributeFilter:['hidden']});
})();
