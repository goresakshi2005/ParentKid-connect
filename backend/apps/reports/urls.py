from django.urls import path
from .views import (
    UploadReportView,
    ConfirmAppointmentView,
    AppointmentListView,
    NextAppointmentView,
    AppointmentDeleteView,
)

urlpatterns = [
    path("reports/upload/", UploadReportView.as_view(), name="upload-report"),
    path("reports/confirm/", ConfirmAppointmentView.as_view(), name="confirm-appointment"),

    # List all appointments
    path("appointments/", AppointmentListView.as_view(), name="appointment-list"),

    # Next upcoming appointment (used by dashboard card)
    path("appointments/next/", NextAppointmentView.as_view(), name="appointment-next"),

    # Delete a specific appointment (also removes Google Calendar event)
    path("appointments/<int:pk>/delete/", AppointmentDeleteView.as_view(), name="appointment-delete"),
]