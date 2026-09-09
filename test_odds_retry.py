"""Offline regression tests: no provider requests or quota usage."""
import asyncio
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from bot.services import odds_feed as feed


class RetryTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.temp = tempfile.TemporaryDirectory()
        cache = Path(self.temp.name) / 'cache.json'
        cache.write_text(json.dumps({'mma': {'events': [
            {'id': 'a'}, {'id': 'b'}], 'fetched_at': 1}}))
        self.patches = [patch.object(feed, 'CACHE', cache),
                        patch.object(feed, 'LOCK', asyncio.Lock()),
                        patch.object(feed, 'AUTO_ENABLED', False),
                        patch.object(feed.settings, 'odds_api_key', 'test-only'),
                        patch.object(feed.time, 'time', return_value=1000)]
        for name in ('LAST_MANUAL', 'RETRY_AFTER', 'FAILURES', 'LAST_ERRORS'):
            self.patches.append(patch.object(feed, name, {}))
        for p in self.patches:
            p.start()

    async def asyncTearDown(self):
        for p in reversed(self.patches):
            p.stop()
        self.temp.cleanup()

    async def test_timeout_preserves_reason_and_other_fight_is_independent(self):
        with patch.object(feed.aiohttp, 'ClientSession', side_effect=asyncio.TimeoutError) as session:
            first = await feed.get_feed('mma', True, 'a')
            again = await feed.get_feed('mma', True, 'a')
            self.assertEqual(session.call_count, 1)
            self.assertTrue(again['manual_throttled'])
            self.assertNotIn('retry_at', first)
            await feed.get_feed('mma', True, 'b')
            self.assertEqual(session.call_count, 2)
            self.assertEqual(len(first['events']), 2)

    async def test_manual_request_ignores_provider_error_backoff(self):
        with patch.object(feed.aiohttp, 'ClientSession', side_effect=feed.ProviderError(429)) as session:
            await feed.get_feed('mma', True, 'a')
            result = await feed.get_feed('boxing', True, 'other')
            self.assertEqual(session.call_count, 2)
            self.assertIn('лимит', result['refresh_error'])

    async def test_only_fixed_manual_cooldown_remains(self):
        with patch.object(feed.aiohttp, 'ClientSession', side_effect=asyncio.TimeoutError) as session:
            await feed.get_feed('mma', True, 'a')
            with patch.object(feed.time, 'time', return_value=1061):
                result = await feed.get_feed('mma', True, 'a')
            self.assertEqual(session.call_count, 2)
            self.assertNotIn('retry_after_seconds', result)

    async def test_single_bookmaker_single_request(self):
        from unittest.mock import MagicMock, AsyncMock
        response = MagicMock(status=200)
        response.json = AsyncMock(return_value=[{'id':'a','bookmakers':[{'key':'onexbet'}]}])
        request = MagicMock()
        request.__aenter__ = AsyncMock(return_value=response)
        session = MagicMock()
        session.get.return_value = request
        context = MagicMock()
        context.__aenter__ = AsyncMock(return_value=session)
        with patch.object(feed.aiohttp, 'ClientSession', return_value=context):
            result = await feed.get_feed('mma', True, 'a')
        self.assertFalse(result['stale'])
        session.get.assert_called_once()
        params = session.get.call_args.kwargs['params']
        self.assertEqual(params['bookmakers'], 'onexbet')
        self.assertNotIn('regions', params)
        self.assertEqual(params['eventIds'], 'a')
        self.assertEqual(params['markets'], 'h2h,totals')

    async def test_logs_do_not_contain_exception_secrets(self):
        with patch.object(feed.aiohttp, 'ClientSession', side_effect=ValueError('apiKey=secret')):
            with self.assertLogs(feed.logger, level='WARNING') as logs:
                result = await feed.get_feed('mma', True, 'a')
        self.assertNotIn('secret', str(logs.output) + str(result))


if __name__ == '__main__':
    unittest.main()
