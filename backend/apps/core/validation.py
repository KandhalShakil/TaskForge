from datetime import date, datetime
from decimal import Decimal

from django.utils import timezone


def is_blank(value):
    if value is None:
        return True
    if isinstance(value, str):
        return value.strip() == ''
    return False


def get_value(attrs, instance, key):
    if key in attrs:
        return attrs.get(key)
    if instance is None:
        return None
    return getattr(instance, key, None)


def normalize_datetime(value):
    if value is None:
        return None

    if isinstance(value, datetime):
        if timezone.is_naive(value):
            return timezone.make_aware(value, timezone=timezone.utc)
        return value.astimezone(timezone.utc)

    return value


def normalize_for_task_range(value):
    value = normalize_datetime(value)
    if isinstance(value, datetime):
        return timezone.localtime(value) if timezone.is_aware(value) else value
    return value


def date_only(value):
    value = normalize_for_task_range(value)
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    return None


def hours_until_end_of_day(current_time=None):
    current_time = normalize_for_task_range(current_time or timezone.now())
    if not isinstance(current_time, datetime):
        return Decimal('0')

    end_of_day = current_time.replace(hour=23, minute=59, second=59, microsecond=999999)
    remaining_seconds = max((end_of_day - current_time).total_seconds(), 0)
    return Decimal(str(remaining_seconds)) / Decimal('3600')


def task_hours_limit(start_date, end_date, current_time=None):
    start_date = normalize_for_task_range(start_date)
    end_date = normalize_for_task_range(end_date)

    if not start_date or not end_date:
        return None

    start_day = date_only(start_date)
    end_day = date_only(end_date)
    if not start_day or not end_day:
        return None

    if start_day == end_day:
        return hours_until_end_of_day(current_time=current_time)

    duration_days = (end_day - start_day).days + 1
    if duration_days <= 0:
        return Decimal('0')
    return Decimal(str(duration_days * 24))


def required_field_errors(attrs, instance, fields, *, partial=False):
    if partial:
        return {}

    errors = {}
    for key, label in fields:
        value = get_value(attrs, instance, key)
        if is_blank(value):
            errors[key] = f'{label} is required'

    if errors:
        errors['error'] = 'All fields are required'
    return errors


def date_order_error(start_date, end_date):
    start_date = normalize_datetime(start_date)
    end_date = normalize_datetime(end_date)
    if start_date and end_date and end_date < start_date:
        return 'End date cannot be before start date'
    return None


def estimated_hours_errors(start_date, end_date, estimated_hours):
    if estimated_hours is None:
        return None

    try:
        hours = Decimal(str(estimated_hours))
    except Exception:
        return 'Estimated hours must be a positive number'

    if hours <= 0:
        return 'Estimated hours must be a positive number'

    limit_hours = task_hours_limit(start_date, end_date)
    if limit_hours is None:
        return None

    if hours > limit_hours:
        if date_only(start_date) == date_only(end_date):
            return 'Estimated hours cannot exceed remaining time today'
        return 'Estimated hours cannot exceed task duration'

    return None


def is_within_range(child_start, child_end, parent_start, parent_end):
    child_start = normalize_datetime(child_start)
    child_end = normalize_datetime(child_end)
    parent_start = normalize_datetime(parent_start)
    parent_end = normalize_datetime(parent_end)

    if not parent_start or not parent_end or not child_start or not child_end:
        return True
    return child_start >= parent_start and child_end <= parent_end
