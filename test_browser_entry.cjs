const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const p=await browser.newPage({viewport:{width:390,height:740}});
 await p.setContent('<button class="welcome-login">Войти</button>');
 await p.evaluate(()=>{
   window.calls=0;window.prepareBrowserLogin=async()=>({nonce:String(++window.calls)});
   window.runBrowserLogin=async()=>{throw new Error('Вход отменён');};
 });
 await p.addScriptTag({path:'docs/welcome-entry.js'});
 await p.evaluate(()=>openWelcomeEntry({localPreview:false}));
 const checkbox=p.locator('[data-server-consent]'),button=p.locator('.entry-primary');
 assert.equal(await checkbox.isChecked(),false);
 assert(await button.isDisabled());
 await checkbox.check();await button.click();
 await p.waitForFunction(()=>window.calls===2);
 assert.equal(await checkbox.isChecked(),false);
 await checkbox.check();assert.equal(await button.isDisabled(),false);
 await button.click();await p.waitForFunction(()=>window.calls===3);
 await p.locator('.entry-back').click();
 await p.evaluate(()=>openWelcomeEntry({localPreview:false}));
 assert.equal(await checkbox.isChecked(),false);
 assert(await button.isDisabled());
 console.log('Browser consent, cancellation, fresh nonce and reopen PASS');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
