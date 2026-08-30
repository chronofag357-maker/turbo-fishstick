"""Statistics/math engine, kept separate from the LLM per the passport's stated
risk that "расчёт вероятностей не должен выполняться исключительно LLM".
"""

from dataclasses import dataclass

from bot.services.adapters.base import OddsQuote

HOME_ADVANTAGE = 3.0


@dataclass
class OutcomeProbabilities:
    home_win: float
    draw: float | None
    away_win: float


def calculate_probabilities(
    home_rating: float, away_rating: float, has_draw: bool
) -> OutcomeProbabilities:
    home_rating += HOME_ADVANTAGE
    draw_weight = 0.24 * min(home_rating, away_rating) if has_draw else 0.0
    total = home_rating + away_rating + draw_weight

    return OutcomeProbabilities(
        home_win=round(home_rating / total * 100, 1),
        draw=round(draw_weight / total * 100, 1) if has_draw else None,
        away_win=round(away_rating / total * 100, 1),
    )


@dataclass
class ComparisonResult:
    name_a: str
    name_b: str
    rating_a: float
    rating_b: float
    edge_pct: float  # positive means A is favoured


def compare_competitors(name_a: str, rating_a: float, name_b: str, rating_b: float) -> ComparisonResult:
    total = rating_a + rating_b
    edge = round((rating_a - rating_b) / total * 100, 1) if total else 0.0
    return ComparisonResult(name_a, name_b, rating_a, rating_b, edge)


@dataclass
class ArbitrageOpportunity:
    market: str  # "П1" | "X" | "П2"
    best_odds: dict[str, float]  # outcome -> odd, keyed by outcome label
    best_bookmakers: dict[str, str]  # outcome -> bookmaker name
    implied_probability_sum: float
    margin_pct: float  # negative = guaranteed profit margin
    stake_split_pct: dict[str, float]


def find_arbitrage(quotes: list[OddsQuote]) -> ArbitrageOpportunity | None:
    """Compares the best available odds per outcome across bookmakers and checks
    the classic arbitrage condition: sum(1/best_odd) < 1.
    """
    if not quotes:
        return None

    has_draw = any(q.draw is not None for q in quotes)
    outcomes = ["П1", "X", "П2"] if has_draw else ["П1", "П2"]

    best_odds: dict[str, float] = {}
    best_bookmakers: dict[str, str] = {}
    for outcome in outcomes:
        best_quote = None
        best_value = 0.0
        for quote in quotes:
            value = {
                "П1": quote.home_win,
                "X": quote.draw,
                "П2": quote.away_win,
            }[outcome]
            if value is not None and value > best_value:
                best_value = value
                best_quote = quote
        if best_quote is None:
            return None
        best_odds[outcome] = best_value
        best_bookmakers[outcome] = best_quote.bookmaker

    implied_sum = sum(1 / odd for odd in best_odds.values())
    margin_pct = round((implied_sum - 1) * 100, 2)
    stake_split = {
        outcome: round((1 / odd) / implied_sum * 100, 1) for outcome, odd in best_odds.items()
    }

    return ArbitrageOpportunity(
        market="1X2" if has_draw else "П1/П2",
        best_odds=best_odds,
        best_bookmakers=best_bookmakers,
        implied_probability_sum=round(implied_sum, 4),
        margin_pct=margin_pct,
        stake_split_pct=stake_split,
    )
