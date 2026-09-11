(() => {
 const tab=document.createElement('button');tab.className='sport live-trainer-tab';tab.type='button';
 tab.style.setProperty('--sport-gradient','url(#nav-time-gradient)');
 tab.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M9 2h6m-3 3v3m0 5 4-3M4 5 2 7"/></svg><span class="sport-label">Live тренажёр</span>';
 tab.addEventListener('click',()=>{
  const target=new URL('live-trainer/index.html',location.href);
  target.searchParams.set('return',location.pathname+location.search);
  location.href=target.href;
 });
 // Menu content is regenerated after account refreshes; delegate navigation.
 document.addEventListener('click',e=>{if(e.target.closest('[data-action="live-trainer"]'))tab.click();});
 const addEntry=()=>{const links=document.querySelector('#panel .menu-links');if(links&&!links.querySelector('[data-action="live-trainer"]')){const b=document.createElement('button');b.type='button';b.dataset.action='live-trainer';b.textContent='Live тренажёр ›';links.append(b);}};
 new MutationObserver(addEntry).observe(document.getElementById('panel-body'),{childList:true,subtree:true});
})();
