/* Media lifetime belongs to the main app, never to a broadcast iframe. */
(() => {
 'use strict';
 const panel=document.createElement('dialog');panel.id='partner-room';
 panel.setAttribute('aria-label','Комната участников');
 panel.innerHTML='<header><button data-back>‹ К боям</button><strong>Комната участников</strong></header><p data-status role="status">Войдите в профиль и подключитесь к общей комнате.</p><div data-tiles></div><div class="pr-controls"><button data-join>Подключиться</button><button data-mic disabled>Микрофон</button><button data-camera disabled>Камера</button><button data-sound disabled>Включить звук</button><button data-leave disabled>Завершить</button></div><p class="pr-note">Общая камера и микрофон включаются после подключения с вашего разрешения. Записи нет. При переходе к боям остаётся голос.</p><ol data-chat aria-label="Чат комнаты" aria-live="polite"></ol><form data-chat-form><input aria-label="Сообщение участникам" maxlength="500" placeholder="Сообщение участникам" required><button>Отправить</button></form>';
 const bar=document.createElement('aside');bar.id='partner-voice';bar.hidden=true;
 bar.innerHTML='<button data-return>Комната</button><span data-count></span><button data-mic>Микрофон</button><button data-leave>Выйти</button>';
 const audio=document.createElement('div');audio.id='partner-audio';audio.hidden=true;
 document.body.append(panel,bar,audio);
 const link=document.createElement('link');link.rel='stylesheet';link.href='partner-room.css?v=125';document.head.append(link);
 let room=null,epoch=0,joining=false,cameraWanted=true,owner=null,cameraQueue=Promise.resolve(),sdkPromise;
 const $=s=>panel.querySelector(s);
 const status=message=>{$('[data-status]').textContent=message;};
 function sdk(){
  if(window.LivekitClient)return Promise.resolve(window.LivekitClient);
  if(!sdkPromise)sdkPromise=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='vendor/livekit-2.22.3/livekit-client.umd.js';
   script.onload=()=>resolve(window.LivekitClient);script.onerror=()=>{sdkPromise=null;script.remove();reject(new Error('Не удалось загрузить видеосвязь.'));};
   document.head.append(script);
  });
  return sdkPromise;
 }
 let videoAttachments=[];
 function detachVideo(){for(const [track,video] of videoAttachments){track.detach(video);video.remove();}videoAttachments=[];}
 function render(){
  detachVideo();const tiles=$('[data-tiles]');tiles.replaceChildren();
  const people=room?[room.localParticipant,...room.remoteParticipants.values()].slice(0,3):[];
  for(let i=0;i<3;i++){
   const person=people[i],tile=document.createElement('div');tile.className='pr-tile';
   const name=document.createElement('span');name.textContent=person?(person.name||'Участник')+(i===0?' · вы':''):'Ожидаем участника';
   tile.append(name);
   const pub=person?.getTrackPublication(window.LivekitClient?.Track.Source.Camera);
   if(panel.open&&pub?.track&&!pub.isMuted){
    const video=document.createElement('video');video.autoplay=true;video.playsInline=true;video.muted=true;
    pub.track.attach(video);videoAttachments.push([pub.track,video]);tile.prepend(video);
   }
   if(person?.isSpeaking)tile.classList.add('speaking');tiles.append(tile);
  }
  const connected=!!room&&!joining;
  $('[data-join]').disabled=joining||!!room;
  for(const el of panel.querySelectorAll('[data-mic],[data-camera],[data-sound],[data-leave]'))el.disabled=!connected;
  $('[data-camera]').textContent=cameraWanted?'Камера: вкл':'Камера: выкл';
  for(const el of [panel.querySelector('[data-mic]'),bar.querySelector('[data-mic]')])el.textContent=room?.localParticipant.isMicrophoneEnabled?'Микрофон: вкл':'Микрофон: выкл';
  bar.hidden=!room||panel.open;
  bar.querySelector('[data-count]').textContent=room?(room.state==='connected'?'На связи · '+people.length:'Переподключение…'):'';
 }
 function camera(){
  const target=room;
  cameraQueue=cameraQueue.catch(()=>{}).then(async()=>{
   if(!target||room!==target)return;
   await target.localParticipant.setCameraEnabled(cameraWanted&&panel.open&&!document.hidden);
   if(room===target)render();
  }).catch(()=>status('Камера недоступна. Голосовая связь остаётся включённой.'));
  return cameraQueue;
 }
 async function leave(){
  epoch++;const previous=room;room=null;joining=false;owner=null;
  audio.replaceChildren();detachVideo();render();status('Соединение завершено.');
  if(previous)await previous.disconnect();
  $('[data-chat]').replaceChildren();
 }
 async function join(){
  if(room||joining)return;
  if(!window.ServerAccount?.current){status('Сначала войдите в свой профиль через Telegram.');return;}
  joining=true;const attempt=++epoch;owner=window.ServerAccount.current.id;render();status('Подключаем защищённую комнату…');
  let candidate;
  try{
   const LK=await sdk();
   const access=await window.ServerAccount.api('stream/token',{consent:true});
   if(epoch!==attempt)return;
   candidate=new LK.Room({adaptiveStream:true,dynacast:true,videoCaptureDefaults:{resolution:{width:640,height:360,frameRate:15}}});
   room=candidate;
   candidate.on(LK.RoomEvent.TrackSubscribed,(track)=>{
    if(room!==candidate)return;
    if(track.kind===LK.Track.Kind.Audio){const el=track.attach();el.autoplay=true;audio.append(el);}
    render();
   });
   candidate.on(LK.RoomEvent.TrackUnsubscribed,track=>{track.detach().forEach(el=>el.remove());render();});
   for(const ev of [LK.RoomEvent.ParticipantConnected,LK.RoomEvent.ParticipantDisconnected,LK.RoomEvent.TrackMuted,LK.RoomEvent.TrackUnmuted,LK.RoomEvent.LocalTrackPublished,LK.RoomEvent.LocalTrackUnpublished,LK.RoomEvent.ActiveSpeakersChanged])candidate.on(ev,render);
   candidate.on(LK.RoomEvent.Reconnecting,()=>{status('Связь прервалась, переподключаемся…');render();});
   candidate.on(LK.RoomEvent.Reconnected,()=>{status('Связь восстановлена.');render();});
   candidate.on(LK.RoomEvent.Disconnected,()=>{if(room===candidate)void leave();});
   candidate.on(LK.RoomEvent.DataReceived,(bytes,participant,_kind,topic)=>{
    if(room!==candidate||topic!=='p2p-chat'||!participant||bytes.length>2000)return;
    message(participant.name||'Участник',new TextDecoder().decode(bytes).slice(0,500));
   });
   await candidate.connect(access.url,access.token);
   if(epoch!==attempt){await candidate.disconnect();return;}
   try{await candidate.startAudio();await candidate.localParticipant.setMicrophoneEnabled(true);}
   catch{status('Разрешите микрофон или нажмите «Включить звук».');}
   if(epoch!==attempt){await candidate.disconnect();return;}
   joining=false;render();await camera();
   if(epoch===attempt)status('Вы в комнате. Камера и микрофон переключаются кнопками ниже.');
  }catch(error){
   if(epoch===attempt){await leave();status(error.message||'Не удалось подключиться.');}
   else if(candidate)await candidate.disconnect();
  }finally{if(epoch===attempt){joining=false;render();}}
 }
 function message(name,text){
  const li=document.createElement('li');li.textContent=name+': '+text;$('[data-chat]').append(li);
  while($('[data-chat]').children.length>100)$('[data-chat]').firstElementChild.remove();
  li.scrollIntoView({block:'nearest'});
 }
 async function mic(){
  if(!room)return;
  try{await room.localParticipant.setMicrophoneEnabled(!room.localParticipant.isMicrophoneEnabled);render();}
  catch{status('Не удалось включить микрофон. Проверьте разрешение устройства.');}
 }
 function open(){if(!panel.open)panel.showModal();render();void camera();}
 function minimize(){panel.close();}
 panel.addEventListener('close',()=>{render();void camera();});
 panel.addEventListener('cancel',e=>{e.preventDefault();minimize();});
 $('[data-back]').onclick=minimize;$('[data-join]').onclick=join;
 $('[data-camera]').onclick=()=>{cameraWanted=!cameraWanted;void camera();};
 $('[data-sound]').onclick=()=>room?.startAudio().catch(()=>status('Нажмите ещё раз, чтобы разрешить звук.'));
 for(const root of [panel,bar]){root.querySelector('[data-mic]').onclick=mic;root.querySelector('[data-leave]').onclick=()=>void leave();}
 bar.querySelector('[data-return]').onclick=open;
 $('[data-chat-form]').onsubmit=async e=>{
  e.preventDefault();const input=e.target.querySelector('input'),text=input.value.trim();
  if(!text||!room||room.state!=='connected')return;
  try{await room.localParticipant.publishData(new TextEncoder().encode(text),{reliable:true,topic:'p2p-chat'});message('Вы',text);input.value='';}
  catch{status('Сообщение не отправлено. Повторите после восстановления связи.');}
 };
 document.addEventListener('visibilitychange',()=>void camera());
 document.addEventListener('click',e=>{if(e.target.closest('[data-server-logout]'))void leave();},true);
 window.addEventListener('pagehide',()=>void leave());
 window.addEventListener('p2p-wallet-update',()=>{if(room&&window.ServerAccount?.current?.id!==owner)void leave();});
 window.PartnerRoom={open,leave,minimize};render();
})();
