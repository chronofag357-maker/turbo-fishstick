// Only verified tournament membership is grouped; unknown bouts stay separate.
window.tournamentOriginalSuffix = (title, original) => {
  if(!original)return '';
  let suffix=original.trim();
  // Strip an already displayed event label, retaining the original fighter pairing.
  suffix=suffix.replace(/^(?:UFC\s+(?:Fight Night\s+)?\d+|Noche UFC)\s*:?\s*/i, (prefix)=>{
    const label=prefix.replace(/:\s*$/,'').trim();
    return title.toLowerCase().includes(label.toLowerCase())?'':prefix;
  }).trim();
  return suffix&&!title.toLowerCase().includes(suffix.toLowerCase())?suffix:'';
};
window.fightTournamentKey = e => e.cardInfo
  ? e.sport + ':' + (e.cardInfo.groupSource || e.cardInfo.source) + ':' + e.cardInfo.title
  : e.sport + ':unconfirmed:' + e.id;

window.tournamentTime = value => {
  const time = value ? Date.parse(value) : NaN;
  return Number.isFinite(time) ? time : Infinity;
};
window.sortTournamentGroups = groups => {
  const list = [...groups];
  for (const [,group] of list) {
    group.items.sort((a,b) => window.tournamentTime(a.event.startTime) - window.tournamentTime(b.event.startTime) || a.event.id.localeCompare(b.event.id));
  }
  return list.sort(([keyA,a],[keyB,b]) =>
    window.tournamentTime(a.items[0]?.event.startTime) - window.tournamentTime(b.items[0]?.event.startTime) || keyA.localeCompare(keyB));
};

(() => {
  const expanded = new Set();
  const baseRender = render;
  render = function() {
    baseRender();
    const root=document.getElementById('events');
    const articles=[...root.querySelectorAll('article.event')];
    if(!articles.length)return;
    const groups=new Map();
    for(const article of articles){
      const id=article.querySelector('[data-event]')?.dataset.event;
      const e=events.find(e=>e.id===id);
      if(!e)continue;
      const key=window.fightTournamentKey(e);
      if(!groups.has(key))groups.set(key,{event:e,items:[]});
      groups.get(key).items.push({article,event:e});
    }
    const controls=document.createElement('div');controls.className='tournament-controls';
    for(const [text,open] of [['Раскрыть все',true],['Свернуть все',false]]){
      const button=document.createElement('button');button.textContent=text;
      button.addEventListener('click',()=>{
        root.querySelectorAll('details.tournament').forEach(d=>{
          if(open)expanded.add(d.dataset.group);else expanded.delete(d.dataset.group);
          d.open=open;
        });
      });controls.append(button);
    }
    const fragment=document.createDocumentFragment();fragment.append(controls);
    for(const [key,group] of window.sortTournamentGroups(groups)){
      const first=group.items[0].event;
      const details=document.createElement('details');details.className='tournament';details.dataset.group=key;details.open=expanded.has(key);
      const summary=document.createElement('summary');
      const text=document.createElement('div');text.className='tournament-label';
      const title=document.createElement('strong');title.textContent=first.cardInfo?.title||first.title+' · '+first.fighters.join(' — ');
      if(title.textContent.startsWith('DWCS'))title.textContent=title.textContent.replace('DWCS',"MMA · DWCS — Dana White’s Contender Series");
      else if(first.sport==='mma'&&!title.textContent.startsWith('MMA'))title.textContent='MMA · '+title.textContent;
      const count=document.createElement('span');count.className='count';count.textContent=String(group.items.length);count.title='Количество боёв в текущем списке';
      const chevron=document.createElement('span');chevron.className='tournament-chevron';chevron.textContent='⌄';chevron.setAttribute('aria-hidden','true');
      text.append(title);
      const scheduled=group.items.find(({event})=>!event.cardInfo?.cancelled&&Number.isFinite(window.tournamentTime(event.startTime)))?.event;
      const scheduleLabel=document.createElement('div');scheduleLabel.className='tournament-schedule';
      if(scheduled){
        const time=document.createElement('time');time.dateTime=scheduled.startTime;time.textContent=window.moscowFightHeader(scheduled.startTime);
        time.title=window.moscowFightTime(scheduled.startTime);
        time.title+=' · время первого неотменённого боя в доступной линии';
        scheduleLabel.append(time);
      }else scheduleLabel.textContent='Дата и время уточняются';
      text.prepend(scheduleLabel);
      const highlights=[...new Set(group.items.filter(x=>!x.event.cardInfo?.cancelled).map(x=>x.event.cardInfo?.highlight).filter(Boolean))];
      for(const description of highlights){const detail=document.createElement('div');detail.className='tournament-description';detail.textContent=description;text.append(detail);}
      const original=first.cardInfo?.originalTitle||(!first.cardInfo?first.originalFighters?.join(' — '):'');
      const hasRussianTitle=/[А-Яа-яЁё]/.test(first.cardInfo?.title||first.title||'');
      const originalSuffix=window.tournamentOriginalSuffix(title.textContent,original);
      if(originalSuffix&&hasRussianTitle){const label=document.createElement('span');label.className='tournament-original';label.textContent=' / '+originalSuffix;label.title=first.cardInfo?'Название из источника турнира':'Имена из Odds API';title.append(label);}
      const sourceUrl=first.cardInfo?.groupSource||first.cardInfo?.source||'https://the-odds-api.com/sports/boxing-odds.html';
      if(sourceUrl){try{
        const url=new URL(sourceUrl);
        if(url.protocol==='https:'){
          const sourceRow=document.createElement('div');sourceRow.className='tournament-sources';
          const link=document.createElement('a');link.className='tournament-source-link';link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';
          if(!first.cardInfo&&first.sport==='mma')link.href='https://the-odds-api.com/sports/mma-ufc-odds.html';
          link.textContent='Источник · '+(!first.cardInfo?'The Odds':url.hostname==='boxing-data.com'?'Boxing Data':url.hostname.replace(/^www\./,''))+' ↗';
          link.title=first.cardInfo?'Открыть источник сведений о боях':'The Odds: пары, время и коэффициенты; турнир не подтверждён';
          link.addEventListener('click',ev=>ev.stopPropagation());
          sourceRow.append(link);text.append(sourceRow);
        }
      }catch{}}
      for(const extra of first.cardInfo?.supplementalSources||[]){
        try{const url=new URL(extra.url);if(url.protocol!=='https:')continue;
        const extraRow=document.createElement('div');extraRow.className='tournament-sources';
        const link=document.createElement('a');link.className='tournament-source-link';link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Доп. источник · '+extra.name+(extra.stale?' (кэш)':'')+' ↗';link.title=[extra.venue,extra.city].filter(Boolean).join(' · ');link.addEventListener('click',ev=>ev.stopPropagation());extraRow.append(link);text.append(extraRow);
        }catch{}
      }
      summary.append(text,count,chevron);details.append(summary);
      const content=document.createElement('div');content.className='tournament-content';
      // Keep the tournament's chronological key intact; cancelled bouts display last.
      const displayItems=[...group.items].sort((a,b)=>Number(Boolean(a.event.cardInfo?.cancelled))-Number(Boolean(b.event.cardInfo?.cancelled)));
      let previousStart=null;
      for(const {article,event} of displayItems){
        const headerKey=(event.startTime||event.date)+'|'+(event.cardInfo?.stage||'')+'|'+(market==='totals'?event.totalNote:event.priceNote);
        if(headerKey&&headerKey===previousStart&&!event.cardInfo?.cancelled)article.querySelector('.event-head')?.remove();
        previousStart=event.cardInfo?.cancelled?null:headerKey;
        if(event.cardInfo?.cancelled){
          article.classList.add('cancelled-fight');
          article.querySelectorAll('.card-stage,.fighter-role,.line-source').forEach(node=>node.remove());
          article.querySelectorAll('.fighter-link,.odd').forEach(button=>{button.disabled=true;button.title='Бой отменён — выбор недоступен';});
          article.querySelectorAll('.odd').forEach(button=>{button.classList.remove('odds-up','odds-down','selected');});
          const badge=document.createElement('strong');badge.className='cancelled-badge';badge.textContent='Отмена';
          const note=document.createElement('small');note.textContent='По сообщению источника';
          const chips=document.createElement('div');chips.className='cancelled-chips';
          chips.append(badge,note);article.prepend(chips);
          const priceNote=document.createElement('div');priceNote.className='line-source';priceNote.textContent='Бой отменён. '+(market==='totals'?event.totalNote:event.priceNote)+' · котировки неактивны';article.append(priceNote);
          try{const url=new URL(event.cardInfo.source);if(url.protocol==='https:'){const link=document.createElement('a');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent='По сообщению '+(url.hostname==='sports.yahoo.com'?'Yahoo Sports':url.hostname.replace(/^www\./,''))+' ↗';note.replaceWith(link)}}catch{}
        }
        article.querySelector('.event-title')?.remove();
        article.setAttribute('aria-label',event.fighters.join(' — '));
        content.append(article);
      }
      details.append(content);
      details.addEventListener('toggle',()=>{if(details.open)expanded.add(key);else expanded.delete(key)});
      fragment.append(details);
    }
    root.replaceChildren(fragment);
  };
  const css=document.createElement('style');
  css.textContent='.tournament-controls{display:flex;justify-content:flex-end;gap:16px;padding:10px 15px;border-bottom:1px solid var(--line);font-size:12px;color:var(--blue)}.tournament{border-bottom:1px solid var(--line)}.tournament>summary{display:flex;align-items:center;gap:10px;list-style:none;cursor:pointer;padding:20px 15px;background:#fff;min-height:94px}.tournament>summary::-webkit-details-marker{display:none}.tournament-label{flex:1;min-width:0}.tournament-label strong{display:block;font-size:17px;line-height:1.3;font-weight:600}.tournament-label small{display:block;font-size:11px;color:#777b92;line-height:1.5;margin-top:8px}.tournament:not([open])>summary .count{background:#f1f2f7;color:var(--ink);border:1px solid var(--line)}.tournament-chevron{font-size:20px;color:#777b92}.tournament[open]>summary .tournament-chevron{transform:rotate(180deg)}.tournament[open]>summary{background:var(--bg)}.tournament-content .card-stage{padding-top:12px}.tournament-content .event:last-child{border-bottom:0}.tournament>summary:focus-visible{outline:2px solid var(--blue);outline-offset:-2px}';
  document.head.append(css);
  const scheduleStyle=document.createElement('style');scheduleStyle.textContent='.tournament-schedule{margin:0 0 6px;font-size:14px;line-height:1.35;color:var(--blue);font-weight:700}.tournament-schedule time{font-weight:700}';document.head.append(scheduleStyle);
  const sourceStyle=document.createElement('style');sourceStyle.textContent='.tournament-sources{margin-top:7px}.tournament-source-link{display:inline-block;padding:3px 7px;border:1px solid #e0e2ea;border-radius:4px;color:#686e85;background:transparent;font-size:10px;line-height:1.4;font-weight:400;text-decoration:none;overflow-wrap:anywhere}.tournament-source-link:hover{color:#258753;border-color:#258753}.tournament-source-link:focus-visible{outline:2px solid var(--blue);outline-offset:2px}';document.head.append(sourceStyle);
  const compactSummaryStyle=document.createElement('style');
  compactSummaryStyle.textContent='.tournament>summary{padding:12px 15px;min-height:60px}.tournament-label .tournament-original{display:inline;font-size:12px;font-weight:400;line-height:1.4;color:#777b92}.tournament .tournament-description{margin-top:4px}';
  document.head.append(compactSummaryStyle);
  const descriptionStyle=document.createElement('style');descriptionStyle.textContent='.tournament-description{font-size:12px;line-height:1.4;font-weight:500;color:#4c526b;margin-top:6px}';document.head.append(descriptionStyle);
  const cancelledCss=document.createElement('style');
cancelledCss.textContent='.cancelled-fight{border-left:2px solid #a3c85a;background:#f6faed;max-width:100%;min-width:0}.cancelled-fight .fighter-link,.cancelled-fight .original-name,.cancelled-fight .odd{color:#567a22!important;opacity:1}.cancelled-fight .odd,.cancelled-fight .fighters{background:#f6faed}.cancelled-chips{display:flex;align-items:center;flex-wrap:wrap;gap:6px;padding:6px 12px;min-width:0}.cancelled-badge{padding:2px 6px;border-radius:3px;background:#e6f0cd;color:#567a22;font-size:10px;font-weight:600;line-height:14px}.cancelled-chips a,.cancelled-chips small{font-size:10px;color:#777b92;overflow-wrap:anywhere}.cancelled-chips a{text-underline-offset:2px}';
  document.head.append(cancelledCss);
})();
