const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
const p=await b.newPage({viewport:{width:390,height:700}});
await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='127.0.0.1')return r.abort();const f=path.join(process.cwd(),'docs',u.pathname);if(!fs.existsSync(f)||!fs.statSync(f).isFile())return r.fulfill({body:'{}'});return r.fulfill({body:fs.readFileSync(f),contentType:({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[path.extname(f)]||'application/octet-stream'});});
await p.goto('http://127.0.0.1/mini-app.html?preview=1');await p.locator('.welcome-login').click();await p.locator('.auth-generate.is-generated').waitFor();await p.waitForTimeout(3500);
assert(await p.evaluate(()=>{const m=document.querySelector('.welcome-glint').getAnimations()[0];return [...document.querySelectorAll('.auth-key-glint')].every(s=>s.getAnimations()[0]?.startTime===m.startTime)}),'Shared animation start time');
const frames=[];
assert(await p.locator('.auth-key-glint').evaluateAll(es=>es.every(s=>!s.textContent)),'Glint contains no digits');
assert(await p.locator('.auth-key-label').evaluateAll(es=>es.length===10&&es.every(s=>getComputedStyle(s).color==='rgb(255, 255, 255)'&&s.getAnimations().length===0)),'White digits are not animated');
for(const [name,t] of [['off',3600],['on',2675]]){
await p.evaluate(t=>{for(const s of document.querySelectorAll('.welcome-glint,.auth-key-glint'))for(const a of s.getAnimations()){a.pause();a.currentTime=t;}},t);
await p.screenshot({path:'.tools/keypad-glint-'+name+'.png'});
frames.push({pixels:await p.locator('.auth-keypad').screenshot(),mask:await p.locator('.auth-key-glint').first().evaluate(s=>getComputedStyle(s).maskPosition)});
}
assert.notEqual(frames[0].mask,frames[1].mask,'Mask must move, not only opacity');
assert(!frames[0].pixels.equals(frames[1].pixels),'Light must visibly change keypad pixels');
await p.emulateMedia({reducedMotion:'reduce'});
assert(await p.locator('.auth-key-glint').first().isHidden());
console.log('PASS keypad glint: shared phase, moving mask, changed pixels, reduced motion');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
