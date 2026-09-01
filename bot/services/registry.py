"""Single place that wires which adapter implementation is active.

Currently everything points at the mock adapters (no external API keys are
configured — see the "Ограничения" section of the bot passport). To go live with
Sportradar / API-Football / Sofascore / a real STT or LLM provider, implement the
matching interface in bot/services/adapters/base.py and swap it in here; handlers
never import a concrete adapter directly.
"""

from bot.config import settings
from bot.services.adapters.deepseek_nlu import DeepSeekNLUAdapter
from bot.services.adapters.mock_news import MockNewsAdapter
from bot.services.adapters.mock_nlu import MockNLUAdapter
from bot.services.adapters.mock_odds import MockOddsAdapter
from bot.services.adapters.mock_sports import MockSportsDataAdapter
from bot.services.adapters.mock_stt import MockSpeechToTextAdapter

sports_data = MockSportsDataAdapter()
odds_data = MockOddsAdapter()
news_data = MockNewsAdapter()
speech_to_text = MockSpeechToTextAdapter()
nlu = DeepSeekNLUAdapter(settings.deepseek_api_key) if settings.deepseek_api_key else MockNLUAdapter()
