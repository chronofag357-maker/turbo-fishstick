const originalFightRender=render;
const disclosureStyle=document.createElement('style');
disclosureStyle.textContent='.data-notice summary::marker{color:#a3c85a}.data-notice summary::-webkit-details-marker{color:#a3c85a}';
document.head.append(disclosureStyle);
const stageStyle=document.createElement('style');
stageStyle.textContent='.event-head .fight-stage-label{display:inline;margin:0;font-size:inherit;font-weight:500;color:#686e85;overflow-wrap:normal}';
document.head.append(stageStyle);
const compactFightStyle=document.createElement('style');
compactFightStyle.textContent='.event .event-row{min-height:64px}.event .fighters{gap:6px;padding:6px 8px;line-height:1.15}.event .fighter-link{padding:0;line-height:1.15}.event .original-name{margin-top:2px;line-height:1.2}.event .line-source{padding-top:4px;padding-bottom:4px}';
document.head.append(compactFightStyle);
const refreshPositionStyle=document.createElement('style');
refreshPositionStyle.textContent='.event .event-row{position:relative}.event .event-row:has(.refresh-line) .fighters{padding-right:18px}.event .event-row:has(.refresh-line) .odd[data-index="0"],.event.totals-layout .event-row:has(.refresh-line) .odd[data-index="1"]{padding-left:13px}.event-row>.refresh-line{position:absolute;left:56.7%;top:50%;transform:translate(-50%,-50%);width:24px;height:24px;display:grid;place-items:center;padding:0;border:1px solid #dddfe8;border-radius:4px;background:#f7f7f8;color:#686e85;font-size:16px;line-height:1;z-index:1}.refresh-line:disabled{opacity:.5}';
document.head.append(refreshPositionStyle);
const refreshAnimationStyle=document.createElement('style');
refreshAnimationStyle.textContent='.refresh-line .refresh-icon{display:block}.refresh-line.is-loading .refresh-icon{animation:refresh-spin .8s linear infinite;color:#258753}.refresh-line.is-loading:after{content:"";position:absolute;left:2px;right:2px;bottom:-4px;height:2px;border-radius:2px;background:linear-gradient(90deg,#dcefe3 0%,#258753 50%,#dcefe3 100%);background-size:200% 100%;animation:refresh-progress 1s linear infinite}.refresh-line.is-loading:disabled{opacity:1}@keyframes refresh-spin{to{transform:rotate(360deg)}}@keyframes refresh-progress{to{background-position:-200% 0}}@media(prefers-reduced-motion:reduce){.refresh-line.is-loading .refresh-icon,.refresh-line.is-loading:after{animation:none}}';
document.head.append(refreshAnimationStyle);
const refreshLabelStyle=document.createElement('style');
refreshLabelStyle.textContent='.event-row>.refresh-line{width:72px;height:26px;display:flex;flex-direction:row-reverse;align-items:center;justify-content:center;gap:3px;left:auto;right:calc(43.3% - 12px);transform:translateY(-50%);font-size:15px}.refresh-line .refresh-label{font-size:10px;line-height:1;font-weight:400}.event .event-row:has(.refresh-line) .fighters{padding-right:64px}.event .event-row:has(.refresh-line) .odd[data-index="0"],.event.totals-layout .event-row:has(.refresh-line) .odd[data-index="1"]{padding-left:13px}';
document.head.append(refreshLabelStyle);
const transparentRefreshStyle=document.createElement('style');
transparentRefreshStyle.textContent='.event-row>.refresh-line{background:transparent;border:0;border-radius:0;box-shadow:none;color:var(--ink);transition:color .15s ease}.event-row>.refresh-line.is-loading,.event-row>.refresh-line:active:not(:disabled),.event-row>.refresh-line:focus-visible{color:#258753}@media(hover:hover) and (pointer:fine){.event-row>.refresh-line:hover:not(:disabled){color:#258753}}@media(prefers-reduced-motion:reduce){.event-row>.refresh-line{transition:none}}';
document.head.append(transparentRefreshStyle);
render=function(){originalFightRender();document.querySelectorAll('article.event').forEach(article=>{
const e=events.find(e=>e.id===article.querySelector('[data-event]')?.dataset.event);if(!e)return;
const dateHeader=article.querySelector('.event-head time');
if(dateHeader){dateHeader.textContent=window.moscowFightHeader(e.startTime);dateHeader.title=e.date||'';if(e.startTime)dateHeader.setAttribute('datetime',e.startTime);}
if(market==='totals'){
article.classList.add('totals-layout');
article.querySelector('.event-head > span')?.remove();
article.querySelector('[data-index="0"]')?.remove();
article.querySelectorAll('.odd').forEach(button=>{
const price=document.createElement('strong');price.className='total-price';price.textContent=button.textContent;
const point=document.createElement('span');point.className='total-point';point.textContent=e.totals?.line??'—';
button.replaceChildren(point,price);
button.setAttribute('aria-label',(button.dataset.index==='1'?'Больше':'Меньше')+' '+(e.totals?.line??'—')+' раундов, коэффициент '+price.textContent);
});
}
article.querySelectorAll('.fighter-link').forEach((b,i)=>{
const a=e.odds[0],c=e.odds[2],s=document.createElement('small');s.className='fighter-role';
const role=Number.isFinite(a)&&Number.isFinite(c)?a===c?'Равная линия':(i===0?a<c:c<a)?'Фаворит':'Андердог':'Нет линии';
s.textContent=' ('+role+')';s.style.cssText='display:inline;margin:0;font-size:10px;font-weight:400;color:#777b92';b.append(s);
const original=e.originalFighters?.[i];if(original&&original!==e.fighters[i]){const label=document.createElement('small');label.className='original-name';label.textContent=original;label.title='Имя из Odds API';b.append(label);}
});
const n=document.createElement('div');n.className='line-source';
const stage=e.sport==='mma'?(e.cardInfo?.stage||'Место в карде уточняется'):e.cardInfo?.stage;
const line=market==='totals'?(e.totals?e.totalNote:'Тотал раундов пока не опубликован'):e.priceNote;
n.textContent=line||'';
if(!e.cardInfo?.cancelled){
const update=document.createElement('button');update.type='button';update.className='refresh-line';update.textContent='↻';
const refreshIcon=document.createElement('span');refreshIcon.className='refresh-icon';refreshIcon.textContent='↻';refreshIcon.setAttribute('aria-hidden','true');update.replaceChildren(refreshIcon);update.dataset.refreshEvent=e.id;
const refreshLabel=document.createElement('span');refreshLabel.className='refresh-label';refreshLabel.textContent='Обновить';update.append(refreshLabel);
update.setAttribute('aria-label','Обновить бой: '+e.fighters.join(' — '));
update.title='Обновить только этот бой (расходует лимит API)';
update.addEventListener('click',()=>window.refreshBookmakerLine?.(e.sport,e.id));article.querySelector('.event-row')?.append(update);
}
if(stage&&dateHeader&&!e.cardInfo?.cancelled){
const stageLabel=document.createElement('span');stageLabel.className='fight-stage-label';stageLabel.textContent=' ('+stage+')';
dateHeader.append(stageLabel);
}
if(dateHeader){
n.style.cssText='display:block;padding:3px 0 0;border:0;font-size:10px;font-weight:400;line-height:1.35;color:#777b92';
dateHeader.append(n);
}else article.append(n);
})};
const marketLayoutStyle=document.createElement('style');
marketLayoutStyle.textContent='.totals-layout .event-head,.totals-layout .event-row{grid-template-columns:56.7% repeat(2,21.65%)}.totals-layout .odd{vertical-align:middle}.total-point{display:block;font-size:13px;font-weight:400;line-height:18px}.total-price{display:block;font-size:17px;line-height:24px;font-weight:750}.event-row .fighter-link{text-align:left}.event-head>span{font-size:12px}.totals-layout .result{grid-column:2/4}';
document.head.append(marketLayoutStyle);
document.querySelector('.data-notice').innerHTML='<span id="data-status" role="status">Загрузка…</span> <button id="refresh-data" style="color:#293870;text-decoration:underline;text-underline-offset:2px">Обновить ↻</button><details><summary>Об источнике и обновлении</summary>The Odds · букмекеры США, Европы, Великобритании и Австралии. Новая линия запрашивается не чаще раза в четыре дня (96 часов). Открытый экран проверяет наш сервер каждую минуту. <span style="color:#258753">(▲</span> Рост<span style="color:#258753">)</span> · <span style="color:#98536f">(▼</span> Снижение<span style="color:#98536f">)</span> относительно предыдущего полученного значения той же БК. Это экономный тестовый режим, не быстрая live-линия. Время боёв — по поставщику, МСК, может уточняться. Исход — победитель, тотал — больше/меньше числа раундов. Прочерк — котировки нет. <a href="https://the-odds-api.com/" target="_blank" rel="noopener noreferrer" style="color:#293870;font:inherit;text-decoration:underline;text-underline-offset:2px" title="Открыть сайт поставщика коэффициентов">The Odds ↗</a></details>';
const css=document.createElement('style');css.textContent='.original-name{display:block;font-size:12px;font-weight:400;line-height:1.4;color:#686e85;margin-top:4px;overflow-wrap:anywhere}.card-stage{padding:0 15px 12px;font-size:12px;line-height:1.5;color:#293870;font-weight:600}.sports{justify-content:center;gap:32px;overflow:visible}.sport{flex:0 1 145px}.fighter-role{display:block;font-size:10px;color:#777b92;margin-top:3px}.event-head{height:auto;min-height:38px}.event-head time{font-size:11px;padding:6px 12px;white-space:normal}.fighters{margin-left:12px}.line-source{padding:6px 16px;font-size:10px;color:#777b92;border-top:1px solid var(--line)}.data-notice details{margin-top:6px;font-size:11px}';document.head.append(css);
