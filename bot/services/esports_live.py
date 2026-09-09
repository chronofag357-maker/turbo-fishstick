"""One server-side provider WebSocket, leased only by visible Mini App viewers."""
import asyncio
import copy
import time
from contextlib import suppress
from urllib.parse import urlencode

import aiohttp
from bot.config import settings
from bot.services import esports_feed as feed

WS_URL = 'wss://ws.api.api-sport.ru/'


def merge(target, update):
    for key, value in update.items():
        if key == 'oddsBk' and isinstance(value, dict):
            target.setdefault(key, {}).update(copy.deepcopy(value))  # replace whole bookmaker boards
        elif isinstance(value, dict) and isinstance(target.get(key), dict):
            merge(target[key], value)
        else:
            if self.status == 'error':
                return self.present()
            target[key] = copy.deepcopy(value)


class LiveFeed:
    def __init__(self):
        self.leases = {}
        self.task = None
        self.raw = {}
        self.events = {}
        self.status = 'stopped'
        self.error = ''
        self.messages = 0
        self.last_message = None
        self.timestamps = {}
        self.changed = asyncio.Event()

    def viewers(self):
        now = time.monotonic()
        self.leases = {k: v for k, v in self.leases.items() if v > now}
        return bool(self.leases)

    async def touch(self, key, stop=False):
        if stop:
            self.leases.pop(key, None)
            if not self.viewers():
                await self.close()
        else:
            self.leases[key] = time.monotonic()+12
            if self.task is None or self.task.done():
                self.events = {e['id']: e for e in feed.read_cache().get('events', [])}
                self.status, self.error = 'connecting', ''
                self.task = asyncio.create_task(self.run())
        return self.present()

    def present(self):
        state = feed.read_cache()
        events = list(self.events.values()) if self.task is not None else state.get('events', [])
        # A disconnected stream cannot make old quotes fresh for placement.
        events = [{**e, 'live_confirmed': self.status == 'connected' and int(e['id'].removeprefix('apisport-')) in self.raw} for e in events]
        return {**state, 'events': events, 'live': self.status, 'live_error': self.error,
                'live_messages': self.messages, 'last_live_message': self.last_message}

    def apply(self, msg):
        if msg.get('sportSlug') != 'esports' or not isinstance(msg.get('matchId'), int):
            return
        mid, typ = msg['matchId'], msg.get('type')
        stamp = msg.get('timestamp', 0)
        if not isinstance(stamp, (int, float)) or stamp < self.timestamps.get(mid, 0):
            return
        self.timestamps[mid] = stamp
        if typ == 'match_deleted':
            self.raw.pop(mid, None)
            self.events.pop('apisport-'+str(mid), None)
        elif typ == 'match_snapshot' and isinstance(msg.get('data'), dict):
            self.raw[mid] = copy.deepcopy(msg['data'])
            self.raw[mid]['id'] = mid
        elif typ == 'match_delta' and mid in self.raw:
            changes = msg.get('changes') or {}
            for field in ('added', 'updated'):
                merge(self.raw[mid], changes.get(field) or {})
        else:
            return
        if mid in self.raw:
            event = feed.normalize(self.raw[mid])
            event['line_received_at'] = time.time()
            self.events[event['id']] = event
        self.messages += 1
        self.last_message = time.time()
        self.changed.set()

    async def run(self):
        delay = 1
        try:
            while self.viewers():
                self.status = 'connecting'
                self.raw.clear()
                self.timestamps.clear()
                try:
                    if not settings.api_sport_key:
                        self.status, self.error = 'error', 'Ключ API-Sport не настроен.'
                        return
                    url = WS_URL+'?'+urlencode({'apiKey': settings.api_sport_key})
                    async with aiohttp.ClientSession() as session:
                        async with session.ws_connect(url, heartbeat=20, max_msg_size=8*1024*1024, timeout=10) as ws:
                            subscribed = set()
                            async def subscribe(mid):
                                if mid in subscribed:
                                    return
                                subscribed.add(mid)
                                await ws.send_json({'action': 'subscribe', 'type': 'match', 'sportSlug': 'esports', 'matchId': mid, 'withBkOdds': True})
                            while self.viewers():
                                try:
                                    packet = await ws.receive(timeout=3)
                                except asyncio.TimeoutError:
                                    continue
                                if packet.type != aiohttp.WSMsgType.TEXT:
                                    break
                                msg = packet.json()
                                if msg.get('type') == 'connected':
                                    await ws.send_json({'action': 'subscribe', 'type': 'sport', 'sportSlug': 'esports', 'withBkOdds': True})
                                    for event in list(self.events.values()):
                                        if event.get('status') not in ('finished', 'canceled', 'cancelled'):
                                            with suppress(ValueError):
                                                await subscribe(int(event['id'].removeprefix('apisport-')))
                                elif msg.get('type') in ('subscribed', 'already_subscribed'):
                                    self.status, self.error, delay = 'connected', '', 1
                                elif msg.get('type') == 'error':
                                    self.status, self.error = 'error', 'API-Sport отклонил Live-подписку: '+str(msg.get('code', 'ERROR'))[:60]
                                    return
                                else:
                                    if msg.get('type') == 'match_delta' and msg.get('matchId') not in self.raw:
                                        await subscribe(msg['matchId'])
                                    self.apply(msg)
                            if ws.close_code == 1008:
                                self.status, self.error = 'error', 'API-Sport отклонил соединение: проверьте ключ и доступ к WebSocket.'
                                return
                except (aiohttp.ClientError, asyncio.TimeoutError, ValueError, TypeError, KeyError):
                    self.error = 'Live-соединение прервано. Переподключаемся.'
                if not self.viewers():
                    break
                self.status = 'reconnecting'
                await asyncio.sleep(delay)
                delay = min(delay*2, 30)
        finally:
            if self.status != 'error':
                self.status = 'stopped'

    async def close(self):
        self.leases.clear()
        if self.task and not self.task.done():
            self.task.cancel()
            with suppress(asyncio.CancelledError):
                await self.task
        self.status = 'stopped'


live = LiveFeed()
