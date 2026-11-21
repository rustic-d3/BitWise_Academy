from django.urls import path

from . import views

urlpatterns = [
    path("glitch/chat/", views.GlitchChatView.as_view(), name="glitch-chat"),
]
