from django.contrib.auth.models import User
from rest_framework import generics, permissions, viewsets

from .models import Category, Expense, Budget   # ✅ FIX: Budget import add kiya
from .serializers import (
    RegisterSerializer,
    CategorySerializer,
    ExpenseSerializer,
    BudgetSerializer,
)


# ---------------- AUTH ----------------
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


# ---------------- CATEGORY ----------------
class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user).order_by("name")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ---------------- EXPENSE ----------------
class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Expense.objects.filter(user=self.request.user).order_by("-date", "-id")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ---------------- BUDGET ----------------
class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user).order_by("-id")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)