"""Routes each sport to a specific SportsDataAdapter, mock by default.

Lets one sport (currently boxing, see registry.py) go live on a real data
source while the rest keep using demo data — handlers only ever see
`SportsDataAdapter` and never know which sport is real vs mock.
"""

from bot.services.adapters.base import Competitor, Event, SportsDataAdapter


class CompositeSportsDataAdapter(SportsDataAdapter):
    def __init__(self, default: SportsDataAdapter, overrides: dict[str, SportsDataAdapter]) -> None:
        self._default = default
        self._overrides = overrides

    def _adapter_for(self, sport: str) -> SportsDataAdapter:
        return self._overrides.get(sport, self._default)

    async def list_events(self, sport: str) -> list[Event]:
        return await self._adapter_for(sport).list_events(sport)

    async def get_event(self, event_id: str) -> Event | None:
        # event_id alone doesn't say which sport it belongs to, so check every
        # distinct adapter in play (small, fixed set — one per sport at most).
        for adapter in {self._default, *self._overrides.values()}:
            event = await adapter.get_event(event_id)
            if event is not None:
                return event
        return None

    async def get_competitor(self, sport: str, name: str) -> Competitor | None:
        return await self._adapter_for(sport).get_competitor(sport, name)

    async def list_competitors(self, sport: str) -> list[Competitor]:
        return await self._adapter_for(sport).list_competitors(sport)
