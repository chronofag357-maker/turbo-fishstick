// Isolated real-media smoke test; accepts short-lived synthetic grants via env.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const access=JSON.parse(Buffer.from(process.env.MEDIA_PROBE,'base64').toString());
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
 try{
  const pages=[];
  for(let i=0;i<3;i++){
   const p=await browser.newPage();pages.push(p);
   await p.route('https://159-194-244-46.sslip.io/probe-fixture',r=>r.fulfill({contentType:'text/html',body:'<body>Media probe</body>'}));
   await p.goto('https://159-194-244-46.sslip.io/probe-fixture');
   await p.addScriptTag({path:'docs/vendor/livekit-2.22.3/livekit-client.umd.js'});
   await p.evaluate(async({url,token})=>{
    window.probe=new LivekitClient.Room();window.received=0;window.chat=false;
    probe.on(LivekitClient.RoomEvent.TrackSubscribed,()=>received++);
    probe.on(LivekitClient.RoomEvent.DataReceived,()=>chat=true);
    await probe.connect(url,token);
    await probe.localParticipant.setMicrophoneEnabled(true);
    await probe.localParticipant.setCameraEnabled(true,{resolution:{width:320,height:180,frameRate:10}});
   },{url:access.url,token:access.tokens[i]});
  }
  for(const p of pages)await p.waitForFunction(()=>probe.remoteParticipants.size===2&&received>=4,{},{timeout:20000});
  await pages[0].evaluate(()=>probe.localParticipant.publishData(new TextEncoder().encode('probe'),{reliable:true}));
  await pages[1].waitForFunction(()=>chat);await pages[2].waitForFunction(()=>chat);
  for(const p of pages)assert.equal(await p.evaluate(()=>probe.remoteParticipants.size),2);
  for(const p of pages)await p.evaluate(()=>probe.disconnect());
  console.log('PASS real LiveKit: three synthetic clients, remote audio/video tracks and data delivery');
 }finally{await browser.close();}
})().catch(e=>{console.error(e.message);process.exit(1)});
