const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('docs/freebk.js','utf8');
const sync=code.slice(code.indexOf('function syncMarketTabs(){'),code.indexOf('const renderBeforeTabs=render;'));
const element=()=>({attrs:{},setAttribute(k,v){this.attrs[k]=v},classList:{toggle(){}}});
const tabs=['outcomes','totals','lines'].map(m=>({...element(),dataset:{market:m}}));
const linePanel=element(),eventsPanel=element(),lineButton={id:'market-tab-lines'};
let market='outcomes';
const context=vm.createContext({screen:{getState:()=>({market})},linePanel,eventsPanel,lineButton,tabs});
vm.runInContext(sync,context);
for(const value of ['outcomes','totals','lines','lines','outcomes','lines','totals']){
 market=value;vm.runInContext('syncMarketTabs()',context);
 assert.equal(linePanel.hidden,value!=='lines');assert.equal(eventsPanel.hidden,value==='lines');
 assert.equal(tabs.filter(t=>t.attrs['aria-selected']==='true').length,1);
 assert.equal(tabs.find(t=>t.tabIndex===0).dataset.market,value);
}
console.log('Tabs: switching, repeated click, and refresh synchronization passed');
