"""Public sports feeds plus same-origin authenticated play-money accounts.

Wildcard CORS applies only to public data. Private routes validate Telegram
identity/server sessions, enforce admin rights and always return no-store.
"""

import logging
from pathlib import Path

from aiohttp import web

from bot.services.registry import sports_data

logger = logging.getLogger(__name__)


def _event_to_json(event) -> dict:
    data = {
        "id": event.id,
        "league": event.league,
        "home": event.home,
        "away": event.away,
        "time": event.start_time,
        "status": event.status,
    }
    if event.score:
        data["score"] = event.score
    return data


@web.middleware
async def cors_middleware(request: web.Request, handler):
    if request.path.startswith('/api/private/'):
        return await handler(request)
    if request.method == "OPTIONS":
        response = web.Response()
    else:
        response = await handler(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response.headers["Cache-Control"] = "no-store" if request.path in ('/api/odds', '/api/esports', '/api/esports-live') else "public, max-age=120"
    return response


async def get_events(request: web.Request) -> web.Response:
    sport = request.query.get("sport", "")
    if not sport:
        return web.json_response({"error": "укажите ?sport="}, status=400)
    events = await sports_data.list_events(sport)
    return web.json_response([_event_to_json(e) for e in events])


async def health(request: web.Request) -> web.Response:
    return web.json_response({"status": "ok"})


async def esports(request: web.Request) -> web.Response:
    from bot.services.esports_feed import get_feed
    from bot.config import settings
    from urllib.parse import urlsplit
    # Public reads never force paid refresh. Preview can refresh only on loopback.
    # Nginx also connects over loopback: disable that exception on a public deployment.
    local_deployment = urlsplit(settings.mini_app_url).hostname in ('localhost', '127.0.0.1', '::1')
    refresh = request.path.startswith('/api/private/') or (
        local_deployment and request.remote in ('127.0.0.1', '::1') and request.query.get('refresh') == '1')
    return web.json_response(await get_feed(refresh), headers={'Cache-Control': 'no-store'})


async def odds(request: web.Request) -> web.Response:
    from bot.services.odds_feed import get_feed, SPORTS
    sport = request.query.get('sport', 'mma')
    if sport not in SPORTS:
        return web.json_response({'error': 'Unknown sport'}, status=400)
    event_id = request.query.get('eventId')
    # Public refresh must not bypass the owner's global quota/interval policy.
    result = await get_feed(sport, force=False, event_id=event_id)
    return await format_odds(result, sport)


async def esports_live(request):
    from bot.services.esports_live import live
    from bot.config import settings
    from urllib.parse import urlsplit
    if not request.path.startswith('/api/private/'):
        if request.remote not in ('127.0.0.1', '::1') or urlsplit(settings.mini_app_url).hostname not in ('localhost', '127.0.0.1', '::1'):
            raise web.HTTPForbidden()
    body = await request.json()
    if not isinstance(body, dict):
        raise web.HTTPBadRequest()
    viewer = body.get('viewer')
    if not isinstance(viewer, str) or not 1 <= len(viewer) <= 80:
        raise web.HTTPBadRequest()
    key = (request.get('identity', {}).get('id', 'local'), viewer)
    return web.json_response(await live.touch(key, stop=body.get('stop') is True), headers={'Cache-Control': 'no-store'})


async def format_odds(result, sport):
    if sport == 'mma' and result.get('events'):
        from bot.services.tournament_metadata import enrich
        result = {**result, 'events': await enrich(result['events'])}
    if sport == 'boxing' and result.get('events'):
        from bot.services.boxing_metadata import enrich as enrich_boxing
        result = {**result, 'events': await enrich_boxing(result['events'])}
        from bot.services.thesportsdb import enrich as enrich_sportsdb
        result = {**result, 'events': await enrich_sportsdb(result['events'])}
    return web.json_response(result, status=503 if result.get('error') else 200)


async def index(request: web.Request) -> web.Response:
    page = (Path(__file__).resolve().parents[2] / "docs" / "index.html").read_text(encoding="utf-8")
    page = page.replace('window.MINI_APP_API_BASE = "";', 'window.MINI_APP_API_BASE = window.location.origin;')
    return web.Response(text=page, content_type="text/html", headers={"Cache-Control": "no-store"})


def create_app() -> web.Application:
    from bot.web.miniapp import install, private_middleware
    app = web.Application(middlewares=[cors_middleware, private_middleware], client_max_size=32768)
    install(app)
    app.router.add_get("/api/health", health)
    app.router.add_get("/api/esports", esports)
    app.router.add_post("/api/private/esports-refresh", esports)
    app.router.add_post("/api/private/esports-live", esports_live)
    app.router.add_post("/api/esports-live", esports_live)
    async def close_live(_app):
        from bot.services.esports_live import live
        await live.close()
    app.on_cleanup.append(close_live)
    app.router.add_get("/api/odds", odds)
    app.router.add_get("/api/events", get_events)
    app.router.add_route("OPTIONS", "/api/events", lambda _r: web.Response())
    app.router.add_get("/", index)
    app.router.add_static("/", Path(__file__).resolve().parents[2] / "docs", show_index=False)
    return app


async def run_api_server(port: int) -> web.AppRunner:
    runner = web.AppRunner(create_app())
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    logger.info("Mini App API слушает на порту %s", port)
    return runner


if __name__ == "__main__":
    from bot.config import settings
    web.run_app(create_app(), host="127.0.0.1", port=settings.mini_app_api_port)
