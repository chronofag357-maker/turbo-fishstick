"""API-Sport trial: one bookmaker, shared persistent cache, no background polling."""
import asyncio
import json
import math
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

import aiohttp
from bot.config import settings

BASE = 'https://api.api-sport.ru/v2'
BOOK = 'pari'
CACHE = Path(__file__).resolve().parents[2] / 'data' / 'esports-feed.json'
LOCK = asyncio.Lock()
COOLDOWN = 1800
DAILY_BUDGET = 10


def read_cache():
    try:
        return json.loads(CACHE.read_text(encoding='utf-8'))
    except (OSError, ValueError):
        return {}


def save_cache(data):
    CACHE.parent.mkdir(parents=True, exist_ok=True)
    temporary = CACHE.with_suffix('.tmp')
    temporary.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
    temporary.replace(CACHE)


def name(obj):
    obj = obj or {}
    return (obj.get('translations') or {}).get('ru') or obj.get('name') or 'Уточняется'


def normalize(match):
    book = (match.get('oddsBk') or {}).get(BOOK) or {}
    status = match.get('status')
    markets = []
    for slug, market in (book.get('markets') or {}).items():
        stakes = []
        for key, stake in (market.get('stakes') or {}).items():
            label = (stake.get('name') or {}).get('ru') or (stake.get('name') or {}).get('en') or key
            for line in (stake.get('lines') or [stake]):
                factor = line.get('factor')
                if type(factor) not in (int, float) or not math.isfinite(factor) or factor <= 1:
                    continue
                stakes.append({'key': key, 'label': label, 'argument': line.get('argument'), 'price': factor})
        if stakes:
            markets.append({'key': slug, 'name': (market.get('name') or {}).get('ru') or slug, 'stakes': stakes})
    return {'id': 'apisport-'+str(match['id']), 'status': status,
            'start': match.get('startTimestamp'), 'tournament': name(match.get('tournament')),
            'game': name(match.get('category')), 'teams': [name(match.get('homeTeam')), name(match.get('awayTeam'))],
            'score': [(match.get('homeScore') or {}).get('current'), (match.get('awayScore') or {}).get('current')],
            'markets': markets, 'active': bool(book.get('isBettingActive')) and status in ('notstarted', 'inprogress'),
            'updated': book.get('updatedAt')}


async def fetch_matches():
    today = datetime.now(timezone(timedelta(hours=3))).date()
    params = {'date_from': str(today), 'date_to': str(today+timedelta(days=2)),
              'with_bk_odds': 'true', 'bookmaker_ids': BOOK, 'view': 'odds',
              'page_size': '500', 'sort': 'asc'}
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
        async with session.get(BASE+'/esports/matches', params=params,
                               headers={'Authorization': settings.api_sport_key}) as response:
            if response.status != 200:
                raise ValueError({400: 'Запрос или доступ к спорту не разрешён API-Sport.',
                                  401: 'Ключ API-Sport недействителен или истёк.',
                                  403: 'Тариф не разрешает доступ.',
                                  429: 'Дневная квота API-Sport исчерпана.'}.get(response.status, 'API-Sport временно недоступен.'))
            data = await response.json()
            if not isinstance(data.get('matches'), list):
                raise ValueError('Неожиданный ответ API-Sport.')
            return {'events': [normalize(m) for m in data['matches']],
                    'total': data.get('totalMatches'), 'partial': data.get('totalPages', 1) > 1}


async def get_feed(refresh=False):
    async with LOCK:
        state = read_cache()
        now = time.time()
        day = datetime.now(timezone.utc).date().isoformat()
        count = state.get('requests', 0) if state.get('day') == day else 0
        if not settings.api_sport_key:
            return {**state, 'events': state.get('events', []), 'error': 'Ключ API-Sport не настроен.'}
        if (state and not refresh) or now-state.get('attempt', 0) < COOLDOWN or count >= DAILY_BUDGET:
            return {**state, 'events': state.get('events', []), 'cached': True,
                    'message': 'Сохранённая линия. Интервал обновления 30 минут; тестовый бюджет — 10 запросов в сутки.'}
        state.update(attempt=now, day=day, requests=count+1, bookmaker=BOOK)
        save_cache(state)  # Count failed attempts too; restarting cannot reset the budget.
        try:
            data = await fetch_matches()
            state.update(data, fetched_at=now, error=None)
        except (aiohttp.ClientError, asyncio.TimeoutError, ValueError) as exc:
            state['error'] = str(exc) if isinstance(exc, ValueError) else 'Нет ответа API-Sport. Сохранённые данные оставлены.'
        save_cache(state)
        return {**state, 'events': state.get('events', [])}
