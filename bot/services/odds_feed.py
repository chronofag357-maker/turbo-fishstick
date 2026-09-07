"""Server-only shared bookmaker feed, with owner-controlled refresh and backoff."""
import asyncio
import json
import time
from pathlib import Path

import aiohttp
from bot.config import settings

CACHE = Path(__file__).resolve().parents[2] / '.tools' / 'odds-cache.json'
LOCK = asyncio.Lock()
REFRESH_HOURS = 96
AUTO_ENABLED = None  # Legacy until application startup loads the private policy.
REFRESH_SECONDS = 96 * 3600

def configure_policy(policy):
    global AUTO_ENABLED, REFRESH_SECONDS
    AUTO_ENABLED = policy['enabled']
    REFRESH_SECONDS = policy['seconds']
REGIONS = 'us,us2,uk,eu,au'
SPORTS = {'mma': 'mma_mixed_martial_arts', 'boxing': 'boxing_boxing'}

LAST_MANUAL = {}
RETRY_AFTER = {}
FAILURES = {}

def datetime_live(event):
    from datetime import datetime
    try:
        return datetime.fromisoformat(event['commence_time'].replace('Z', '+00:00')).timestamp() <= time.time()
    except (KeyError, ValueError, TypeError):
        return False

async def get_feed(sport, force=False, event_id=None):
    async with LOCK:
        try:
            cache = json.loads(CACHE.read_text(encoding='utf-8'))
        except (OSError, ValueError):
            cache = {}
        old = cache.get(sport)
        if AUTO_ENABLED is False:
            return {**(old or {'events': []}), 'stale': True, 'auto_disabled': True,
                    'refresh_hours': REFRESH_SECONDS/3600, 'refresh_error': 'Автообновление отключено администратором.'}
        if time.time() < RETRY_AFTER.get(sport, 0):
            return {**(old or {'events': []}), 'stale': True, 'refresh_error': 'Повторный запрос отложен после ошибки источника.'}
        manual_key = (sport, event_id)
        if force and time.time() - LAST_MANUAL.get(manual_key, 0) < 60:
            return {**(old or {'events': []}), 'refresh_hours': REFRESH_HOURS, 'stale': not bool(old), 'manual_throttled': True}
        if force:
            LAST_MANUAL[manual_key] = time.time()
        effective_seconds = max(40 if old and any(datetime_live(e) for e in old.get('events', [])) else 60, REFRESH_SECONDS)
        if not force and old and old.get('regions') == REGIONS and time.time() - old['fetched_at'] < effective_seconds:
            return {**old, 'refresh_hours': effective_seconds/3600, 'stale': False, 'served_from_cache': True}
        try:
            if not settings.odds_api_key:
                raise ValueError('missing key')
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
                async def fetch_region(region):
                  async with session.get(
                    'https://api.the-odds-api.com/v4/sports/' + SPORTS[sport] + '/odds',
                    params={'apiKey': settings.odds_api_key, 'regions': region,
                            'markets': 'h2h,totals', 'oddsFormat': 'decimal',
                            **({'eventIds': event_id} if event_id else {})},
                    proxy=settings.proxy_url or None,
                ) as response:
                    if response.status != 200:
                        raise ValueError({401:'Доступ к поставщику отклонён: проверьте API-ключ.',403:'Поставщик запретил доступ.',429:'Поставщик ограничил запросы или исчерпан лимит API.'}.get(response.status,'Поставщик временно недоступен.'))
                    region_rows = await response.json()
                    if not isinstance(region_rows, list):
                        raise ValueError('invalid response')
                    for event in region_rows:
                        for book in event.get('bookmakers', []):
                            book['regions'] = [region]
                    return region_rows
                batches = await asyncio.gather(*(fetch_region(region) for region in REGIONS.split(',')))
                merged = {}
                for batch in batches:
                    for event in batch:
                        if event['id'] not in merged:
                            merged[event['id']] = event
                            continue
                        books = merged[event['id']]['bookmakers']
                        for book in event.get('bookmakers', []):
                            existing = next((b for b in books if b['key'] == book['key']), None)
                            if existing:
                                existing['regions'] = sorted(set(existing['regions'] + book['regions']))
                            else:
                                books.append(book)
                rows = list(merged.values())
            result = {'events': rows, 'fetched_at': time.time(), 'source': 'The Odds API', 'refresh_hours': effective_seconds/3600, 'regions': REGIONS}
            if event_id:
                updated = next((e for e in rows if e['id'] == event_id), None)
                if updated is None:
                    return {**(old or {'events': []}), 'stale': True, 'event_missing': True}
                updated['line_fetched_at'] = time.time()
                result = {**(old or result), 'events': [updated if e['id'] == event_id else e for e in (old or {'events': rows})['events']]}
            cache[sport] = result
            FAILURES[sport] = 0
            RETRY_AFTER[sport] = 0
            CACHE.parent.mkdir(exist_ok=True)
            CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding='utf-8')
            return {**result, 'stale': False}
        except (aiohttp.ClientError, asyncio.TimeoutError, ValueError) as exc:
            FAILURES[sport] = min(FAILURES.get(sport, 0)+1, 8)
            RETRY_AFTER[sport] = time.time()+min(3600, 60*2**(FAILURES[sport]-1))
            message = str(exc) if isinstance(exc, ValueError) else 'Не удалось связаться с поставщиком: сеть или время ожидания.'
            if old:
                return {**old, 'refresh_hours': REFRESH_HOURS, 'stale': True, 'refresh_error': message}
            return {'events': [], 'error': 'Линия временно недоступна. Попробуйте позже.', 'stale': True}
