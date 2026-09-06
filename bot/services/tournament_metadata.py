"""Source-attributed metadata. Only the verified BKFC JSON-LD adapter is automatic."""
import asyncio
import json
import time
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
import aiohttp
from bot.config import settings

ROOT = Path(__file__).resolve().parents[2]
SOURCES = json.loads((ROOT / 'source/tournament-sources.json').read_text(encoding='utf-8'))
CACHE = ROOT / '.tools/tournament-metadata-cache.json'
LOCK = asyncio.Lock()

class JsonLd(HTMLParser):
    def __init__(self):
        super().__init__(); self.active=False; self.parts=[]; self.blocks=[]
    def handle_starttag(self, tag, attrs):
        if tag=='script' and dict(attrs).get('type')=='application/ld+json':
            self.active=True; self.parts=[]
    def handle_data(self, data):
        if self.active: self.parts.append(data)
    def handle_endtag(self, tag):
        if tag=='script' and self.active:
            self.blocks.append(''.join(self.parts)); self.active=False

def parse_event(html):
    parser=JsonLd(); parser.feed(html)
    for block in parser.blocks:
        try: data=json.loads(block)
        except ValueError: continue
        if isinstance(data,dict) and data.get('@type')=='Event':
            if not isinstance(data.get('name'),str) or not data['name'].startswith('BKFC 94 '): continue
            # A missing or changed event date must not attach an old card to another bout.
            date=datetime.strptime(data['startDate'],'%b %d, %Y').strftime('%Y-%m-%d')
            if date!='2026-09-26': raise ValueError('Schedule changed; review required')
            name=data['name'].replace('MANCHESTER','Манчестер').replace('TILL vs ROMERO','Тилл — Ромеро')
            return {'originalTitle':data['name'],'title':name,'cancelled':str(data.get('eventStatus','')).endswith('EventCancelled')}
    raise ValueError('Event not found')

async def automatic(source):
    async with LOCK:
        try: cache=json.loads(CACHE.read_text(encoding='utf-8'))
        except (OSError,ValueError): cache={}
        old=cache.get(source,{})
        if time.time()-old.get('attempted_at',0)<86400: return old
        result={**old,'attempted_at':time.time(),'stale':True}
        try:
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=15)) as session:
                async with session.get(source,proxy=settings.proxy_url or None) as response:
                    if response.status!=200: raise ValueError('Source unavailable')
                    html=await response.text()
            result.update(parse_event(html)); result.update(checked_at=time.time(),stale=False)
        except (aiohttp.ClientError,asyncio.TimeoutError,ValueError,KeyError): pass
        cache[source]=result; CACHE.parent.mkdir(exist_ok=True)
        CACHE.write_text(json.dumps(cache,ensure_ascii=False),encoding='utf-8')
        return result

async def enrich(rows):
    output=[]
    for row in rows:
        item=dict(row); pair={row.get('home_team'),row.get('away_team')}; date=str(row.get('commence_time',''))[:10]
        for source in SOURCES:
            if not source['from']<=date<source['to'] or not any(set(p)==pair for p in source['pairs']): continue
            update=await automatic(source['source']) if source.get('auto') else {}
            checked=datetime.fromtimestamp(update['checked_at'],timezone.utc).strftime('%d.%m.%Y') if update.get('checked_at') else '06.09.2026'
            item['tournament']={'title':update.get('title',source['title']),'originalTitle':update.get('originalTitle',source.get('originalTitle','')),'stage':source['stage'],'source':source['source'],'checked':checked,
                'note':'Проверка JSON-LD раз в сутки; состав пар сверяется отдельно.' if source.get('auto') else 'Сверено вручную; автоматическое обновление не подключено.',
                'stale':update.get('stale',False),'groupSource':source.get('groupSource',source['source']),
                'cancelled':source.get('cancelled',False) or update.get('cancelled',False)}
            item['metadata_unavailable']=source.get('unavailable',False) or update.get('cancelled',False)
            break
        output.append(item)
    return output
