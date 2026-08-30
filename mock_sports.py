from bot.services.adapters.base import Competitor, Event, SportsDataAdapter
from bot.services.adapters.mock_data import COMPETITORS, EVENTS


class MockSportsDataAdapter(SportsDataAdapter):
    async def list_events(self, sport: str) -> list[Event]:
        return EVENTS.get(sport, [])

    async def get_event(self, event_id: str) -> Event | None:
        for events in EVENTS.values():
            for event in events:
                if event.id == event_id:
                    return event
        return None

    async def get_competitor(self, sport: str, name: str) -> Competitor | None:
        for competitor in COMPETITORS.get(sport, []):
            if competitor.name == name or competitor.id == name:
                return competitor
        return None

    async def list_competitors(self, sport: str) -> list[Competitor]:
        return COMPETITORS.get(sport, [])
