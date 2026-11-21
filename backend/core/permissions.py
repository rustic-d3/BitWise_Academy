"""Role-based DRF permissions shared by every app."""

from rest_framework.permissions import BasePermission


class _HasRole(BasePermission):
    role = None

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.role == self.role)


class IsAdmin(BasePermission):
    message = "Only administrators can perform this action."

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_superuser or user.role == user.Role.ADMIN)
        )


class IsTeacher(_HasRole):
    role = "TEACHER"
    message = "Only teachers can perform this action."


class IsParent(_HasRole):
    role = "PARENT"
    message = "Only parents can perform this action."
