// android-app/app/src/main/java/com/parentkid/screenmonitor/api/ApiService.kt

package com.parentkid.screenmonitor.api

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST

interface ApiService {

    @POST("api/login")
    suspend fun login(
        @Body request: LoginRequest
    ): Response<LoginResponse>

    @POST("api/register-device")
    suspend fun registerDevice(
        @Header("Authorization") token: String,
        @Body request: RegisterDeviceRequest
    ): Response<DeviceResponse>

    @POST("api/upload-screen-time")
    suspend fun uploadScreenTime(
        @Header("Authorization") token: String,
        @Body request: ScreenTimeUploadRequest
    ): Response<UploadResponse>
}