from aiogram import F, Router
from aiogram.types import Message

from bot.db import repo
from bot.services.registry import nlu

router = Router(name="freeform")


@router.message(F.text)
async def handle_freeform(message: Message) -> None:
    """Catch-all for free-text questions (function 7). Must be registered last so
    command/FSM handlers in other routers get first refusal.
    """
    await repo.log_query(message.from_user.id, "freeform", message.text)
    answer = await nlu.answer(message.text)
    await message.answer(answer)
