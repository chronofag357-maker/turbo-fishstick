from aiogram import F, Router
from aiogram.filters import CommandStart
from aiogram.types import CallbackQuery, Message, ReplyKeyboardRemove
from aiogram.exceptions import TelegramBadRequest

from bot.db import repo

router = Router(name="start")

async def clear_legacy_keyboard(message: Message) -> None:
    # Telegram removes a reply keyboard via a new message. Remove that
    # transitional message too; the persistent Web App menu is configured at startup.
    notice = await message.answer(
        "Откройте приложение кнопкой «P2P Market» в меню бота.",
        reply_markup=ReplyKeyboardRemove(),
    )
    try:
        await notice.delete()
    except TelegramBadRequest:
        pass  # If deletion is unavailable, keep the useful one-line instruction.


@router.message(CommandStart())
async def cmd_start(message: Message) -> None:
    await repo.get_or_create_user(
        tg_id=message.from_user.id,
        username=message.from_user.username,
        full_name=message.from_user.full_name,
    )
    await repo.ensure_sport_settings()
    await clear_legacy_keyboard(message)


@router.callback_query(F.data == "home")
async def cb_home(callback: CallbackQuery) -> None:
    await callback.message.edit_reply_markup(reply_markup=None)
    await callback.answer("Откройте приложение кнопкой P2P Market в меню бота.")
