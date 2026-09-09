// Run after navigation extensions; preserve existing listeners and live status nodes.
(() => {
 const notice=document.querySelector('.data-notice');
 if(notice&&!notice.querySelector('.feed-summary')){
  const details=document.createElement('details');details.className='feed-summary';
  const summary=document.createElement('summary');summary.textContent='Сводка событий';
  const body=document.createElement('div');body.className='feed-summary-body';
  while(notice.firstChild)body.append(notice.firstChild);
  details.append(summary,body);notice.append(details);
  const counts=document.createElement('span');counts.className='feed-counts';summary.append(counts);
  const refresh=body.querySelector('#refresh-data');
  if(refresh){refresh.classList.add('summary-refresh');summary.append(refresh);refresh.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();});}
  function updateCounts(){
   const rows=typeof events==='undefined'?[]:events;
   const count=s=>new Set(rows.filter(e=>e.sport===s&&e.status!=='finished'&&!e.cardInfo?.cancelled).map(e=>e.id)).size;
   const es=window.esportsSummary;
   counts.textContent='MMA '+count('mma')+' · Бокс '+count('boxing')+' · Киберспорт '+(es?es.total:'—');
   counts.title='Количество событий в загруженном расписании, без завершённых и отменённых. Киберспорт: '+(es?es.total+' всего, '+es.lined+' с линией, '+(es.total-es.lined)+' в ожидании линии':'ещё не загружен');
  }
  const priorRender=render;render=function(){const result=priorRender.apply(this,arguments);updateCounts();return result;};
  window.addEventListener('esports-summary-change',updateCounts);updateCounts();
 }
 const source=document.querySelector('.fight-list-toolbar details>summary');
 if(source){source.textContent='Об источнике';const brief=document.createElement('span');brief.className='source-brief';brief.textContent='The Odds · букмекеры США, Европы, UK, Австрии, РФ';brief.title='Букмекеры США, Европы, Великобритании, Австрии и России — перечень на перспективу';source.append(brief);}
 if(source){const original=source.parentElement.querySelector('a[href="https://the-odds-api.com/"]');if(original){const link=original.cloneNode(true);link.classList.add('source-quick-link');link.removeAttribute('style');link.addEventListener('click',e=>e.stopPropagation());source.append(link);}}
 const css=document.createElement('link');css.rel='stylesheet';css.href='compact-header.css?v=221';document.head.append(css);
})();
