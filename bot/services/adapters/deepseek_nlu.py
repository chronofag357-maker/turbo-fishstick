"""Real LLM-backed answer() for function 7 (free-form questions), speaking
the OpenAI-compatible /chat/completions dialect. DeepSeek is the default,
but base_url/model are configurable (LLM_BASE_URL / LLM_MODEL in .env), so
any compatible provider — OpenRouter, Groq, Together, a local model — works
without touching this file.

Per the passport's stated risk ("расчёт вероятностей не должен
выполняться исключительно LLM"), the system prompt explicitly keeps the
model away from inventing odds or probabilities — those always come
from services/analytics.py via the bot's own commands, never from here.
"""

import asyncio
import logging

import aiohttp

from bot.services.adapters.base import NLUAdapter

logger = logging.getLogger(__name__)

DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
# Per the API reference, /chat/completions only accepts deepseek-v4-flash,
# deepseek-v4-pro and deepseek-v4-flash-vision-exp — the old deepseek-chat
# alias is gone. Flash is the cheap one, which is what this feature needs.
DEEPSEEK_MODEL = "deepseek-v4-flash"
# Free-tier models on providers like OpenRouter get queued behind everyone
# else's free traffic — a big MoE model can easily take 30-40s to answer.
# 20s was cutting that off mid-request, which look like a network failure
# in the logs even though the request was still in flight.
REQUEST_TIMEOUT_SECONDS = 55

SYSTEM_PROMPT = (
    "Ты — помощник в Telegram-боте «Спортивный аналитик». Отвечай кратко и по делу "
    "на свободные вопросы о спорте, на русском языке. Никогда не придумывай конкретные "
    "коэффициенты, вероятности исходов или прогнозы счёта — это считает отдельный "
    "математический модуль бота, а не ты. Если пользователь спрашивает про коэффициенты, "
    "вероятности или анализ конкретного матча — вежливо направь его к командам меню бота "
    "(анализ матча, коэффициенты, поиск вилки), не называя числа сам."
)


class DeepSeekNLUAdapter(NLUAdapter):
    def __init__(
        self,
        api_key: str,
        model: str = DEEPSEEK_MODEL,
        proxy_url: str = "",
        base_url: str = DEEPSEEK_API_URL,
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._proxy_url = proxy_url or None
        self._base_url = base_url

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
        # DeepSeek turns thinking mode on by default and bills the reasoning
        # tokens; a short sports Q&A doesn't need it. Only sent to DeepSeek
        # itself — other OpenAI-compatible providers don't know this field.
        if self._base_url == DEEPSEEK_API_URL:
            payload["thinking"] = {"type": "disabled"}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self._base_url,
                    json=payload,
                    headers=headers,
                    proxy=self._proxy_url,
                    timeout=aiohttp.ClientTimeout(total=REQUEST_TIMEOUT_SECONDS),
                ) as response:
                    if response.status != 200:
                        body = (await response.text())[:500]
                        logger.warning("LLM API (%s): HTTP %s — %s", self._base_url, response.status, body)
                        return "Не удалось получить ответ от LLM (ошибка API). Попробуйте позже."
                    data = await response.json()
        except (aiohttp.ClientError, asyncio.TimeoutError) as exc:
            logger.warning("LLM API (%s) недоступен: %s", self._base_url, exc)
            return "Не удалось связаться с LLM. Попробуйте позже."

        try:
            return data["choices"][0]["message"]["content"].strip()
        except (KeyError, IndexError, TypeError):
            return "LLM вернула пустой ответ. Попробуйте переформулировать вопрос."
