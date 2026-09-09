// Presentation-only localisation. Never translate stored bets, IDs, input values or API payloads.
(() => {
 'use strict';
 const dictionary={
 'Введите сгенерированный код':'Enter the generated code',
 'Код не подтверждён':'Code not verified','Код подтверждён':'Code verified',
 'Сгенерировать код':'Generate code',
 'Сгенерировать':'Generate','Код для входа':'Sign-in code','Введите код':'Enter code','Цифровая клавиатура':'Numeric keypad','Удалить цифру':'Delete digit','Проведите до конца':'Slide all the way','Заключить пари — вход':'Place bet — sign in','Заключить пари':'Place bet','Проверяем Telegram ID…':'Checking Telegram ID…',
 'Силва — Ван Цун':'Silva — Wang Cong','Ван — Пантожа':'Van — Pantoja','Силва — Дельгадо':'Silva — Delgado','Царукян — Руффи':'Tsarukyan — Ruffy','Волкановски — Евлоев':'Volkanovski — Evloev','Ян — Двалишвили':'Yan — Dvalishvili',
 'Гарсия — Бенн':'Garcia — Benn','Хеджес — Браун':'Hedges — Brown','Солт-Лейк-Сити':'Salt Lake City',
 'За вакантный титул UFC в женском наилегчайшем весе':'For the vacant UFC women’s flyweight title',
 'За титул UFC в наилегчайшем весе':'For the UFC flyweight title','За титул UFC в полулёгком весе':'For the UFC featherweight title',
 'За вакантный титул':'For the vacant title','Женский наилегчайший вес':'Women’s flyweight','Женский минимальный вес':'Women’s strawweight','Женский легчайший вес':'Women’s bantamweight',
 'рейтинговый, соглавный бой':'ranked co-main event','титульный, главный бой':'title fight, main event',
 'Титулы не указаны в источнике':'Titles not specified by the source',
 'Титулы Великобритании и Содружества':'British and Commonwealth titles',
 'Второй полулёгкий вес':'Super featherweight','Второй полулегкий вес':'Super featherweight','Первый средний вес':'Super welterweight',
 'Место в карде может измениться. Справочник обновляется отдельно от коэффициентов.':'Card placement may change. Event information is updated separately from odds.',
 'Последняя автоматическая проверка источника не удалась.':'The latest automatic source check failed.',
 'По дополнительному источнику бой отменён или требует проверки. Выбор исходов отключён.':'An additional source reports that this fight is cancelled or needs verification. Outcome selection is disabled.',
 'Обновление недоступно. Ниже — сохранённые значения, не текущая линия.':'Updates are unavailable. Saved values are shown below, not current odds.',
 'Бой отсутствует в последнем ответе. Линия недоступна.':'This fight is missing from the latest response. Odds are unavailable.',
 'Boxing Data. Время в расписании — The Odds (МСК); часовой пояс Boxing Data не указан.':'Boxing Data. Schedule time comes from The Odds (MSK); Boxing Data does not specify a time zone.',
 'Время начала по поставщику, может уточняться.':'Start time supplied by the provider, subject to change.',
 'сохранённые сведения':'cached information','время не указано':'time not specified','Бой отменён.':'Fight cancelled.','котировки неактивны':'odds are inactive',
 'Количество боёв в текущем списке':'Number of fights in the current list','время первого неотменённого боя в доступной линии':'time of the first non-cancelled fight in the available odds feed',
 'Источник турнира':'Tournament source','проверен':'checked','кэш':'cache',
 'Женский бой':'Women’s bout','Женщины':'Women','защита титула':'title defence','за титул UFC в легчайшем весе':'for the UFC bantamweight title','за титул UFC на легчайшем весе':'for the UFC bantamweight title',
 'Прематч':'Prematch','Единоборства':'MMA','Бокс':'Boxing','Киберспорт':'Esports','Трансляции':'Broadcasts','Live тренажёр':'Live trainer',
 'ИСХОДЫ':'OUTCOMES','ТОТАЛ РАУНДОВ':'ROUND TOTALS','ТОТАЛЫ':'TOTALS','ФОРЫ':'HANDICAPS','В ОЖИДАНИИ ЛИНИИ':'AWAITING ODDS','ЛИНИИ':'LINES','букмекеров — по регионам':'bookmakers by region',
 'Топ':'Top','Мои пари':'My bets','Игры 24/7':'Games 24/7','Профиль':'Profile','Сводка событий':'Event summary','Об источнике и обновлении':'Source and updates','Об источнике':'Source',
 'Раскрыть все':'Expand all','Раскрыть всё':'Expand all','Свернуть все':'Collapse all','Свернуть всё':'Collapse all','Обновить':'Refresh','Загрузка…':'Loading…','Все':'All',
 'Фаворит':'Favourite','Андердог':'Underdog','Равная линия':'Even odds','Нет линии':'No odds','Линии пока нет':'Awaiting odds','Коэффициенты пока не опубликованы':'Odds not published yet',
 'В разработке / Возможные':'In development / Possible','Основной кард':'Main card','Ранние прелимы':'Early prelims','Прелимы':'Prelims','Главный бой вечера':'Main event','Главный бой':'Main event','Соглавный бой':'Co-main event',
 'Титульный бой':'Title fight','Рейтинговый бой':'Ranked bout','за титул':'for the title','наилегчайшем весе':'flyweight','легчайшем весе':'bantamweight','полулёгком весе':'featherweight','полулегком весе':'featherweight',
 'Полулёгкий вес':'Featherweight','Полулегкий вес':'Featherweight','Легчайший вес':'Bantamweight','Наилегчайший вес':'Flyweight','Лёгкий вес':'Lightweight','Легкий вес':'Lightweight','Полусредний вес':'Welterweight','Средний вес':'Middleweight','Полутяжёлый вес':'Light heavyweight','Полутяжелый вес':'Light heavyweight','Тяжёлый вес':'Heavyweight','Тяжелый вес':'Heavyweight','Первый тяжёлый вес':'Cruiserweight',
 'раундов':'rounds','раунда':'rounds','раунд':'round','МСК':'MSK','линия':'odds','Источник':'Source','Доп. источник':'Additional source','Коэффициент':'Odds','коэффициентов':'odds','букмекеры':'bookmakers',
 'января':'January','февраля':'February','марта':'March','апреля':'April','мая':'May','июня':'June','июля':'July','августа':'August','сентября':'September','октября':'October','ноября':'November','декабря':'December',
 'Глендейл':'Glendale','Лос-Анджелес':'Los Angeles','Лас-Вегас':'Las Vegas','Абу-Даби':'Abu Dhabi','Остров Яс':'Yas Island','Манчестер':'Manchester',
 'Дата и время уточняются':'Date and time TBC','Время уточняется':'Time TBC','Место в карде уточняется':'Card position TBC','Отмена':'Cancelled','По сообщению источника':'According to the source','По сообщению':'According to',
 'Больше':'Over','Меньше':'Under','Победа 1':'Win 1','Победа 2':'Win 2','Ничья':'Draw','Раунды':'Rounds','Тотал':'Total','Линия боя':'Fight odds','Тотал раундов пока не опубликован':'Round totals not published yet',
 'Боец или турнир':'Fighter or tournament','Команда или турнир':'Team or tournament','Поиск боёв':'Search fights','Настройки отображения':'Display settings','Меню':'Menu',
 'Нет событий':'No events','Нет матчей':'No matches','Для выбранного спорта события пока не загружены.':'Events for this sport have not been loaded yet.',
 'Для выбранной дисциплины и режима матчей в полученном расписании нет.':'No matches in the loaded schedule for this discipline and mode.','Измените поиск.':'Try another search.','Попробуйте обновить позже.':'Try refreshing later.',
 'Сохранённые данные':'Cached data','Получено':'Received','матчей':'matches','событий':'events','Задержка':'Delayed','Перенесён':'Postponed','Приём у букмекера приостановлен · сохранённая линия':'Bookmaker suspended betting · saved odds',
 'Регион':'Region','Букмекер':'Bookmaker','США':'USA','Европы':'Europe','Европа':'Europe','Великобритания':'UK','Австралия':'Australia','Австрии':'Austria','Австрия':'Austria','Россия':'Russia','РФ':'Russia','Авто':'Auto',
 'Войти':'Sign in','Вход по Telegram ID':'Telegram ID sign-in','Гость':'Guest','Партнёр':'Partner','Партнер':'Partner','Выход из аккаунта':'Sign out','Генерация кода':'Generate code','Скопировать':'Copy','Вставить код':'Paste code','Проведите для входа':'Slide to enter','Код скопирован':'Code copied',
 'Войти через Telegram':'Sign in with Telegram','Telegram ID недоступен в этом браузере.':'Telegram ID is unavailable in this browser.','Локальный предпросмотр · без авторизации':'Local preview · no authentication',
 'Баланс':'Balance','Пополнить':'Add funds','Контактный центр':'Contact centre','Результаты':'Results','История операций':'Transaction history','В игре':'In play','Поставлено':'Staked','Выплачено':'Paid out','Плюс / минус':'Profit / loss',
 'Сумма':'Amount','Сумма ставки':'Stake','Возможный выигрыш':'Potential return','Купон':'Bet slip','Оформить':'Confirm','Поставить':'Place bet','Удалить':'Remove','Очистить':'Clear','Закрыть':'Close','Отменить':'Cancel','Назад':'Back','Сохранить':'Save','Продолжить':'Continue',
 'Панель администратора':'Admin panel','Участники':'Members','Добавить участника':'Add member','Обновление коэффициентов':'Odds updates','Автообновление':'Automatic updates','Интервал в секундах (40–86400)':'Interval in seconds (40–86400)',
 'Тренировка':'Practice','Разбор':'Review','Редактор':'Editor','Прогресс':'Progress','Симуляция':'Simulation','Вернуться в приложение':'Return to app','Начать упражнение':'Start exercise','Следующее упражнение':'Next exercise','Повторить это':'Repeat','К списку сценариев':'Scenario list','Пауза / продолжить':'Pause / resume',
 'Верно':'Correct','Время истекло':'Time is up','Разберём решение':'Review the answer','Обучение · без спешки':'Practice · untimed','Проверка · 20 секунд на ответ':'Test · 20 seconds per answer','Режим':'Mode','Сценарий':'Scenario'
 };
 let language='ru';try{language=localStorage.getItem('p2p-language')==='en'?'en':'ru';}catch{}
 const originals=new WeakMap(),attributes=new WeakMap();let names=[];
 const replacements=Object.entries(dictionary).sort((a,b)=>b[0].length-a[0].length);
 const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 let translationPattern,translationMap,translationSignature='';
 function translate(value){
  const signature=JSON.stringify(names);
  if(!translationPattern||signature!==translationSignature){
   translationSignature=signature;const entries=[...names,...replacements].sort((a,b)=>b[0].length-a[0].length);
   translationMap=new Map(entries.map(([a,b])=>[a.toLowerCase(),b]));
   translationPattern=new RegExp('(?<![А-Яа-яЁёA-Za-z])(?:'+entries.map(([a])=>escape(a)).join('|')+')(?![А-Яа-яЁёA-Za-z])','giu');
  }
  // Single pass: replacing a name must not prevent a longer title phrase translating.
  const text=value.replace(translationPattern,m=>{const en=translationMap.get(m.toLowerCase());return m===m.toUpperCase()?en.toUpperCase():en;});
  return text.replace(/\sВ\s(?=\d{1,2}:\d{2})/g,' AT ');
 }
 const skip=e=>!e||e.closest('script,style,svg,textarea,input,[contenteditable],.language-switch');
 function localise(root){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
  while(node=walker.nextNode()){
   if(skip(node.parentElement))continue;
   let record=originals.get(node);if(!record||node.nodeValue!==record.last)record={source:node.nodeValue};
   const value=language==='en'?translate(record.source):record.source;
   if(node.nodeValue!==value)node.nodeValue=value;record.last=value;originals.set(node,record);
  }
  for(const e of root.querySelectorAll('[placeholder],[title],[aria-label]')){
   if(e.closest('script,style,svg,[contenteditable],.language-switch'))continue;let records=attributes.get(e)||{};
   for(const key of ['placeholder','title','aria-label']){if(!e.hasAttribute(key))continue;const current=e.getAttribute(key);let r=records[key];if(!r||r.last!==current)r={source:current};const next=language==='en'?translate(r.source):r.source;if(next!==current)e.setAttribute(key,next);r.last=next;records[key]=r;}
   attributes.set(e,records);
  }
 }
 function refreshNames(){names=[];if(typeof events!=='undefined')for(const e of events)for(let i=0;i<(e.fighters||[]).length;i++){const original=e.originalFighters?.[i];if(original&&original!==e.fighters[i])names.push([e.fighters[i],original]);}names.sort((a,b)=>b[0].length-a[0].length);}
 let queued=false;
 const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;apply();});});
 function apply(){observer.disconnect();refreshNames();document.documentElement.lang=language;localise(document.body);document.querySelectorAll('[data-language]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.language===language)));observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','placeholder','aria-label']});}
 const switcher=document.createElement('div');switcher.className='language-switch';switcher.setAttribute('role','group');switcher.setAttribute('aria-label','Language / Язык');
 for(const lang of ['ru','en']){const button=document.createElement('button');button.type='button';button.dataset.language=lang;button.textContent=lang.toUpperCase();button.addEventListener('click',()=>{language=lang;try{localStorage.setItem('p2p-language',lang);}catch{}apply();});switcher.append(button);}
 document.querySelector('.topbar [data-action="search"]')?.before(switcher);
 window.AppLanguage={get current(){return language;},apply,translate};apply();
})();
