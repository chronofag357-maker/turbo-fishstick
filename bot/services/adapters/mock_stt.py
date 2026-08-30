from bot.services.adapters.base import SpeechToTextAdapter


class MockSpeechToTextAdapter(SpeechToTextAdapter):
    """Placeholder until a real Speech-to-Text provider is wired in."""

    async def transcribe(self, voice_bytes: bytes) -> str:
        raise NotImplementedError(
            "Распознавание голоса пока не подключено. "
            "Подключите реальный STT-адаптер в bot/services/registry.py."
        )
