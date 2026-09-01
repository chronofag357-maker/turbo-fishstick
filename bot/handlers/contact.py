"""'Get free express bets' button — the label is bait, the mechanism
underneath is a plain contact-the-owner flow: notify every configured
admin with who asked, then hand the user the owner's contact.
"""

from aiogram import F, Router
from aiogram.exceptions import TelegramAPIError
from aiogram.types import CallbackQuery

from bot.config import settings

router = Router(name="contact")


@router.callback_query(F.data == "contact_human")
async def cb_contact_human(callback: CallbackQuery) -> None:
    user = callback.from_user
    username = f"@{user.username}" if user.username else "без username"
    notice = (
        f"🎁 Пользователь {user.full_name} ({username}, ID: {user.id}) "
        "хочет получить бесплатные экспрессы."
    )

    for admin_id in settings.admin_id_set:
        try:
            await callback.bot.send_message(admin_id, notice)
        except TelegramAPIError:
            pass

    if settings.contact_username:
        reply = f"Спасибо! Мы получили ваш запрос. Напишите нам напрямую: {settings.contact_username}"
    else:
        reply = "Спасибо! Ваш запрос отправлен, с вами скоро свяжутся."

    await callback.message.answer(reply)
    await callback.answer()
