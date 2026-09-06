const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const c={window:{}};vm.createContext(c);
vm.runInContext(fs.readFileSync('docs/tournament-groups.js','utf8').split('(() => {')[0],c);
const group=(...times)=>({items:times.map((startTime,i)=>({event:{id:String(i),startTime}}))});
const result=c.window.sortTournamentGroups(new Map([
 ['unknown',group(null)],['2027',group('2027-01-01T01:00:00Z')],
 ['later',group('2026-09-13T01:00:00Z','2026-09-12T23:00:00Z')],
 ['first',group('2026-09-13T01:00:00+03:00')],['invalid',group('bad')]
]));
assert.equal(result.map(x=>x[0]).join(','),'first,later,2027,invalid,unknown');
assert.equal(result[1][1].items[0].event.startTime,'2026-09-12T23:00:00Z');
console.log('PASS: chronological blocks and fights, timezone offsets, year rollover, unknown dates last');
