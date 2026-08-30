"""Native Telegram Game card (sendGame), launching the same casino screen
that also lives inside the Mini App. Score syncing (setGameScore /
getGameHighScores) needs a server holding the bot token to call those
methods on demand from the browser — out of scope without real hosting,
so this only handles launching the game, no leaderboard.
"""

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.types import CallbackQuery, Message

from bot.config import settings

router = Router(name="game")

# Short name registered with @BotFather via /newgame.
GAME_SHORT_NAME = "casino_chronofag"


@router.message(Command("game"))
async def send_game(message: Message) -> None:
    await message.answer_game(game_short_name=GAME_SHORT_NAME)


@router.callback_query(F.game_short_name == GAME_SHORT_NAME)
async def open_game(callback: CallbackQuery) -> None:
    if not settings.mini_app_url:
        await callback.answer(
            "Игра пока не настроена — владелец бота не указал MINI_APP_URL.", show_alert=True
        )
        return
    await callback.answer(url=f"{settings.mini_app_url}?view=casino")
