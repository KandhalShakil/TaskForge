from __future__ import annotations

import pusher
from django.conf import settings


def get_pusher_client() -> pusher.Pusher | None:
    if not all([settings.PUSHER_APP_ID, settings.PUSHER_KEY, settings.PUSHER_SECRET, settings.PUSHER_CLUSTER]):
        return None

    return pusher.Pusher(
        app_id=settings.PUSHER_APP_ID,
        key=settings.PUSHER_KEY,
        secret=settings.PUSHER_SECRET,
        cluster=settings.PUSHER_CLUSTER,
        ssl=settings.PUSHER_SSL,
    )


def trigger_event(channel: str, event: str, payload: dict) -> bool:
    client = get_pusher_client()
    if not client:
        return False
    client.trigger(channel, event, payload)
    return True
