const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const width of [320,390]){
   const page=await browser.newPage({viewport:{width,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('https://telegram.org/**',r=>r.abort());
   await page.addInitScript(()=>{window.Telegram={WebApp:{initData:'test-fixture',ready(){},expand(){}}}});
   const account={id:1,name:'Администратор',balance:455000,admin:true,bets:[],transactions:[],stats:{placed:1000,inPlay:1000,paid:0,profit:0,won:0,lost:0}};
   await page.route('**/api/private/**',async route=>{
    const url=route.request().url();let body={ok:true};
    if(url.endsWith('/login'))body={token:'fixture-only'};
    if(url.endsWith('/me'))body=account;
    if(url.endsWith('/admin/report'))body={accounts:[account],policy:{enabled:false,seconds:86400},actions:[]};
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
   });
   await page.goto('http://127.0.0.1:8081/mini-app.html?v=120',{waitUntil:'domcontentloaded'});
   await page.waitForTimeout(1200);
   await page.locator('[data-action=menu]').click();
   await page.locator('[data-server-consent]').check();
   await page.locator('[data-server-login]').click();
   await page.locator('[data-server-admin]').click();
   await page.locator('[data-policy-seconds]').fill('40');
   await page.locator('[data-policy-save]').click();
   await page.waitForTimeout(100);
   assert.match(await page.locator('.admin-status').innerText(),/сохранена/);
   assert(await page.locator('#server-admin').evaluate(e=>e.scrollWidth<=e.clientWidth));
   await page.screenshot({path:'.tools/server-admin-'+width+'.png'});
   await page.locator('[data-admin-close]').click();
   assert.equal(errors.length,0,errors.join('\n'));
   await page.close();
  }
  console.log('PASS: server login, owner dashboard, policy save, 320/390px');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
