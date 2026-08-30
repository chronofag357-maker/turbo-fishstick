from aiogram import F, Router
from aiogram.types import CallbackQuery

from bot.db import repo
from bot.keyboards.main import sports_keyboard, sport_menu

router = Router(name="sports")


@router.callback_query(F.data == "sports")
async def cb_sports(callback: CallbackQuery) -> None:
    sports = await repo.list_enabled_sports()
    if not sports:
        await callback.answer("Пока нет доступных видов спорта", show_alert=True)
        return
    await callback.message.edit_text(
        "Выберите вид спорта:", reply_markup=sports_keyboard(sports)
    )
    await callback.answer()


@router.callback_query(F.data.startswith("sport:"))
async def cb_sport_menu(callback: CallbackQuery) -> None:
    code = callback.data.split(":", 1)[1]
    sports = {s.code: s.name for s in await repo.list_all_sports()}
    name = sports.get(code, code)
    await callback.message.edit_text(f"🏅 {name}\n\nЧто вас интересует?", reply_markup=sport_menu(code))
    await callback.answer()
