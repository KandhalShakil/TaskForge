from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django_mongoengine import mongo_admin

urlpatterns = [
    path('admin/', mongo_admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/workspaces/', include('apps.workspaces.urls')),
    path('api/projects/', include('apps.projects.urls')),
    path('api/tasks/', include('apps.tasks.urls')),
    path('api/categories/', include('apps.tasks.category_urls')),
    path('api/chat/', include('apps.chat.urls')),
    path('api/companies/', include('apps.companies.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
