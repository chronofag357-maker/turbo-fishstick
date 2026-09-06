"""Tiny read-only HTTP API the Mini App (docs/, static GitHub Pages) fetches
live data from — GitHub Pages can't hold the RapidAPI key itself, so this
runs next to the bot's polling loop and holds it instead.

Wraps the same `sports_data` used by the Telegram bot handlers (see
bot/services/registry.py), so a sport shows real data here exactly when it
does in the chat — nothing sport-specific lives in this module.

CORS is wide open (GET-only, no cookies/auth involved): this only ever
returns the same public schedule data the Mini App already ships as a
demo/fallback copy, so there's nothing here worth restricting the origin for.
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
    if request.method == "OPTIONS":
        response = web.Response()
    else:
        response = await handler(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response.headers["Cache-Control"] = "public, max-age=120"
    return response


async def get_events(request: web.Request) -> web.Response:
    sport = request.query.get("sport", "")
    if not sport:
        return web.json_response({"error": "укажите ?sport="}, status=400)
    events = await sports_data.list_events(sport)
    return web.json_response([_event_to_json(e) for e in events])


async def health(request: web.Request) -> web.Response:
    return web.json_response({"status": "ok"})


async def odds(request: web.Request) -> web.Response:
    from bot.services.odds_feed import get_feed, SPORTS
    sport = request.query.get('sport', 'mma')
    if sport not in SPORTS:
        return web.json_response({'error': 'Unknown sport'}, status=400)
    event_id = request.query.get('eventId')
    result = await get_feed(sport, force=request.query.get('refresh') == '1' and bool(event_id), event_id=event_id)
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
    app = web.Application(middlewares=[cors_middleware])
    app.router.add_get("/api/health", health)
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
