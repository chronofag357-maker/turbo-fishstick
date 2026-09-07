const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{for(const width of [320,390]){
  const page=await browser.newPage({viewport:{width,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://www.trillertv.com/**',r=>r.fulfill({contentType:'text/html',body:'<body style="background:black;color:white">▶</body>'}));
  await page.goto('http://127.0.0.1:8081/broadcasts.html?v=122');
  assert.equal(await page.locator('#watch-sheet,#watch').count(),0);
  assert.equal((await page.locator('#player').boundingBox()).width,180);
  await page.locator('#expand').click();
  assert.equal((await page.locator('#player-shell').boundingBox()).width,width);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#expand').getAttribute('aria-expanded'),'false');
  await page.locator('#stream-tab').click();
  assert.equal(await page.locator('.stream-slot:visible').count(),3);
  assert.equal(await page.locator('#player iframe').count(),0);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'.tools/broadcast-stream-'+width+'.png'});
  await page.locator('#tv-tab').click();
  assert.equal(await page.locator('#player iframe').count(),1);
  await page.screenshot({path:'.tools/broadcast-tv-'+width+'.png'});
  assert.deepEqual(errors,[]);await page.close();
 }console.log('Broadcast UI passed: 320/390, tabs, compact player, expand, cleanup');}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
