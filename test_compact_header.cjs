const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const width of [320,390,450]){
  const p=await browser.newPage({viewport:{width,height:844}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='127.0.0.1')return r.abort();if(u.pathname.startsWith('/api/'))return r.fulfill({contentType:'application/json',body:'{"events":[],"fetched_at":1}'});const f=path.join(process.cwd(),'docs',u.pathname);if(!fs.existsSync(f))return r.fulfill({status:404,body:''});return r.fulfill({body:fs.readFileSync(f),contentType:({'.html':'text/html','.css':'text/css','.js':'text/javascript'})[path.extname(f)]||'text/plain'});});
  await p.goto('http://127.0.0.1/mini-app.html?preview=1');
  await p.waitForSelector('.feed-summary');
  await p.evaluate(()=>{
   document.getElementById('welcome-gate')?.remove();document.getElementById('app').inert=false;
   FightScreen.setEvents(Array.from({length:6},(_,i)=>({id:'fixture'+i,sport:'mma',status:'prematch',title:'MMA · Учебный турнир '+(i+1),fighters:['Участник А','Участник Б'],odds:[1.8,null,2.1],date:'12 сентября',startTime:'2026-09-12T19:00:00Z',cardInfo:{title:'MMA · Учебный турнир '+(i+1),source:'https://example.com/'+i,stage:'Основной кард'},priceNote:'Сохранённая линия'})));
   document.getElementById('data-status').textContent='MMA: 50 событий / Бокс: 20 событий · получено 09.09 · следующая проверка источника завтра';
  });
  const check=await p.evaluate(()=>{const n=document.querySelector('.sports'),r=n.getBoundingClientRect();return {header:document.querySelector('.header').getBoundingClientRect().height,overflow:n.scrollWidth>n.clientWidth,page:document.documentElement.scrollWidth>innerWidth,visible:[...n.children].every(b=>{const x=b.getBoundingClientRect();return x.left>=r.left&&x.right<=r.right+.5}),count:n.children.length};});
  assert.equal(check.count,7);assert.equal(check.page,false);assert(check.header<=145,JSON.stringify(check));
  const tops=await p.locator('.sports>.sport').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().top));
  assert(Math.max(...tops)-Math.min(...tops)<1,'All five tabs must be in one row');
  const icons=await p.locator('.sports>.sport svg').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().top));
  assert(Math.max(...icons)-Math.min(...icons)<1,'Sport icons align');
  const labels=await p.locator('.sports>.sport .sport-label').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().top));
  assert(Math.max(...labels)-Math.min(...labels)<1,'Sport labels align: '+JSON.stringify(labels));
  const badge=await p.locator('.broadcast-live-badge').boundingBox(),icon=await p.locator('.broadcast-icon').boundingBox();
  assert(badge.x>=icon.x+icon.width&&Math.abs(badge.y+badge.height/2-icon.y-icon.height/2)<1,'Live count right of screen icon');
  assert.equal(await p.locator('.broadcast-live-badge').evaluate(e=>getComputedStyle(e,'::before').width),'6px');
  const nav=await p.locator('.bottom-nav').evaluate(n=>({bg:getComputedStyle(n).backgroundColor,border:getComputedStyle(n).borderTopWidth,buttons:[...n.querySelectorAll('button')].map(b=>({height:b.getBoundingClientRect().height,width:b.getBoundingClientRect().width,round:getComputedStyle(b.querySelector('svg')).borderRadius}))}));
  assert.equal(nav.bg,'rgba(0, 0, 0, 0)');assert.equal(nav.border,'0px');
  const colors=await p.locator('.bottom-nav .nav-item').evaluateAll(bs=>bs.map(b=>({text:getComputedStyle(b).color,fill:getComputedStyle(b.querySelector('svg')).fill,border:getComputedStyle(b.querySelector('svg')).borderTopColor})));
  assert(colors.every(c=>c.text==='rgb(32, 36, 63)'&&c.fill==='rgb(41, 56, 112)'&&c.border==='rgb(41, 56, 112)'));
  assert.equal(nav.buttons.length,4);assert(nav.buttons.every(b=>b.height>=44&&b.width>=44&&b.round==='50%'));
  assert.equal(await p.locator('.feed-summary').getAttribute('open'),null);
  assert.equal(await p.locator('.feed-summary>summary #refresh-data').isVisible(),true);
  assert.equal(await p.locator('.source-quick-link').isVisible(),true);
  assert.equal(await p.locator('.source-quick-link').getAttribute('href'),'https://the-odds-api.com/');
  const fixture=await p.evaluate(()=>events);
  await p.locator('#refresh-data').click();
  await p.waitForTimeout(100);
  await p.evaluate(rows=>FightScreen.setEvents(rows),fixture);
  assert.equal(await p.locator('.feed-summary').getAttribute('open'),null);
  await p.locator('.feed-summary>summary').click();assert.equal(await p.locator('#data-status').isVisible(),true);
  await p.evaluate(()=>render());assert.notEqual(await p.locator('.feed-summary').getAttribute('open'),null);
  await p.locator('.feed-summary>summary').click();assert.equal(await p.locator('#data-status').isVisible(),false);
  await p.screenshot({path:'.tools/compact-header-'+width+'.png'});
  if(process.env.HEADER_ONLY==='1'){assert.deepEqual(errors,[]);console.log('PASS navigation layout',width);await p.close();continue;}
  assert.equal(await p.locator('.tournament>summary a,.boxing-fight-sources').count(),0);
  await p.locator('.tournament>summary').first().click();
  assert.equal(await p.locator('.tournament-content .fight-event-sources a').first().isVisible(),false);
  await p.locator('.fight-inline-summary>summary').first().click();
  assert.equal(await p.locator('.tournament-content .fight-event-sources a').first().isVisible(),true);
  assert.equal(await p.locator('.tournament-content .line-source>.fight-event-sources').first().count(),1);
  await p.evaluate(()=>{FightScreen.setEvents(events.map(e=>({...e,sport:'boxing'})));FightScreen.setSport('boxing');});
  await p.locator('.boxing-fight-header').first().click();
  assert.equal(await p.locator('#fight-live-details .fight-event-sources a').first().isVisible(),true);
  assert.equal(await p.locator('#fight-live-details .fight-event-sources a').first().getAttribute('href'),'https://example.com/0');
  assert.deepEqual(errors,[]);console.log(width,check);await p.close();
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
