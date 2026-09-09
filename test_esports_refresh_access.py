"""Deployment regression: a reverse proxy is not a local preview user."""
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from bot.config import settings
from bot.web.api import esports


class RefreshAccessTests(unittest.IsolatedAsyncioTestCase):
    async def test_public_proxy_cannot_force_refresh(self):
        request = SimpleNamespace(path='/api/esports', remote='127.0.0.1', query={'refresh': '1'})
        with patch.object(settings, 'mini_app_url', 'https://example.com/'), patch(
            'bot.services.esports_feed.get_feed', AsyncMock(return_value={'events': []})
        ) as feed:
            await esports(request)
            feed.assert_awaited_once_with(False)

    async def test_private_route_can_refresh_after_middleware_auth(self):
        request = SimpleNamespace(path='/api/private/esports-refresh', remote='127.0.0.1', query={})
        with patch.object(settings, 'mini_app_url', 'https://example.com/'), patch(
            'bot.services.esports_feed.get_feed', AsyncMock(return_value={'events': []})
        ) as feed:
            await esports(request)
            feed.assert_awaited_once_with(True)

    async def test_local_preview_can_refresh(self):
        request = SimpleNamespace(path='/api/esports', remote='127.0.0.1', query={'refresh': '1'})
        with patch.object(settings, 'mini_app_url', 'http://127.0.0.1:8081/'), patch(
            'bot.services.esports_feed.get_feed', AsyncMock(return_value={'events': []})
        ) as feed:
            await esports(request)
            feed.assert_awaited_once_with(True)


if __name__ == '__main__':
    unittest.main()
