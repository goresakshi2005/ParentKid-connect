from django.urls import path
from .views import UploadReportView, ConfirmAppointmentView, AppointmentListView

urlpatterns = [
    path("reports/upload/", UploadReportView.as_view(), name="upload-report"),
    path("reports/confirm/", ConfirmAppointmentView.as_view(), name="confirm-appointment"),
    path("appointments/", AppointmentListView.as_view(), name="appointment-list"),
]