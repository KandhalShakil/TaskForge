from __future__ import annotations

from decimal import Decimal
from uuid import UUID


def _normalize(value):
    if value is None:
        return None
    if isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, UUID):
        return str(value)
    if hasattr(value, 'isoformat'):
        return value.isoformat()
    if isinstance(value, (list, tuple, set)):
        return [_normalize(item) for item in value]
    if isinstance(value, dict):
        return {key: _normalize(item) for key, item in value.items()}
    return str(value)


def model_to_document(instance, mapping):
    document = {}
    for key, value in mapping.items():
        if callable(value):
            value = value(instance)
        document[key] = _normalize(value)
    return document


def upsert_document(collection_name, document):
    from apps.core.mongo import get_mongo_db

    db = get_mongo_db()
    payload = _normalize(document)
    db[collection_name].update_one({'_id': payload['_id']}, {'$set': payload}, upsert=True)


def delete_document(collection_name, document_id):
    from apps.core.mongo import get_mongo_db

    db = get_mongo_db()
    db[collection_name].delete_one({'_id': str(document_id)})
