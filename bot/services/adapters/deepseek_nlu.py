"""Real LLM-backed answer() for function 7 (free-form questions), using
DeepSeek's OpenAI-compatible chat completions API.

Per the passport's stated risk ("расчёт вероятностей не должен
выполняться исключительно LLM"), the system prompt explicitly keeps the
model away from inventing odds or probabilities — those always come
from services/analytics.py via the bot's own commands, never from here.
"""

import asyncio

import aiohttp

from bot.services.adapters.base import NLUAdapter

DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
REQUEST_TIMEOUT_SECONDS = 20

SYSTEM_PROMPT = (
    "Ты — помощник в Telegram-боте «Спортивный аналитик». Отвечай кратко и по делу "
    "на свободные вопросы о спорте, на русском языке. Никогда не придумывай конкретные "
    "коэффициенты, вероятности исходов или прогнозы счёта — это считает отдельный "
    "математический модуль бота, а не ты. Если пользователь спрашивает про коэффициенты, "
    "вероятности или анализ конкретного матча — вежливо направь его к командам меню бота "
    "(анализ матча, коэффициенты, поиск вилки), не называя числа сам."
)


class DeepSeekNLUAdapter(NLUAdapter):
    def __init__(self, api_key: str, model: str = "deepseek-chat", proxy_url: str = "") -> None:
        self._api_key = api_key
        self._model = model
        self._proxy_url = proxy_url or None

    async def answer(self, question: str) -> str:
        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": question},
            ],
            "max_tokens": 500,
            "temperature": 0.6,
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    DEEPSEEK_API_URL,
                    json=payload,
                    headers=headers,
                    proxy=self._proxy_url,
                    timeout=aiohttp.ClientTimeout(total=REQUEST_TIMEOUT_SECONDS),
                ) as response:
                    if response.status != 200:
                        return "Не удалось получить ответ от LLM (ошибка API). Попробуйте позже."
                    data = await response.json()
        except (aiohttp.ClientError, asyncio.TimeoutError):
            return "Не удалось связаться с LLM. Попробуйте позже."

        try:
            return data["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError, TypeError):
            return "LLM вернула пустой ответ. Попробуйте переформулировать вопрос."
