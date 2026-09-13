const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{for(const width of [320,390]){
  const page=await browser.newPage({viewport:{width,height:568}});
  await page.setContent('<div id="panel-body"></div>');
  await page.evaluate(()=>{
   window.freebkMenuContent=()=>'<div class="account-menu"><div class="menu-balance"><strong>0</strong></div></div>';
   window.ServerAccount={enabled:true,current:{admin:true},api:async()=>{},refresh:async()=>{}};
  });
  await page.addScriptTag({path:'docs/training-membership.js'});
  await page.evaluate(()=>document.querySelector('#panel-body').innerHTML=freebkMenuContent());
  await page.locator('[data-training-open]').click();
  assert(await page.locator('#training-membership').evaluate(e=>e.scrollWidth<=e.clientWidth));
  await page.screenshot({path:'.tools/training-'+width+'.png'});
  await page.locator('[data-training-refill]').click();
  assert.match(await page.locator('[data-training-status]').innerText(),/Начислено/);
  await page.keyboard.press('Escape');
  await page.evaluate(()=>{ServerAccount.current.admin=false;document.querySelector('#panel-body').innerHTML=freebkMenuContent()});
  assert.equal(await page.locator('[data-training-open]').count(),0);
  await page.close();
 }}finally{await browser.close()}
 console.log('PASS training panel 320/390, refill feedback, non-admin hidden');
})();
