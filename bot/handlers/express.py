"""Entry point for the express-bet buttons. Each button is a Web App link
into docs/ (?view=ufc / ?view=boxing / ?view=express) rather than a
callback — they open as Mini App screens attached right under this
message, per the requested UX. The screens themselves are placeholders
for now; real content lands in a follow-up.
"""

from aiogram import F, Router
from aiogram.types import CallbackQuery

from bot.config import settings
from bot.keyboards.main import express_tabs_keyboard

router = Router(name="express")


@router.callback_query(F.data == "express")
async def open_express(callback: CallbackQuery) -> None:
    if not settings.mini_app_url:
        await callback.answer(
            "Mini App не настроен — владелец бота не указал MINI_APP_URL.", show_alert=True
        )
        return
    await callback.message.answer(
        "🎯 Экспресс-ставки\n\nВыберите категорию — откроется мини-приложение.",
        reply_markup=express_tabs_keyboard(settings.mini_app_url),
    )
    await callback.answer()
