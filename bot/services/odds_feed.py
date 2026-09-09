"""Server-only shared bookmaker feed, with owner-controlled refresh and backoff."""
import asyncio
import json
import logging
import math
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
REGIONS = 'eu'
BOOKMAKER = 'onexbet'
SPORTS = {'mma': 'mma_mixed_martial_arts', 'boxing': 'boxing_boxing'}

LAST_MANUAL = {}
RETRY_AFTER = {}
FAILURES = {}
LAST_ERRORS = {}
PROVIDER_KEY = ('provider', None)
logger = logging.getLogger(__name__)


class ProviderError(ValueError):
    def __init__(self, status):
        self.status = status
        super().__init__({401: 'Доступ к поставщику отклонён: проверьте API-ключ.',
                          403: 'Поставщик запретил доступ.',
                          429: 'Поставщик ограничил запросы или исчерпан лимит API.'
                          }.get(status, f'Поставщик вернул HTTP {status}.'))


def retry_result(old, key):
    remaining = max(0, math.ceil(RETRY_AFTER.get(key, 0) - time.time()))
    reason = LAST_ERRORS[key]
    return present(old, stale=True, refresh_hours=REFRESH_SECONDS/3600,
                   retry_after_seconds=remaining, retry_at=RETRY_AFTER[key],
                   refresh_error_reason=reason,
                   refresh_error=f'{reason} Повторить можно через {remaining} сек.')

def datetime_live(event):
    from datetime import datetime
    try:
        return datetime.fromisoformat(event['commence_time'].replace('Z', '+00:00')).timestamp() <= time.time()
    except (KeyError, ValueError, TypeError):
        return False

def present(feed, **flags):
    result = {**(feed or {'events': []}), **flags}
    result['events'] = [{**e, 'line_stale': bool(e.get('line_invalid')) or
                         time.time()-e.get('line_fetched_at', result.get('fetched_at', 0)) > 120}
                        for e in result['events']]
    return result

async def get_feed(sport, force=False, event_id=None):
    async with LOCK:
        try:
            cache = json.loads(CACHE.read_text(encoding='utf-8'))
        except (OSError, ValueError):
            cache = {}
        old = cache.get(sport)
        if force and not event_id:
            raise ValueError('Manual refresh requires an event')
        if AUTO_ENABLED is False and not force:
            return present(old, stale=True, auto_disabled=True,
                           refresh_hours=REFRESH_SECONDS/3600, refresh_error='Автообновление отключено. Можно обновить выбранный бой стрелочкой.')
        manual_key = (sport, event_id)
        # Only credential/quota failures affect other fights. Network and event
        # failures have independent retry windows, including automatic refresh.
        retry_key = manual_key if force else (sport, None)
        # No long application-side error lockout for manual requests.
        # Background retries retain backoff so the scheduler cannot hammer a
        # failing provider every ten seconds.
        if not force:
            for key in (PROVIDER_KEY, retry_key):
                if time.time() < RETRY_AFTER.get(key, 0):
                    return retry_result(old, key)
        if force and time.time() - LAST_MANUAL.get(manual_key, 0) < 60:
            return present(old, refresh_hours=REFRESH_SECONDS/3600, stale=not bool(old), manual_throttled=True)
        if force:
            LAST_MANUAL[manual_key] = time.time()
        effective_seconds = max(40 if old and any(datetime_live(e) for e in old.get('events', [])) else 60, REFRESH_SECONDS)
        if not force and old and old.get('bookmaker_scope') == BOOKMAKER and time.time() - old['fetched_at'] < effective_seconds:
            return present(old, refresh_hours=effective_seconds/3600, stale=False, served_from_cache=True)
        try:
            if not settings.odds_api_key:
                raise ValueError('missing key')
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
                async def fetch_region(region):
                  async with session.get(
                    'https://api.the-odds-api.com/v4/sports/' + SPORTS[sport] + '/odds',
                    params={'apiKey': settings.odds_api_key, 'bookmakers': BOOKMAKER,
                            'markets': 'h2h,totals', 'oddsFormat': 'decimal',
                            **({'eventIds': event_id} if event_id else {})},
                    proxy=settings.proxy_url or None,
                ) as response:
                    if response.status != 200:
                        raise ProviderError(response.status)
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
            result = {'events': rows, 'fetched_at': time.time(), 'source': 'The Odds API', 'refresh_hours': effective_seconds/3600, 'regions': REGIONS, 'bookmaker_scope': BOOKMAKER}
            if event_id:
                updated = next((e for e in rows if e['id'] == event_id), None)
                if updated is None:
                    if old:
                        for e in old['events']:
                            if e['id'] == event_id:
                                e['line_invalid'] = True
                        cache[sport] = old
                        CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding='utf-8')
                    return {**(old or {'events': []}), 'stale': True, 'event_missing': True}
                updated['line_fetched_at'] = time.time()
                result = {**(old or result), 'events': [e for e in (old or {'events': []})['events'] if e['id'] != event_id] + [updated]}
            cache[sport] = result
            for key in (retry_key, PROVIDER_KEY):
                FAILURES.pop(key, None)
                RETRY_AFTER.pop(key, None)
                LAST_ERRORS.pop(key, None)
            CACHE.parent.mkdir(exist_ok=True)
            CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding='utf-8')
            return present(result, stale=False)
        except (aiohttp.ClientError, asyncio.TimeoutError, ValueError) as exc:
            if force and old:
                for e in old['events']:
                    if e['id'] == event_id:
                        e['line_invalid'] = True
                cache[sport] = old
                CACHE.write_text(json.dumps(cache, ensure_ascii=False), encoding='utf-8')
            if isinstance(exc, ProviderError) and exc.status in (401, 403, 429):
                retry_key = PROVIDER_KEY
            FAILURES[retry_key] = min(FAILURES.get(retry_key, 0)+1, 8)
            RETRY_AFTER[retry_key] = time.time()+min(3600, 60*2**(FAILURES[retry_key]-1))
            # Never log raw exceptions: request URLs can contain the API key.
            message = (str(exc) if isinstance(exc, ProviderError) else
                       'Поставщик не ответил за 30 секунд.' if isinstance(exc, asyncio.TimeoutError) else
                       'Ошибка соединения с поставщиком.' if isinstance(exc, aiohttp.ClientError) else
                       'Ключ поставщика не настроен.' if not settings.odds_api_key else
                       'Поставщик вернул некорректные данные.')
            LAST_ERRORS[retry_key] = message
            logger.warning('Odds refresh failed: sport=%s scope=%s reason=%s retry_seconds=%s',
                           sport, 'provider' if retry_key == PROVIDER_KEY else 'event' if force else 'auto',
                           message, math.ceil(RETRY_AFTER[retry_key]-time.time()))
            if force:
                return present(old, stale=True, refresh_error_reason=message,
                               refresh_error=message)
            return retry_result(old, retry_key)
