from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .documents import CompanyDocument

class CompanyCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        name = request.query_params.get('name', '').strip()
        # Normalize spaces
        name = " ".join(name.split())
        
        if not name:
            return Response({'exists': False, 'total_count': CompanyDocument.objects.count()})
        
        # Case-insensitive search for company name
        company = CompanyDocument.objects(name__iexact=name).first()
        return Response({
            'exists': bool(company),
            'total_count': CompanyDocument.objects.count(),
            'searched_for': name
        })
