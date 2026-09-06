"""Cached supplemental boxing metadata. Never infer timezone or no-title status."""
import asyncio
import json
import time
from datetime import date
from pathlib import Path
import aiohttp
from bot.config import settings

CACHE=Path(__file__).resolve().parents[2]/'.tools/boxing-metadata.json'
LOCK=asyncio.Lock()
DIVISIONS={'Super Featherweight':'Второй полулёгкий вес','Super Welterweight':'Первый средний вес','Welterweight':'Полусредний вес','Lightweight':'Лёгкий вес'}
STAGES={'Main Card':'Основной кард','Main Event':'Главный бой','Co-Main':'Соглавный бой'}
def name(value):
    return str(value).lower().replace('abass barou','abass baraou').strip()

async def schedule():
    async with LOCK:
        try: cached=json.loads(CACHE.read_text(encoding='utf-8'))
        except (OSError,ValueError): cached={}
        if time.time()-cached.get('attempt_at',0)<96*3600:return cached
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=20)) as session:
                async with session.get('https://boxing-data-api.p.rapidapi.com/v2/fights/schedule',params={'days':7,'page_size':25,'date_sort':'ASC'},headers={'X-RapidAPI-Key':settings.boxing_data_api_key,'X-RapidAPI-Host':'boxing-data-api.p.rapidapi.com'},proxy=settings.proxy_url or None) as response:
                    response.raise_for_status(); payload=await response.json()
            if payload.get('error') or not isinstance(payload.get('data'),list):raise ValueError('Invalid data')
            cached={'rows':payload['data'],'checked_at':time.time(),'stale':False}
        except (aiohttp.ClientError,TimeoutError,ValueError):cached={**cached,'stale':True}
        cached['attempt_at']=time.time();CACHE.parent.mkdir(exist_ok=True);CACHE.write_text(json.dumps(cached,ensure_ascii=False),encoding='utf-8')
        return cached

async def enrich(events):
    cached=await schedule(); output=[]
    for event in events:
        item=dict(event)
        for row in cached.get('rows',[]):
            fighters=row.get('fighters',{})
            pair={name(fighters.get(k,{}).get('full_name')) for k in ('fighter_1','fighter_2')}
            if pair!={name(event.get('home_team')),name(event.get('away_team'))}:continue
            try:
                if abs((date.fromisoformat(row['date'][:10])-date.fromisoformat(event['commence_time'][:10])).days)>1:continue
            except (ValueError,KeyError):continue
            division=(row.get('division') or {}).get('name','')
            titles=[t.get('name') for t in row.get('titles',[]) if t.get('name')]
            rounds=row.get('scheduled_rounds')
            parts=[STAGES.get(row.get('card_billing'),row.get('card_billing')),DIVISIONS.get(division,division)]
            if isinstance(rounds,int) and rounds>0:parts.append(f'{rounds} раундов')
            parts.append('Титульный бой: '+', '.join(titles) if titles else 'Титулы не указаны в источнике')
            item['boxing_info']={'stage':' · '.join(p for p in parts if p),'source':'https://boxing-data.com/docs/endpoints/fights/','date_raw':row.get('date'),'event_title':(row.get('event') or {}).get('title'),'stale':cached.get('stale',False)}
            break
        output.append(item)
    return output
