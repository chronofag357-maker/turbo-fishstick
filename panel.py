from aiogram import F, Router
from aiogram.filters import Command
from aiogram.types import CallbackQuery, Message

from bot.db import repo
from bot.keyboards.admin import admin_menu

router = Router(name="admin_panel")

ADMIN_HOME_TEXT = "🛠 Панель владельца"

MORE_FUNCTIONS_TEXT = (
    "⚙️ Остальные функции владельца (архитектурные заготовки, готовые к расширению):\n\n"
    "• Контроль источников данных — подмените адаптер в bot/services/registry.py.\n"
    "• Настройки аналитики — параметры в bot/services/analytics.py.\n"
    "• Контроль ошибок парсеров — логируйте сбои адаптеров через bot/db/repo.py "
    "(добавьте таблицу логов ошибок по аналогии с QueryLog).\n"
    "• Тарифы и подписки — модель Subscription в bot/db/models.py готова "
    "под платные уведомления; для оплаты подключите Telegram Stars/ЮKassa.\n"
    "• Управление Mini App — настройте MINI_APP_URL в .env, содержимое Mini App "
    "разрабатывается отдельным frontend-проектом."
)


@router.message(Command("admin"))
async def cmd_admin(message: Message) -> None:
    await message.answer(ADMIN_HOME_TEXT, reply_markup=admin_menu())


@router.callback_query(F.data == "admin:home")
async def cb_admin_home(callback: CallbackQuery) -> None:
    await callback.message.edit_text(ADMIN_HOME_TEXT, reply_markup=admin_menu())
    await callback.answer()


@router.callback_query(F.data == "admin:stats")
async def cb_admin_stats(callback: CallbackQuery) -> None:
    users_count = await repo.count_users()
    queries_count = await repo.count_queries()
    top = await repo.top_functions()

    lines = [
        "📈 Статистика бота",
        f"Пользователей: {users_count}",
        f"Запросов всего: {queries_count}",
        "",
        "Топ функций по запросам:",
    ]
    lines += [f"• {name}: {count}" for name, count in top] or ["(пока нет данных)"]

    await callback.message.answer("\n".join(lines))
    await callback.answer()


@router.callback_query(F.data == "admin:more")
async def cb_admin_more(callback: CallbackQuery) -> None:
    await callback.message.answer(MORE_FUNCTIONS_TEXT)
    await callback.answer()
