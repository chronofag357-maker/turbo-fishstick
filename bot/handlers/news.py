from aiogram import F, Router
from aiogram.types import CallbackQuery

from bot.db import repo
from bot.services.registry import news_data

router = Router(name="news")


@router.callback_query(F.data.startswith("news:"))
async def cb_news(callback: CallbackQuery) -> None:
    sport = callback.data.split(":", 1)[1]
    items = await news_data.get_news(sport)
    lines = [f"📰 Новости: {sport}", ""]
    for item in items:
        mark = "✅ подтверждено" if item.confirmed else "⚠️ неподтверждено"
        lines.append(f"• {item.title}\n  {item.source}, {item.published_at} · {mark}")

    await repo.log_query(callback.from_user.id, "news", sport)
    await callback.message.answer("\n".join(lines))
    await callback.answer()
