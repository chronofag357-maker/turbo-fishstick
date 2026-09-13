const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{
 for(const width of [320,390]){
 const p=await b.newPage({viewport:{width,height:740}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',r=>{const u=new URL(r.request().url());return u.hostname!=='127.0.0.1'||u.pathname.startsWith('/api/')?r.fulfill({status:503,body:'{}'}):r.continue()});
 await p.goto('http://127.0.0.1:8084/mini-app.html?preview=1');
 await p.locator('.welcome-login').click();
 const d=p.locator('#welcome-entry');
 assert(await d.isVisible());
 assert(await d.locator('.entry-primary').isDisabled());
 await d.locator('[data-server-consent]').check();
 await d.locator('.entry-primary').click();
 await d.locator('.entry-handle').press('Enter');
 assert(await d.locator('.entry-primary').isDisabled());
 await p.screenshot({path:'.tools/entry-slider-'+width+'.png'});
 const target=await d.locator('.entry-target').evaluate(t=>parseFloat(getComputedStyle(t).right)/(t.parentElement.clientWidth-64));
 const handle=await d.locator('.entry-handle').boundingBox();
 const rail=await d.locator('.entry-slide').boundingBox();
 await p.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2);
 await p.mouse.down();
 await p.mouse.move(handle.x+handle.width/2-(rail.width-handle.width)*target,handle.y+handle.height/2,{steps:16});
 await p.mouse.up();
 assert(!(await d.locator('.entry-primary').isDisabled()));
 await p.screenshot({path:'.tools/entry-new-'+width+'.png'});
 assert(await d.evaluate(e=>e.scrollWidth<=e.clientWidth));
 await d.locator('.entry-primary').click();
 assert(await p.locator('#welcome-gate').isHidden());
 assert.equal(await p.locator('#app').evaluate(e=>e.inert),false);
 assert.deepEqual(errors,[]);
 console.log(width+' PASS');await p.close();
 }
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exit(1)});
