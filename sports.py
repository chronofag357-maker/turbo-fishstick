from aiogram import F, Router
from aiogram.types import CallbackQuery

from bot.db import repo
from bot.keyboards.admin import admin_sports_keyboard

router = Router(name="admin_sports")


@router.callback_query(F.data == "admin:sports")
async def cb_admin_sports(callback: CallbackQuery) -> None:
    await repo.ensure_sport_settings()
    sports = await repo.list_all_sports()
    await callback.message.edit_text(
        "🏅 Виды спорта (нажмите, чтобы включить/выключить):",
        reply_markup=admin_sports_keyboard(sports),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("admin_sport:"))
async def cb_admin_toggle_sport(callback: CallbackQuery) -> None:
    _, code, action = callback.data.split(":", 2)
    await repo.set_sport_enabled(code, enabled=(action == "enable"))

    sports = await repo.list_all_sports()
    await callback.message.edit_reply_markup(reply_markup=admin_sports_keyboard(sports))
    await callback.answer("Готово")
