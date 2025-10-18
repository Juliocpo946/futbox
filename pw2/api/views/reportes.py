from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from pw2.services.reporte_service import ReporteService
from pw2.utils.logger import log_critical_error
from pw2.utils.permissions import IsAdminUser

class ReportesView(APIView):
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        try:
            service = ReporteService()
            reportes = service.generar_reportes()
            return Response(reportes, status=status.HTTP_200_OK)
        except Exception as e:
            log_critical_error("Error al generar reportes.", e)
            return Response({'error': 'Ocurrió un error en el servidor.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)