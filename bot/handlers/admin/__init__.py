from aiogram import Router

from bot.filters import IsAdmin
from bot.handlers.admin import broadcast, panel, sports, users

router = Router(name="admin")
router.message.filter(IsAdmin())
router.callback_query.filter(IsAdmin())

router.include_router(panel.router)
router.include_router(users.router)
router.include_router(sports.router)
router.include_router(broadcast.router)
