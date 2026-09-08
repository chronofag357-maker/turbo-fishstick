"""Short-lived, room-scoped LiveKit grants. No media or chat is stored here."""
from datetime import timedelta
from urllib.parse import urlsplit


class StreamUnavailable(Exception):
    pass


def connection_details(identity, config):
    if not config.livekit_enabled:
        raise StreamUnavailable("Общая видеокомната ещё не включена.")
    allowed = {int(value.strip()) for value in config.livekit_participant_ids.split(",")
               if value.strip().isdigit()}
    if identity["id"] not in allowed:
        raise PermissionError("Доступ к комнате только у приглашённых участников.")
    endpoint = urlsplit(config.livekit_url)
    if (endpoint.scheme != "wss" or not endpoint.hostname or endpoint.username
            or endpoint.password or endpoint.query or endpoint.fragment
            or not config.livekit_api_key or len(config.livekit_api_secret) < 32
            or not config.livekit_room or len(allowed) > 3):
        raise StreamUnavailable("Настройки защищённой комнаты не завершены.")
    from livekit import api
    token = (api.AccessToken(config.livekit_api_key, config.livekit_api_secret)
             .with_identity(str(identity["id"]))
             .with_name(str(identity.get("name") or "Участник")[:100])
             .with_ttl(timedelta(minutes=5))
             .with_grants(api.VideoGrants(
                 room_join=True, room=config.livekit_room,
                 can_publish=True, can_subscribe=True, can_publish_data=True,
                 can_publish_sources=["camera", "microphone"],
                 room_admin=False))
             .to_jwt())
    return {"url": config.livekit_url, "token": token,
            "room": config.livekit_room, "expiresIn": 300}
