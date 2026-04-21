from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.users'

    def ready(self):
        import getpass
        import sys

        from django_mongoengine.mongo_auth.managers import MongoUserManager
        from django_mongoengine.mongo_auth.managers import get_user_document

        def _prompt_superuser_password():
            if not sys.stdin or not sys.stdin.isatty():
                raise ValueError('Superuser must have a password')

            while True:
                password = getpass.getpass('Password: ')
                password_again = getpass.getpass('Password (again): ')

                if not password:
                    print('Error: Blank passwords are not allowed.')
                    continue

                if password != password_again:
                    print("Error: Your passwords didn't match.")
                    continue

                return password

        def _create_superuser_requires_password(self, username, email=None, password=None, **extra_fields):
            if not password:
                password = _prompt_superuser_password()

            extra_fields.setdefault('is_staff', True)
            extra_fields.setdefault('is_superuser', True)
            return get_user_document().create_superuser(username, password, email)

        MongoUserManager.create_superuser = _create_superuser_requires_password
