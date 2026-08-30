from sqlalchemy import func, select

from bot.constants import MVP_SPORTS
from bot.db.engine import get_session
from bot.db.models import QueryLog, SportSetting, Subscription, User, utcnow


async def get_or_create_user(tg_id: int, username: str | None, full_name: str) -> User:
    async with get_session() as session:
        user = await session.scalar(select(User).where(User.tg_id == tg_id))
        if user is None:
            user = User(tg_id=tg_id, username=username, full_name=full_name)
            session.add(user)
        else:
            user.username = username
            user.full_name = full_name
            user.last_active_at = utcnow()
        await session.commit()
        await session.refresh(user)
        return user


async def is_user_blocked(tg_id: int) -> bool:
    async with get_session() as session:
        user = await session.scalar(select(User).where(User.tg_id == tg_id))
        return bool(user and user.is_blocked)


async def set_user_blocked(tg_id: int, blocked: bool) -> bool:
    async with get_session() as session:
        user = await session.scalar(select(User).where(User.tg_id == tg_id))
        if user is None:
            return False
        user.is_blocked = blocked
        await session.commit()
        return True


async def list_users(limit: int = 20) -> list[User]:
    async with get_session() as session:
        result = await session.scalars(
            select(User).order_by(User.last_active_at.desc()).limit(limit)
        )
        return list(result.all())


async def list_all_user_tg_ids() -> list[int]:
    async with get_session() as session:
        result = await session.scalars(select(User.tg_id).where(User.is_blocked.is_(False)))
        return list(result.all())


async def count_users() -> int:
    async with get_session() as session:
        return await session.scalar(select(func.count()).select_from(User)) or 0


async def log_query(user_tg_id: int, function: str, payload: str = "") -> None:
    async with get_session() as session:
        session.add(QueryLog(user_tg_id=user_tg_id, function=function, payload=payload))
        await session.commit()


async def count_queries() -> int:
    async with get_session() as session:
        return await session.scalar(select(func.count()).select_from(QueryLog)) or 0


async def top_functions(limit: int = 5) -> list[tuple[str, int]]:
    async with get_session() as session:
        result = await session.execute(
            select(QueryLog.function, func.count().label("cnt"))
            .group_by(QueryLog.function)
            .order_by(func.count().desc())
            .limit(limit)
        )
        return [(row.function, row.cnt) for row in result.all()]


async def ensure_sport_settings() -> None:
    async with get_session() as session:
        existing = {s.code for s in (await session.scalars(select(SportSetting))).all()}
        for code, name in MVP_SPORTS:
            if code not in existing:
                session.add(SportSetting(code=code, name=name, is_enabled=True))
        await session.commit()


async def list_enabled_sports() -> list[SportSetting]:
    async with get_session() as session:
        result = await session.scalars(
            select(SportSetting).where(SportSetting.is_enabled.is_(True))
        )
        return list(result.all())


async def list_all_sports() -> list[SportSetting]:
    async with get_session() as session:
        return list((await session.scalars(select(SportSetting))).all())


async def set_sport_enabled(code: str, enabled: bool) -> bool:
    async with get_session() as session:
        sport = await session.scalar(select(SportSetting).where(SportSetting.code == code))
        if sport is None:
            return False
        sport.is_enabled = enabled
        await session.commit()
        return True


async def add_subscription(user_tg_id: int, event_id: str, event_label: str) -> None:
    async with get_session() as session:
        session.add(
            Subscription(user_tg_id=user_tg_id, event_id=event_id, event_label=event_label)
        )
        await session.commit()


async def list_subscriptions(user_tg_id: int) -> list[Subscription]:
    async with get_session() as session:
        result = await session.scalars(
            select(Subscription).where(Subscription.user_tg_id == user_tg_id)
        )
        return list(result.all())
