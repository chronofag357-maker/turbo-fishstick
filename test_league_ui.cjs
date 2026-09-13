const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{for(const width of [320,390]){
  const page=await browser.newPage({viewport:{width,height:740}}),errors=[];let accepted=null;
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{sessionStorage.setItem('p2p-session','fixture');window.Telegram={WebApp:{initData:'fixture',ready(){},expand(){}}}});
  const tournament={id:'t',title:'Проверочный турнир',fixture:true,source:'https://example.com',closed:false,results:{},events:Array.from({length:5},(_,i)=>({id:String(i),title:'Проверочная пара '+i,start:Date.now()/1000+3600,outcomes:[{name:'A',odds:2},{name:'B',odds:2}]})),members:[{name:'Владелец',mine:true,balance:10000,pending:0,coupons:[],rank:1,count:0}]};
  await page.route('**/*',async r=>{
   const u=new URL(r.request().url());
   if(u.pathname==='/api/private/me')return r.fulfill({json:{id:1,name:'Владелец',admin:true,balance:456000,bets:[],stats:{},transactions:[]}});
   if(u.pathname==='/api/private/league')return r.fulfill({json:{tournaments:[tournament]}});
   if(u.pathname==='/api/private/league/place'){accepted=r.request().postDataJSON();return r.fulfill({json:{ok:true}})}
   if(u.hostname!=='127.0.0.1'||u.pathname.startsWith('/api/'))return r.fulfill({status:503,body:'{}'});
   return r.continue();
  });
  await page.goto('http://127.0.0.1:8084/mini-app.html?preview=1',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.PredictionLeague&&window.ServerAccount?.current);
  await page.evaluate(()=>PredictionLeague.open());
  await page.locator('[data-tournament]').click();
  await page.locator('[data-event="0"]').selectOption('A');
  await page.locator('[name=stake]').fill('2000');
  await page.locator('[data-coupon] button').click();
  await page.waitForTimeout(200);
  assert.equal(accepted.stake,200000);assert.equal(accepted.picks.length,1);
  assert(await page.locator('#prediction-league').evaluate(e=>e.scrollWidth<=e.clientWidth));
  await page.screenshot({path:'.tools/league-'+width+'.png'});
  await page.locator('[data-tab=practice]').click();
  await page.locator('[data-tab=favorites]').click();
  await page.keyboard.press('Escape');
  await page.evaluate(()=>panel('Меню',freebkMenuContent()));
  assert.equal(await page.locator('[data-league-open]').count(),1);
  await page.screenshot({path:'.tools/league-menu-'+width+'.png'});
  assert.deepEqual(errors,[]);await page.close();
 }}finally{await browser.close()}
 console.log('PASS integrated league: 320/390, coupon submission, tabs, menu, no JS errors');
})().catch(e=>{console.error(e);process.exit(1)});
