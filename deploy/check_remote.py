import asyncio
import aiohttp
from bot.config import settings

async def main():
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=20)) as session:
        async with session.get('https://api.the-odds-api.com/v4/sports', params={'apiKey':settings.odds_api_key}) as response:
            print('The Odds authentication HTTP', response.status)
        async with session.get('https://api.telegram.org/bot'+settings.bot_token+'/getChatMenuButton') as response:
            data=await response.json()
            print('Telegram menu:', data.get('result',{}).get('web_app',{}).get('url'))

asyncio.run(main())
