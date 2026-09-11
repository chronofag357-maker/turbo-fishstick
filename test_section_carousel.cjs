const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{for(const width of [320,390,450]){
const p=await b.newPage({viewport:{width,height:760},hasTouch:true});const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='127.0.0.1')return r.abort();const f=path.join(process.cwd(),'docs',u.pathname);if(!fs.existsSync(f)||!fs.statSync(f).isFile())return r.fulfill({body:'{}',contentType:'application/json'});return r.fulfill({body:fs.readFileSync(f),contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(f)]||'application/octet-stream'});});
await p.goto('http://127.0.0.1/mini-app.html?preview=1');await p.waitForSelector('.section-carousel');
await p.evaluate(()=>{document.getElementById('welcome-gate').remove();document.getElementById('app').inert=false;});
assert.equal(await p.locator('.sports>.sport').count(),7);
assert.equal(await p.locator('.topbar .modes + .broadcast-tab').count(),1);
assert.deepEqual(await p.locator('.sports .sport-label').allTextContents(),['Единоборства','Бокс','Киберспорт','P2P Betting','Poker','Trading','Live тренажёр']);
assert(await p.locator('.live-trainer-tab .sport-label').evaluate(n=>getComputedStyle(n).whiteSpace==='nowrap'));
assert.deepEqual(await p.locator('.extra-section-tab .sport-label').allTextContents(),['P2P Betting','Poker','Trading']);
await p.waitForTimeout(200);
const overflow=await p.locator('.sports').evaluate(n=>n.scrollWidth-n.clientWidth);
if(width<450)assert(overflow>0,'Narrow screens scroll');
assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await p.screenshot({path:'.tools/carousel-start-'+width+'.png'});
assert(await p.locator('.sports').evaluate(n=>{const r=n.getBoundingClientRect();return n.scrollLeft===0&&[...n.children].slice(0,5).every(b=>{const x=b.getBoundingClientRect();return x.left>=r.left&&x.right<=r.right+.5;})}),'First five sections visible immediately');
// Native touch swipe, not a scripted scrollLeft assignment.
const cdp=await p.context().newCDPSession(p),nav=await p.locator('.sports').boundingBox(),y=nav.y+nav.height/2;
await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:width-20,y}]});
for(let x=width-40;x>=25;x-=20){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});await p.waitForTimeout(16);}
await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(350);
if(overflow>0)assert(await p.locator('.sports').evaluate(n=>n.scrollLeft>0),'Native swipe scrolls');
for(const id of ['p2p','poker','trading']){await p.locator(`[data-section=${id}]`).click();assert(await p.locator('.extra-section-screen').isVisible());assert.equal(await p.locator('.extra-section-screen').textContent(),'');assert(await p.locator('.markets').isHidden());}
await p.screenshot({path:'.tools/carousel-end-'+width+'.png'});
await p.keyboard.press('Home');await p.keyboard.press('Enter');assert(await p.locator('.extra-section-screen').isHidden());assert(await p.locator('.markets').isVisible());
assert(await p.locator('.sports').evaluate(n=>n.scrollLeft<5),'Keyboard returns to start');
await p.mouse.move(width-30,y);await p.mouse.down();await p.mouse.move(25,y,{steps:10});await p.mouse.up();if(overflow>0)assert(await p.locator('.sports').evaluate(n=>n.scrollLeft>0),'Mouse drag scrolls');
assert(await p.locator('.extra-section-screen').isHidden(),'Dragging does not open a section');
await p.locator('.topbar .broadcast-tab').click();assert(await p.locator('#broadcast-screen').isVisible());await p.frameLocator('#broadcast-screen iframe').locator('.back').click();await p.locator('#broadcast-screen').waitFor({state:'hidden'});
await p.reload();await p.waitForTimeout(300);
assert.equal(await p.locator('.sports').evaluate(n=>n.scrollLeft),0,'Opening starts at beginning, not previous scroll offset');
assert.deepEqual(errors,[]);console.log('PASS carousel',width);await p.close();
}}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
