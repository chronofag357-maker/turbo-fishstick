from aiogram import F, Router
from aiogram.types import CallbackQuery

from bot.db import repo
from bot.keyboards.main import competitors_keyboard
from bot.services.registry import sports_data

router = Router(name="profiles")


@router.callback_query(F.data.startswith("profiles:"))
async def cb_profiles_pick(callback: CallbackQuery) -> None:
    sport = callback.data.split(":", 1)[1]
    competitors = await sports_data.list_competitors(sport)
    if not competitors:
        await callback.answer("Нет данных по этому виду спорта", show_alert=True)
        return
    await callback.message.edit_text(
        "Чей публичный профиль показать?",
        reply_markup=competitors_keyboard(sport, competitors, prefix="profile"),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("profile:"))
async def cb_profile(callback: CallbackQuery) -> None:
    _, sport, competitor_id = callback.data.split(":", 2)
    competitor = await sports_data.get_competitor(sport, competitor_id)
    if competitor is None:
        await callback.answer("Не найдено", show_alert=True)
        return

    text = (
        f"👤 {competitor.name}\n\n"
        "Поиск официальных сайтов и публичных профилей подключается через "
        "реальный источник данных (сейчас — заглушка на демо-данных)."
    )
    await repo.log_query(callback.from_user.id, "profile", competitor_id)
    await callback.message.answer(text)
    await callback.answer()
