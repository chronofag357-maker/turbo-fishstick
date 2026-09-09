const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  for(const width of [390,320]){
   const page=await browser.newPage({viewport:{width,height:840}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   let requests=0;
   await page.route('**/*',r=>{
    const u=new URL(r.request().url());
    if(u.hostname!=='127.0.0.1')return r.abort();
    if(u.pathname==='/api/esports'){
     requests++;
     return r.fulfill({contentType:'application/json',body:JSON.stringify({fetched_at:Date.now()/1000,events:[{id:'es-test',game:'Counter Strike',tournament:'Тестовый турнир с длинным названием',teams:['<Team A>','Team B'],status:'notstarted',start:Date.now()+86400000,active:true,updated:Date.now(),score:[null,null],markets:[{key:'result',name:'Исход',stakes:[{key:'w1',label:'П1',price:1.25},{key:'w2',label:'П2',price:3.5}]},{key:'total',name:'Тотал',stakes:[{key:'over',label:'Больше',argument:2.5,price:1.9}]}]}]})});
    }
    if(u.pathname.startsWith('/api/'))return r.fulfill({contentType:'application/json',body:'{"events":[]}'});
    const file=path.join(process.cwd(),'docs',u.pathname);
    if(!fs.existsSync(file)||!fs.statSync(file).isFile())return r.fulfill({status:404,body:''});
    return r.fulfill({body:fs.readFileSync(file),contentType:({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream'});
   });
   await page.goto('http://127.0.0.1/mini-app.html?preview=1');
   await page.evaluate(()=>{document.getElementById('welcome-gate')?.remove();document.getElementById('app').inert=false;});
   await page.click('[data-sport=esports]');
   await page.locator('.es-price').first().waitFor();
   const iconStroke=()=>page.locator('[data-sport=esports] svg').evaluate(e=>getComputedStyle(e).stroke);
   assert.equal(await iconStroke(),'rgb(160, 77, 165)');
   assert.equal(await page.locator('[data-sport=esports] .sport-label').evaluate(e=>getComputedStyle(e).textDecorationLine),'none');
   assert.equal(await page.locator('.es-price strong').first().innerText(),'1.25');
   assert.equal(await page.locator('.es-teams strong').first().innerText(),'<Team A>');
   assert.deepEqual(await page.locator('.es-teams strong').first().evaluate(e=>({color:getComputedStyle(e).color,weight:getComputedStyle(e).fontWeight})),{color:'rgb(32, 36, 63)',weight:'700'});
   assert.equal(await page.locator('#events').isHidden(),true);
   assert.equal(await page.locator('.es-markets button').count(),4);
   await page.getByRole('button',{name:'В ОЖИДАНИИ ЛИНИИ',exact:true}).click();
   assert.equal(await page.locator('.es-card').count(),0);
   await page.click('[data-es-kind=total]');
   assert.deepEqual(await page.locator('[data-es-kind=total]').evaluate(e=>({bg:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color})),{bg:'rgb(41, 56, 112)',color:'rgb(255, 255, 255)'});
   assert.equal(await page.locator('.es-price small').first().innerText(),'Больше 2.5');
   await page.click('[data-es-expand]');assert.equal(await page.locator('.es-details').count(),1);
   await page.click('[data-sport=boxing]');assert.equal(await page.locator('#esports-events').isHidden(),true);
   assert.equal(await iconStroke(),'rgb(119, 123, 146)');
   assert.equal(await page.locator('.markets').isVisible(),true);
   await page.click('[data-sport=esports]');assert.equal(requests,1);
   assert.equal(await iconStroke(),'rgb(160, 77, 165)');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert.deepEqual(errors,[]);
   await page.screenshot({path:'.tools/esports-'+width+'.png'});
   let ready=false;
   await page.route('**/api/esports?refresh=1',r=>r.fulfill({contentType:'application/json',body:JSON.stringify({fetched_at:Date.now()/1000,events:[{id:'waiting',game:'Counter Strike',tournament:'Ожидающий матч',teams:['New A','New B'],status:'notstarted',start:Date.now()+86400000,active:true,updated:Date.now(),score:[null,null],markets:ready?[{key:'result',name:'Исход',stakes:[{label:'П1',price:2.1}]}]:[]}]})}));
   await page.click('[data-es-refresh]');
   await page.click('[data-es-kind=unlined]');
   await page.getByText('New A',{exact:true}).waitFor();
   assert.equal(await page.locator('.es-card').count(),1);
   ready=true;await page.click('[data-es-refresh]');
   await page.waitForFunction(()=>!document.querySelector('.es-card'));
   await page.click('[data-es-kind=result]');
   assert.equal(await page.locator('.es-price strong').innerText(),'2.10');
   const rows=await page.locator('.es-markets button').evaluateAll(bs=>bs.map(b=>b.getBoundingClientRect().top));
   assert(Math.max(...rows)-Math.min(...rows)<1);
   await page.close();
  }
  console.log('Esports UI: 390/320, filters, prices, escape, navigation, cache PASS');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
