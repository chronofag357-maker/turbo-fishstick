from aiogram.types import InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder

from bot.db.models import SportSetting, User


def admin_menu() -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text="📈 Статистика", callback_data="admin:stats")
    builder.button(text="👥 Пользователи", callback_data="admin:users")
    builder.button(text="🏅 Виды спорта", callback_data="admin:sports")
    builder.button(text="📣 Рассылка", callback_data="admin:broadcast")
    builder.button(text="⚙️ Остальные функции владельца", callback_data="admin:more")
    builder.adjust(1)
    return builder.as_markup()


def admin_sports_keyboard(sports: list[SportSetting]) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    for sport in sports:
        mark = "✅" if sport.is_enabled else "🚫"
        action = "disable" if sport.is_enabled else "enable"
        builder.button(
            text=f"{mark} {sport.name}", callback_data=f"admin_sport:{sport.code}:{action}"
        )
    builder.button(text="⬅️ Админ-панель", callback_data="admin:home")
    builder.adjust(1)
    return builder.as_markup()


def admin_users_keyboard(users: list[User]) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    for user in users:
        mark = "🚫" if user.is_blocked else "✅"
        action = "unblock" if user.is_blocked else "block"
        label = user.username or user.full_name or str(user.tg_id)
        builder.button(text=f"{mark} {label}", callback_data=f"admin_user:{user.tg_id}:{action}")
    builder.button(text="⬅️ Админ-панель", callback_data="admin:home")
    builder.adjust(1)
    return builder.as_markup()
