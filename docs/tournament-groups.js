// Only verified tournament membership is grouped; unknown bouts stay separate.
window.fightSourceLinks = event => {
  const row=document.createElement('span');row.className='fight-event-sources';
  const card=event.cardInfo;
  const urls=[{url:card?.source||'https://the-odds-api.com/sports/'+(event.sport==='mma'?'mma-ufc':'boxing')+'-odds.html'},...(card?.groupSource&&card.groupSource!==card.source?[{url:card.groupSource}]:[]),...(card?.supplementalSources||[])];
  const seen=new Set();
  for(const item of urls){try{const url=new URL(item.url);if(url.protocol!=='https:'||seen.has(url.href))continue;seen.add(url.href);
    const a=document.createElement('a');a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Источник · '+(item.name||url.hostname.replace(/^www\./,''))+(item.stale?' (кэш)':'')+' ↗';a.addEventListener('click',e=>e.stopPropagation());row.append(a);
  }catch{}}
  return row;
};
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
window.fightTournamentKey = e => e.sport==='boxing' ? 'boxing:fight:'+e.id
  : e.sport==='mma'&&e.cardInfo?.highlight ? 'mma:featured:'+e.id : e.cardInfo
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
  const expandedSummaries=new Set();
  const notice=document.querySelector('.data-notice');
  const sourceDetails=notice.querySelector('details');
  const toolbar=document.createElement('div');toolbar.className='fight-list-toolbar';
  const controls=document.createElement('div');controls.className='tournament-controls';
  toolbar.append(sourceDetails,controls);notice.after(toolbar);
  const sourceBody=document.createElement('div');sourceBody.className='fight-source-body';
  [...sourceDetails.childNodes].filter(node=>node!==sourceDetails.querySelector('summary')).forEach(node=>sourceBody.append(node));
  sourceDetails.append(sourceBody);
  const baseRender = render;
  render = function() {
    baseRender();
    const root=document.getElementById('events');
    const articles=[...root.querySelectorAll('article.event')];
    if(!articles.length){controls.replaceChildren();updateStickyTop();return;}
    const groups=new Map();
    for(const article of articles){
      const id=article.querySelector('[data-event]')?.dataset.event;
      const e=events.find(e=>e.id===id);
      if(!e)continue;
      const key=window.fightTournamentKey(e);
      if(!groups.has(key))groups.set(key,{event:e,items:[]});
      groups.get(key).items.push({article,event:e});
    }
    controls.replaceChildren();
    const toggleAll=document.createElement('button');toggleAll.type='button';
    const allExpanded=()=>{const items=[...root.querySelectorAll('details.tournament')];return items.length>0&&items.every(d=>d.open)};
    const syncToggleAll=()=>{toggleAll.textContent=allExpanded()?'Свернуть все':'Раскрыть все'};
    toggleAll.addEventListener('click',()=>{
        const open=!allExpanded();
        root.querySelectorAll('details.tournament').forEach(d=>{
          if(open)expanded.add(d.dataset.group);else expanded.delete(d.dataset.group);
          d.open=open;
        });
        syncToggleAll();
    });if([...groups.values()].some(group=>group.event.sport==='mma'))controls.append(toggleAll);
    const fragment=document.createDocumentFragment();
    for(const [key,group] of window.sortTournamentGroups(groups)){
      const first=group.items[0].event;
      const details=document.createElement('details');details.className='tournament';details.dataset.group=key;details.open=expanded.has(key);
      const summary=document.createElement('summary');
      const text=document.createElement('div');text.className='tournament-label';
      const title=document.createElement('strong');title.textContent=first.sport==='boxing'
        ? (first.cardInfo?.title||first.fighters.join(' — ')).replace(/^(?:Бокс|Boxing)\s*(?:[·:—–-]\s*|$)/i,'')
        : first.cardInfo?.title||first.title+' · '+first.fighters.join(' — ');
      if(first.sport==='mma'&&first.cardInfo?.highlight){
        const description=first.cardInfo.highlight,separator=description.indexOf(':');
        const pair=separator>0?description.slice(0,separator):first.fighters.join(' — ');
        // A featured fight must not inherit another pairing from the event name.
        const tournament=title.textContent.split(' · ').filter(part=>!part.includes(' — ')).join(' · ');
        title.textContent=tournament+' · '+pair;
      }
      if(title.textContent.startsWith('DWCS'))title.textContent=title.textContent.replace('DWCS',"MMA · DWCS — Dana White’s Contender Series");
      else if(first.sport==='mma'&&!title.textContent.startsWith('MMA'))title.textContent='MMA · '+title.textContent;
      const count=document.createElement('span');count.className='count';count.textContent=String(group.items.length);count.title='Количество боёв в текущем списке';
      const chevron=document.createElement('span');chevron.className='tournament-chevron';chevron.textContent='›';chevron.setAttribute('aria-hidden','true');
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
      if(first.sport==='mma'&&first.cardInfo&&/\bvs\b/i.test(first.cardInfo.originalTitle||'')){
        const main=highlights.find(value=>/(?:^|[ :·])главный бой/i.test(value));
        const pair=main?.split(':')[0];
        if(pair&&pair.includes(' — ')&&!title.textContent.includes(pair))title.textContent+=' · '+pair;
      }
      for(const description of highlights){const detail=document.createElement('div');detail.className='tournament-description';
        const separator=description.indexOf(':');
        const pair=separator>0?description.slice(0,separator):'';
        detail.textContent=first.sport==='mma'&&pair&&title.textContent.includes(pair)
          ? description.slice(separator+1).trim().replace(/^./,letter=>letter.toUpperCase()) : description;
        text.append(detail);}
      const original=first.cardInfo?.originalTitle||(!first.cardInfo?first.originalFighters?.join(' — '):'');
      const hasRussianTitle=/[А-Яа-яЁё]/.test(first.cardInfo?.title||first.title||'');
      const originalSuffix=window.tournamentOriginalSuffix(title.textContent,original);
      if(originalSuffix&&hasRussianTitle&&!(first.sport==='mma'&&first.cardInfo)){const label=document.createElement('span');label.className='tournament-original';label.textContent=' / '+originalSuffix;label.title=first.cardInfo?'Название из источника турнира':'Имена из Odds API';title.append(label);}
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
      text.querySelectorAll('.tournament-sources').forEach(row=>row.remove());
      if(first.sport==='boxing'){
        // Boxing goes directly to its fight card, without a nested tournament row.
        const fight=document.createElement('article');fight.className='tournament boxing-fight';
        const button=document.createElement('button');button.className='boxing-fight-header';
        button.type='button';button.setAttribute('aria-haspopup','dialog');
        const sources=[...text.querySelectorAll('.tournament-sources')];sources.forEach(row=>row.remove());
        button.append(text,chevron);
        button.addEventListener('click',()=>window.openFight(first.id));
        fight.append(button);
        if(sources.length){const footer=document.createElement('div');footer.className='boxing-fight-sources';footer.append(...sources);fight.append(footer)}
        fragment.append(fight);continue;
      }
      summary.append(text,count,chevron);details.append(summary);
      const content=document.createElement('div');content.className='tournament-content';
      // Keep the tournament's chronological key intact; cancelled bouts display last.
      const displayItems=[...group.items].sort((a,b)=>Number(Boolean(a.event.cardInfo?.cancelled))-Number(Boolean(b.event.cardInfo?.cancelled)));
      let previousStart=null,previousStage='';
      for(const {article,event} of displayItems){
        if(event.sport==='mma'&&!event.cardInfo?.cancelled){
          const parts=(event.cardInfo?.stage||'').split('·').map(part=>part.trim()).filter(Boolean);
          const section=parts.find(part=>/^(?:Ранние прелимы|Прелимы|Основной кард)$/i.test(part))||'';
          const sectionKey=section.toLowerCase();
          const visibleParts=parts.filter(part=>!sectionKey||part.toLowerCase()!==sectionKey||sectionKey!==previousStage);
          const label=article.querySelector('.fight-stage-label');
          if(label&&section){if(visibleParts.length)label.textContent=' ('+visibleParts.join(' · ')+')';else label.remove();}
          previousStage=sectionKey;
        }
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
        const sources=window.fightSourceLinks(event);
        const metadata=article.querySelector('.line-source')||article.querySelector('.event-head time');
        if(metadata)metadata.append(sources);else article.prepend(sources);
        if(metadata?.classList.contains('line-source')&&!event.cardInfo?.cancelled){
          const disclosure=document.createElement('details');disclosure.className='fight-inline-summary';disclosure.open=expandedSummaries.has(event.id);
          const trigger=document.createElement('summary');trigger.textContent='Сводка событий';
          const time=article.querySelector('.event-head time');
          if(time){const cell=document.createElement('div');cell.className='fight-time-cell';time.replaceWith(cell);cell.append(time,disclosure);}
          else metadata.before(disclosure);
          disclosure.append(trigger,metadata);
          disclosure.addEventListener('toggle',()=>{if(!disclosure.isConnected)return;if(disclosure.open)expandedSummaries.add(event.id);else expandedSummaries.delete(event.id);});
        }
        article.setAttribute('aria-label',event.fighters.join(' — '));
        content.append(article);
      }
      details.append(content);
      details.addEventListener('toggle',()=>{if(!details.isConnected)return;if(details.open)expanded.add(key);else expanded.delete(key);syncToggleAll()});
      fragment.append(details);
    }
    root.replaceChildren(fragment);
    syncToggleAll();
    updateStickyTop();
  };
  const css=document.createElement('style');
  css.textContent='.tournament-controls{display:flex;justify-content:flex-end;gap:16px;padding:10px 15px;border-bottom:1px solid var(--line);font-size:12px;color:var(--blue)}.tournament{border-bottom:1px solid var(--line)}.tournament>summary{display:flex;align-items:center;gap:10px;list-style:none;cursor:pointer;padding:20px 15px;background:#fff;min-height:94px}.tournament>summary::-webkit-details-marker{display:none}.tournament-label{flex:1;min-width:0}.tournament-label strong{display:block;font-size:17px;line-height:1.3;font-weight:600}.tournament-label small{display:block;font-size:11px;color:#777b92;line-height:1.5;margin-top:8px}.tournament:not([open])>summary .count{background:#f1f2f7;color:var(--ink);border:1px solid var(--line)}.tournament-chevron{font-size:20px;color:#777b92}.tournament[open]>summary .tournament-chevron{transform:rotate(180deg)}.tournament[open]>summary{background:var(--bg)}.tournament-content .card-stage{padding-top:12px}.tournament-content .event:last-child{border-bottom:0}.tournament>summary:focus-visible{outline:2px solid var(--blue);outline-offset:-2px}';
  document.head.append(css);
  const boxingStyle=document.createElement('style');boxingStyle.textContent='.boxing-fight-header{display:flex;align-items:center;gap:10px;width:100%;padding:12px 15px;min-height:60px;text-align:left;color:var(--ink);background:#fff;touch-action:manipulation}.boxing-fight-header:active{background:var(--bg)}.boxing-fight-header:focus-visible{outline:2px solid var(--blue);outline-offset:-2px}.boxing-fight-sources{padding:0 15px 12px;background:#fff}.boxing-fight-sources .tournament-sources{margin-top:0}';document.head.append(boxingStyle);
  const scheduleStyle=document.createElement('style');scheduleStyle.textContent='.tournament-schedule{margin:0 0 6px;font-size:14px;line-height:1.35;color:var(--blue);font-weight:700}.tournament-schedule time{font-weight:700}';document.head.append(scheduleStyle);
  const sourceStyle=document.createElement('style');sourceStyle.textContent='.tournament-sources{margin-top:7px}.tournament-source-link{display:inline-block;padding:3px 7px;border:1px solid #e0e2ea;border-radius:4px;color:#686e85;background:transparent;font-size:10px;line-height:1.4;font-weight:400;text-decoration:none;overflow-wrap:anywhere}.tournament-source-link:hover{color:#258753;border-color:#258753}.tournament-source-link:focus-visible{outline:2px solid var(--blue);outline-offset:2px}';document.head.append(sourceStyle);
  const compactSummaryStyle=document.createElement('style');
  compactSummaryStyle.textContent='.tournament>summary{padding:12px 15px;min-height:60px}.tournament-label .tournament-original{display:inline;font-size:12px;font-weight:400;line-height:1.4;color:#777b92}.tournament .tournament-description{margin-top:4px}';
  document.head.append(compactSummaryStyle);
  const descriptionStyle=document.createElement('style');descriptionStyle.textContent='.tournament-description{font-size:12px;line-height:1.4;font-weight:500;color:#4c526b;margin-top:6px}';document.head.append(descriptionStyle);
  const cancelledCss=document.createElement('style');
cancelledCss.textContent='.cancelled-fight{border-left:2px solid #a3c85a;background:#f6faed;max-width:100%;min-width:0}.cancelled-fight .fighter-link,.cancelled-fight .original-name,.cancelled-fight .odd{color:#567a22!important;opacity:1}.cancelled-fight .odd,.cancelled-fight .fighters{background:#f6faed}.cancelled-chips{display:flex;align-items:center;flex-wrap:wrap;gap:6px;padding:6px 12px;min-width:0}.cancelled-badge{padding:2px 6px;border-radius:3px;background:#e6f0cd;color:#567a22;font-size:10px;font-weight:600;line-height:14px}.cancelled-chips a,.cancelled-chips small{font-size:10px;color:#777b92;overflow-wrap:anywhere}.cancelled-chips a{text-underline-offset:2px}';
  document.head.append(cancelledCss);
  // Compact mobile list: retain full text and a generous tap area, not clipped labels.
  const mobileListStyle=document.createElement('style');
  mobileListStyle.textContent=`
    .tournament>summary,.boxing-fight-header{box-sizing:border-box;padding:8px 12px;min-height:44px;gap:7px}
    .tournament-label strong{font-size:12px;line-height:1.25;font-weight:600;overflow-wrap:anywhere}
    .tournament-schedule{font-size:11px;line-height:1.25;margin-bottom:3px;color:#397eae}
    .tournament-schedule time{display:inline-block;font-weight:800;color:#397eae}
    @supports ((background-clip:text) or (-webkit-background-clip:text)){
      .tournament-schedule time{background:linear-gradient(100deg,#397eae 0%,#5797c2 55%,#70963d 100%);background-clip:text;-webkit-background-clip:text;color:transparent}
    }
    @media(forced-colors:active){.tournament-schedule time{background:none;color:CanvasText}}
    .tournament-label .tournament-original{font-size:10px;line-height:1.25}
    .tournament .tournament-description{font-size:11px;line-height:1.25;margin-top:3px}
    .tournament-sources{display:inline-block;margin:3px 4px 0 0}
    .tournament-source-link{padding:3px 5px;font-size:10px;line-height:1.2}
    .boxing-fight-sources{display:flex;flex-wrap:wrap;gap:3px 4px;padding:0 12px 6px}
    .boxing-fight-sources .tournament-sources{margin:0}
    .tournament>summary>.count{font-size:12px;min-width:26px;padding:3px 5px}
    .tournament-chevron{display:inline-flex;align-items:center;justify-content:center;flex:0 0 12px;width:12px;height:20px;font-size:17px;line-height:1;transition:transform .2s ease}
    .tournament[open]>summary .tournament-chevron{transform:rotate(90deg)}
    @media(prefers-reduced-motion:reduce){.tournament-chevron{transition:none}}
    .tournament-controls{padding:6px 12px;font-size:11px}
    .tournament-content .event .event-row{min-height:56px}
    .tournament-content .event .fighters{gap:4px;padding-top:5px;padding-bottom:5px;margin-left:6px}
    .tournament-content .event .fighter-link{font-size:12px;line-height:1.2}
    .tournament-content .event .original-name{font-size:10px;line-height:1.2;margin-top:1px}
    .tournament-content .event-head{min-height:30px}
    .tournament-content .event-head time{font-size:10px;padding:4px 8px}
    .tournament-content .event .card-stage{font-size:10px;line-height:1.25;padding:6px 12px}
  `;
  document.head.append(mobileListStyle);
  // Native sticky is constrained by each tournament, so the next group pushes
  // the previous heading out instead of stacking a second copy on top.
  const stickyStyle=document.createElement('style');
  stickyStyle.textContent=`
    .fight-list-toolbar{position:sticky;top:var(--fight-header-top,0px);z-index:4;display:flex;align-items:flex-start;gap:8px;padding:6px 12px;background:var(--bg);border-bottom:1px solid var(--line);font-size:11px;line-height:1.4;color:#777b92}
    .fight-list-toolbar>details{flex:1;min-width:0}
    .fight-list-toolbar summary{cursor:pointer}
    .fight-list-toolbar summary::marker{color:#a3c85a}
    .fight-list-toolbar .tournament-controls{flex:none;padding:0;border:0;font:inherit;color:var(--blue);white-space:nowrap}
    .fight-list-toolbar button{font:inherit;padding:0}
    .fight-source-body{margin-top:8px;max-height:35dvh;overflow:auto;overscroll-behavior:contain}
    details.tournament[open]>summary{position:sticky;top:var(--fight-list-top,0px);z-index:3;background:var(--bg);box-shadow:0 1px 0 var(--line)}
    details.tournament>summary{scroll-margin-top:var(--fight-list-top,0px)}
  `;
  document.head.append(stickyStyle);
  const stickyHeader=document.querySelector('.header');
  const updateStickyTop=()=>{
    const headerHeight=stickyHeader?.getBoundingClientRect().height||0;
    const controlsHeight=toolbar.getBoundingClientRect().height||0;
    document.documentElement.style.setProperty('--fight-header-top',`${headerHeight}px`);
    document.documentElement.style.setProperty('--fight-list-top',`${headerHeight+controlsHeight}px`);
  };
  if(typeof ResizeObserver!=='undefined'){
    const observer=new ResizeObserver(updateStickyTop);
    if(stickyHeader)observer.observe(stickyHeader);
    observer.observe(toolbar);
    observer.observe(document.getElementById('events'));
  }
  window.addEventListener('resize',updateStickyTop);updateStickyTop();
})();
