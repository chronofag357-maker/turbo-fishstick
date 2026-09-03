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


def create_app() -> web.Application:
    app = web.Application(middlewares=[cors_middleware])
    app.router.add_get("/api/health", health)
    app.router.add_get("/api/events", get_events)
    app.router.add_route("OPTIONS", "/api/events", lambda _r: web.Response())
    return app


async def run_api_server(port: int) -> None:
    runner = web.AppRunner(create_app())
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    logger.info("Mini App API слушает на порту %s", port)
