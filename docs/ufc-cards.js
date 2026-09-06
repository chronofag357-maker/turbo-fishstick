// Editorial metadata checked against UFC on 2026-09-06; not an automatic schedule feed.
(() => {
  const cards=[];
  const add=(title,from,to,source,fights)=>cards.push({title,from,to,source,fights});
  add('UFC Fight Night 288 · Noche UFC · Глендейл','2026-09-12','2026-09-14','https://www.ufc.com/event/ufc-fight-night-september-12-2026',[
    ['Jean Silva','Jose Delgado','Основной кард · Главный бой'],
    ['Brandon Moreno','Joseph Morales','Основной кард · Соглавный бой'],
    ['Tommy McMillen','Marwan Rahiki','Основной кард'],
    ['Manon Fiorot','Alexa Grasso','Основной кард'],
    ['Waldo Cortes-Acosta','Curtis Blaydes','Основной кард'],
    ['David Martinez','Dan Ige','Основной кард'],
    ['Tim Elliott','Edgar Chairez','Прелимы'],
    ['Ignacio Bahamondes','Muslim Salikhov','Прелимы'],
    ['Yousri Belgaroui','Djorden Santos','Прелимы'],
    ['Rafa Garcia','Zhu Rong','Прелимы'],
    ['Drakkar Klose','Thomas Gantt','Прелимы'],
    ['J.J. Aldrich','Regina Tarin','Прелимы'],
    ['Sean King','Jessie Rosas','Прелимы']
  ]);
  add('UFC 331 · Ван — Пантожа 2 · Лос-Анджелес','2026-09-19','2026-09-21','https://www.ufc.com/event/cryptocom-ufc-331',[
    ['Joshua Van','Alexandre Pantoja','Основной кард · Главный бой · За титул UFC в наилегчайшем весе'],
    ['Arman Tsarukyan','Mauricio Ruffy','Основной кард · Соглавный бой · 5 раундов'],
    ['Patricio Pitbull','Dooho Choi','Основной кард'],
    ['Renato Moicano','Brian Ortega','Основной кард'],
    ['Alonzo Menifield','Iwo Baraniewski','Основной кард'],
    ['Gable Steveson','Sean Sharaf','Прелимы'],
    ['Marlon Vera','Charles Jourdain','Прелимы'],
    ['Tai Tuivasa','Robelis Despaigne','Прелимы'],
    ['Edmen Shahbazyan','Brunno Ferreira','Прелимы'],
    ['Giga Chikadze','Joanderson Brito','Ранние прелимы'],
    ["Casey O'Neill",'Eduarda Moura','Ранние прелимы'],
    ['Ryan Gandra','Ozzy Diaz','Ранние прелимы'],
    ['Michael Aswell Jr.','JooSang Yoo','Ранние прелимы']
  ]);
  add('UFC 332 · Силва — Ван Цун · Солт-Лейк-Сити','2026-10-03','2026-10-05','https://jp.ufc.com/news/undisputed-flyweight-title-grabs-ufc-332-salt-lake-city',[
    ['Natalia Silva','Wang Cong','Главный бой · За вакантный титул UFC в женском наилегчайшем весе'],
    ['Deiveson Figueiredo','Payton Talbott','Место в карде уточняется']
  ]);
  add('UFC 333 · Волкановски — Евлоев · Абу-Даби','2026-10-24','2026-10-26','https://www.ufc.com/event/ufc-333',[
    ['Alex Volkanovski','Movsar Evloev','Основной кард · Главный бой · За титул UFC в полулёгком весе'],
    ['Petr Yan','Merab Dvalishvili','Основной кард · За титул UFC в легчайшем весе']
  ]);
  const originals={
    'https://www.ufc.com/event/ufc-fight-night-september-12-2026':'Noche UFC: Silva vs Delgado',
    'https://www.ufc.com/event/cryptocom-ufc-331':'UFC 331: Van vs Pantoja 2',
    'https://jp.ufc.com/news/undisputed-flyweight-title-grabs-ufc-332-salt-lake-city':'UFC 332',
    'https://www.ufc.com/event/ufc-333':'UFC 333: Volkanovski vs Evloev'
  };
  const aliases={'Jose Miguel Delgado':'Jose Delgado','Tommy Gantt':'Thomas Gantt','JJ Aldrich':'J.J. Aldrich','Rongzhu':'Zhu Rong','Alexander Volkanovski':'Alex Volkanovski'};
  const highlights={
    'Jean Silva|Jose Delgado':'Силва — Дельгадо: главный бой вечера · Полулёгкий вес · 5 раундов',
    'Joshua Van|Alexandre Pantoja':'Ван — Пантожа: титульный бой · Наилегчайший вес · 5 раундов',
    'Arman Tsarukyan|Mauricio Ruffy':'Царукян — Руффи: рейтинговый, соглавный бой · Лёгкий вес · 5 раундов',
    'Natalia Silva|Wang Cong':'Силва — Ван Цун: за вакантный титул · Женский наилегчайший вес · 5 раундов',
    'Alex Volkanovski|Movsar Evloev':'Волкановски — Евлоев: титульный, главный бой · Полулёгкий вес · 5 раундов',
    'Petr Yan|Merab Dvalishvili':'Ян — Двалишвили: титульный бой · Легчайший вес · 5 раундов'
  };
  window.ufcCardInfo=(event)=>{
    if(event.sport_key!=='mma_mixed_martial_arts')return null;
    const pair=[event.home_team,event.away_team].map(n=>aliases[n]||n);
    const date=event.commence_time?.slice(0,10);
    for(const c of cards){
      if(!date||date<c.from||date>=c.to)continue;
      const f=c.fights.find(f=>pair.includes(f[0])&&pair.includes(f[1]));
      if(f)return {title:c.title,originalTitle:originals[c.source],stage:f[2],highlight:highlights[f[0]+'|'+f[1]]||'',source:c.source,checked:'06.09.2026'};
    }
    return null;
  };
})();
