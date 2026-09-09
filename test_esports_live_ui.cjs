const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH);
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{for(const width of [320,390]){
  const p=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'}),errors=[];
  let polls=0,stops=0,rest=0,phase=0;
  const event=(id,price)=>({id:'apisport-'+id,game:'CS2',tournament:'Турнир '+id,teams:['Team A'+id,'Team B'+id],status:'notstarted',start:Date.now()+86400000,active:true,live_confirmed:true,updated:Date.now(),score:[null,null],markets:[{key:'result',name:'Исход',stakes:[{key:'w1',label:'П1',price},{key:'w2',label:'П2',price:3}]}]});
  const payload=()=>({fetched_at:Date.now()/1000,events:[event(1,phase?2.2:2),event(2,phase?1.8:2)],live:'connected',live_messages:phase,last_live_message:Date.now()/1000});
  p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/*',r=>{
   const u=new URL(r.request().url());if(u.hostname!=='127.0.0.1')return r.abort();
   if(u.pathname==='/api/esports-live'){const stop=r.request().postDataJSON().stop;if(stop)stops++;else {polls++;phase=1;}return r.fulfill({json:payload()});}
   if(u.pathname==='/api/esports'){rest++;return r.fulfill({json:payload()});}
   if(u.pathname.startsWith('/api/'))return r.fulfill({json:{events:[]}});
   const f=path.join(process.cwd(),'docs',u.pathname);if(!fs.existsSync(f))return r.fulfill({status:404,body:''});
   return r.fulfill({body:fs.readFileSync(f),contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(f)]||'text/plain'});
  });
  await p.goto('http://127.0.0.1/mini-app.html?preview=1&view=esports');
  await p.evaluate(()=>{freebkDemoSignedIn=true;freebkDemoPartner='Test';window.dispatchEvent(new Event('freebk-account-change'));});
  await p.locator('.es-price').first().waitFor();assert.equal(polls,0);
  await p.locator('.es-price').nth(0).click();
  await p.locator('.coupon-handle').click();
  await p.locator('.es-price').nth(2).click();
  await p.locator('.coupon-handle').click();
  assert.equal(await p.locator('.coupon-item').count(),2);
  assert.equal(await p.locator('.coupon-total').innerText(),'4.00');
  await p.locator('.coupon-handle').click();
  const before=await p.locator('.es-price').first().boundingBox();
  await p.click('[data-es-refresh]');
  await p.waitForSelector('.es-up');await p.waitForSelector('.es-down');
  const after=await p.locator('.es-price').first().boundingBox();assert.equal(before.width,after.width);assert.equal(before.height,after.height);
  assert.equal(await p.locator('.es-price strong').first().innerText(),'2.20');
  await p.locator('.coupon-handle').click();
  await p.locator('[data-coupon-accept]').click();
  assert.equal(await p.locator('.coupon-total').innerText(),'3.96');
  await p.locator('.coupon-handle').click();
  await p.waitForTimeout(2200);assert(polls>=2);assert.equal(rest,2);
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  const stoppedPolls=polls;await p.waitForTimeout(2400);assert.equal(polls,stoppedPolls);assert(stops>0);
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  await p.waitForTimeout(500);assert(polls>stoppedPolls);
  await p.click('[data-es-refresh]');const finalPolls=polls;await p.waitForTimeout(2400);assert.equal(polls,finalPolls);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await p.screenshot({path:'.tools/esports-live-'+width+'.png'});
  assert.deepEqual(errors,[]);await p.close();
 }
 console.log('PASS esports 320/390: express, real price deltas, accept, start/stop, hide/resume, no REST polling');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
