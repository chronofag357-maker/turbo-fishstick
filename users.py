from aiogram import F, Router
from aiogram.types import CallbackQuery

from bot.db import repo
from bot.keyboards.admin import admin_users_keyboard

router = Router(name="admin_users")


@router.callback_query(F.data == "admin:users")
async def cb_admin_users(callback: CallbackQuery) -> None:
    users = await repo.list_users()
    if not users:
        await callback.answer("Пока нет пользователей", show_alert=True)
        return
    await callback.message.edit_text(
        "👥 Пользователи (нажмите, чтобы заблокировать/разблокировать):",
        reply_markup=admin_users_keyboard(users),
    )
    await callback.answer()


@router.callback_query(F.data.startswith("admin_user:"))
async def cb_admin_toggle_user(callback: CallbackQuery) -> None:
    _, tg_id_raw, action = callback.data.split(":", 2)
    tg_id = int(tg_id_raw)
    await repo.set_user_blocked(tg_id, blocked=(action == "block"))

    users = await repo.list_users()
    await callback.message.edit_reply_markup(reply_markup=admin_users_keyboard(users))
    await callback.answer("Готово")
