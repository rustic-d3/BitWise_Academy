from rest_framework.permissions import BasePermission
from .models import User


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.role == User.Role.ADMIN


class IsTeacher(BasePermission):
    message = "Only teachers can perform this action."

    def has_permission(self, request, view):
        return request.user.role == User.Role.TEACHER


class IsParent(BasePermission):
    message = "Only parents can perform this action."

    def has_permission(self, request, view):
        return request.user.role == User.Role.PARENT
