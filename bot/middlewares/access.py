from typing import Any, Awaitable, Callable

from aiogram import BaseMiddleware
from aiogram.types import CallbackQuery, Message, TelegramObject

from bot.db import repo


class BlockedUserMiddleware(BaseMiddleware):
    """Owner function 3 (user access management): silently drops updates from
    users the owner has blocked via the admin panel.
    """

    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        user = getattr(event, "from_user", None)
        if user is not None and await repo.is_user_blocked(user.id):
            if isinstance(event, CallbackQuery):
                await event.answer("Доступ ограничен владельцем бота.", show_alert=True)
            elif isinstance(event, Message):
                await event.answer("Доступ ограничен владельцем бота.")
            return None
        return await handler(event, data)
