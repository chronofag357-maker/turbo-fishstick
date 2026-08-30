from aiogram import F, Router
from aiogram.types import CallbackQuery

from bot.keyboards.main import event_detail_keyboard, events_keyboard
from bot.services.registry import sports_data

router = Router(name="events")


@router.callback_query(F.data.startswith("events:"))
async def cb_events(callback: CallbackQuery) -> None:
    sport = callback.data.split(":", 1)[1]
    events = await sports_data.list_events(sport)
    if not events:
        await callback.answer("Пока нет событий для этого вида спорта", show_alert=True)
        return
    await callback.message.edit_text(
        "Выберите событие:", reply_markup=events_keyboard(sport, events)
    )
    await callback.answer()


@router.callback_query(F.data.startswith("event:"))
async def cb_event_detail(callback: CallbackQuery) -> None:
    _, sport, event_id = callback.data.split(":", 2)
    event = await sports_data.get_event(event_id)
    if event is None:
        await callback.answer("Событие не найдено", show_alert=True)
        return
    status_label = {"scheduled": "запланировано", "live": "идёт сейчас", "finished": "завершено"}
    text = (
        f"📅 {event.league}\n"
        f"{event.home} — {event.away}\n"
        f"Начало: {event.start_time}\n"
        f"Статус: {status_label.get(event.status, event.status)}"
    )
    if event.score:
        text += f"\nСчёт: {event.score}"
    await callback.message.edit_text(text, reply_markup=event_detail_keyboard(sport, event_id))
    await callback.answer()
