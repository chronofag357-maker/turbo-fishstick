const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{for(const width of [320,390]){
  const page=await browser.newPage({viewport:{width,height:844}});
  await page.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<html><head></head><body>Прематч</body></html>'}));
  await page.goto('http://127.0.0.1:8081/fixture');
  await page.addStyleTag({content:fs.readFileSync('docs/partner-room.css','utf8')});
  await page.evaluate(()=>{
   window.calls=[];window.ServerAccount={current:{id:1},api:async()=>({url:'wss://fixture',token:'fixture'})};
   class Room{
    constructor(){window.testRoom=this;this.state='disconnected';this.remoteParticipants=new Map();this.handlers={};
     this.localParticipant={name:'Вы',isMicrophoneEnabled:false,getTrackPublication:()=>null,
      setMicrophoneEnabled:async v=>{this.localParticipant.isMicrophoneEnabled=v;calls.push(['mic',v]);},
      setCameraEnabled:async v=>{calls.push(['cam',v]);},publishData:async()=>{}};
    }
    on(e,cb){this.handlers[e]=cb;return this;}
    async connect(){this.state='connected';calls.push(['connect']);}
    async disconnect(){this.state='disconnected';calls.push(['disconnect']);}
    async startAudio(){}
   }
   const RoomEvent=Object.fromEntries(['TrackSubscribed','TrackUnsubscribed','ParticipantConnected','ParticipantDisconnected','TrackMuted','TrackUnmuted','LocalTrackPublished','LocalTrackUnpublished','ActiveSpeakersChanged','Reconnecting','Reconnected','Disconnected','DataReceived'].map(s=>[s,s]));
   window.LivekitClient={Room,RoomEvent,Track:{Source:{Camera:'camera'},Kind:{Audio:'audio'}}};
  });
  await page.addScriptTag({content:fs.readFileSync('docs/partner-room.js','utf8')});
  await page.evaluate(()=>PartnerRoom.open());
  await page.locator('[data-join]').click();await page.waitForTimeout(150);
  assert.equal(await page.locator('.pr-tile').count(),3);
  await page.locator('[data-back]').click();await page.waitForTimeout(150);
  assert(await page.locator('#partner-voice').isVisible());
  assert(await page.evaluate(()=>testRoom.localParticipant.isMicrophoneEnabled));
  assert.equal(await page.evaluate(()=>calls.filter(c=>c[0]==='disconnect').length),0);
  assert.equal(await page.evaluate(()=>calls.filter(c=>c[0]==='cam').at(-1)[1]),false);
  await page.locator('[data-return]').click();await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>calls.filter(c=>c[0]==='cam').at(-1)[1]),true);
  await page.locator('[data-camera]').click();await page.waitForTimeout(100);
  await page.locator('[data-back]').click();await page.locator('[data-return]').click();await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>calls.filter(c=>c[0]==='cam').at(-1)[1]),false);
  assert(await page.evaluate(()=>document.querySelector('#partner-room').scrollWidth<=innerWidth));
  await page.screenshot({path:'.tools/partner-room-'+width+'.png'});
  await page.locator('#partner-room [data-leave]').click();
  assert.equal(await page.evaluate(()=>calls.filter(c=>c[0]==='disconnect').length),1);
  await page.close();
 }console.log('PASS partner room: audio persists, video pauses/restores, explicit camera off persists, disconnect, 320/390');}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
