from aiogram import F, Router
from aiogram.types import CallbackQuery

from bot.db import repo
from bot.services import analytics
from bot.services.registry import odds_data, sports_data

router = Router(name="arbitrage")


@router.callback_query(F.data.startswith("arb:"))
async def cb_arbitrage(callback: CallbackQuery) -> None:
    event_id = callback.data.split(":", 1)[1]
    event = await sports_data.get_event(event_id)
    quotes = await odds_data.get_odds(event_id)
    if event is None or not quotes:
        await callback.answer("Коэффициенты недоступны", show_alert=True)
        return

    opportunity = analytics.find_arbitrage(quotes)
    await repo.log_query(callback.from_user.id, "arbitrage", event_id)

    if opportunity is None:
        await callback.message.answer("Не удалось рассчитать вилку для этого события.")
        await callback.answer()
        return

    lines = [f"🎯 Поиск вилки: {event.home} — {event.away}", ""]
    for outcome, odd in opportunity.best_odds.items():
        bookmaker = opportunity.best_bookmakers[outcome]
        share = opportunity.stake_split_pct[outcome]
        lines.append(f"{outcome}: {odd} у {bookmaker} — доля ставки {share}%")
    lines.append("")
    if opportunity.margin_pct < 0:
        lines.append(
            f"✅ Потенциальная вилка найдена! Гарантированная маржа: {-opportunity.margin_pct}%"
        )
    else:
        lines.append(
            f"❌ Вилки нет: суммарная маржа букмекеров {opportunity.margin_pct}% (нет арбитража)."
        )
    lines.append(
        "\n⚠️ Коэффициенты могут измениться к моменту размещения ставки — это демо-расчёт."
    )

    await callback.message.answer("\n".join(lines))
    await callback.answer()
