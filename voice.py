from aiogram import Router
from aiogram.types import Message

from bot.db import repo
from bot.services.registry import nlu, speech_to_text

router = Router(name="voice")


@router.message(lambda message: message.voice is not None)
async def handle_voice(message: Message) -> None:
    try:
        voice_file = await message.bot.download(message.voice)
        text = await speech_to_text.transcribe(voice_file.read())
    except NotImplementedError as exc:
        await message.answer(f"🎤 {exc}")
        return

    await repo.log_query(message.from_user.id, "voice", text)
    answer = await nlu.answer(text)
    await message.answer(f"🎤 Распознано: «{text}»\n\n{answer}")
