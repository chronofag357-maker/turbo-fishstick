import asyncio
import copy
import time
import unittest
from unittest.mock import patch
from bot.services.esports_live import LiveFeed
from bot.services.esports_pick import verified_esports_pick
from bot.services.miniapp_store import Conflict


def message(price=2):
    return {'type': 'match_snapshot', 'sportSlug': 'esports', 'matchId': 1, 'timestamp': 1,
            'data': {'id': 1, 'status': 'inprogress', 'startTimestamp': time.time()*1000,
                     'homeTeam': {'name': 'A'}, 'awayTeam': {'name': 'B'},
                     'oddsBk': {'pari': {'isBettingActive': True, 'updatedAt': time.time()*1000,
                                        'markets': {'result': {'stakes': {'w1': {'factor': price}, 'w2': {'factor': 3}}}}}}}}


class LiveTests(unittest.IsolatedAsyncioTestCase):
    def test_map_scores_delta_and_missing_values(self):
        live = LiveFeed()
        msg = message()
        msg['data']['esports'] = {'bestOf': 5, 'games': [{'gameNumber': 1, 'status': 'inprogress',
            'homeScore': {'current': 17}, 'awayScore': {'current': 14},
            'statistics': {'home': {'goldEarned': 72000}}}]}
        live.apply(msg)
        details = live.events['apisport-1']['details']
        self.assertEqual(details['games'][0]['score'], [17, 14])
        self.assertEqual(details['games'][0]['statistics']['goldEarned'], [72000, None])
        live.apply({'type': 'match_delta', 'sportSlug': 'esports', 'matchId': 1, 'timestamp': 2,
            'changes': {'updated': {'homeScore': {'current': 1}, 'status': 'finished'}}})
        self.assertEqual(live.events['apisport-1']['score'], [1, None])
        self.assertEqual(live.events['apisport-1']['status'], 'finished')
        live.apply({'type': 'match_delta', 'sportSlug': 'esports', 'matchId': 1, 'timestamp': 3,
            'changes': {'updated': {'esports': {'games': {'0': {'homeScore': {'current': 18},
              'winnerCode': 1, 'status': 'finished'}}}}}})
        self.assertEqual(live.events['apisport-1']['details']['games'][0]['score'], [18, 14])
        self.assertEqual(live.events['apisport-1']['details']['games'][0]['winner'], 1)

    async def test_socket_protocol_and_stop_disconnect(self):
        from aiohttp import web
        from aiohttp.test_utils import TestServer
        subscriptions = []
        closed = asyncio.Event()
        async def handler(request):
            ws = web.WebSocketResponse()
            await ws.prepare(request)
            await ws.send_json({'type': 'connected'})
            async for packet in ws:
                subscriptions.append(packet.json())
                await ws.send_json({'type': 'subscribed'})
                await ws.send_json(message())
            closed.set()
            return ws
        app = web.Application()
        app.router.add_get('/', handler)
        server = TestServer(app)
        await server.start_server()
        live = LiveFeed()
        try:
            with patch('bot.services.esports_live.WS_URL', str(server.make_url('/')).replace('http:', 'ws:')), patch(
                'bot.services.esports_feed.read_cache', return_value={}), patch('bot.services.esports_live.settings.api_sport_key', 'offline'):
                await live.touch('viewer')
                await asyncio.wait_for(live.changed.wait(), 3)
                self.assertEqual(live.present()['live'], 'connected')
                self.assertTrue(live.present()['events'][0]['live_confirmed'])
                self.assertEqual(subscriptions[0], {'action': 'subscribe', 'type': 'sport', 'sportSlug': 'esports', 'withBkOdds': True})
                await live.touch('viewer', stop=True)
                await asyncio.wait_for(closed.wait(), 3)
        finally:
            await live.close()
            await server.close()

    def test_snapshots_deltas_delete_and_no_stale_markets(self):
        live = LiveFeed()
        live.apply(message())
        board = copy.deepcopy(message(2.2)['data']['oddsBk'])
        del board['pari']['markets']['result']['stakes']['w2']
        live.apply({'type': 'match_delta', 'sportSlug': 'esports', 'matchId': 1, 'timestamp': 2,
                    'changes': {'updated': {'oddsBk': board}}})
        stakes = live.events['apisport-1']['markets'][0]['stakes']
        self.assertEqual(len(stakes), 1)
        self.assertEqual(stakes[0]['price'], 2.2)
        live.apply(message())  # Older packet must not roll back prices.
        self.assertEqual(live.events['apisport-1']['markets'][0]['stakes'][0]['price'], 2.2)
        live.apply({'type': 'match_deleted', 'sportSlug': 'esports', 'matchId': 1, 'timestamp': 3})
        self.assertFalse(live.events)

    async def test_viewers_share_task_stop_and_expire(self):
        live = LiveFeed()
        async def wait():
            await asyncio.Future()
        with patch.object(live, 'run', wait), patch('bot.services.esports_feed.read_cache', return_value={}):
            await live.touch('a')
            task = live.task
            await live.touch('b')
            self.assertIs(task, live.task)
            await live.touch('a', stop=True)
            self.assertFalse(task.done())
            await live.touch('b', stop=True)
            self.assertTrue(task.done())
            live.leases['expired'] = time.monotonic()-1
            self.assertFalse(live.viewers())

    def test_verified_prices_closed_stale_and_forged(self):
        live = LiveFeed()
        live.apply(message())
        event = live.events['apisport-1']
        p = {'id': event['id'], 'kind': 'result', 'stakeKey': 'w1', 'sourceKey': 'pari', 'value': 2, 'line': None}
        f = {'events': [event]}
        self.assertEqual(verified_esports_pick(p, f, time.time())['selection'], 'w1')
        with self.assertRaises(Conflict):
            verified_esports_pick({**p, 'value': 20}, f, time.time())
        with self.assertRaises(Conflict):
            verified_esports_pick(p, f, time.time()+121)
        event['active'] = False
        with self.assertRaises(Conflict):
            verified_esports_pick(p, f, time.time())

if __name__ == '__main__':
    unittest.main()
