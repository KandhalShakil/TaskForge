import uuid
from datetime import datetime
import logging

from django.contrib.auth.hashers import check_password, make_password
from pymongo.errors import DuplicateKeyError

from .documents import UserDocument
from .mongo_auth import MongoUser


logger = logging.getLogger(__name__)


def to_mongo_user(document: UserDocument) -> MongoUser:
    return MongoUser(
        id=str(document.id),
        email=document.email,
        full_name=document.full_name,
        user_type=document.user_type,
        is_active=document.is_active,
        is_staff=document.is_staff,
        is_superuser=document.is_superuser,
        companyId=getattr(document, 'companyId', None),
        avatar=document.avatar,
    )


def create_user(*, email: str, full_name: str, password: str, user_type: str = 'employee', company_name: str = None) -> UserDocument:
    if not password:
        raise ValueError('Password is required')

    normalized_email = email.lower().strip()
    if UserDocument.objects(email=normalized_email).first():
        raise ValueError('Email already exists')

    user = UserDocument(
        id=str(uuid.uuid4()),
        email=normalized_email,
        full_name=full_name,
        avatar='',
        user_type=user_type,
        password=make_password(password),
        is_active=True,
        is_staff=(user_type == 'admin'),
        is_superuser=False,
        date_joined=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    from apps.companies.documents import CompanyDocument
    
    if user_type == 'owner':
        if not company_name:
            raise ValueError('Company name is required for owners')
        # Check if company exists
        if CompanyDocument.objects(name__iexact=company_name).first():
            raise ValueError('Company name already exists')
        
        company = CompanyDocument(
            id=str(uuid.uuid4()),
            name=company_name,
            createdBy=user.id,
            createdAt=datetime.utcnow()
        )
        company.save()
        user.companyId = company.id
    else: # employee
        if not company_name:
            raise ValueError('Company name is required for employees')
        company = CompanyDocument.objects(name__iexact=company_name).first()
        if not company:
            raise ValueError('Company does not exist')
        user.companyId = company.id

    try:
        user.save()
        return user
    except DuplicateKeyError as exc:
        logger.exception('Duplicate email detected while creating user')
        raise ValueError('Email already exists') from exc


def authenticate_user(*, email: str, password: str) -> UserDocument | None:
    user = UserDocument.objects(email=email.lower().strip()).first()
    if not user:
        return None
    if not user.is_active:
        return None
    if not check_password(password, user.password):
        return None
    return user


def update_password(*, user: UserDocument, raw_password: str) -> UserDocument:
    user.password = make_password(raw_password)
    user.updated_at = datetime.utcnow()
    user.save()
    return user
