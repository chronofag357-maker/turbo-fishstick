const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
 try{for(const width of [320,390]){
  const page=await browser.newPage({viewport:{width,height:844}});let calls=0;
  await page.route('https://www.trillertv.com/**',r=>r.fulfill({body:'video fixture'}));
  await page.route('https://meet.jit.si/**',r=>{calls++;return r.fulfill({body:'Jitsi fixture'});});
  await page.goto('http://127.0.0.1:8081/broadcasts.html?v=123');
  await page.locator('#stream-tab').click();assert.equal(calls,0);
  await page.locator('#self-camera').click();
  await page.waitForFunction(()=>document.querySelector('#self-camera').getAttribute('aria-pressed')==='true');
  assert(await page.locator('#self-video').isVisible());assert.equal(calls,0);
  assert.equal(await page.evaluate(()=>document.querySelector('#self-video').srcObject.getAudioTracks().length),0);
  await page.evaluate(()=>window.testTrack=document.querySelector('#self-video').srcObject.getVideoTracks()[0]);
  await page.locator('#tv-tab').click();
  assert.equal(await page.evaluate(()=>window.testTrack.readyState),'ended');
  await page.locator('#stream-tab').click();
  const url=await page.locator('#stream-room').inputValue();
  assert.match(url,/^https:\/\/meet\.jit\.si\/P2PMarket-[a-f0-9]{32}$/);
  await page.locator('#stream-room').fill('https://evil.example/roomname123');
  await page.locator('#stream-join').click();assert.equal(calls,0);
  await page.locator('#stream-room').fill(url);await page.locator('#stream-join').click();
  await page.waitForFunction(()=>!!document.querySelector('#stream-meeting iframe'));
  const meetingSrc=await page.locator('#stream-meeting iframe').getAttribute('src');
  assert.match(meetingSrc,/startWithAudioMuted=false/);
  assert.match(meetingSrc,/config.deeplinking.disabled=true/);
  assert.match(meetingSrc,/config.tileView.numberOfVisibleTiles=3/);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#stream-leave').click();
  assert.equal(await page.locator('#stream-meeting iframe').count(),0);
  await page.screenshot({path:'.tools/stream-ready-'+width+'.png'});
  await page.reload();await page.locator('#stream-tab').click();
  assert.equal(await page.locator('#stream-room').inputValue(),url);
  await page.close();
 }console.log('PASS: 320/390 camera preview, no audio, tracks released, Jitsi consent, URL validation, leave');}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
