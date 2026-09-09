const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage();
 await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='127.0.0.1')return r.abort();if(u.pathname.startsWith('/api/'))return r.fulfill({contentType:'application/json',body:'{"events":[]}'});const f=path.join(process.cwd(),'docs',u.pathname);if(!fs.existsSync(f))return r.fulfill({status:404,body:''});return r.fulfill({body:fs.readFileSync(f),contentType:({'.html':'text/html','.css':'text/css','.js':'text/javascript'})[path.extname(f)]||'text/plain'});});
 await p.goto('http://127.0.0.1/mini-app.html?v=222&preview=1');
 await p.evaluate(()=>{freebkDemoSignedIn=true;window.dispatchEvent(new Event('freebk-account-change'));});
 await p.getByRole('button',{name:'Live тренажёр',exact:true}).click();
 await p.getByRole('link',{name:'Вернуться в приложение'}).click();
 await p.waitForSelector('.sports');
 assert.equal(await p.locator('#welcome-gate').isVisible(),false);
 assert.equal(await p.locator('#app').evaluate(e=>e.inert),false);
 await p.evaluate(()=>{freebkDemoSignedIn=false;window.dispatchEvent(new Event('freebk-account-change'));});
 await p.reload();assert.equal(await p.locator('#welcome-gate').isVisible(),true);
 console.log('Trainer return preserves preview entry; logout clears it: PASS');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
