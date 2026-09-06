const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const docEvents={},winEvents={},timers=new Map();let id=0,calls=0,lastSignal;
const context={window:{addEventListener:(n,f)=>winEvents[n]=f},document:{hidden:false,addEventListener:(n,f)=>docEvents[n]=f},AbortController,Date,setTimeout:f=>{timers.set(++id,f);return id},clearTimeout:id=>timers.delete(id)};
vm.createContext(context);vm.runInContext(fs.readFileSync('docs/feed-runtime.js','utf8'),context);
const format=context.window.moscowFightTime;
const header=context.window.moscowFightHeader;
assert.equal(header('2026-09-12T23:45:00Z'),'13 СЕНТЯБРЯ В 02:45 МСК');
assert.equal(header('2026-09-13T02:45:00+03:00'),'13 СЕНТЯБРЯ В 02:45 МСК');
assert.equal(header('2026-12-31T23:00:00Z'),'1 ЯНВАРЯ В 02:00 МСК');
assert.equal(header(null),'Дата и время уточняются');
assert.match(format('2026-09-12T23:45:00Z'),/13 сентября 2026.*02:45 МСК/);
assert.match(format('2026-12-31T23:00:00Z'),/1 января 2027.*02:00 МСК/);
assert.match(format('2026-09-13T02:45:00+03:00'),/13 сентября 2026.*02:45 МСК/);
assert.equal(format(null),'Дата и время уточняются');
assert.equal(format('bad'),'Дата и время уточняются');
const flush=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 context.window.startVisibleFeed(async signal=>{calls++;lastSignal=signal});await flush();
 assert.equal(calls,1);assert.equal(timers.size,1);
 context.document.hidden=true;docEvents.visibilitychange();assert.equal(timers.size,0);
 context.document.hidden=false;docEvents.visibilitychange();await flush();assert.equal(calls,2);
 winEvents.pagehide();assert.equal(timers.size,0);
 winEvents.pageshow();await flush();assert.equal(calls,3);assert.equal(timers.size,1);
 winEvents.pagehide();
 // A hidden screen also aborts an in-flight request.
 context.window.startVisibleFeed(signal=>{lastSignal=signal;return new Promise(resolve=>signal.addEventListener('abort',resolve))});
 context.document.hidden=true;docEvents.visibilitychange();await flush();assert(lastSignal.aborted);assert.equal(timers.size,0);
 console.log('PASS: Moscow date/day/year rollover; open, hide, resume, page restore, request cancellation');
})().catch(e=>{console.error(e);process.exitCode=1});
