// Official Telegram OIDC library; profile only, no phone or message permission.
(() => {
  let loading;
  function sdk(){
    if(window.Telegram?.Login)return Promise.resolve();
    if(!loading)loading=new Promise((resolve,reject)=>{
      const s=document.createElement('script');s.src='https://oauth.telegram.org/js/telegram-login.js?6';
      s.onload=resolve;s.onerror=()=>{loading=null;s.remove();reject(new Error('Не удалось загрузить Telegram Login.'))};
      document.head.append(s);
    });
    return loading;
  }
  window.prepareBrowserLogin=async()=>{
    await sdk();
    return window.ServerAccount.api('telegram/challenge',{});
  };
  window.runBrowserLogin=(challenge)=>new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(new Error('Время входа истекло. Откройте окно заново.')),300000);
    window.Telegram.Login.auth({client_id:challenge.client_id,scope:['profile'],nonce:challenge.nonce,lang:'ru'},async data=>{
      clearTimeout(timeout);
      try{
        if(!data?.id_token)throw new Error('Вход отменён или не подтверждён. Откройте окно заново.');
        const result=await window.ServerAccount.api('telegram/login',{id_token:data.id_token,nonce:challenge.nonce,consent:true});
        await window.ServerAccount.acceptBrowserToken(result.token);resolve();
      }catch(e){reject(e)}
    });
  });
})();
