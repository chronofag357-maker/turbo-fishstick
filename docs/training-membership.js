// Closed owner pilot. No invoices, paid entitlements or currency conversions.
(() => {
  function install(){
    const previous=window.freebkMenuContent;
    if(!previous)return;
    const eligible=()=>window.ServerAccount?.enabled ? !!window.ServerAccount.current?.admin : ['localhost','127.0.0.1','[::1]'].includes(location.hostname);
    window.freebkMenuContent=()=>{
      const html=previous();if(!eligible())return html;
      const template=document.createElement('template');template.innerHTML=html;
      const balance=template.content.querySelector('.menu-balance');
      if(balance){
        const value=balance.querySelector('strong');if(value)value.insertAdjacentHTML('beforeend',' <span>очков</span>');
        balance.querySelector('button')?.remove();
        balance.insertAdjacentHTML('beforeend','<button type="button" data-training-open aria-label="О балансе и подписке">ⓘ</button>');
      }
      return template.innerHTML;
    };
    const dialog=document.createElement('dialog');dialog.id='training-membership';
    dialog.innerHTML='<header><strong>Баланс и подписка</strong><button data-training-close aria-label="Закрыть">×</button></header><h2>Настоящие эмоции.<br>Осознанные решения.</h2><p>Купоны, анализ вероятностей и практика управления риском.</p><section><h3>Баланс в очках</h3><p>Игровые очки не являются деньгами. Без вывода, передачи и обмена на Stars, криптовалюту или ценные призы.</p><button data-training-refill>Восстановить 10 000 очков бесплатно</button><small>При нулевом балансе без ожидающих купонов. История сохраняется.</small></section><section><h3>Подписка на тренажёр</h3><p>Оплата — за доступ к инструментам, не за денежный депозит или шанс получить приз. Результаты тренировок не гарантируют доход.</p><p>Сейчас доступ владельца бесплатный. Покупка за Stars ещё не включена.</p></section><p role="status" data-training-status></p>';
    document.body.append(dialog);
    const style=document.createElement('style');style.textContent='#training-membership{box-sizing:border-box;width:min(94vw,420px);max-height:88dvh;overflow:auto;border:1px solid #d7d8df;border-radius:14px;padding:18px;color:#20243F;background:white;font:14px Arial;line-height:1.5}#training-membership::backdrop{background:#171b3699}#training-membership header{display:flex;justify-content:space-between;align-items:center}#training-membership h2{font-size:21px}#training-membership h3{font-size:15px}#training-membership section{border-top:1px solid #d7d8df;padding:8px 0}#training-membership button{min-height:44px;border:0;border-radius:7px;background:#293870;color:white;padding:8px 12px;max-width:100%;white-space:normal}#training-membership button:disabled{opacity:.5}#training-membership small{display:block;margin-top:8px}#training-membership [data-training-close]{min-width:44px}';document.head.append(style);
    document.addEventListener('click',async e=>{
      if(e.target.closest('[data-training-open]')&&eligible()){e.preventDefault();e.stopImmediatePropagation();dialog.querySelector('[data-training-status]').textContent='';dialog.showModal();}
      if(e.target.closest('[data-training-close]'))dialog.close();
      const button=e.target.closest('[data-training-refill]');if(!button||button.disabled||!eligible())return;
      button.disabled=true;const status=dialog.querySelector('[data-training-status]');
      try{
        if(window.ServerAccount?.enabled){await window.ServerAccount.api('training/refill',{});await window.ServerAccount.refresh();}
        else{window.DemoWallet.refill(freebkDemoPartner);window.dispatchEvent(new Event('p2p-wallet-update'));}
        status.textContent='Начислено 10 000 очков. История сохранена.';
        const menu=document.querySelector('#panel-body .account-menu');if(menu)menu.outerHTML=window.freebkMenuContent();
      }catch(error){status.textContent=error.message;}finally{button.disabled=false;}
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
