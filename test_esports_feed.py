"""Offline trial-budget and provider-contract regression tests."""
import asyncio
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch
from bot.services import esports_feed as feed


class EsportsTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.patches = [patch.object(feed, 'CACHE', Path(self.tmp.name)/'cache.json'),
                        patch.object(feed, 'LOCK', asyncio.Lock()),
                        patch.object(feed.settings, 'api_sport_key', 'offline')]
        for p in self.patches:
            p.start()

    async def asyncTearDown(self):
        for p in reversed(self.patches):
            p.stop()
        self.tmp.cleanup()

    async def test_shared_cache_and_cooldown(self):
        with patch.object(feed, 'fetch_matches', AsyncMock(return_value={'events': []})) as fetch:
            await asyncio.gather(feed.get_feed(), feed.get_feed())
            await feed.get_feed(True)
            self.assertEqual(fetch.await_count, 1)
            self.assertEqual(feed.read_cache()['requests'], 1)

    async def test_failure_retains_snapshot_and_throttles(self):
        feed.save_cache({'events': [{'id': 'kept'}], 'fetched_at': 1})
        with patch.object(feed, 'fetch_matches', AsyncMock(side_effect=ValueError('denied'))) as fetch:
            result = await feed.get_feed(True)
            self.assertEqual(result['events'], [{'id': 'kept'}])
            self.assertEqual(result['error'], 'denied')
            await feed.get_feed(True)
            self.assertEqual(fetch.await_count, 1)

    async def test_budget_survives_restart(self):
        from datetime import datetime, timezone
        feed.save_cache({'events': [], 'day': datetime.now(timezone.utc).date().isoformat(), 'requests': 10})
        with patch.object(feed, 'fetch_matches', AsyncMock()) as fetch:
            await feed.get_feed(True)
            fetch.assert_not_called()

    def test_prices_names_and_inactive_market(self):
        match={'id': 5, 'status': 'finished', 'homeTeam': {'name': '<Team>'},
               'oddsBk': {'pari': {'isBettingActive': True, 'markets': {
                   'result': {'name': {'ru': 'Исход'}, 'stakes': {'w1': {'factor': 1.5}, 'w2': {'factor': float('nan')}}},
                   'total': {'stakes': {'over': {'lines': [{'argument': 2.5, 'factor': 1.9}]}}}}}}}
        result=feed.normalize(match)
        self.assertFalse(result['active'])
        self.assertEqual(result['teams'][0], '<Team>')
        self.assertEqual(len(result['markets'][0]['stakes']), 1)
        self.assertEqual(result['markets'][1]['stakes'][0]['argument'], 2.5)

    def test_no_bookmaker_no_fake_prices(self):
        self.assertEqual(feed.normalize({'id': 2, 'oddsBase': [{'price': 2}]})['markets'], [])


if __name__ == '__main__':
    unittest.main()
