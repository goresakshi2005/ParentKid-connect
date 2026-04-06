// android-app/app/src/main/java/com/parentkid/screenmonitor/UsageStatsHelper.kt

package com.parentkid.screenmonitor

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Process
import com.parentkid.screenmonitor.api.AppUsageItem
import java.text.SimpleDateFormat
import java.util.*

object UsageStatsHelper {

    /**
     * Check if the app has PACKAGE_USAGE_STATS permission.
     * If not, you must send the user to Settings > Apps > Special app access > Usage access.
     */
    fun hasUsagePermission(context: Context): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            Process.myUid(),
            context.packageName
        )
        return mode == AppOpsManager.MODE_ALLOWED
    }

    /**
     * Collects today's app usage stats using UsageStatsManager.
     * Returns a list of AppUsageItem ready to POST to the Django backend.
     *
     * Only includes apps with usage > 0 seconds.
     * Skips system/launcher apps that are not meaningful.
     */
    fun getTodayUsage(context: Context): List<AppUsageItem> {
        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE)
                as UsageStatsManager

        val cal = Calendar.getInstance()
        val endTime = cal.timeInMillis

        // Start of today (midnight)
        cal.set(Calendar.HOUR_OF_DAY, 0)
        cal.set(Calendar.MINUTE, 0)
        cal.set(Calendar.SECOND, 0)
        cal.set(Calendar.MILLISECOND, 0)
        val startTime = cal.timeInMillis

        val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())

        val stats = usageStatsManager.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            startTime,
            endTime
        )

        val pm = context.packageManager
        val skippedPackages = setOf(
            "com.android.launcher",
            "com.android.launcher2",
            "com.android.launcher3",
            "com.google.android.apps.nexuslauncher",
            "com.android.systemui",
            context.packageName  // Skip this app itself
        )

        return stats
            .filter { it.totalTimeInForeground > 0 }
            .filter { it.packageName !in skippedPackages }
            .map { stat ->
                val appName = try {
                    pm.getApplicationLabel(
                        pm.getApplicationInfo(stat.packageName, PackageManager.GET_META_DATA)
                    ).toString()
                } catch (e: PackageManager.NameNotFoundException) {
                    stat.packageName  // fallback to package name if app not found
                }

                AppUsageItem(
                    appName = appName,
                    packageName = stat.packageName,
                    usageTime = stat.totalTimeInForeground / 1000,  // ms → seconds
                    date = todayStr
                )
            }
            .sortedByDescending { it.usageTime }
    }

    /**
     * Returns DUMMY data for testing without a real Android device.
     * Remove this once you test with a real device.
     */
    fun getDummyUsage(): List<AppUsageItem> {
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        return listOf(
            AppUsageItem("YouTube", "com.google.android.youtube", 3600, today),
            AppUsageItem("Instagram", "com.instagram.android", 2700, today),
            AppUsageItem("WhatsApp", "com.whatsapp", 1800, today),
            AppUsageItem("Chrome", "com.android.chrome", 1200, today),
            AppUsageItem("Minecraft", "com.mojang.minecraftpe", 900, today),
            AppUsageItem("Spotify", "com.spotify.music", 600, today),
        )
    }
}