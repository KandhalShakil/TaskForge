from __future__ import annotations

import logging

import pusher
from django.conf import settings

logger = logging.getLogger(__name__)


def get_pusher_client() -> pusher.Pusher | None:
    if not all([settings.PUSHER_APP_ID, settings.PUSHER_KEY, settings.PUSHER_SECRET, settings.PUSHER_CLUSTER]):
        logger.warning(
            "[Pusher] Missing credentials — real-time events will not fire. "
            "Set PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER in your .env file."
        )
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
        print(f"[Pusher] SKIPPED — no client. channel={channel!r} event={event!r}")
        return False
    print(f"[Pusher] Triggered: channel={channel!r} event={event!r} payload={payload}")
    logger.info("[Pusher] Triggered: channel=%r event=%r", channel, event)
    client.trigger(channel, event, payload)
    return True
