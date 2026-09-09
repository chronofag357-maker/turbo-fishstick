const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const width of [320,390]){
  const p=await browser.newPage({viewport:{width,height:844}}),errors=[];let api=0;
  p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.pathname.startsWith('/api/')){api++;return r.fulfill({contentType:'application/json',body:'{"events":[]}'});}if(u.hostname!=='127.0.0.1')return r.abort();const f=path.join(process.cwd(),'docs',u.pathname);if(!fs.existsSync(f))return r.fulfill({status:404,body:''});return r.fulfill({body:fs.readFileSync(f),contentType:({'.html':'text/html','.css':'text/css','.js':'text/javascript'})[path.extname(f)]||'text/plain'});});
  await p.goto('http://127.0.0.1/live-trainer/index.html');
  assert.equal(await p.locator('#scenario option').count(),10);
  await p.click('[data-start]');assert.equal(await p.locator('[data-answer]').count(),0);
  await p.waitForSelector('[data-answer]');await p.click('[data-answer="1"]');
  assert.match(await p.locator('.explanation').innerText(),/Разберём/);
  await p.click('[data-replay]');await p.waitForSelector('[data-answer]');await p.click('[data-answer="0"]');
  assert.match(await p.locator('.explanation').innerText(),/Верно/);
  await p.click('[data-tab=stats]');assert.equal(await p.locator('.history').count(),2);
  await p.reload();await p.click('[data-tab=stats]');assert.equal(await p.locator('.history').count(),2);
  await p.click('[data-tab=edit]');await p.fill('[name=a]','1.5');await p.fill('[name=b]','2.5');await p.locator('#editor button').click();
  await p.click('[data-tab=train]');assert.equal(await p.locator('#scenario option').count(),11);
  await p.selectOption('#scenario','10');await p.click('[data-start]');await p.waitForSelector('[data-answer]');await p.click('[data-answer="0"]');assert.match(await p.locator('.explanation').innerText(),/Верно/);
  assert.equal(api,0);assert.deepEqual(errors,[]);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.screenshot({path:'.tools/live-trainer-'+width+'.png'});
  await p.goto('http://127.0.0.1/mini-app.html?preview=1');await p.evaluate(()=>{document.getElementById('welcome-gate')?.remove();document.getElementById('app').inert=false;});
  await p.getByRole('button',{name:'Live тренажёр',exact:true}).click();await p.waitForURL(u=>u.pathname.endsWith('/live-trainer/index.html'));
  assert.deepEqual(errors,[]);await p.close();
 }
 console.log('PASS: trainer 320/390, correct/wrong, hidden future, editor, persistence, no API, navigation');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
