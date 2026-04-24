from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterView, CategoryViewSet, ExpenseViewSet, BudgetViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='categories')
router.register(r'expenses', ExpenseViewSet, basename='expenses')
router.register(r'budgets', BudgetViewSet, basename='budgets')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('', include(router.urls)),
]