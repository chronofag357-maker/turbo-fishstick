import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch, AsyncMock
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer
from bot.web import miniapp
from bot.services.miniapp_store import Store


class PrivateAPITests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.store = Store(Path(self.tmp.name)/'db.sqlite3')
        self.store.init()
        self.store.allow(1, 2)
        self.owner = self.store.login(1, 'Owner', True)
        self.other = self.store.login(2, 'Other')
        self.patches = [patch.object(miniapp, 'store', self.store), patch.object(miniapp.settings, 'admin_ids', '1'),
                        patch('bot.db.repo.is_user_blocked', new=AsyncMock(return_value=False))]
        for p in self.patches:
            p.start()
        app = web.Application(middlewares=[miniapp.private_middleware], client_max_size=32768)
        app.router.add_get('/api/private/me', miniapp.me)
        app.router.add_get('/api/private/admin/report', miniapp.report)
        app.router.add_post('/api/private/admin/allow', miniapp.allow)
        app.router.add_post('/api/private/admin/result', miniapp.result)
        app.router.add_post('/api/private/bets', miniapp.place)
        app.router.add_post('/api/private/refresh', miniapp.refresh_event)
        self.client = TestClient(TestServer(app))
        await self.client.start_server()

    async def asyncTearDown(self):
        await self.client.close()
        for p in reversed(self.patches):
            p.stop()
        self.tmp.cleanup()

    def headers(self, token):
        return {'Authorization': 'Bearer '+token}

    async def test_access_controls_no_cache(self):
        r = await self.client.get('/api/private/me')
        self.assertEqual(r.status, 403)
        self.assertEqual(r.headers['Cache-Control'], 'no-store')
        r = await self.client.get('/api/private/admin/report', headers=self.headers(self.other))
        self.assertEqual(r.status, 403)
        r = await self.client.post('/api/private/admin/allow', json={'id': 3}, headers=self.headers(self.other))
        self.assertEqual(r.status, 403)
        r = await self.client.get('/api/private/me?id=1', headers=self.headers(self.other))
        self.assertEqual((await r.json())['id'], 2)
        r = await self.client.get('/api/private/admin/report', headers=self.headers(self.owner))
        self.assertEqual(r.status, 200)
        self.assertEqual(len((await r.json())['accounts']), 2)

    async def test_settlement_cannot_be_forged(self):
        r = await self.client.post('/api/private/admin/result', json={'key': 'fake', 'result': 'won', 'source': 'https://example.com', 'confirmed': True}, headers=self.headers(self.owner))
        self.assertEqual(r.status, 400)
        r = await self.client.post('/api/private/admin/result', json={}, headers=self.headers(self.other))
        self.assertEqual(r.status, 403)
        r = await self.client.post('/api/private/bets', json={'key': 'invalid', 'stake': -100, 'picks': []}, headers=self.headers(self.owner))
        self.assertEqual(r.status, 400)
        self.assertEqual(self.store.snapshot(1)['balance'], 456000)

    async def test_manual_refresh_requires_account(self):
        body = {'sport': 'mma', 'eventId': 'one'}
        r = await self.client.post('/api/private/refresh', json=body)
        self.assertEqual(r.status, 403)
        mocked = AsyncMock(return_value={'events': [], 'stale': False})
        with patch.object(miniapp, 'refresh_attempts', {}), patch('bot.services.odds_feed.get_feed', new=mocked):
            r = await self.client.post('/api/private/refresh', json=body, headers=self.headers(self.other))
            self.assertEqual(r.status, 200)
            mocked.assert_awaited_once_with('mma', force=True, event_id='one')

    async def test_accept_settle_refresh_across_sessions(self):
        from datetime import datetime, timezone
        import time
        now = datetime.now(timezone.utc).isoformat()
        feed = {'fetched_at': time.time(), 'events': [{'id': 'a', 'home_team': 'A', 'away_team': 'B',
            'commence_time': now, 'bookmakers': [{'key': 'book', 'last_update': now, 'markets': [
                {'key': 'h2h', 'outcomes': [{'name': 'A', 'price': 2}, {'name': 'B', 'price': 3}]}]}]}]}
        body = {'key': 'unique-request-key-1', 'stake': 100000, 'picks': [
            {'id': 'a', 'sport': 'mma', 'kind': 'outcomes', 'index': 0, 'sourceKey': 'book', 'value': 2, 'line': None}]}
        with patch('bot.services.odds_feed.get_feed', new=AsyncMock(return_value=feed)):
            r = await self.client.post('/api/private/bets', json=body, headers=self.headers(self.other))
            self.assertEqual(r.status, 200, await r.text())
            bet = await r.json()
            r = await self.client.post('/api/private/bets', json=body, headers=self.headers(self.other))
            self.assertEqual((await r.json())['id'], bet['id'])
        r = await self.client.post('/api/private/admin/result', json={
            'key': bet['picks'][0]['resultKey'], 'result': 'A', 'source': 'https://example.com/result', 'confirmed': True}, headers=self.headers(self.owner))
        self.assertEqual(r.status, 200, await r.text())
        second_session = self.store.login(2, 'Other')
        r = await self.client.get('/api/private/me', headers=self.headers(second_session))
        snap = await r.json()
        self.assertEqual(snap['balance'], 457000)
        self.assertEqual(snap['bets'][0]['status'], 'won')
        self.assertEqual(snap['stats']['profit'], 1000)


if __name__ == '__main__':
    unittest.main()
