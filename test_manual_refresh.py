import asyncio
import json
import tempfile
import time
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch
from bot.services import odds_feed as feed
from bot.web.miniapp import verified_pick
from bot.services.miniapp_store import Conflict


class ManualRefreshTests(unittest.IsolatedAsyncioTestCase):
    async def test_single_event_off_cooldown_and_placement_validation(self):
        now = time.time()
        event = {'id': 'one', 'home_team': 'A', 'away_team': 'B', 'commence_time': '2099-01-01T00:00:00Z',
                 'bookmakers': [{'key': 'test', 'last_update': datetime.now(timezone.utc).isoformat(),
                    'markets': [{'key': 'h2h', 'outcomes': [{'name': 'A', 'price': 2}]}]}]}
        calls = []
        class Response:
            status = 200
            async def __aenter__(self): return self
            async def __aexit__(self, *args): pass
            async def json(self): return json.loads(json.dumps([event]))
        class Session:
            def __init__(self, **kwargs): pass
            async def __aenter__(self): return self
            async def __aexit__(self, *args): pass
            def get(self, url, **kwargs):
                calls.append(kwargs['params'])
                return Response()
        with tempfile.TemporaryDirectory() as tmp:
            cache = Path(tmp)/'cache.json'
            other = {**event, 'id': 'two'}
            cache.write_text(json.dumps({'mma': {'events': [event, other], 'fetched_at': now-9999, 'regions': feed.REGIONS}}))
            with patch.object(feed, 'CACHE', cache), patch.object(feed, 'AUTO_ENABLED', False), patch.object(feed, 'LOCK', asyncio.Lock()), patch.object(feed, 'LAST_MANUAL', {}), patch.object(feed, 'RETRY_AFTER', {}), patch.object(feed, 'FAILURES', {}), patch.object(feed.settings, 'odds_api_key', 'fixture'), patch.object(feed.aiohttp, 'ClientSession', Session):
                before = await feed.get_feed('mma')
                self.assertTrue(all(e['line_stale'] for e in before['events']))
                self.assertEqual(calls, [])
                refreshed = await feed.get_feed('mma', force=True, event_id='one')
                self.assertEqual(len(calls), 5)
                self.assertTrue(all(c['eventIds'] == 'one' for c in calls))
                self.assertEqual({e['id']: e['line_stale'] for e in refreshed['events']}, {'one': False, 'two': True})
                again = await feed.get_feed('mma', force=True, event_id='one')
                self.assertTrue(again['manual_throttled'])
                self.assertEqual(len(calls), 5)
                for_placement = await feed.get_feed('mma')
                p = {'id': 'one', 'sport': 'mma', 'sourceKey': 'test', 'kind': 'outcomes', 'index': 0, 'value': 2}
                self.assertEqual(verified_pick(p, for_placement, now)['value'], 2)
                with self.assertRaises(Conflict):
                    verified_pick({**p, 'id': 'two'}, for_placement, now)
                self.assertEqual(json.loads(cache.read_text())['mma']['fetched_at'], now-9999)


if __name__ == '__main__':
    unittest.main()
