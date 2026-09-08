const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
const page=await browser.newPage({viewport:{width:390,height:760}});
page.on('pageerror',e=>console.log('PAGE ERROR',e.message));
await page.route('**/*',async r=>{
 const u=new URL(r.request().url());
 if(u.hostname!=='127.0.0.1')return r.abort();
 const file=path.join(process.cwd(),'docs',u.pathname);
 if(!fs.existsSync(file)||!fs.statSync(file).isFile())return r.fulfill({status:503,body:'{}'});
 return r.fulfill({body:fs.readFileSync(file),contentType:({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream'});
});
await page.goto('http://127.0.0.1/mini-app.html');
await page.waitForTimeout(700);
await page.evaluate(()=>{
 document.getElementById('welcome-gate').remove();document.getElementById('app').inert=false;
 const e={id:'test',fighters:['Боец А','Боец Б'],sport:'mma',status:'prematch',title:'Тест',date:'',startTime:'2027-01-01T12:00:00Z',priceKey:'book',odds:[1.2,null,3],priceNote:'Тестовая БК'};
 FightScreen.setEvents([{...e,unavailable:true}]);
 FightScreen.setEvents([{...e,odds:[1.15,null,3.1]}]);
 document.querySelectorAll('details.tournament').forEach(d=>d.open=true);
});
console.log(await page.locator('#events').innerText());
assert.equal(await page.locator('#events .odds-arrow').count(),2);
await page.screenshot({path:'.tools/odds-full.png'});
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
