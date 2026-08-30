from bot.services.adapters.base import OddsAdapter, OddsQuote
from bot.services.adapters.mock_data import COMPETITORS, EVENTS

# Per-bookmaker overround (>1, the house edge) and a small bias on top of the
# "true" model probability for each outcome, simulating that real bookmakers
# don't all price a market identically. This is what occasionally produces a
# genuine cross-book arbitrage for the demo, the same way real markets do.
BOOKMAKERS = {
    "BookOne": {"margin": 1.06, "bias": (1.00, 1.00, 1.00)},
    "BookTwo": {"margin": 1.04, "bias": (1.05, 0.93, 0.99)},
    "BookThree": {"margin": 1.07, "bias": (0.97, 1.05, 1.04)},
}


def _find_ratings(event_id: str) -> tuple[float, float, bool] | None:
    for events in EVENTS.values():
        for event in events:
            if event.id != event_id:
                continue
            competitors = COMPETITORS.get(event.sport, [])
            by_name = {c.name: c.rating for c in competitors}
            home = by_name.get(event.home, 70.0)
            away = by_name.get(event.away, 70.0)
            has_draw = event.sport in {"football", "hockey"}
            return home, away, has_draw
    return None


class MockOddsAdapter(OddsAdapter):
    async def get_odds(self, event_id: str) -> list[OddsQuote]:
        ratings = _find_ratings(event_id)
        if ratings is None:
            return []
        home_rating, away_rating, has_draw = ratings

        draw_weight = 0.24 * min(home_rating, away_rating) if has_draw else 0.0
        total = home_rating + away_rating + draw_weight
        p_home = home_rating / total
        p_away = away_rating / total
        p_draw = draw_weight / total if has_draw else 0.0

        quotes = []
        for bookmaker, params in BOOKMAKERS.items():
            margin = params["margin"]
            bias_home, bias_draw, bias_away = params["bias"]

            biased_home = p_home * bias_home
            biased_draw = p_draw * bias_draw if has_draw else 0.0
            biased_away = p_away * bias_away
            biased_total = biased_home + biased_draw + biased_away
            biased_home /= biased_total
            biased_draw /= biased_total
            biased_away /= biased_total

            quotes.append(
                OddsQuote(
                    bookmaker=bookmaker,
                    home_win=round(1 / (biased_home * margin), 2),
                    draw=round(1 / (biased_draw * margin), 2) if has_draw else None,
                    away_win=round(1 / (biased_away * margin), 2),
                    updated_at="только что",
                )
            )
        return quotes
