from aiogram import F, Router
from aiogram.types import CallbackQuery

from bot.db import repo
from bot.services.registry import odds_data, sports_data

router = Router(name="odds")


@router.callback_query(F.data.startswith("odds:"))
async def cb_odds(callback: CallbackQuery) -> None:
    event_id = callback.data.split(":", 1)[1]
    event = await sports_data.get_event(event_id)
    quotes = await odds_data.get_odds(event_id)
    if event is None or not quotes:
        await callback.answer("Коэффициенты недоступны", show_alert=True)
        return

    lines = [f"💰 Коэффициенты: {event.home} — {event.away}", ""]
    for quote in quotes:
        row = f"{quote.bookmaker}: П1 {quote.home_win}"
        if quote.draw is not None:
            row += f" | X {quote.draw}"
        row += f" | П2 {quote.away_win}"
        lines.append(row)
    lines.append("")
    lines.append(f"Обновлено: {quotes[0].updated_at}")

    await repo.log_query(callback.from_user.id, "odds", event_id)
    await callback.message.answer("\n".join(lines))
    await callback.answer()
