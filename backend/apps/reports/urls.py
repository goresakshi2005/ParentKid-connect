# backend/apps/reports/urls.py

from django.urls import path
from .views import (
    UploadReportView,
    ConfirmAppointmentView,
    AppointmentListView,
    NextAppointmentView,
    AppointmentDeleteView,
    # ── NEW ──
    MaternalHealthGuideView,
    MaternalHealthGuideListView,
    MaternalHealthGuideDetailView,
)

urlpatterns = [
    # Existing routes
    path("reports/upload/", UploadReportView.as_view(), name="upload-report"),
    path("reports/confirm/", ConfirmAppointmentView.as_view(), name="confirm-appointment"),
    path("appointments/", AppointmentListView.as_view(), name="appointment-list"),
    path("appointments/next/", NextAppointmentView.as_view(), name="appointment-next"),
    path("appointments/<int:pk>/delete/", AppointmentDeleteView.as_view(), name="appointment-delete"),

    # ── NEW: Maternal Health Guide routes ──
    path("reports/health-guide/", MaternalHealthGuideView.as_view(), name="health-guide-create"),
    path("reports/health-guide/history/", MaternalHealthGuideListView.as_view(), name="health-guide-list"),
    path("reports/health-guide/<int:pk>/", MaternalHealthGuideDetailView.as_view(), name="health-guide-detail"),
]