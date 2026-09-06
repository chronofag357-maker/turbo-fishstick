"""Free V1 supplemental source. Does not overwrite odds, rounds or start times."""
import asyncio
import json
import time
from datetime import date
from pathlib import Path
import aiohttp
from bot.config import settings

CACHE=Path(__file__).resolve().parents[3]/'.tools/thesportsdb.json'
LOCK=asyncio.Lock()
QUERIES=['Ryan_Garcia_vs_Conor_Benn','John_Hedges_vs_Pat_Brown']

def match(row,event):
    if row.get('strLeague')!='Boxing':return False
    pair={n.strip().lower() for n in row.get('strEvent','').split(' vs ')}
    if pair!={event.get('home_team','').lower(),event.get('away_team','').lower()}:return False
    try:return abs((date.fromisoformat(row['dateEvent'])-date.fromisoformat(event['commence_time'][:10])).days)<=1
    except (KeyError,ValueError):return False

async def fetch():
    async with LOCK:
        try:cache=json.loads(CACHE.read_text(encoding='utf-8'))
        except (OSError,ValueError):cache={}
        if time.time()-cache.get('attempt_at',0)<96*3600:return cache
        try:
            rows=[]
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=15)) as session:
                for query in QUERIES:
                    async with session.get('https://www.thesportsdb.com/api/v1/json/123/searchevents.php',params={'e':query,'s':'2026'},proxy=settings.proxy_url or None) as response:
                        response.raise_for_status();data=await response.json()
                        events=data.get('event') or []
                        if not isinstance(events,list):raise ValueError('Unexpected schema')
                        rows.extend(events)
            cache={'rows':rows,'checked_at':time.time(),'stale':False}
        except (aiohttp.ClientError,TimeoutError,ValueError):cache={**cache,'stale':True}
        cache['attempt_at']=time.time();CACHE.parent.mkdir(exist_ok=True);CACHE.write_text(json.dumps(cache,ensure_ascii=False),encoding='utf-8')
        return cache

async def enrich(events):
    cache=await fetch();output=[]
    for event in events:
        item=dict(event)
        for row in cache.get('rows',[]):
            if match(row,event) and str(row.get('idEvent','')).isdigit():
                item['supplemental_sources']=[{'name':'TheSportsDB','url':'https://www.thesportsdb.com/event/'+str(row['idEvent']),'venue':row.get('strVenue'),'city':row.get('strCity'),'stale':cache.get('stale',False)}]
                break
        output.append(item)
    return output
