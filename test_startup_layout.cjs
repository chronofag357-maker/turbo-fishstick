const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try{for(const width of [320,390]){
  const p=await b.newPage({viewport:{width,height:740}});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));
  let release;const hold=new Promise(r=>release=r);
  await p.route('**/*',async r=>{
   const u=new URL(r.request().url());
   if(u.pathname.endsWith('/compact-header.js'))await hold;
   if(u.pathname.endsWith('/ufc-snapshot.js'))return r.fulfill({contentType:'application/javascript',body:width===320?'':'window.UFC_SNAPSHOT={fights:[]};'});
   if(u.hostname!=='127.0.0.1'||u.pathname.startsWith('/api/'))return r.fulfill({status:503,body:'{}'});
   return r.continue();
  });
  await p.goto('http://127.0.0.1:8084/mini-app.html?preview=1',{waitUntil:'commit'});
  await p.waitForSelector('#app',{state:'attached'});
  assert.equal(await p.locator('#app').evaluate(e=>getComputedStyle(e).visibility),'hidden');
  release();await p.waitForFunction(()=>!document.documentElement.classList.contains('app-booting'));
  assert.equal(await p.locator('#app').evaluate(e=>getComputedStyle(e).visibility),'visible');
  assert.equal(await p.locator('link[href*="compact-header.css"]').count(),1);
  assert.deepEqual(errors,[]);
  assert.equal(await p.locator('.market[data-market="lines"]').count(),1);
  await p.screenshot({path:'.tools/startup-'+width+'.png'});
  console.log(width+' startup visibility PASS');await p.close();
 }}finally{await b.close()}
})().catch(e=>{console.error(e);process.exit(1)});
