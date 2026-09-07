// Moscow dates are independent of the visitor's device timezone.
window.moscowFightHeader = value => {
  const date = value ? new Date(value) : new Date(NaN);
  if (!Number.isFinite(date.getTime())) return 'Дата и время уточняются';
  const day = date.toLocaleDateString('ru-RU', {timeZone:'Europe/Moscow',day:'numeric',month:'long'});
  const time = date.toLocaleTimeString('ru-RU', {timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit',hour12:false});
  return day.toLocaleUpperCase('ru-RU') + ' В ' + time + ' МСК';
};
window.moscowFightTime = value => {
  if (!value) return 'Дата и время уточняются';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Дата и время уточняются';
  const day = date.toLocaleDateString('ru-RU', {timeZone:'Europe/Moscow',day:'numeric',month:'long',year:'numeric'});
  const time = date.toLocaleTimeString('ru-RU', {timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit',hour12:false});
  return day + ' · ' + time + ' МСК';
};
window.startVisibleFeed = function(load, interval=60000) {
  let timer=null, controller=null, pageActive=true, resumePending=false;
  const active=()=>pageActive&&!document.hidden;
  async function tick(){
    if(!active())return;
    if(controller){resumePending=true;return;}
    clearTimeout(timer); timer=null;
    controller=new AbortController();
    try {await load(controller.signal);} finally {
      controller=null;
      if(active())timer=setTimeout(tick,resumePending?0:(window.ServerAccount?.enabled?Math.min(interval,40000):interval));
      resumePending=false;
    }
  }
  function stop(){clearTimeout(timer);timer=null;controller?.abort();}
  document.addEventListener('visibilitychange',()=>{if(active())tick();else stop()});
  window.addEventListener('pagehide',()=>{pageActive=false;stop()});
  window.addEventListener('pageshow',()=>{pageActive=true;tick()});
  tick();
  return {refresh:tick};
};
