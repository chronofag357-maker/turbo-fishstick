"""Turns a free-text sports question into deterministic, safe factual context.

The LLM never receives provider credentials and is not asked to calculate or
invent odds.  New live data providers only need to implement ``OddsAdapter``;
this service keeps handlers and prompts independent from a provider.
"""

from dataclasses import dataclass
import re

from bot.constants import MVP_SPORTS
from bot.services.adapters.base import Event, OddsAdapter, SportsDataAdapter


@dataclass(frozen=True)
class ContextResult:
    direct_answer: str | None = None
    llm_context: str = ""


_ODDS_WORDS = ("коэффициент", "коэф", "кэф", "ставк", "п1", "п2", "линия")
_IGNORED_TOKENS = {
    "какие", "какой", "покажи", "дай", "нужны", "нужен", "будут", "сейчас",
    "на", "по", "для", "бой", "матч", "игра", "коэффициенты", "ставки",
}


def _tokens(value: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[\wёЁ]+", value.lower())
        if len(token) > 1 and token not in _IGNORED_TOKENS
    }


def _is_odds_question(question: str) -> bool:
    lowered = question.lower()
    return any(word in lowered for word in _ODDS_WORDS)


async def _find_event(question: str, sports_data: SportsDataAdapter) -> Event | None:
    question_tokens = _tokens(question)
    candidates: list[tuple[int, Event]] = []
    for sport, _ in MVP_SPORTS:
        for event in await sports_data.list_events(sport):
            event_tokens = _tokens(f"{event.home} {event.away} {event.league}")
            score = len(question_tokens & event_tokens)
            if score:
                candidates.append((score, event))

    if not candidates:
        return None
    candidates.sort(key=lambda item: item[0], reverse=True)
    best_score, best_event = candidates[0]
    second_score = candidates[1][0] if len(candidates) > 1 else 0
    return best_event if best_score > second_score else None


def _format_odds(event: Event, quotes: list) -> str:
    lines = [
        f"💰 Коэффициенты: {event.home} — {event.away}",
        f"Турнир: {event.league}",
        f"Начало: {event.start_time}",
        "",
    ]
    for quote in quotes:
        row = f"{quote.bookmaker}: П1 {quote.home_win}"
        if quote.draw is not None:
            row += f" | X {quote.draw}"
        row += f" | П2 {quote.away_win}"
        lines.append(row)
    lines.extend(
        [
            "",
            f"Обновлено: {quotes[0].updated_at}",
            "Источник: текущий адаптер коэффициентов. Пока не подключён лицензированный "
            "поставщик, эти значения являются демонстрационными.",
        ]
    )
    return "\n".join(lines)


async def build_sports_context(
    question: str, sports_data: SportsDataAdapter, odds_data: OddsAdapter
) -> ContextResult:
    """Return deterministic odds when the event is identified, otherwise LLM facts."""
    if not _is_odds_question(question):
        return ContextResult()

    event = await _find_event(question, sports_data)
    if event is None:
        return ContextResult(
            llm_context=(
                "Пользователь запрашивает коэффициенты, но событие не удалось однозначно "
                "определить. Попроси назвать обоих участников. Не называй никаких чисел."
            )
        )

    quotes = await odds_data.get_odds(event.id)
    if not quotes:
        return ContextResult(
            llm_context=(
                f"Событие найдено: {event.home} — {event.away}, {event.league}, "
                f"{event.start_time}. Коэффициенты от активного поставщика недоступны. "
                "Сообщи это прямо и не придумывай значения."
            )
        )
    return ContextResult(direct_answer=_format_odds(event, quotes))
