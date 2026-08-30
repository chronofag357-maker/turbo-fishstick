from bot.services.adapters.base import NewsAdapter, NewsItem


class MockNewsAdapter(NewsAdapter):
    async def get_news(self, sport: str, subject: str | None = None) -> list[NewsItem]:
        subject_label = subject or "команды/спортсмена"
        return [
            NewsItem(
                title=f"Официальный источник: изменений в составе {subject_label} не зафиксировано",
                source="официальный сайт",
                confirmed=True,
                published_at="сегодня",
            ),
            NewsItem(
                title=f"СМИ сообщают о возможной ротации состава перед матчем ({subject_label})",
                source="СМИ",
                confirmed=False,
                published_at="сегодня",
            ),
        ]
