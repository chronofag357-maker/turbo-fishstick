"""Real sports-data adapter for boxing, backed by Boxing Data API on RapidAPI
(rapidapi.com/bengroves1993/api/boxing-data-api).

Covers `list_events`/`get_event`/`list_competitors`/`get_competitor` for
sport="boxing" only — this provider has no MMA data and no odds endpoint,
so MMA and the odds/arbitrage functions keep using their mock adapters (see
registry.py). The free tier only returns fights within a short forward/back
window (`days`), which is also why results are cached rather than re-fetched
on every call.

Real fighters have no strength rating in this API, so every competitor comes
back with a neutral rating — enough for the analytics engine to run without
crashing, but it won't produce a meaningful edge until a real rating source
exists.
"""

import logging
import time

import aiohttp

from bot.services.adapters.base import Competitor, Event, SportsDataAdapter

logger = logging.getLogger(__name__)

_BASE_URL = "https://boxing-data-api.p.rapidapi.com/v2"
_HOST = "boxing-data-api.p.rapidapi.com"
_NEUTRAL_RATING = 70.0


class BoxingDataApiAdapter(SportsDataAdapter):
    def __init__(self, api_key: str, days: int = 5, ttl_seconds: int = 900) -> None:
        self._api_key = api_key
        self._days = days
        self._ttl_seconds = ttl_seconds
        self._cached_at: float = 0.0
        self._cached_events: list[Event] = []

    async def _schedule(self) -> list[Event]:
        if self._cached_events and time.monotonic() - self._cached_at < self._ttl_seconds:
            return self._cached_events

        headers = {"X-RapidAPI-Key": self._api_key, "X-RapidAPI-Host": _HOST}
        params = {"days": str(self._days), "page_size": "25", "date_sort": "ASC"}
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{_BASE_URL}/fights/schedule",
                    headers=headers,
                    params=params,
                    timeout=aiohttp.ClientTimeout(total=12),
                ) as resp:
                    if resp.status in (401, 403):
                        logger.warning("Boxing Data API: ключ отклонён (HTTP %s)", resp.status)
                        return self._cached_events
                    resp.raise_for_status()
                    payload = await resp.json()
        except (aiohttp.ClientError, TimeoutError) as exc:
            logger.warning("Boxing Data API недоступен: %s", exc)
            return self._cached_events

        rows = payload.get("data") or []
        if isinstance(rows, dict):
            rows = [rows]
        events = [e for e in (_to_event(row) for row in rows) if e is not None]

        self._cached_at = time.monotonic()
        self._cached_events = events
        return events

    async def list_events(self, sport: str) -> list[Event]:
        if sport != "boxing":
            return []
        return await self._schedule()

    async def get_event(self, event_id: str) -> Event | None:
        for event in await self._schedule():
            if event.id == event_id:
                return event
        return None

    async def get_competitor(self, sport: str, name: str) -> Competitor | None:
        if sport != "boxing":
            return None
        for event in await self._schedule():
            if name in (event.home, event.away):
                return Competitor(id=name, sport="boxing", name=name, rating=_NEUTRAL_RATING)
        return None

    async def list_competitors(self, sport: str) -> list[Competitor]:
        if sport != "boxing":
            return []
        seen: dict[str, Competitor] = {}
        for event in await self._schedule():
            for name in (event.home, event.away):
                seen.setdefault(name, Competitor(id=name, sport="boxing", name=name, rating=_NEUTRAL_RATING))
        return list(seen.values())


def _to_event(row: dict) -> Event | None:
    fighters = row.get("fighters") or {}
    fighter_1 = fighters.get("fighter_1") or {}
    fighter_2 = fighters.get("fighter_2") or {}
    home = fighter_1.get("full_name") or fighter_1.get("name")
    away = fighter_2.get("full_name") or fighter_2.get("name")
    if not home or not away or not row.get("id"):
        return None

    raw_date = row.get("date") or ""
    start_time = raw_date[:16].replace("T", " ") if raw_date else "дата уточняется"
    division = (row.get("division") or {}).get("name")

    return Event(
        id=str(row["id"]),
        sport="boxing",
        league=row.get("title") or division or "Бокс",
        home=home,
        away=away,
        start_time=start_time,
        status="scheduled",
    )
