from aiogram import F, Router
from aiogram.types import CallbackQuery

from bot.db import repo
from bot.services import analytics
from bot.services.registry import news_data, sports_data

router = Router(name="analysis")


@router.callback_query(F.data.startswith("analysis:"))
async def cb_analysis(callback: CallbackQuery) -> None:
    event_id = callback.data.split(":", 1)[1]
    event = await sports_data.get_event(event_id)
    if event is None:
        await callback.answer("Событие не найдено", show_alert=True)
        return

    home = await sports_data.get_competitor(event.sport, event.home)
    away = await sports_data.get_competitor(event.sport, event.away)
    has_draw = event.sport in {"football", "hockey"}
    probs = analytics.calculate_probabilities(
        home.rating if home else 70.0, away.rating if away else 70.0, has_draw
    )
    news = await news_data.get_news(event.sport, subject=f"{event.home} — {event.away}")

    lines = [
        f"🔍 Анализ: {event.home} — {event.away}",
        f"{event.league} · {event.start_time}",
        "",
        "Вероятности исходов (модельная оценка):",
        f"П1 ({event.home}): {probs.home_win}%",
    ]
    if probs.draw is not None:
        lines.append(f"Ничья: {probs.draw}%")
    lines.append(f"П2 ({event.away}): {probs.away_win}%")
    lines.append("")
    lines.append("Новости:")
    for item in news:
        mark = "✅" if item.confirmed else "⚠️ неподтверждено"
        lines.append(f"• {item.title} ({mark})")
    lines.append("")
    lines.append(
        "ℹ️ Вероятности — модельная оценка на демо-данных, а не гарантия исхода."
    )

    await repo.log_query(callback.from_user.id, "analysis", event_id)
    await callback.message.answer("\n".join(lines))
    await callback.answer()
