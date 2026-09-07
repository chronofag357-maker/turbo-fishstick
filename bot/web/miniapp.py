"""Authenticated Mini App routes; tokens never appear in URLs or logs."""
import asyncio
import hashlib
import hmac
import json
import time
import logging
from contextlib import suppress
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path
from urllib.parse import parse_qsl, urlsplit

from aiohttp import web
from bot.config import settings
from bot.services.miniapp_store import Store, Conflict

store = Store(Path(__file__).resolve().parents[2] / 'data' / 'miniapp.sqlite3')


def validate_init_data(raw, token, now=None):
    try:
        if not isinstance(raw, str) or len(raw) > 12000:
            raise ValueError()
        pairs = parse_qsl(raw, keep_blank_values=True, strict_parsing=True)
        values = dict(pairs)
        if len(values) != len(pairs):
            raise ValueError()
        received = values.pop('hash')
        secret = hmac.new(b'WebAppData', token.encode(), hashlib.sha256).digest()
        expected = hmac.new(secret, '\n'.join(k+'='+v for k, v in sorted(values.items())).encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, received):
            raise ValueError()
        age = (time.time() if now is None else now)-int(values['auth_date'])
        if not -30 <= age <= 300:
            raise ValueError()
        user = json.loads(values['user'])
        if type(user.get('id')) is not int or not 0 < user['id'] < 2**52:
            raise ValueError()
        return user
    except (ValueError, KeyError, TypeError, InvalidOperation):
        raise PermissionError('Откройте Mini App заново через Telegram.') from None


async def call(method, *args):
    return await asyncio.to_thread(method, *args)


async def object_body(request):
    data = await request.json()
    if not isinstance(data, dict):
        raise ValueError('Ожидается объект JSON.')
    return data


@web.middleware
async def private_middleware(request, handler):
    if not request.path.startswith('/api/private/'):
        return await handler(request)
    try:
        if request.method != 'GET' and request.content_type != 'application/json':
            raise ValueError('Ожидается JSON.')
        if request.path != '/api/private/login':
            token = request.headers.get('Authorization', '').removeprefix('Bearer ')
            request['identity'] = await call(store.identity, token)
            request['token'] = token
            from bot.db.repo import is_user_blocked
            if await is_user_blocked(request['identity']['id']):
                raise PermissionError('Аккаунт заблокирован.')
            if request.path.startswith('/api/private/admin/') and request['identity']['id'] not in settings.admin_id_set:
                raise PermissionError('Доступ только администратору.')
        response = await handler(request)
    except PermissionError as exc:
        response = web.json_response({'error': str(exc)}, status=403)
    except Conflict as exc:
        response = web.json_response({'error': str(exc)}, status=409)
    except (ValueError, KeyError, TypeError, InvalidOperation):
        response = web.json_response({'error': 'Проверьте данные запроса.'}, status=400)
    response.headers['Cache-Control'] = 'no-store'
    return response


async def login(request):
    data = await object_body(request)
    if data.get('consent') is not True:
        raise ValueError('Необходимо согласие на журнал действий.')
    user = validate_init_data(data.get('initData'), settings.bot_token)
    from bot.db.repo import is_user_blocked
    if await is_user_blocked(user['id']):
        raise PermissionError('Аккаунт заблокирован.')
    token = await call(store.login, user['id'], ' '.join(str(user.get(k, '')) for k in ('first_name', 'last_name')).strip(), user['id'] in settings.admin_id_set)
    return web.json_response({'token': token})


async def me(request):
    uid = request['identity']['id']
    return web.json_response({**await call(store.snapshot, uid), 'admin': uid in settings.admin_id_set})


async def logout(request):
    await call(store.logout, request['token'])
    return web.json_response({'ok': True})


def verified_pick(p, feed, now):
    event = next((e for e in feed.get('events', []) if e['id'] == p['id']), None)
    if feed.get('error') or not event or event.get('line_invalid') or event.get('line_stale', feed.get('stale', False)):
        raise Conflict('Линия этого боя недоступна или устарела. Обновите его стрелочкой.')
    if not event or now-event.get('line_fetched_at', feed.get('fetched_at', 0)) > 120:
        raise Conflict('Линия устарела. Обновите бой перед оформлением.')
    book = next((b for b in event['bookmakers'] if b['key'] == p['sourceKey']), None)
    kind, index = p['kind'], p['index']
    if type(index) is not int or index not in (0, 1, 2) or kind not in ('outcomes', 'totals') or kind == 'totals' and index == 0:
        raise ValueError()
    selection = [event['home_team'], 'Draw', event['away_team']][index] if kind == 'outcomes' else ('Over' if index == 1 else 'Under')
    keys = ('h2h', 'h2h_3_way') if kind == 'outcomes' else ('totals',)
    found = None
    for market in (book or {}).get('markets', []):
        if market['key'] not in keys:
            continue
        for outcome in market['outcomes']:
            if outcome['name'] == selection and (kind == 'outcomes' or outcome.get('point') == p.get('line')):
                found = market, outcome
                break
        if found:
            break
    if not found:
        raise Conflict('Исход закрыт или отсутствует.')
    market, outcome = found
    timestamp = market.get('last_update') or book.get('last_update')
    if not timestamp or not -30 <= now-datetime.fromisoformat(timestamp.replace('Z', '+00:00')).timestamp() <= 120:
        raise Conflict('Котировка букмекера устарела. Пари не принято.')
    if Decimal(str(outcome['price'])) != Decimal(str(p['value'])):
        raise Conflict('Коэффициент изменился. Обновите бой и подтвердите новую линию.')
    fighters = [event['home_team'], event['away_team']]
    return {'id': event['id'], 'sport': p['sport'], 'kind': kind, 'index': index,
            'value': outcome['price'], 'line': outcome.get('point'), 'sourceKey': book['key'],
            'marketKey': market['key'], 'selection': selection,
            'fighters': fighters, 'label': selection, 'date': event['commence_time'],
            'startTime': event['commence_time'], 'source': book.get('title', book['key'])}


async def place(request):
    data = await object_body(request)
    if type(data.get('stake')) is not int or not 100000 <= data['stake'] <= 1000000:
        raise ValueError()
    uid = request['identity']['id']
    key = data['key']
    if not isinstance(key, str) or not 16 <= len(key) <= 80:
        raise ValueError()
    picks = data['picks']
    if not isinstance(picks, list) or not 1 <= len(picks) <= 20 or len({p['id'] for p in picks}) != len(picks):
        raise ValueError()
    digest = hashlib.sha256(json.dumps({'stake': data['stake'], 'picks': picks}, sort_keys=True).encode()).hexdigest()
    old = await call(store.existing, uid, key, digest)
    if old:
        return web.json_response(old)
    from bot.services.odds_feed import get_feed, SPORTS
    feeds = {}
    verified = []
    for p in picks:
        if p['sport'] not in SPORTS:
            raise ValueError()
        if p['sport'] not in feeds:
            feeds[p['sport']] = await get_feed(p['sport'])
        verified.append(verified_pick(p, feeds[p['sport']], time.time()))
    bet = await call(store.place, uid, key, digest, data['stake'], verified)
    return web.json_response(bet)


async def action(request):
    data = await object_body(request)
    if data.get('kind') not in ('select', 'remove', 'clear', 'open_history', 'open_fight', 'section'):
        raise ValueError()
    # Only bounded references, never arbitrary form values, passwords or initData.
    payload = {k: str(data[k])[:80] for k in ('event', 'market', 'index', 'section') if k in data}
    await call(store.action, request['identity']['id'], data['kind'], payload)
    return web.json_response({'ok': True})


async def refresh_event(request):
    data = await object_body(request)
    from bot.services.odds_feed import get_feed, SPORTS
    sport, event_id = data.get('sport'), data.get('eventId')
    if sport not in SPORTS or not isinstance(event_id, str) or not 1 <= len(event_id) <= 80 or not all(c.isalnum() or c in '-_' for c in event_id):
        raise ValueError()
    # Account-wide cap as well as the shared per-event 60-second cooldown.
    uid = request['identity']['id']
    now = time.monotonic()
    if now-refresh_attempts.get(uid, -100) < 5:
        raise Conflict('Подождите несколько секунд перед следующим обновлением.')
    refresh_attempts[uid] = now
    result = await get_feed(sport, force=True, event_id=event_id)
    await call(store.action, uid, 'manual_refresh', {'event': event_id, 'sport': sport, 'success': not result.get('stale')})
    from bot.web.api import format_odds
    return await format_odds(result, sport)


refresh_attempts = {}


async def report(request):
    return web.json_response({**await call(store.report), 'policy': await call(store.policy)})


async def allow(request):
    uid = (await object_body(request))['id']
    if type(uid) is not int or not 0 < uid < 2**52:
        raise ValueError()
    await call(store.allow, request['identity']['id'], uid)
    return web.json_response({'ok': True})


async def result(request):
    data = await object_body(request)
    key, value, source = data['key'], data['result'], data['source']
    if not isinstance(source, str) or len(source) > 500 or urlsplit(source).scheme != 'https' or not urlsplit(source).netloc:
        raise ValueError()
    # Only settle market references and participants from accepted server snapshots.
    report_data = await call(store.report)
    matching = [p for a in report_data['accounts'] for b in a['bets'] for p in b['picks'] if store.result_key(p) == key]
    if not matching or value not in {'void', 'Draw', 'Over', 'Under', *matching[0]['fighters']}:
        raise ValueError()
    allowed = {'void', 'Over', 'Under'} if matching[0]['kind'] == 'totals' else {'void', 'Draw', *matching[0]['fighters']}
    if value not in allowed or data.get('confirmed') is not True:
        raise ValueError()
    return web.json_response({'settled': await call(store.confirm_result, request['identity']['id'], key, value, source)})


async def policy(request):
    value = await call(store.save_policy, request['identity']['id'], await object_body(request))
    from bot.services.odds_feed import configure_policy
    configure_policy(value)
    return web.json_response(value)


async def startup(app):
    await call(store.init)
    from bot.db.engine import init_db
    await init_db()
    from bot.services.odds_feed import configure_policy
    configure_policy(await call(store.policy))


async def scheduler(app):
    async def run():
        from bot.services.odds_feed import get_feed, SPORTS
        while True:
            try:
                if (await call(store.policy))['enabled']:
                    for sport in SPORTS:
                        await get_feed(sport)
                await asyncio.sleep(10)
            except asyncio.CancelledError:
                raise
            except Exception:
                logging.getLogger(__name__).warning('Odds scheduler failed; retry delayed')
                await asyncio.sleep(60)
    task = asyncio.create_task(run())
    yield
    task.cancel()
    with suppress(asyncio.CancelledError):
        await task


def install(app):
    app.on_startup.append(startup)
    app.cleanup_ctx.append(scheduler)
    for method, path, handler in [('POST', 'login', login), ('GET', 'me', me), ('POST', 'logout', logout),
            ('POST', 'bets', place), ('POST', 'actions', action), ('POST', 'refresh', refresh_event), ('GET', 'admin/report', report),
            ('POST', 'admin/allow', allow), ('POST', 'admin/result', result), ('POST', 'admin/policy', policy)]:
        app.router.add_route(method, '/api/private/'+path, handler)
