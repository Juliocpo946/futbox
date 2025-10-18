from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from pw2.api.serializers import (
    PaisSerializer, MundialSerializer, MundialDetalleSerializer, CategoriaSerializer
)
from pw2.services.pais_service import PaisService
from pw2.services.mundial_service import MundialService
from pw2.services.categoria_service import CategoriaService
from pw2.utils.permissions import IsAdminUser

class AdminPaisesView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        service = PaisService()
        paises = service.get_all()
        serializer = PaisSerializer(paises, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PaisSerializer(data=request.data)
        if serializer.is_valid():
            service = PaisService()
            pais = service.create(serializer.validated_data)
            return Response(PaisSerializer(pais).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminPaisDetalleView(APIView):
    permission_classes = [IsAdminUser]

    def put(self, request, pk):
        serializer = PaisSerializer(data=request.data)
        if serializer.is_valid():
            try:
                service = PaisService()
                pais = service.update(pk, serializer.validated_data)
                return Response(PaisSerializer(pais).data)
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            service = PaisService()
            service.delete(pk)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

class AdminMundialesView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        service = MundialService()
        mundiales = service.get_all()
        serializer = MundialDetalleSerializer(mundiales, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = MundialSerializer(data=request.data)
        if serializer.is_valid():
            service = MundialService()
            mundial = service.create(serializer.validated_data)
            return Response(MundialDetalleSerializer(mundial).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminMundialDetalleView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            service = MundialService()
            mundial = service.get_by_id(pk)
            return Response(MundialDetalleSerializer(mundial).data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        serializer = MundialSerializer(data=request.data)
        if serializer.is_valid():
            try:
                service = MundialService()
                mundial = service.update(pk, serializer.validated_data)
                return Response(MundialDetalleSerializer(mundial).data)
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            service = MundialService()
            service.delete(pk)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)

class AdminCategoriasView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        service = CategoriaService()
        categorias = service.get_all()
        serializer = CategoriaSerializer(categorias, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CategoriaSerializer(data=request.data)
        if serializer.is_valid():
            service = CategoriaService()
            categoria = service.create(serializer.validated_data)
            return Response(CategoriaSerializer(categoria).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class AdminCategoriaDetalleView(APIView):
    permission_classes = [IsAdminUser]

    def put(self, request, pk):
        serializer = CategoriaSerializer(data=request.data)
        if serializer.is_valid():
            try:
                service = CategoriaService()
                categoria = service.update(pk, serializer.validated_data)
                return Response(CategoriaSerializer(categoria).data)
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            service = CategoriaService()
            service.delete(pk)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_404_NOT_FOUND)