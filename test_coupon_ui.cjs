// Run against the local preview, using Playwright from NODE_PATH or the local runtime.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  p.setDefaultTimeout(7000);const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:8081/mini-app.html?v=107',{waitUntil:'domcontentloaded',timeout:30000});await p.waitForTimeout(2200);
  const seed=()=>p.evaluate(()=>{
   window.couponFixtures=[1,2,3].map(i=>({id:'test'+i,title:'Тестовый турнир '+i,sport:'mma',status:'prematch',fighters:['Боец '+i,'Соперник '+i],odds:[i===1?2:3,null,1.5],startTime:'2099-12-01T10:00:00Z',date:'1 декабря',priceKey:'testbook',priceNote:'Тестовая линия',totals:null}));
   FightScreen.setEvents(couponFixtures);FightScreen.setSport('mma');
  });
  await seed();
  async function login(first,last){
   await p.locator('[data-action="menu"]').click();
   await p.locator('[data-demo-partner]').fill(first);await p.locator('[data-demo-surname]').fill(last);
   await p.locator('[data-menu-demo="telegram"]').click();await p.locator('.menu-handle').click();await p.waitForTimeout(450);
  }
  await login('Марсель','Ла');
  await p.getByRole('button',{name:'Раскрыть все',exact:true}).click();
  await p.locator('[data-odd="test1"][data-index="0"]').click();
  assert.equal(await p.locator('.coupon-notice').textContent(),'1 000 – 10 000');
  assert(await p.locator('[data-payout]').isHidden());
  await p.waitForTimeout(550);await p.screenshot({path:'.tools/coupon-empty.png'});
  await p.locator('[data-coupon-confirm]').click();
  assert.match(await p.locator('[data-coupon-confirm]').textContent(),/✓/);
  await p.waitForTimeout(800);assert.equal(await p.locator('.coupon-body').count(),0);
  assert.match(await p.locator('.coupon-brand').textContent(),/P2P Market/);
  await p.screenshot({path:'.tools/coupon-floating.png'});
  assert.equal(await p.evaluate(()=>DemoWallet.balance('Марсель Ла')),456000);
  await p.locator('.coupon-handle').click();
  for(const width of [390,320]){
   await p.setViewportSize({width,height:844});await p.waitForTimeout(550);
   for(const value of ['', '1000']){
    await p.locator('[data-coupon-stake]').fill(value);
    for(const fraction of [.03,.5,.97]){
     await p.locator('[data-coupon-stake]').evaluate(e=>e.blur());
     const area=await p.locator('.coupon-amount').boundingBox();
     await p.touchscreen.tap(area.x+area.width*fraction,area.y+area.height/2);
     await p.waitForTimeout(100);
     assert(await p.locator('[data-coupon-stake]').evaluate(e=>document.activeElement===e),`tap ${width} ${value} ${fraction}`);
     await p.locator('[data-coupon-stake]').evaluate(e=>e.blur());
     await p.mouse.click(area.x+area.width*fraction,area.y+area.height/2);
     assert(await p.locator('[data-coupon-stake]').evaluate(e=>document.activeElement===e));
    }
   }
  }
  await p.setViewportSize({width:390,height:844});
  for(const value of ['999','10001']){await p.locator('[data-coupon-stake]').fill(value);assert(await p.locator('[data-coupon-place]').isDisabled());}
  assert.equal(await p.locator('[data-coupon-min],[data-coupon-max],.coupon-config,.coupon-settings-icon').count(),0);
  assert(await p.locator('.coupon-wallet-row').evaluate(e=>e.scrollWidth<=e.clientWidth));
  await p.locator('[data-coupon-stake]').fill('10000');assert(await p.locator('[data-coupon-place]').isEnabled());
  await p.locator('[data-coupon-stake]').fill('1000');assert.equal(await p.locator('[data-payout]').textContent(),'2 000');
  await p.locator('.coupon-handle').click();await p.locator('[data-odd="test2"][data-index="0"]').click();await p.locator('.coupon-handle').click();
  assert.equal(await p.locator('[data-payout]').textContent(),'6 000');
  assert.equal(await p.locator('.coupon-type button').first().getAttribute('aria-pressed'),'true');
  await p.locator('[data-coupon-remove="test2"]').click();
  assert.equal(await p.locator('.coupon-type button').first().getAttribute('aria-pressed'),'false');
  assert.equal(await p.locator('.coupon-type .active').count(),0);
  await p.locator('.coupon-handle').click();await p.locator('[data-odd="test2"][data-index="0"]').click();await p.locator('.coupon-handle').click();
  assert.equal(await p.locator('.coupon-type .active').textContent(),'Экспресс');
  assert.equal(await p.locator('[data-coupon-confirm]').count(),0);
  await p.locator('[data-coupon-stake]').fill('-1');assert(await p.locator('[data-coupon-place]').isDisabled());
  await p.locator('[data-coupon-stake]').fill('1.001');assert(await p.locator('[data-coupon-place]').isDisabled());
  await p.locator('[data-coupon-stake]').fill('500000');assert(await p.locator('[data-coupon-place]').isDisabled());
  await p.locator('[data-coupon-stake]').fill('1000');
  await p.evaluate(()=>{couponFixtures[0].odds[0]=2.5;FightScreen.setEvents(couponFixtures)});
  assert(await p.locator('[data-coupon-place]').isDisabled());assert.equal(await p.locator('.coupon-item').count(),2);
  await p.locator('[data-coupon-accept]').click();assert.equal(await p.locator('[data-payout]').textContent(),'7 500');
  await p.locator('[data-coupon-stake]').fill('1000');assert.equal((await p.locator('[data-payout]').textContent()).replace(/\s/g,''),'7500');
  await p.locator('[data-coupon-stake]').fill('1000');
  await p.waitForTimeout(400);await p.screenshot({path:'.tools/coupon-working.png'});
  await p.locator('[data-coupon-place]').click();
  assert.match(await p.locator('#coupon-receipt').textContent(),/Купон принят/);
  await p.waitForTimeout(550);
  const downloadEvent=p.waitForEvent('download');await p.locator('[data-receipt-download]').click();
  const startSwitch=p.getByRole('switch',{name:'На начало события'}),resultSwitch=p.getByRole('switch',{name:'На результат пари'});
  await startSwitch.check();assert(await startSwitch.isChecked());assert(await p.locator('#coupon-receipt').isVisible());
  await resultSwitch.focus();await p.keyboard.press('Space');assert(await resultSwitch.isChecked());
  await p.evaluate(()=>{const b=JSON.parse(localStorage.getItem('freebk-demo-wallet-v1'))['Марсель Ла'].bets[0];showDemoReceipt(b)});
  assert(await startSwitch.isChecked());assert(await resultSwitch.isChecked());
  await startSwitch.uncheck();assert(!(await startSwitch.isChecked()));assert(await p.locator('#coupon-receipt').isVisible());
  const download=await downloadEvent;assert.match(download.suggestedFilename(),/\.svg$/);assert(await p.locator('#coupon-receipt').isVisible());
  assert.match(require('node:fs').readFileSync(await download.path(),'utf8'),/7\s500/);
  await p.evaluate(()=>{navigator.share=async data=>{window.sharedReceipt=data}});
  await p.locator('[data-receipt-share]').click();assert.match(await p.evaluate(()=>sharedReceipt.text),/Коэффициент: 7.50/);
  assert.match(await p.locator('[data-receipt-email]').getAttribute('href'),/^mailto:/);
  await p.waitForTimeout(3100);assert(await p.locator('#coupon-receipt').isVisible());
  await p.screenshot({path:'.tools/coupon-receipt.png'});
  await p.locator('.receipt-heading span').click();assert(await p.locator('#coupon-receipt').isHidden());
  await p.locator('[data-action="bets"]').click();
  assert.equal(await p.locator('.bet-record').evaluate(e=>e.open),false);
  await p.locator('.bet-record summary').click();assert.equal(await p.locator('.bet-record').evaluate(e=>e.open),true);
  const historyDownload=p.waitForEvent('download');await p.locator('.bet-record [data-receipt-download]').click();await historyDownload;
  assert.equal(await p.locator('.bet-record').evaluate(e=>e.open),true);
  await p.screenshot({path:'.tools/history-card-expanded.png'});
  await p.locator('.bet-record summary').click();assert.equal(await p.locator('.bet-record').evaluate(e=>e.open),false);
  let ledger=await p.evaluate(()=>JSON.parse(localStorage.getItem('freebk-demo-wallet-v1'))['Марсель Ла']);
  assert.equal(ledger.balance,455000);assert.equal(ledger.bets.length,1);assert.equal(ledger.bets[0].payout,7500);
  await p.screenshot({path:'.tools/coupon-history.png'});
  await p.locator('.bet-favourite').click();
  await p.locator('[data-history-tab="favourites"]').click();assert.equal(await p.locator('.bet-record').count(),1);
  await p.locator('.bet-favourite').click();assert.equal(await p.locator('.bet-record').count(),0);
  await p.locator('[data-history-tab="history"]').click();
  await p.locator('.bottom-nav [data-action="top"]').click();assert(await p.locator('#bet-history-screen').isHidden());await p.locator('[data-action="profile"]').click();
  assert.equal((await p.locator('.menu-balance strong').textContent()).replace(/\s/g,''),'455000');
  await p.locator('.menu-logout').click();await p.locator('[data-demo-partner]').fill('Владимир');await p.locator('[data-demo-surname]').fill('Елков');await p.locator('[data-menu-demo="telegram"]').click();
  assert.equal((await p.locator('.menu-balance strong').textContent()).replace(/\s/g,''),'456000');
  await p.reload({waitUntil:'domcontentloaded'});await p.waitForTimeout(1600);await login('Марсель','Ла');await p.locator('[data-action="bets"]').click();assert.equal(await p.locator('.bet-record').count(),1);
  await p.locator('.bottom-nav [data-action="top"]').click();await seed();
  if(await p.getByRole('button',{name:'Раскрыть все',exact:true}).count())await p.getByRole('button',{name:'Раскрыть все',exact:true}).click();
  await p.locator('[data-odd="test1"][data-index="0"]').click();
  await p.waitForTimeout(550);
  const handle=await p.locator('.coupon-handle').boundingBox();await p.mouse.move(handle.x+50,handle.y+20);await p.mouse.down();await p.mouse.move(handle.x+50,handle.y+130,{steps:10});await p.mouse.up();await p.waitForTimeout(450);assert.equal(await p.locator('.coupon-body').count(),0);
  await p.locator('.coupon-handle').click();await p.locator('[data-coupon-remove]').click();assert(await p.locator('#bet-coupon').isHidden());
  await p.setViewportSize({width:320,height:640});await p.locator('[data-odd="test1"][data-index="0"]').click();
  assert(await p.locator('#bet-coupon').evaluate(e=>e.scrollWidth<=e.clientWidth));
  await p.evaluate(()=>openFight('test1'));
  await p.locator('#panel').evaluate(e=>e.close());
  for(const direction of [-1,1,0]){
   await p.locator('.coupon-handle').click();await p.waitForTimeout(450);
   if(direction===0)await p.locator('[data-coupon-dismiss]').click();
   else{
    const area=await p.locator('.coupon-handle').boundingBox();const x=area.x+area.width/2,y=area.y+25;
    await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+direction*110,y,{steps:8});await p.mouse.up();
   }
   assert(await p.locator('#bet-coupon').isHidden());
   await p.waitForTimeout(450);await p.locator('#events [data-odd="test1"][data-index="0"]').click();await p.waitForTimeout(450);
  }
  await p.evaluate(()=>openFight('test1'));
  await p.locator('#fight-live-details [data-odd="test1"][data-index="2"]').click();
  assert.equal(await p.locator('.coupon-item').count(),1);assert.equal(await p.locator('#panel').evaluate(e=>e.open),false);
  assert.match(await p.locator('.coupon-item strong').textContent(),/1.50/);
  await p.evaluate(()=>{couponFixtures[0].unavailable=true;FightScreen.setEvents(couponFixtures)});assert(await p.locator('[data-coupon-place]').isDisabled());
  await p.evaluate(()=>{const d=JSON.parse(localStorage.getItem('freebk-demo-wallet-v1'));const first=d['Марсель Ла'].bets[0];d['Марсель Ла'].bets=Array.from({length:10},(_,i)=>({...first,id:'many'+i}));localStorage.setItem('freebk-demo-wallet-v1',JSON.stringify(d))});
  await p.locator('[data-action="bets"]').click();assert.equal(await p.locator('.bet-record').count(),10);
  assert(await p.locator('#bet-history-screen').evaluate(e=>e.scrollHeight>e.clientHeight&&e.scrollWidth<=e.clientWidth));
  await p.locator('[data-history-settings]').click();await p.locator('.history-filters select').selectOption('won');assert.equal(await p.locator('.bet-record').count(),0);
  assert.deepEqual(errors,[]);console.log('PASS: coupon math, acceptance, history screen, favourite add/remove, status filter, ten-card scroll, account isolation, reload, swipe, 320px');
  await p.evaluate(()=>{const b=JSON.parse(localStorage.getItem('freebk-demo-wallet-v1'))['Марсель Ла'].bets[0];BetHistory.show('Марсель Ла',{balance:455000,bets:[{...b,id:'pending'},{...b,id:'sale',cashoutOffer:780},{...b,id:'win',status:'won',settledPayout:7500},{...b,id:'loss',status:'lost'}]})});
  for(const [stage,count] of [['all',4],['pending',2],['sale',1],['settled',2]]){
   await p.locator(`[data-history-stage="${stage}"]`).click();assert.equal(await p.locator('.bet-record').count(),count);
   assert.equal(await p.locator(`[data-history-stage="${stage}"]`).getAttribute('aria-selected'),'true');
  }
  await p.locator('[data-history-stage="sale"]').click();await p.locator('.history-sale').click();assert.match(await p.locator('.history-message').textContent(),/не подключена/);
  await p.locator('[data-history-stage="all"]').click();
  assert(await p.locator('#bet-history-screen').evaluate(e=>e.scrollWidth<=e.clientWidth));
  await p.screenshot({path:'.tools/history-stages.png'});
  console.log('PASS: All/In play/For sale/Settled filters, sale remains unavailable, 320px');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
