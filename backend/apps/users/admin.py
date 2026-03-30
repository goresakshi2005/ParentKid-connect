from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, ParentTeenLink

class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_staff')
    list_filter = ('role', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        ('Role Info', {'fields': ('role', 'phone', 'avatar', 'bio')}),
    )

admin.site.register(CustomUser, CustomUserAdmin)
admin.site.register(ParentTeenLink)