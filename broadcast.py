from aiogram import F, Router
from aiogram.exceptions import TelegramAPIError
from aiogram.filters import StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import CallbackQuery, Message

from bot.db import repo

router = Router(name="admin_broadcast")


class BroadcastStates(StatesGroup):
    waiting_text = State()


@router.callback_query(F.data == "admin:broadcast")
async def cb_admin_broadcast_start(callback: CallbackQuery, state: FSMContext) -> None:
    await state.set_state(BroadcastStates.waiting_text)
    await callback.message.answer(
        "📣 Отправьте текст рассылки следующим сообщением (или /cancel для отмены)."
    )
    await callback.answer()


@router.message(StateFilter(BroadcastStates.waiting_text), F.text == "/cancel")
async def cmd_broadcast_cancel(message: Message, state: FSMContext) -> None:
    await state.clear()
    await message.answer("Рассылка отменена.")


@router.message(StateFilter(BroadcastStates.waiting_text), F.text)
async def handle_broadcast_text(message: Message, state: FSMContext) -> None:
    await state.clear()
    tg_ids = await repo.list_all_user_tg_ids()

    sent, failed = 0, 0
    for tg_id in tg_ids:
        try:
            await message.bot.send_message(tg_id, message.text)
            sent += 1
        except TelegramAPIError:
            failed += 1

    await message.answer(f"📣 Рассылка завершена. Доставлено: {sent}, ошибок: {failed}.")
