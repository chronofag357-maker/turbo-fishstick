"""Single place that wires which adapter implementation is active.

Everything points at the mock adapters by default (no external API keys are
configured — see the "Ограничения" section of the bot passport), except boxing,
which goes live on Boxing Data API (RapidAPI) when BOXING_DATA_API_KEY is set —
see the "Реальные данные: бокс" section of the README. To go live with
Sportradar / API-Football / Sofascore / a real STT or LLM provider for the other
sports, implement the matching interface in bot/services/adapters/base.py and
swap it in here; handlers never import a concrete adapter directly.
"""

from bot.config import settings
from bot.services.adapters.boxing_data_api import BoxingDataApiAdapter
from bot.services.adapters.deepseek_nlu import DeepSeekNLUAdapter
from bot.services.adapters.mock_news import MockNewsAdapter
from bot.services.adapters.mock_nlu import MockNLUAdapter
from bot.services.adapters.mock_odds import MockOddsAdapter
from bot.services.adapters.mock_sports import MockSportsDataAdapter
from bot.services.adapters.mock_stt import MockSpeechToTextAdapter
from bot.services.adapters.sports_composite import CompositeSportsDataAdapter

_mock_sports_data = MockSportsDataAdapter()
sports_data = (
    CompositeSportsDataAdapter(
        default=_mock_sports_data,
        overrides={"boxing": BoxingDataApiAdapter(settings.boxing_data_api_key)},
    )
    if settings.boxing_data_api_key
    else _mock_sports_data
)
# Boxing Data API has no odds endpoint, so odds/arbitrage stay on the mock
# adapter even when boxing's schedule is real — a real boxing event id simply
# won't be found in the mock's static data, so the handler correctly reports
# "Коэффициенты недоступны" instead of showing invented numbers.
odds_data = MockOddsAdapter()
news_data = MockNewsAdapter()
speech_to_text = MockSpeechToTextAdapter()
nlu = DeepSeekNLUAdapter(settings.deepseek_api_key) if settings.deepseek_api_key else MockNLUAdapter()
