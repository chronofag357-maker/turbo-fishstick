(()=>{
'use strict';
const screen=window.FightScreen,status=document.getElementById('data-status'),refresh=document.getElementById('refresh-data');
window.Telegram?.WebApp?.ready();window.Telegram?.WebApp?.expand();
const pairs=[['Rafa Garcia','Zhu Rong'],['Yousri Belgaroui','Djorden Santos'],['Ignacio Bahamondes','Muslim Salikhov'],['Tim Elliott','Edgar Chairez'],['David Martinez','Dan Ige'],['Waldo Cortes-Acosta','Curtis Blaydes'],['Manon Fiorot','Alexa Grasso'],['Tommy McMillen','Marwan Rahiki'],['Brandon Moreno','Joseph Morales'],['Jean Silva','Jose Delgado'],['Drakkar Klose','Thomas Gantt'],['J.J. Aldrich','Regina Tarin']];
const ids=['garcia-rongzhu','belgaroui-santos','bahamondes-salikhov','elliott-chairez','martinez-ige','cortes-blaydes','fiorot-grasso','mcmillen-rahiki','moreno-morales','silva-delgado','klose-gantt','aldrich-tarin'];
const names={};pairs.forEach((p,i)=>p.forEach((n,j)=>{names[n]=window.UFC_SNAPSHOT.fights.find(f=>f.id===ids[i]).fighters[j]}));
Object.assign(names,{'Ryan Garcia':'Райан Гарсия','Conor Benn':'Конор Бенн','Petr Yan':'Пётр Ян','Islam Makhachev':'Ислам Махачев','Alex Pereira':'Алекс Перейра','Conor McGregor':'Конор Макгрегор'});
Object.assign(names,{'Ramiro Jimenez':'Рамиро Хименес','Rodrigo Vera':'Родриго Вера'});
const letters={a:'а',b:'б',c:'к',d:'д',e:'е',f:'ф',g:'г',h:'х',i:'и',j:'дж',k:'к',l:'л',m:'м',n:'н',o:'о',p:'п',q:'к',r:'р',s:'с',t:'т',u:'у',v:'в',w:'у',x:'кс',y:'и',z:'з'};
const ru=n=>names[n]||n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(' ').map(w=>{const t=w.toLowerCase().replace(/sh/g,'ш').replace(/ch/g,'ч').replace(/[a-z]/g,c=>letters[c]);return t.charAt(0).toUpperCase()+t.slice(1)}).join(' ');
const stamp=s=>s?new Date(s).toLocaleString('ru-RU',{timeZone:'Europe/Moscow',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+' МСК':'время не указано';
let chosenRegion='',chosenBook='',raw=[];
const regions={'us':'США','us2':'США — дополнительные','uk':'Великобритания','eu':'Европа','au':'Австралия'};
const lineButton=document.createElement('button');
lineButton.className='market';lineButton.dataset.market='lines';
const lineHeading=document.createElement('span'),lineCaption=document.createElement('span');
lineHeading.textContent='ЛИНИИ';lineCaption.textContent='букмекеров — по регионам';
lineCaption.style.cssText='display:block;font-size:10px;font-weight:500;line-height:13px';
lineButton.append(lineHeading,lineCaption);
lineButton.title='Коэффициенты разных букмекеров: выбор региона и источника линии';
document.querySelector('.markets').style.height='auto';
document.querySelector('.markets').style.flexWrap='nowrap';
document.querySelector('.markets').append(lineButton);
const mobileToolbarStyle=document.createElement('style');
mobileToolbarStyle.textContent=`
  .markets{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr) minmax(0,1.45fr);gap:4px;padding:10px 12px;align-items:stretch}
  .markets>.market{min-width:0;min-height:44px;padding:5px 3px;font-size:clamp(10px,2.9vw,12px);line-height:1.2;white-space:normal;overflow-wrap:anywhere}
  .data-notice #refresh-data{display:inline;padding:0;margin:0 0 0 3px;font:inherit;line-height:inherit;vertical-align:baseline;white-space:nowrap}
`;
document.head.append(mobileToolbarStyle);
const linePanel=document.createElement('div');
linePanel.hidden=true;linePanel.style.cssText='padding:12px 20px;border-bottom:1px solid var(--line);display:grid;gap:8px;background:white';
linePanel.innerHTML='<label>Регион <select id="line-region" aria-label="Регион линии"></select></label><label>Букмекер <select id="line-book" aria-label="Букмекер линии"></select></label><small>Переключение без запросов к источнику. Прочерк — у выбранной линии нет коэффициента. Авто отдаёт приоритет исходам с ничьей.</small>';
document.querySelector('header').after(linePanel);
const regionSelect=linePanel.querySelector('#line-region'),bookSelect=linePanel.querySelector('#line-book');
for(const [key,label] of [['','Все регионы'],...Object.entries(regions)])regionSelect.add(new Option(label,key));
for(const select of [regionSelect,bookSelect])select.style.cssText='display:block;width:100%;padding:8px;margin-top:4px;border:1px solid var(--line);background:white;color:var(--ink)';
// All three tabs use the existing single market state and delegated click handler.
const marketTabs=document.querySelector('.markets');
marketTabs.setAttribute('role','tablist');
linePanel.id='bookmaker-lines-panel';linePanel.setAttribute('role','tabpanel');
const eventsPanel=document.getElementById('events');eventsPanel.setAttribute('role','tabpanel');
const tabs=[...marketTabs.querySelectorAll('[data-market]')];
for(const tab of tabs){tab.setAttribute('role','tab');tab.id='market-tab-'+tab.dataset.market;tab.setAttribute('aria-controls',tab===lineButton?linePanel.id:eventsPanel.id);}
function syncMarketTabs(){
const active=screen.getState().market,isLines=active==='lines';
linePanel.hidden=!isLines;eventsPanel.hidden=isLines;
linePanel.setAttribute('aria-labelledby',lineButton.id);
eventsPanel.setAttribute('aria-labelledby','market-tab-'+active);
for(const tab of tabs){const selected=tab.dataset.market===active;tab.classList.toggle('active',selected);tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;}
}
const renderBeforeTabs=render;
render=function(){renderBeforeTabs();syncMarketTabs()};
marketTabs.addEventListener('keydown',event=>{
if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
const index=tabs.indexOf(event.target.closest('[data-market]'));if(index<0)return;
event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
tabs[next].focus();tabs[next].click();
});
syncMarketTabs();
function eligibleBooks(e){return(e.bookmakers||[]).filter(b=>(!chosenRegion||(b.regions||[]).includes(chosenRegion))&&(!chosenBook||b.key===chosenBook))}
function updateBookOptions(){
const books=new Map();for(const e of raw)for(const b of e.bookmakers||[])if(!chosenRegion||(b.regions||[]).includes(chosenRegion))books.set(b.key,b.title);
bookSelect.replaceChildren(new Option('Авто — доступная линия',''));
if(chosenBook&&!books.has(chosenBook))books.set(chosenBook,chosenBook+' — сейчас нет линии');
for(const [key,title] of [...books].sort((a,b)=>a[1].localeCompare(b[1])))bookSelect.add(new Option(title,key));
bookSelect.value=chosenBook;
}
function renderLines(){
current=raw.map(e=>({...normalize({...e,bookmakers:eligibleBooks(e)},e.feedSport),unavailable:e.feedUnavailable||e.metadata_unavailable}));
current.sort((a,b)=>String(a.startTime).localeCompare(String(b.startTime)));screen.setEvents(current);
lineHeading.textContent=chosenRegion||chosenBook?'ЛИНИИ ●':'ЛИНИИ';
}
regionSelect.addEventListener('change',()=>{chosenRegion=regionSelect.value;chosenBook='';updateBookOptions();renderLines()});
bookSelect.addEventListener('change',()=>{chosenBook=bookSelect.value;renderLines()});
function normalize(e,sport){
const fighters=[e.home_team,e.away_team],entries=(e.bookmakers||[]).flatMap(b=>(b.markets||[]).map(m=>({b,m}))).sort((a,b)=>a.b.key.localeCompare(b.b.key));
const winners=entries.filter(({m})=>['h2h','h2h_3_way'].includes(m.key)&&fighters.every(n=>m.outcomes.some(o=>o.name===n&&Number.isFinite(o.price))));
// All prices must belong to the same bookmaker and market.
const win=winners.find(({m})=>m.outcomes.some(o=>o.name==='Draw'&&Number.isFinite(o.price)))||winners[0];
let total;for(const entry of entries.filter(x=>x.m.key==='totals')){const over=entry.m.outcomes.find(o=>o.name==='Over'&&Number.isFinite(o.point)),under=over&&entry.m.outcomes.find(o=>o.name==='Under'&&o.point===over.point);if(over&&under){total={...entry,line:over.point,over:over.price,under:under.price};break}}
const source=x=>x?x.b.title+' · линия '+stamp(x.m.last_update||x.b.last_update):'Коэффициенты пока не опубликованы';
let card=e.tournament||window.ufcCardInfo(e)||window.boxingCardInfo?.(e);
if(card)card={...card,supplementalSources:e.supplemental_sources||[]};
if(sport==='boxing'&&e.boxing_info){const info=e.boxing_info;card={...card,title:card?.title||'Бокс · '+fighters.map(ru).join(' — '),originalTitle:card?.originalTitle||fighters.join(' vs '),stage:info.stage+(info.stale?' · сохранённые сведения':''),highlight:info.stage,source:info.source,note:'Boxing Data. Время в расписании — The Odds (МСК); часовой пояс Boxing Data не указан.'};}
return{id:e.id,sport,metadataUnavailable:Boolean(e.metadata_unavailable),status:new Date(e.commence_time)>new Date()?'prematch':'live',cardInfo:card,title:card?card.title:sport==='mma'?'MMA · В разработке / Возможные':'Бокс',startTime:e.commence_time,date:window.moscowFightTime(e.commence_time),originalFighters:fighters.slice(),originalSportTitle:e.sport_title||'',fighters:fighters.map(ru),odds:win?[win.m.outcomes.find(o=>o.name===fighters[0]).price,win.m.outcomes.find(o=>o.name==='Draw')?.price??null,win.m.outcomes.find(o=>o.name===fighters[1]).price]:[null,null,null],totals:total?{line:total.line,over:total.over,under:total.under}:null,priceKey:win?.b.key??'',totalKey:total?.b.key??'',priceNote:source(win),totalNote:source(total),sourceNote:'The Odds. '+source(win)+'. Время начала по поставщику, может уточняться.'};
}
let busy=false,current=[];
let toastTimer;
const toast=document.createElement('div');toast.hidden=true;toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');
toast.style.cssText='position:fixed;bottom:90px;left:50%;transform:translateX(-50%);width:max-content;max-width:calc(100vw - 32px);box-sizing:border-box;padding:10px 14px;border-radius:7px;background:#edf7f0;color:#24683d;box-shadow:0 3px 16px #20243f22;font-size:12px;line-height:1.4;z-index:100;pointer-events:none';document.body.append(toast);
function notifyRefresh(message,error=false){clearTimeout(toastTimer);toast.textContent=message;toast.style.background=error?'#fff0f1':'#edf7f0';toast.style.color=error?'#a82a40':'#24683d';toast.hidden=false;toastTimer=setTimeout(()=>{toast.hidden=true},3000);}
const priceSnapshot=e=>JSON.stringify(e?{fighters:e.originalFighters,book:e.priceKey,odds:e.odds,totalBook:e.totalKey,totals:e.totals}:null);
const eventCountLabel=n=>n+' '+(n%100>=11&&n%100<=14?'событий':n%10===1?'событие':n%10>=2&&n%10<=4?'события':'событий');
async function load(signal,manualSport=null,eventId=null,summaryOnly=false){
if(busy)return;busy=true;refresh.disabled=true;status.textContent='Загрузка линии…';
const before=eventId?priceSnapshot(current.find(e=>e.id===eventId)):null;
try{
const base=window.FREEBK_API_BASE;if(!base)throw new Error('Публичный API ещё не настроен.');
const results=await Promise.all((manualSport?[manualSport]:['mma','boxing']).map(async sport=>{try{const r=await fetch(base.replace(/\/$/,'')+'/api/odds?sport='+sport+(eventId?'&refresh=1&eventId='+encodeURIComponent(eventId):''),{cache:'no-store',signal:AbortSignal.any([signal,AbortSignal.timeout(65000)])}),data=await r.json();if(!r.ok||!Array.isArray(data.events))throw new Error();return{sport,data}}catch{return{sport,error:true}}}));
if(signal.aborted)return;
if(eventId&&results.some(r=>r.data?.manual_throttled)){status.textContent='Повторное обновление доступно через минуту после предыдущего запроса.';notifyRefresh('Подождите минуту: новый запрос поставщику не отправлен.',true);return;}
if(eventId&&results.some(r=>r.error||r.data?.stale)){const failed=results.find(r=>r.error||r.data?.stale);status.textContent='Не удалось обновить этот бой. Сохранённые коэффициенты оставлены без изменений.';notifyRefresh('Ошибка обновления. '+(failed.data?.event_missing?'Поставщик больше не возвращает этот бой.':failed.data?.refresh_error||'Нет ответа от сервера или поставщика.'),true);return;}
if(!summaryOnly){
for(const r of results)if(r.error)raw=raw.map(e=>e.feedSport===r.sport?{...e,feedUnavailable:true}:e);
for(const r of results)if(!r.error)raw=raw.filter(e=>e.feedSport!==r.sport).concat(r.data.events.map(e=>({...e,feedSport:r.sport,feedUnavailable:r.data.stale})));
updateBookOptions();renderLines();
}
if(results.some(r=>r.data?.manual_throttled)){status.textContent='Повторное обновление доступно через минуту после предыдущего запроса.';return;}
if(eventId&&results.some(r=>r.data?.served_from_cache)){status.textContent='Показана последняя серверная линия. Новый опрос — по интервалу администратора.';notifyRefresh('Использован общий кэш: дополнительный запрос поставщику не отправлялся.');return;}
if(eventId){const updated=current.find(e=>e.id===eventId);status.textContent='Линия выбранного боя проверена. Остальные бои не обновлялись.';notifyRefresh(!updated||(!updated.odds.some(Number.isFinite)&&!updated.totals)?'Поставщик ответил. Для выбранной линии коэффициенты не опубликованы.':before===priceSnapshot(updated)?'Поставщик ответил: коэффициенты выбранной линии не изменились.':'Обновлено: коэффициенты или источник выбранной линии изменились.');return;}
status.replaceChildren();
results.forEach((r,i)=>{
if(i)status.append(document.createTextNode(' / '));
const count=document.createElement('span');count.style.color='#a3c85a';count.textContent=(r.sport==='mma'?'MMA':'Бокс')+': '+(r.error?'ошибка загрузки':eventCountLabel(r.data.events.length));status.append(count);
if(!r.error)status.append(document.createTextNode(' · получено '+stamp(r.data.fetched_at*1000)+' · следующая проверка источника после '+stamp((r.data.fetched_at+(r.data.refresh_hours??96)*3600)*1000)+(r.data.stale?' · устаревший кэш':'')));
});
}catch(e){status.textContent=e.message;if(eventId)notifyRefresh('Ошибка обновления. Попробуйте позже.',true);else if(!summaryOnly)screen.setError(e.message)}finally{busy=false;refresh.disabled=false}
}
screen.setSport('mma');
window.refreshBookmakerLine=async (sport,eventId)=>{
if(busy)return;
const buttons=document.querySelectorAll('.refresh-line');buttons.forEach(b=>{b.disabled=true;if(b.dataset.refreshEvent===eventId){b.classList.add('is-loading');b.setAttribute('aria-busy','true');}});
try{await load(new AbortController().signal,sport,eventId)}finally{document.querySelectorAll('.refresh-line').forEach(b=>{b.disabled=false;b.classList.remove('is-loading');b.removeAttribute('aria-busy');})}
};
const lifecycle=window.startVisibleFeed(load);
refresh.title='Обновить сводку и все блоки событий вместе';
refresh.addEventListener('click',()=>lifecycle.refresh());
})();
