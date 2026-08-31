from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder

from bot.db.models import SportSetting
from bot.services.adapters.base import Competitor, Event


def main_menu(mini_app_url: str = "") -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text="🏆 Виды спорта", callback_data="sports")
    builder.button(text="🎯 Экспресс", callback_data="express")
    builder.button(text="🔔 Мои подписки", callback_data="my_subs")
    if mini_app_url:
        builder.button(text="📱 Открыть Mini App", web_app=WebAppInfo(url=mini_app_url))
    builder.adjust(1)
    return builder.as_markup()


def express_tabs_keyboard(mini_app_url: str) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text="🥋 UFC-предматч", web_app=WebAppInfo(url=f"{mini_app_url}?view=ufc"))
    builder.button(text="🥊 Boxing-предматч", web_app=WebAppInfo(url=f"{mini_app_url}?view=boxing"))
    builder.button(text="🧮 Экспресс-10 ед.", web_app=WebAppInfo(url=f"{mini_app_url}?view=express"))
    builder.button(text="⬅️ В меню", callback_data="home")
    builder.adjust(2, 1, 1)
    return builder.as_markup()


def sports_keyboard(sports: list[SportSetting]) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    for sport in sports:
        builder.button(text=sport.name, callback_data=f"sport:{sport.code}")
    builder.button(text="⬅️ В меню", callback_data="home")
    builder.adjust(2)
    return builder.as_markup()


def sport_menu(code: str) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text="📅 События и анализ", callback_data=f"events:{code}")
    builder.button(text="📊 Статистика", callback_data=f"stats_pick:{code}")
    builder.button(text="⚖️ Сравнение", callback_data=f"cmp_start:{code}")
    builder.button(text="📰 Новости", callback_data=f"news:{code}")
    builder.button(text="👤 Профили", callback_data=f"profiles:{code}")
    builder.button(text="⬅️ Виды спорта", callback_data="sports")
    builder.adjust(1)
    return builder.as_markup()


def events_keyboard(sport: str, events: list[Event]) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    for event in events:
        label = f"{event.home} — {event.away}"
        if event.status == "live":
            label = f"🔴 {label}"
        builder.button(text=label, callback_data=f"event:{sport}:{event.id}")
    builder.button(text="⬅️ Назад", callback_data=f"sport:{sport}")
    builder.adjust(1)
    return builder.as_markup()


def event_detail_keyboard(sport: str, event_id: str) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text="🔍 Анализ и вероятности", callback_data=f"analysis:{event_id}")
    builder.button(text="💰 Коэффициенты", callback_data=f"odds:{event_id}")
    builder.button(text="🎯 Поиск вилки", callback_data=f"arb:{event_id}")
    builder.button(text="🔔 Подписаться", callback_data=f"subscribe:{event_id}")
    builder.button(text="⬅️ Назад", callback_data=f"events:{sport}")
    builder.adjust(1)
    return builder.as_markup()


def competitors_keyboard(
    sport: str, competitors: list[Competitor], prefix: str, exclude_id: str | None = None
) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    for competitor in competitors:
        if competitor.id == exclude_id:
            continue
        callback = f"{prefix}:{sport}:{competitor.id}"
        builder.button(text=competitor.name, callback_data=callback)
    builder.button(text="⬅️ Назад", callback_data=f"sport:{sport}")
    builder.adjust(2)
    return builder.as_markup()


def compare_step2_keyboard(
    sport: str, competitors: list[Competitor], first_id: str
) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    for competitor in competitors:
        if competitor.id == first_id:
            continue
        builder.button(
            text=competitor.name, callback_data=f"cmp_pick2:{sport}:{first_id}:{competitor.id}"
        )
    builder.button(text="⬅️ Назад", callback_data=f"sport:{sport}")
    builder.adjust(2)
    return builder.as_markup()
