from aiogram import F, Router
from aiogram.types import Message

from bot.db import repo
from bot.config import settings
from bot.keyboards.main import freebk_keyboard
from bot.services.registry import nlu, odds_data, sports_data
from bot.services.sports_context import build_sports_context

router = Router(name="freeform")


@router.message(F.text)
async def handle_freeform(message: Message) -> None:
    """Catch-all for free-text questions (function 7). Must be registered last so
    command/FSM handlers in other routers get first refusal.
    """
    await repo.log_query(message.from_user.id, "freeform", message.text)
    context = await build_sports_context(message.text, sports_data, odds_data)
    answer = context.direct_answer or await nlu.answer(message.text, context.llm_context)
    await message.answer(answer, parse_mode=None, reply_markup=freebk_keyboard(settings.mini_app_url))
