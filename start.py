from aiogram import F, Router
from aiogram.filters import CommandStart
from aiogram.types import CallbackQuery, Message

from bot.config import settings
from bot.db import repo
from bot.keyboards.main import main_menu

router = Router(name="start")

WELCOME_TEXT = (
    "👋 Привет! Я «Спортивный аналитик» — помогаю анализировать матчи, статистику, "
    "коэффициенты и искать вилки.\n\n"
    "Выберите вид спорта или просто напишите вопрос текстом."
)


@router.message(CommandStart())
async def cmd_start(message: Message) -> None:
    await repo.get_or_create_user(
        tg_id=message.from_user.id,
        username=message.from_user.username,
        full_name=message.from_user.full_name,
    )
    await repo.ensure_sport_settings()
    await message.answer(WELCOME_TEXT, reply_markup=main_menu(settings.mini_app_url))


@router.callback_query(F.data == "home")
async def cb_home(callback: CallbackQuery) -> None:
    await callback.message.edit_text(WELCOME_TEXT, reply_markup=main_menu(settings.mini_app_url))
    await callback.answer()
