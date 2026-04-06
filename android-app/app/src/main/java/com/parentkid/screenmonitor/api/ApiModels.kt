// android-app/app/src/main/java/com/parentkid/screenmonitor/api/ApiModels.kt

package com.parentkid.screenmonitor.api

import com.google.gson.annotations.SerializedName

// ── Request bodies ─────────────────────────────────────────

data class LoginRequest(
    val username: String,
    val password: String
)

data class RegisterDeviceRequest(
    @SerializedName("device_id") val deviceId: String,
    @SerializedName("device_name") val deviceName: String
)

data class AppUsageItem(
    @SerializedName("app_name") val appName: String,
    @SerializedName("package_name") val packageName: String,
    @SerializedName("usage_time") val usageTime: Long,   // seconds
    val date: String                                       // "YYYY-MM-DD"
)

data class ScreenTimeUploadRequest(
    @SerializedName("device_id") val deviceId: String,
    val usages: List<AppUsageItem>
)

// ── Response bodies ────────────────────────────────────────

data class LoginResponse(
    val access: String,
    val refresh: String,
    val user: UserInfo
)

data class UserInfo(
    val id: Int,
    val username: String,
    val email: String
)

data class DeviceResponse(
    val id: Int,
    @SerializedName("device_name") val deviceName: String,
    @SerializedName("device_id") val deviceId: String,
    @SerializedName("registered_at") val registeredAt: String
)

data class UploadResponse(
    val message: String,
    val created: Int,
    val updated: Int
)