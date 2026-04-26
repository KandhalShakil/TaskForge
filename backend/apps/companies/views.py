from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .documents import CompanyDocument

class CompanyCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        name = request.query_params.get('name', '').strip()
        if not name:
            return Response({'exists': False})
        
        # Case-insensitive search for company name
        company = CompanyDocument.objects(name__iexact=name).first()
        return Response({'exists': bool(company)})
