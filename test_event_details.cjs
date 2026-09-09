const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH);
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{for(const width of [320,390]){
  const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const match={id:'apisport-1',game:'LoL',tournament:'NA Challengers League',teams:['NRG','Maryville University'],status:'inprogress',start:Date.now(),active:true,score:[1,0],details:{bestOf:5,games:[{number:1,status:'finished',winner:1,score:[17,14],statistics:{kills:[17,14],goldEarned:[72000,64000]}},{number:2,status:'inprogress',score:[0,null],statistics:{}}]},markets:[{key:'result',name:'Исход',stakes:[{key:'w1',label:'П1',price:1.4},{key:'w2',label:'П2',price:2.7}]}]};
  await page.route('**/*',r=>{
   const u=new URL(r.request().url());if(u.hostname!=='127.0.0.1')return r.abort();
   if(u.pathname==='/api/esports')return r.fulfill({json:{events:[match],fetched_at:Date.now()/1000}});
   if(u.pathname.startsWith('/api/'))return r.fulfill({json:{events:[]}});
   const f=path.join(process.cwd(),'docs',u.pathname);if(!fs.existsSync(f))return r.fulfill({status:404,body:''});
   return r.fulfill({body:fs.readFileSync(f),contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(f)]||'text/plain'});
  });
  await page.goto('http://127.0.0.1/mini-app.html?preview=1&view=esports');
  await page.evaluate(()=>{freebkDemoSignedIn=true;freebkDemoPartner='Test';window.dispatchEvent(new Event('freebk-account-change'));mode='live';render();});
  await page.locator('.es-team-open').click();
  assert.equal(await page.locator('.ed-score').allTextContents().then(a=>a.join(':')),'1:0');
  await page.click('[data-ed-tab="1"]');assert((await page.locator('#event-detail').innerText()).includes('72000'));
  assert((await page.locator('#event-detail').innerText()).includes('17 : 14'));
  await page.click('[data-ed-tab="2"]');assert((await page.locator('#event-detail').innerText()).includes('0 : —'));
  await page.click('[data-ed-tab="match"]');await page.locator('#event-detail .es-price').first().click();
  assert.equal(await page.locator('.coupon-item').count(),1);
  await page.locator('.coupon-handle').click();
  await page.screenshot({path:'.tools/detail-esports-'+width+'.png'});
  assert.equal(await page.locator('#event-detail').evaluate(e=>e.scrollWidth>e.clientWidth),false);
  await page.keyboard.press('Escape');assert(await page.locator('#event-detail').isHidden());
  await page.evaluate(()=>{
   events.push({id:'detail-boxing',sport:'boxing',fighters:['Райан Гарсия','Конор Бенн'],title:'Титульный бой · Полусредний вес · 12 раундов',date:'13 сентября 04:30',status:'prematch',odds:[1.4,17,3.25],totals:{line:10.5,over:1.78,under:1.98},priceNote:'Сохранённая линия',sourceNote:'Test'});
   openFight('detail-boxing');
  });
  assert.equal(await page.locator('#event-detail [data-odd]').count(),5);
  await page.screenshot({path:'.tools/detail-boxing-'+width+'.png'});
  await page.evaluate(()=>{events.find(e=>e.id==='detail-boxing').odds[0]=1.5;EventDetail.update();});
  assert.equal(await page.locator('#event-detail [data-odd] strong').first().innerText(),'1.50');
  assert.equal(await page.locator('#event-detail').evaluate(e=>e.scrollWidth>e.clientWidth),false);
  await page.click('.ed-back');assert(await page.locator('#welcome-gate').isHidden());
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS event details 320/390: series, maps, missing data, coupon, back, updated prices');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
