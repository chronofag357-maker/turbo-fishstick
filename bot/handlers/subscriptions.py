from aiogram import F, Router
from aiogram.types import CallbackQuery

from bot.db import repo
from bot.services.registry import sports_data

router = Router(name="subscriptions")


@router.callback_query(F.data.startswith("subscribe:"))
async def cb_subscribe(callback: CallbackQuery) -> None:
    event_id = callback.data.split(":", 1)[1]
    event = await sports_data.get_event(event_id)
    if event is None:
        await callback.answer("Событие не найдено", show_alert=True)
        return

    label = f"{event.home} — {event.away} ({event.league})"
    await repo.add_subscription(callback.from_user.id, event_id, label)
    await callback.answer("🔔 Подписка оформлена, пришлём уведомления об изменениях", show_alert=True)


@router.callback_query(F.data == "my_subs")
async def cb_my_subs(callback: CallbackQuery) -> None:
    subs = await repo.list_subscriptions(callback.from_user.id)
    if not subs:
        await callback.answer("У вас пока нет подписок на события", show_alert=True)
        return
    lines = ["🔔 Ваши подписки:", ""]
    lines += [f"• {sub.event_label}" for sub in subs]
    await callback.message.answer("\n".join(lines))
    await callback.answer()
