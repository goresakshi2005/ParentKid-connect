// android-app/app/src/main/java/com/parentkid/screenmonitor/MainActivity.kt

package com.parentkid.screenmonitor

import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.parentkid.screenmonitor.api.LoginRequest
import com.parentkid.screenmonitor.api.RegisterDeviceRequest
import com.parentkid.screenmonitor.api.RetrofitClient
import com.parentkid.screenmonitor.api.ScreenTimeUploadRequest
import kotlinx.coroutines.launch
import java.util.UUID

class MainActivity : AppCompatActivity() {

    // ──────────────────────────────────────────
    // CONFIG — Change these for your setup
    // ──────────────────────────────────────────
    private val USERNAME = "testparent"       // Your Django user
    private val PASSWORD = "testpass123"      // Your Django password
    private val USE_DUMMY_DATA = true         // Set false on real device with permission
    // ──────────────────────────────────────────

    private var accessToken: String? = null
    private val deviceId = getDeviceId()

    private lateinit var statusText: TextView
    private lateinit var btnSync: Button
    private lateinit var btnPermission: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        statusText = findViewById(R.id.statusText)
        btnSync = findViewById(R.id.btnSync)
        btnPermission = findViewById(R.id.btnPermission)

        btnPermission.setOnClickListener {
            // Opens Android's Usage Access settings screen
            startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
        }

        btnSync.setOnClickListener {
            lifecycleScope.launch {
                syncScreenTime()
            }
        }

        // Auto-check permission
        updatePermissionStatus()
    }

    private fun updatePermissionStatus() {
        val hasPermission = UsageStatsHelper.hasUsagePermission(this)
        btnPermission.isEnabled = !hasPermission
        btnPermission.text = if (hasPermission) "✓ Permission Granted" else "Grant Usage Permission"
    }

    private suspend fun syncScreenTime() {
        statusText.text = "Step 1/3: Logging in..."
        btnSync.isEnabled = false

        try {
            // ── Step 1: Login ─────────────────────────
            val loginResp = RetrofitClient.api.login(LoginRequest(USERNAME, PASSWORD))
            if (!loginResp.isSuccessful) {
                showError("Login failed: ${loginResp.code()} ${loginResp.errorBody()?.string()}")
                return
            }
            accessToken = loginResp.body()!!.access
            val authHeader = "Bearer $accessToken"
            Log.d("ScreenMonitor", "Logged in. Token: $accessToken")

            // ── Step 2: Register device ───────────────
            statusText.text = "Step 2/3: Registering device..."
            val deviceResp = RetrofitClient.api.registerDevice(
                authHeader,
                RegisterDeviceRequest(
                    deviceId = deviceId,
                    deviceName = "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}"
                )
            )
            if (!deviceResp.isSuccessful) {
                showError("Device registration failed: ${deviceResp.errorBody()?.string()}")
                return
            }
            Log.d("ScreenMonitor", "Device registered: ${deviceResp.body()}")

            // ── Step 3: Collect & Upload usage ────────
            statusText.text = "Step 3/3: Uploading screen time..."

            val usages = if (USE_DUMMY_DATA) {
                UsageStatsHelper.getDummyUsage()
            } else {
                if (!UsageStatsHelper.hasUsagePermission(this)) {
                    showError("Please grant Usage Access permission first.")
                    return
                }
                UsageStatsHelper.getTodayUsage(this)
            }

            Log.d("ScreenMonitor", "Sending ${usages.size} app usage records")

            val uploadResp = RetrofitClient.api.uploadScreenTime(
                authHeader,
                ScreenTimeUploadRequest(deviceId = deviceId, usages = usages)
            )

            if (!uploadResp.isSuccessful) {
                showError("Upload failed: ${uploadResp.errorBody()?.string()}")
                return
            }

            val result = uploadResp.body()!!
            statusText.text = "✓ Sync complete!\n" +
                    "Apps synced: ${usages.size}\n" +
                    "New records: ${result.created}\n" +
                    "Updated: ${result.updated}"
            Toast.makeText(this, "Screen time synced!", Toast.LENGTH_SHORT).show()

        } catch (e: Exception) {
            showError("Network error: ${e.message}\n\nMake sure Django is running on port 8000.")
            Log.e("ScreenMonitor", "Sync error", e)
        } finally {
            btnSync.isEnabled = true
            updatePermissionStatus()
        }
    }

    private fun showError(msg: String) {
        statusText.text = "❌ Error:\n$msg"
        Toast.makeText(this, "Sync failed", Toast.LENGTH_LONG).show()
    }

    private fun getDeviceId(): String {
        // Use Android ID as a stable device identifier
        return try {
            Settings.Secure.getString(
                application.contentResolver,
                Settings.Secure.ANDROID_ID
            ) ?: UUID.randomUUID().toString()
        } catch (e: Exception) {
            UUID.randomUUID().toString()
        }
    }
}