// Independently authored browser terminal. No WEX/GPL code, no private exchange API.
(() => {
  let root, socket, controller, timer, generation=0, symbol='BTCUSDT', interval='1h', live=true;
  let candles=[], bids=[], asks=[], orders=[], quote=10000, assets={BTCUSDT:0,ETHUSDT:0};
  const fmt=(n,d=2)=>Number(n).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
  const base=()=>symbol.slice(0,-4);
  function close(){generation++;controller?.abort();socket?.close();clearInterval(timer);root=null;}
  function fixture(){const p=symbol==='BTCUSDT'?64000:2800;let last=p;
    candles=Array.from({length:48},(_,i)=>{const o=last,c=o+Math.sin(i*1.7)*p*.002+p*.0003;last=c;return [i,o,Math.max(o,c)+p*.001,Math.min(o,c)-p*.001,c,10+(i*17)%70];});
    bids=Array.from({length:5},(_,i)=>[last-(i+1)*p*.0001,.12+i*.08]);asks=bids.map((r,i)=>[last+(i+1)*p*.0001,r[1]+.03]);
  }
  function status(text){if(root)root.querySelector('.tt-status').textContent=text;}
  function paint(){if(!root)return;const last=candles.at(-1)?.[4];root.querySelector('.tt-price').textContent=last?fmt(last)+' USDT':'—';
    for(const [side,rows] of [['bids',bids],['asks',asks]])root.querySelector('[data-'+side+']').innerHTML=rows.slice(0,5).map(r=>`<tr><td>${fmt(r[0])}</td><td>${fmt(r[1],4)}</td></tr>`).join('');
    const svg=root.querySelector('svg');if(!candles.length){svg.innerHTML='';return;}
    const lo=Math.min(...candles.map(c=>c[3])),hi=Math.max(...candles.map(c=>c[2])),y=p=>15+(hi-p)/Math.max(hi-lo,1)*130;
    svg.innerHTML=[0,1,2,3].map(i=>`<path d="M6 ${15+i*43}H350" stroke="#e5eaf0"/><text x="350" y="${12+i*43}" text-anchor="end" fill="#637486" font-size="8">${fmt(hi-(hi-lo)*i/3)}</text>`).join('')+candles.map((c,i)=>{const x=8+i*6.1,color=c[4]>=c[1]?'#257243':'#98536f';return `<path d="M${x} ${y(c[2])}V${y(c[3])}" stroke="${color}"/><rect x="${x-2}" y="${Math.min(y(c[1]),y(c[4]))}" width="4" height="${Math.max(1,Math.abs(y(c[1])-y(c[4])))}" fill="${color}"/><rect x="${x-2}" y="${190-c[5]/Math.max(...candles.map(v=>v[5]),1)*30}" width="4" height="${c[5]/Math.max(...candles.map(v=>v[5]),1)*30}" fill="${color}" opacity=".35"/>`;}).join('');
  }
  function account(){if(!root)return;root.querySelector('[data-balance]').textContent=`Баланс: ${fmt(quote)} USDT · ${fmt(assets[symbol],6)} ${base()}`;
    const list=root.querySelector('[data-orders]');list.replaceChildren();
    if(!orders.length){list.textContent='Пока нет ордеров.';return;}
    orders.slice().reverse().forEach(o=>{const row=document.createElement('div');row.className='tt-order';const text=document.createElement('span');text.textContent=`${o.side==='buy'?'Покупка':'Продажа'} ${o.symbol} · ${o.qty} × ${fmt(o.price)} · ${o.state}`;row.append(text);if(o.state==='Открыт'){const b=document.createElement('button');b.textContent='Отменить';b.onclick=()=>{o.state='Отменён';if(o.side==='buy')quote+=o.qty*o.price;else assets[o.symbol]+=o.qty;account();};row.append(b);}list.append(row);});
  }
  async function connect(){const id=++generation;controller?.abort();socket?.close();clearInterval(timer);if(!root)return;
    if(!live){fixture();paint();status('ДЕМО: сохранённый учебный сценарий, не текущие цены. Сделки виртуальные.');return;}
    candles=[];bids=[];asks=[];paint();status('Подключаем публичные данные Binance Spot…');controller=new AbortController();const signal=controller.signal;
    const requestController=controller;
    const timeout=setTimeout(()=>requestController.abort(),10000);
    try{const get=async path=>{const r=await fetch('https://data-api.binance.vision/api/v3/'+path,{signal});if(!r.ok)throw Error('HTTP '+r.status);return r.json();};
      const [k,d]=await Promise.all([get(`klines?symbol=${symbol}&interval=${interval}&limit=48`),get(`depth?symbol=${symbol}&limit=5`)]);if(id!==generation||!root)return;
      if(!Array.isArray(k)||!k.length||!Array.isArray(d.bids))throw Error('Invalid data');
      candles=k.map(r=>r.slice(0,6).map(Number));bids=d.bids.map(r=>r.map(Number));asks=d.asks.map(r=>r.map(Number));paint();
      let updated=Date.now();status('Binance Spot · снимок получен, подключаем поток…');
      socket=new WebSocket(`wss://data-stream.binance.vision:443/stream?streams=${symbol.toLowerCase()}@kline_${interval}/${symbol.toLowerCase()}@depth5@1000ms`);
      socket.onmessage=e=>{if(id!==generation||!root)return;try{const d=JSON.parse(e.data).data;if(d.k){const k=d.k,r=[k.t,+k.o,+k.h,+k.l,+k.c,+k.v];if(candles.at(-1)?.[0]===r[0])candles[candles.length-1]=r;else candles.push(r);candles=candles.slice(-48);}else if(d.bids){bids=d.bids.map(r=>r.map(Number));asks=d.asks.map(r=>r.map(Number));}updated=Date.now();paint();status('● Binance Spot · '+new Date(updated).toLocaleTimeString()+'');}catch{status('Ошибка данных потока. Обновите подключение.');}};
      socket.onclose=()=>{if(id===generation)status('Поток отключён. На экране последний снимок; нажмите «Обновить».');};
      timer=setInterval(()=>{if(Date.now()-updated>15000)status('Данные устарели: нет обновлений более 15 секунд.');},5000);
    }catch(e){if(id===generation)status('Котировки недоступны. Проверьте сеть и нажмите «Обновить».');}finally{clearTimeout(timeout);}
  }
  function open(host){root=document.createElement('div');root.className='trade-terminal';host.append(root);
    root.innerHTML=`<div class="tt-head"><div><h2>Trading terminal</h2><small>CLASSIC EXCHANGE / SPOT</small></div><select aria-label="Рынок"><option>BTCUSDT</option><option>ETHUSDT</option></select></div><div class="tt-toolbar"><button data-mode="live">Котировки Binance</button><button data-refresh>Обновить</button></div><div class="tt-status" role="status"></div><section class="tt-panel"><h3>Рынок / USDT</h3><div class="tt-price">—</div><div class="tt-toolbar" style="padding:0 8px">${['1m','5m','1h','1d'].map(i=>`<button data-interval="${i}">${i}</button>`).join('')}</div><svg viewBox="0 0 360 198" role="img" aria-label="Свечной график и объёмы"></svg><div class="tt-chart-caption"><span>48 свечей</span><span>Объём / время слева направо →</span></div></section><div class="tt-columns">${[['bids','Покупатели','tt-buy'],['asks','Продавцы','tt-sell']].map(([k,t,c])=>`<section class="tt-panel ${c}"><h3>${t}</h3><table><thead><tr><th>Цена USDT</th><th>Количество</th></tr></thead><tbody data-${k}></tbody></table></section>`).join('')}</div><section class="tt-panel"><h3>Лимитные ордера</h3><div class="tt-note" data-balance></div><div class="tt-columns">${['buy','sell'].map(s=>`<form data-side="${s}"><label>Цена, USDT<input name="price" type="number" min="0.01" step="any" required></label><label>Количество<input name="qty" type="number" min="0.000001" step="any" required value="0.001"></label><button class="tt-submit ${s==='sell'?'sell':''}">${s==='buy'?'Купить':'Продать'}</button></form>`).join('')}</div><div class="tt-message" role="status"></div></section><section class="tt-panel"><h3>Мои ордера / история</h3><div class="tt-note" data-orders></div></section>`;
    const select=root.querySelector('select');select.value=symbol;select.onchange=()=>{symbol=select.value;account();connect();};
    const buttons=()=>{root.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.mode==='live')===live)));root.querySelectorAll('[data-interval]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.interval===interval)));};
    root.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{live=b.dataset.mode==='live';buttons();connect();});root.querySelectorAll('[data-interval]').forEach(b=>b.onclick=()=>{interval=b.dataset.interval;buttons();connect();});root.querySelector('[data-refresh]').onclick=connect;
    root.querySelectorAll('form').forEach(f=>f.onsubmit=e=>{e.preventDefault();const price=+f.price.value,qty=+f.qty.value,side=f.dataset.side,total=price*qty;const message=root.querySelector('.tt-message');if(!Number.isFinite(total)||price<=0||qty<=0||total<=0){message.textContent='Введите положительные цену и количество.';return;}if(side==='buy'?total>quote:qty>assets[symbol]){message.textContent='Недостаточно средств.';return;}if(side==='buy')quote-=total;else assets[symbol]-=qty;orders.push({symbol,price,qty,side,state:'Открыт'});message.textContent='Ордер создан.';account();});buttons();account();connect();
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden){generation++;controller?.abort();socket?.close();clearInterval(timer);status('Пауза: обновление возобновится при возвращении.');}else if(root&&live)connect();});
  window.TradingTerminal={open,close};
})();
