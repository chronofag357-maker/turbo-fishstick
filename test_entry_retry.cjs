const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:740}});
  await page.setContent('<button class="welcome-login">Войти</button>');
  await page.evaluate(()=>{
   window.Telegram={WebApp:{initData:'fixture'}};
   window.attempts=0;
   window.ServerAccount={loginFromTelegram:async()=>{if(++window.attempts===1)throw new Error('Тест: сервер недоступен');}};
  });
  await page.addScriptTag({path:'docs/welcome-entry.js'});
  await page.evaluate(()=>openWelcomeEntry({localPreview:false}));
  await page.locator('[data-server-consent]').check();
  await page.locator('.entry-primary').click();
  const target=await page.locator('.entry-target').evaluate(t=>Math.round(parseFloat(getComputedStyle(t).right)/(t.parentElement.clientWidth-64)*100));
  for(let i=0;i<target;i++)await page.locator('.entry-handle').press('ArrowLeft');
  await page.locator('.entry-handle').press('Enter');
  await page.locator('.entry-primary').click();
  assert.match(await page.locator('.menu-demo-message').innerText(),/сервер недоступен/);
  assert.equal(await page.locator('.entry-primary').isEnabled(),true);
  await page.locator('.entry-primary').click();
  assert.equal(await page.locator('#welcome-entry').isVisible(),false);
  assert.equal(await page.evaluate(()=>attempts),2);
  console.log('PASS visible Telegram login failure and successful retry');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
