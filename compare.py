from aiogram import F, Router
from aiogram.types import CallbackQuery

from bot.db import repo
from bot.keyboards.main import compare_step2_keyboard, competitors_keyboard
from bot.services import analytics
from bot.services.registry import sports_data

router = Router(name="compare")


@router.callback_query(F.data.startswith("cmp_start:"))
async def cb_compare_start(callback: CallbackQuery) -> None:
    sport = callback.data.split(":", 1)[1]
    competitors = await sports_data.list_competitors(sport)
    if len(competitors) < 2:
        await callback.answer("Недостаточно данных для сравнения", show_alert=True)
        return
    await callback.message.edit_text(
        "Выберите первого участника:",
        reply_markup=competitors_keyboard(sport, competitors, prefix="cmp1"),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("cmp1:"))
async def cb_compare_pick_first(callback: CallbackQuery) -> None:
    _, sport, first_id = callback.data.split(":", 2)
    competitors = await sports_data.list_competitors(sport)
    await callback.message.edit_text(
        "Выберите второго участника:",
        reply_markup=compare_step2_keyboard(sport, competitors, first_id),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("cmp_pick2:"))
async def cb_compare_result(callback: CallbackQuery) -> None:
    _, sport, first_id, second_id = callback.data.split(":", 3)
    competitor_a = await sports_data.get_competitor(sport, first_id)
    competitor_b = await sports_data.get_competitor(sport, second_id)
    if competitor_a is None or competitor_b is None:
        await callback.answer("Не найдено", show_alert=True)
        return

    result = analytics.compare_competitors(
        competitor_a.name, competitor_a.rating, competitor_b.name, competitor_b.rating
    )
    favourite = result.name_a if result.edge_pct >= 0 else result.name_b
    text = (
        f"⚖️ {result.name_a} ({result.rating_a}) vs {result.name_b} ({result.rating_b})\n\n"
        f"Преимущество: {favourite} (разница {abs(result.edge_pct)}%)"
    )
    await repo.log_query(callback.from_user.id, "compare", f"{first_id} vs {second_id}")
    await callback.message.answer(text)
    await callback.answer()
