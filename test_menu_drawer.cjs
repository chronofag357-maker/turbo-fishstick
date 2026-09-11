const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 for(const width of [320,390]){
 const p=await browser.newPage({viewport:{width,height:844}});
 await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='127.0.0.1')return r.abort();if(u.pathname.startsWith('/api/'))return r.fulfill({json:{events:[]}});const f=path.join(process.cwd(),'docs',u.pathname);return fs.existsSync(f)&&fs.statSync(f).isFile()?r.fulfill({body:fs.readFileSync(f),contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(f)]||'text/plain'}):r.fulfill({status:404,body:''});});
 await p.goto('http://127.0.0.1/mini-app.html?preview=1');
 await p.evaluate(()=>{document.getElementById('welcome-gate').remove();document.getElementById('app').inert=false;freebkDemoSignedIn=true;freebkDemoPartner='Марсель Ла';});
 await p.locator('[data-action=menu]').click();await p.waitForTimeout(750);
 const box=await p.locator('#panel').boundingBox();assert(Math.abs(box.x)<1);assert.equal(box.y,0);assert.equal(box.height,844);assert(box.width<=width-44);
 assert.equal(await p.locator('.topbar .broadcast-tab,.sports .live-trainer-tab').count(),0);
 assert(await p.locator('#panel [data-action=live-trainer]').isVisible());
 assert(await p.locator('#panel [data-action=broadcasts]').isVisible());
 assert(await p.locator('#panel .menu-balance').isVisible());
 assert(await p.locator('#panel-body').evaluate(e=>e.scrollWidth<=e.clientWidth));
 await p.screenshot({path:'.tools/menu-drawer-'+width+'.png'});
 await p.keyboard.press('Escape');await p.waitForTimeout(300);assert.equal(await p.locator('#panel').getAttribute('open'),null);
 await p.locator('[data-action=menu]').click();await p.waitForTimeout(450);
 await p.locator('#panel [data-action=broadcasts]').click();assert(await p.locator('#broadcast-screen').isVisible());
 await p.frameLocator('#broadcast-screen iframe').locator('.back').click();await p.waitForTimeout(500);
 await p.locator('[data-action=menu]').click();await p.waitForTimeout(450);
 await p.locator('#panel [data-action=live-trainer]').click();await p.waitForURL('**/live-trainer/index.html?*');
 console.log('PASS drawer/profile/links',width);await p.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
