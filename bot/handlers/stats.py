from aiogram import F, Router
from aiogram.types import CallbackQuery

from bot.db import repo
from bot.keyboards.main import competitors_keyboard
from bot.services.registry import sports_data

router = Router(name="stats")


@router.callback_query(F.data.startswith("stats_pick:"))
async def cb_stats_pick(callback: CallbackQuery) -> None:
    sport = callback.data.split(":", 1)[1]
    competitors = await sports_data.list_competitors(sport)
    if not competitors:
        await callback.answer("Нет данных по этому виду спорта", show_alert=True)
        return
    await callback.message.edit_text(
        "Выберите команду/спортсмена:",
        reply_markup=competitors_keyboard(sport, competitors, prefix="stats"),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("stats:"))
async def cb_stats(callback: CallbackQuery) -> None:
    _, sport, competitor_id = callback.data.split(":", 2)
    competitor = await sports_data.get_competitor(sport, competitor_id)
    if competitor is None:
        await callback.answer("Не найдено", show_alert=True)
        return

    text = (
        f"📊 {competitor.name}\n"
        f"Рейтинг силы (внутренняя модель): {competitor.rating}/100\n\n"
        "Подробная историческая статистика подключается через реальный "
        "спортивный API (сейчас показаны демо-данные)."
    )
    await repo.log_query(callback.from_user.id, "stats", competitor_id)
    await callback.message.answer(text)
    await callback.answer()
