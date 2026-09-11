const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
for(const [width,height] of [[320,568],[390,650],[390,844]]){
const p=await browser.newPage({viewport:{width,height}});
await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='127.0.0.1')return r.abort();if(u.pathname.startsWith('/api/'))return r.fulfill({json:{events:[]}});const f=path.join(process.cwd(),'docs',u.pathname);return fs.existsSync(f)&&fs.statSync(f).isFile()?r.fulfill({body:fs.readFileSync(f),contentType:({'.html':'text/html','.css':'text/css','.js':'text/javascript'})[path.extname(f)]||'text/plain'}):r.fulfill({status:404,body:''});});
await p.goto('http://127.0.0.1/mini-app.html?preview=1');
await p.evaluate(()=>{document.getElementById('welcome-gate').remove();document.getElementById('app').inert=false;freebkDemoSignedIn=true;freebkDemoPartner='Марсель Ла';});
await p.locator('[data-action=menu]').click();
await p.evaluate(()=>{const menu=document.querySelector('.account-menu');menu.querySelector('.menu-balance').insertAdjacentHTML('afterend','<div class="server-stats"><span>В игре <b>100 000</b></span><span>Поставлено <b>100 000</b></span><span>Выплачено <b>9 455,20</b></span><span>Плюс / минус <b>−20 000</b></span></div><button data-server-ledger>История операций</button>');menu.querySelector('.menu-links').insertAdjacentHTML('beforeend','<button data-server-admin>Панель администратора ›</button>');});
await p.waitForTimeout(750);
const geometry=await p.locator('#panel-body').evaluate(e=>({h:e.clientHeight,scroll:e.scrollHeight,w:e.clientWidth,sw:e.scrollWidth}));
assert(geometry.scroll<=geometry.h+1,JSON.stringify({width,height,...geometry}));assert(geometry.sw<=geometry.w);
const exit=await p.locator('.menu-logout').boundingBox();assert(exit.y+exit.height<=height-9);
await p.screenshot({path:'.tools/menu-compact-'+height+'.png'});console.log('PASS full account no scrolling',width,height);await p.close();
}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
