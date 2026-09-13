// Media navigation reuses the existing screens; no feed requests.
(() => {
  const bar=document.querySelector('#app .topbar'),modes=bar.querySelector('.modes');
  bar.classList.add('has-media-tabs');
  for(const [label,kind] of [['Трансляции','broadcast'],['Стримы','streams']]){
    const button=document.createElement('button');
    button.type='button';button.className='mode media-mode';button.textContent=label;
    button.dataset.media=kind;button.setAttribute('aria-haspopup','dialog');
    button.onclick=()=>kind==='broadcast'?window.openBroadcastScreen?.():window.PartnerRoom?.open();
    modes.append(button);
  }
  const css=document.createElement('style');
  css.textContent=`
  #app .topbar.has-media-tabs{gap:4px;padding-inline:5px}
  #app .topbar.has-media-tabs .modes{gap:6px;flex:1;justify-content:flex-start;min-width:0}
  #app .topbar.has-media-tabs .mode{font-size:19px;min-height:40px}
  #app .topbar.has-media-tabs .media-mode{font-size:11px}
  #app .topbar.has-media-tabs .icon-button[data-action="menu"]{width:32px;margin-right:6px}
  #app .topbar.has-media-tabs .icon-button{width:22px;flex:none;margin:0;padding:0}
  #app .topbar.has-media-tabs .language-switch{margin:0;flex:none}
  #app .topbar.has-media-tabs .language-switch button{min-width:17px;padding-inline:1px;font-size:8px}
  @media(max-width:370px){#app .topbar.has-media-tabs{gap:2px;padding-inline:2px}#app .topbar.has-media-tabs .modes{gap:2px;display:grid;grid-template-columns:auto auto auto}#app .topbar.has-media-tabs .mode{font-size:18px;grid-row:1 / 3}#app .topbar.has-media-tabs .media-mode{font-size:10px;min-height:20px;grid-column:3;grid-row:auto}#app .topbar.has-media-tabs .icon-button{width:20px}}
  `;document.head.append(css);
})();
