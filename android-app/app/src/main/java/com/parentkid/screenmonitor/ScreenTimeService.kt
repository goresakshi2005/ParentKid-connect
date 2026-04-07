// android-app/app/src/main/java/com/parentkid/screenmonitor/ScreenTimeService.kt

package com.parentkid.screenmonitor

import android.app.Service
import android.content.Intent
import android.os.IBinder
import android.util.Log
import com.parentkid.screenmonitor.api.LoginRequest
import com.parentkid.screenmonitor.api.RegisterDeviceRequest
import com.parentkid.screenmonitor.api.RetrofitClient
import com.parentkid.screenmonitor.api.ScreenTimeUploadRequest
import kotlinx.coroutines.*

/**
 * Optional background service — syncs screen time data without user interaction.
 *
 * To start it from MainActivity:
 *   startService(Intent(this, ScreenTimeService::class.java))
 *
 * For production use, replace this with WorkManager for reliable background execution.
 */
class ScreenTimeService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    // ── Configure these to match MainActivity ─────────
    private val USERNAME = "testparent"
    private val PASSWORD = "testpass123"
    private val USE_DUMMY = true
    // ──────────────────────────────────────────────────

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d("ScreenTimeService", "Service started — beginning sync")
        serviceScope.launch {
            runSync()
            stopSelf()
        }
        return START_NOT_STICKY
    }

    private suspend fun runSync() {
        try {
            val loginResp = RetrofitClient.api.login(LoginRequest(USERNAME, PASSWORD))
            if (!loginResp.isSuccessful) {
                Log.e("ScreenTimeService", "Login failed: ${loginResp.code()}")
                return
            }

            val token = "Bearer ${loginResp.body()!!.access}"
            val deviceId = getDeviceId()

            RetrofitClient.api.registerDevice(
                token,
                RegisterDeviceRequest(
                    deviceId = deviceId,
                    deviceName = "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}"
                )
            )

            val usages = if (USE_DUMMY) {
                UsageStatsHelper.getDummyUsage()
            } else {
                UsageStatsHelper.getTodayUsage(this@ScreenTimeService)
            }

            val uploadResp = RetrofitClient.api.uploadScreenTime(
                token,
                ScreenTimeUploadRequest(deviceId = deviceId, usages = usages)
            )

            if (uploadResp.isSuccessful) {
                Log.d("ScreenTimeService", "Sync successful: ${uploadResp.body()?.message}")
            } else {
                Log.e("ScreenTimeService", "Upload failed: ${uploadResp.code()}")
            }

        } catch (e: Exception) {
            Log.e("ScreenTimeService", "Sync error: ${e.message}", e)
        }
    }

    private fun getDeviceId(): String {
        return try {
            android.provider.Settings.Secure.getString(
                contentResolver,
                android.provider.Settings.Secure.ANDROID_ID
            ) ?: "unknown-device"
        } catch (e: Exception) {
            "unknown-device"
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }
}