"""Adapter interfaces for external data sources.

Per the bot passport's architectural principle, every external source (Sportradar,
Sofascore, API-Football, news, speech-to-text, LLM...) is wired in behind one of
these interfaces and normalized to the internal data shapes below. Swapping a mock
adapter for a real one later means implementing one of these classes and pointing
`bot/services/registry.py` at it — no handler code changes.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class Competitor:
    id: str
    sport: str
    name: str
    rating: float  # internal strength rating, 0-100, used by the analytics engine


@dataclass
class Event:
    id: str
    sport: str
    league: str
    home: str
    away: str
    start_time: str
    status: str  # "scheduled" | "live" | "finished"
    score: str | None = None


@dataclass
class OddsQuote:
    bookmaker: str
    home_win: float
    draw: float | None
    away_win: float
    updated_at: str


@dataclass
class NewsItem:
    title: str
    source: str
    confirmed: bool
    published_at: str


class SportsDataAdapter(ABC):
    @abstractmethod
    async def list_events(self, sport: str) -> list[Event]: ...

    @abstractmethod
    async def get_event(self, event_id: str) -> Event | None: ...

    @abstractmethod
    async def get_competitor(self, sport: str, name: str) -> Competitor | None: ...

    @abstractmethod
    async def list_competitors(self, sport: str) -> list[Competitor]: ...


class OddsAdapter(ABC):
    @abstractmethod
    async def get_odds(self, event_id: str) -> list[OddsQuote]: ...


class NewsAdapter(ABC):
    @abstractmethod
    async def get_news(self, sport: str, subject: str | None = None) -> list[NewsItem]: ...


class SpeechToTextAdapter(ABC):
    @abstractmethod
    async def transcribe(self, voice_bytes: bytes) -> str: ...


class NLUAdapter(ABC):
    """Natural-language understanding / free-text explanation (function 7).

    Intent detection and explanation only — probability math always comes from the
    analytics engine (bot/services/analytics.py), never from the LLM, per the
    passport's stated risk: "расчёт вероятностей не должен выполняться исключительно LLM".
    """

    @abstractmethod
    async def answer(self, question: str) -> str: ...
