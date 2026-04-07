// android-app/app/src/main/java/com/parentkid/screenmonitor/api/RetrofitClient.kt

package com.parentkid.screenmonitor.api

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {

    // ⚠️ IMPORTANT: Change this to your computer's IP when testing on a real device.
    // Use 10.0.2.2 for Android emulator (it maps to your host machine's localhost).
    // Use your LAN IP (e.g. 192.168.1.X) for a real device on the same Wi-Fi.
    private const val BASE_URL = "http://10.0.2.2:8000/"

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(loggingInterceptor)
        .build()

    val api: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}