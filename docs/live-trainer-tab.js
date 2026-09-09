(() => {
 const tab=document.createElement('button');tab.className='sport';tab.type='button';
 tab.style.setProperty('--sport-gradient','url(#nav-time-gradient)');
 tab.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M9 2h6m-3 3v3m0 5 4-3M4 5 2 7"/></svg><span class="sport-label">Live тренажёр</span>';
 tab.addEventListener('click',()=>{
  const target=new URL('live-trainer/index.html',location.href);
  target.searchParams.set('return',location.pathname+location.search);
  location.href=target.href;
 });
 document.querySelector('.sports').append(tab);
})();
