from bot.services.adapters.base import NLUAdapter


class MockNLUAdapter(NLUAdapter):
    """Keyword-based stand-in for a real LLM. Handles intent-free small talk only;
    numeric analysis always goes through the analytics engine, never through this.
    """

    async def answer(self, question: str) -> str:
        return (
            "Свободные вопросы пока обрабатываются упрощённо: подключите реальную "
            "LLM в bot/services/registry.py (функция 7 паспорта бота).\n\n"
            f"Ваш вопрос: «{question}».\n"
            "Попробуйте команды меню — анализ матча, статистика, сравнение или "
            "коэффициенты — они уже работают на демо-данных."
        )
