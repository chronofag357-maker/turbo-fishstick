const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const p=await browser.newPage({viewport:{width:390,height:844}});
  await p.goto('http://127.0.0.1:8081/mini-app.html',{waitUntil:'domcontentloaded'});await p.waitForTimeout(2200);
  await p.evaluate(()=>{
   window.stageFixtures=['Ранние прелимы','Ранние прелимы','Прелимы','Прелимы','Основной кард','Основной кард','Основной кард · Соглавный бой','Основной кард · Главный бой'].map((stage,i)=>({id:'stage'+i,title:'Тест',sport:'mma',status:'prematch',fighters:['Боец '+i,'Соперник '+i],odds:[2,null,2],startTime:`2099-12-01T${String(10+i).padStart(2,'0')}:00:00Z`,date:'1 декабря',priceNote:'Линия',cardInfo:{title:'Тестовый турнир',stage,source:'https://example.com'}}));
   FightScreen.setEvents(stageFixtures);FightScreen.setSport('mma');
  });
  const expected=['(Ранние прелимы)','(Прелимы)','(Основной кард)','(Соглавный бой)','(Главный бой)'];
  for(const width of [390,320]){
   await p.setViewportSize({width,height:844});
   assert.deepEqual((await p.locator('.tournament-content .fight-stage-label').allTextContents()).map(s=>s.trim()),expected);
   await p.evaluate(()=>FightScreen.setEvents(stageFixtures));
   assert.deepEqual((await p.locator('.tournament-content .fight-stage-label').allTextContents()).map(s=>s.trim()),expected);
  }
  await p.locator('.tournament summary').first().click();
  await p.screenshot({path:'.tools/stage-labels.png'});
  console.log('PASS: section labels once, main/co-main preserved, rerender, 390/320px');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
