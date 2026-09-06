// Editorial boxing metadata, checked 2026-09-06. No automatic scraping.
window.boxingCardInfo=e=>{
  if(e.sport_key!=='boxing_boxing')return null;
  const date=e.commence_time?.slice(0,10),pair=[e.home_team,e.away_team];
  const rows=[
    {pair:['Ryan Garcia','Conor Benn'],from:'2026-09-12',to:'2026-09-14',title:'Бокс · Гарсия — Бенн · Лас-Вегас',originalTitle:'Garcia vs Benn',stage:'Титульный бой WBC · Полусредний вес · 12 раундов',source:'https://wbcboxing.com/en/ryan-garcia-to-defend-wbc-welterweight-title-against-conor-benn-in-las-vegas/'},
    {pair:['John Hedges','Pat Brown'],from:'2026-09-19',to:'2026-09-21',title:'Бокс · Хеджес — Браун · Манчестер',originalTitle:'Pat Brown vs John Hedges',stage:'Титулы Великобритании и Содружества · Первый тяжёлый вес',source:'https://www.cooplive.com/events/pat-brown-vs-john-hedges-fltq'}
  ];
  const row=rows.find(r=>date>=r.from&&date<r.to&&r.pair.every(n=>pair.includes(n)));
  return row?{title:row.title,originalTitle:row.originalTitle,stage:row.stage,highlight:row.stage,source:row.source,checked:'06.09.2026'}:null;
};
