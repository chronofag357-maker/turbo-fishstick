const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{for(const width of [320,390]){
  const page=await browser.newPage({viewport:{width,height:600}});
  await page.setContent('<div id="events"></div><dialog id="panel"></dialog>');
  await page.evaluate(()=>{
   window.events=[];window.market='outcomes';window.selected=new Set();
   window.fmt=n=>n==null?'—':n.toFixed(2);
   window.render=()=>{document.querySelector('#events').innerHTML=events.map(e=>e.odds.map((n,i)=>`<button data-odd="${e.id}" data-index="${i}">${fmt(n)}</button>`).join('')).join('')};
   window.panel=(_title,html)=>{const d=document.querySelector('#panel');d.innerHTML=html;d.showModal()};
   window.FightScreen={setEvents(data){events=data;render()}};
  });
  await page.addScriptTag({path:'docs/odds-updates.js'});
  await page.evaluate(()=>{
   const e={id:'test',fighters:['Боец А','Боец Б'],priceKey:'book',odds:[2,null,3],title:'Тестовая линия',date:'',priceNote:'Тест без поставщика'};
   FightScreen.setEvents([e]);FightScreen.setEvents([{...e,odds:[2.15,null,2.9]}]);
  });
  assert.deepEqual(await page.locator('.odds-arrow').allTextContents(),['+0,15','−0,10']);
  assert.equal(await page.locator('.odds-arrow svg').count(),2);
  await page.evaluate(()=>openFight('test'));
  assert.deepEqual(await page.locator('#panel .odds-arrow').allTextContents(),['+0,15','−0,10']);
  assert.equal(await page.locator('#panel .odds-down').evaluate(e=>getComputedStyle(e).color),'rgb(86, 122, 34)');
  await page.screenshot({path:`.tools/odds-delta-${width}.png`});
  await page.close();
 }}finally{await browser.close()}
 console.log('PASS: delta labels in list and dialog at 320/390; cancellation palette');
})().catch(e=>{console.error(e);process.exit(1)});
