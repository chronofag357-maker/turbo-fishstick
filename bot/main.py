import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import MenuButtonDefault, MenuButtonWebApp, WebAppInfo

from bot.config import settings
from bot.db.engine import init_db
from bot.db.repo import ensure_sport_settings
from bot.handlers import (
    analysis,
    arbitrage,
    compare,
    events,
    freeform,
    news,
    odds,
    profiles,
    sports,
    start,
    stats,
    subscriptions,
    voice,
)
from bot.handlers import admin as admin_handlers
from bot.middlewares.access import BlockedUserMiddleware


async def main() -> None:
    logging.basicConfig(level=logging.INFO)

    await init_db()
    await ensure_sport_settings()

    bot = Bot(
        token=settings.bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dp = Dispatcher(storage=MemoryStorage())

    dp.message.middleware(BlockedUserMiddleware())
    dp.callback_query.middleware(BlockedUserMiddleware())

    # Order matters: admin (stateful) and specific handlers must come before the
    # freeform catch-all, otherwise it would swallow every text message first.
    dp.include_router(start.router)
    dp.include_router(admin_handlers.router)
    dp.include_router(sports.router)
    dp.include_router(events.router)
    dp.include_router(analysis.router)
    dp.include_router(odds.router)
    dp.include_router(arbitrage.router)
    dp.include_router(stats.router)
    dp.include_router(compare.router)
    dp.include_router(news.router)
    dp.include_router(profiles.router)
    dp.include_router(subscriptions.router)
    dp.include_router(voice.router)
    dp.include_router(freeform.router)

    if settings.mini_app_url:
        await bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(text="Открыть", web_app=WebAppInfo(url=settings.mini_app_url))
        )
    else:
        await bot.set_chat_menu_button(menu_button=MenuButtonDefault())

    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
