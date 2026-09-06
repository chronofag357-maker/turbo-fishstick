"""Run connection checks without polling or displaying credentials."""
import asyncio
from aiogram import Bot
from aiogram.client.session.aiohttp import AiohttpSession
from bot.config import settings
from bot.services.registry import sports_data, nlu


async def check():
    bot = Bot(settings.bot_token, session=AiohttpSession(proxy=settings.proxy_url or None))
    try:
        me = await bot.get_me()
        print("TELEGRAM_OK @" + me.username)
    finally:
        await bot.session.close()
    events = await sports_data.list_events("boxing")
    print("BOXING_EVENTS", len(events))
    print("LLM:", await nlu.answer("Ответь одним словом: работает"))


if __name__ == "__main__":
    asyncio.run(check())
