import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

/**
 * ReportUploader.jsx
 *
 * Changes from original:
 * - Added Google Calendar connection status check on mount
 * - Added "Connect Google Calendar" banner when user has not connected
 * - Shows calendar icon in "done" step indicating whether event was added to calendar
 */
export default function ReportUploader({ token }) {
    const [file, setFile] = useState(null);
    const [step, setStep] = useState("upload"); // upload | confirm | done | error
    const [loading, setLoading] = useState(false);
    const [extracted, setExtracted] = useState(null);
    const [reportId, setReportId] = useState(null);
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");

    const [editDate, setEditDate] = useState("");
    const [editTime, setEditTime] = useState("");
    const [editDoctor, setEditDoctor] = useState("");

    // ✅ NEW: Google Calendar connection state
    const [googleConnected, setGoogleConnected] = useState(null); // null = loading, true/false
    const [connectingGoogle, setConnectingGoogle] = useState(false);

    const fileInputRef = useRef(null);
    const authHeaders = { Authorization: `Bearer ${token}` };

    // ✅ NEW: Check if user has connected Google Calendar on mount
    useEffect(() => {
        checkGoogleStatus();
    }, [token]);

    const checkGoogleStatus = async () => {
        try {
            const res = await axios.get(
                `${process.env.REACT_APP_API_URL}/users/google_status/`,
                { headers: authHeaders }
            );
            setGoogleConnected(res.data.connected);
        } catch {
            setGoogleConnected(false);
        }
    };

    // ✅ NEW: Redirect user to Google OAuth
    const handleConnectGoogle = async () => {
        setConnectingGoogle(true);
        try {
            const res = await axios.get(
                `${process.env.REACT_APP_API_URL}/users/google_oauth_url/`,
                { headers: authHeaders }
            );
            // Redirect to Google consent screen
            window.location.href = res.data.url;
        } catch {
            alert("Could not start Google connection. Please try again.");
            setConnectingGoogle(false);
        }
    };

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) setFile(selected);
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setErrorMsg("");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await axios.post(
                `${process.env.REACT_APP_API_URL}/reports/upload/`,
                formData,
                { headers: { ...authHeaders, "Content-Type": "multipart/form-data" } }
            );

            const { appointment, report_id } = res.data;
            setExtracted(appointment);
            setReportId(report_id);
            setEditDate(appointment.date);
            setEditTime(convertTo24(appointment.time));
            setEditDoctor(appointment.doctor);
            setStep("confirm");
        } catch (err) {
            setErrorMsg(err.response?.data?.error || "Something went wrong. Please try again.");
            setStep("error");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        setLoading(true);
        setErrorMsg("");

        try {
            const parsed = new Date(`${editDate}T${editTime}`);
            const datetimeIso = parsed.toISOString();

            const res = await axios.post(
                `${process.env.REACT_APP_API_URL}/reports/confirm/`,
                { report_id: reportId, datetime_iso: datetimeIso, doctor: editDoctor },
                { headers: authHeaders }
            );
            setResult(res.data);
            setStep("done");
            // Refresh google status after scheduling
            checkGoogleStatus();
        } catch (err) {
            setErrorMsg(err.response?.data?.error || "Scheduling failed. Please try again.");
            setStep("error");
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setStep("upload");
        setFile(null);
        setExtracted(null);
        setErrorMsg("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div>
            <h2 className="text-3xl font-extrabold dark:text-white mb-2">
                📋 Upload Checkup Report
            </h2>
            <p className="text-gray-500 dark:text-slate-400 mb-6">
                Upload your pregnancy checkup report and we'll automatically schedule your next appointment in Google Calendar.
            </p>

            {/* ✅ NEW: Google Calendar connection banner */}
            {googleConnected === false && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📅</span>
                        <div>
                            <p className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm">
                                Google Calendar not connected
                            </p>
                            <p className="text-yellow-700 dark:text-yellow-400 text-xs">
                                Connect your Google account so appointments are added to your calendar automatically.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleConnectGoogle}
                        disabled={connectingGoogle}
                        className="shrink-0 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2"
                    >
                        {connectingGoogle ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Connecting...
                            </>
                        ) : (
                            "Connect Google Calendar"
                        )}
                    </button>
                </div>
            )}

            {googleConnected === true && (
                <div className="mb-6 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                    <span className="text-xl">✅</span>
                    <p className="text-green-700 dark:text-green-400 text-sm font-medium">
                        Google Calendar connected — appointments will be added automatically.
                    </p>
                </div>
            )}

            {/* ── STEP 1: Upload ── */}
            {step === "upload" && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-gray-100 dark:border-slate-800 p-8 space-y-6">

                    {/* File Picker Area */}
                    <div>
                        <p className="text-sm font-semibold text-gray-600 dark:text-slate-400 mb-3">
                            Step 1 — Choose your report file
                        </p>
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-5 py-3 bg-gray-100 dark:bg-slate-800 border-2 border-dashed border-pink-400 dark:border-pink-600 rounded-xl text-pink-600 dark:text-pink-400 font-semibold hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-all flex items-center gap-2"
                            >
                                📁 Choose File
                            </button>
                            <span className="text-sm text-gray-500 dark:text-slate-400 truncate max-w-xs">
                                {file ? file.name : "No file chosen"}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                            Supports: PDF, PNG, JPG, JPEG
                        </p>
                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 dark:border-slate-800" />

                    {/* Extract Button */}
                    <div>
                        <p className="text-sm font-semibold text-gray-600 dark:text-slate-400 mb-3">
                            Step 2 — Extract appointment from report
                        </p>
                        <button
                            onClick={handleUpload}
                            disabled={!file || loading}
                            className="w-full py-4 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Extracting appointment...
                                </>
                            ) : (
                                "🔍 Extract & Analyse Report"
                            )}
                        </button>
                        {!file && (
                            <p className="text-xs text-center text-gray-400 dark:text-slate-500 mt-2">
                                Please choose a file first
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* ── STEP 2: Confirm ── */}
            {step === "confirm" && extracted && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-gray-100 dark:border-slate-800 p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-4xl">✅</span>
                        <div>
                            <h3 className="text-xl font-bold dark:text-white">Appointment Detected!</h3>
                            <p className="text-gray-500 dark:text-slate-400 text-sm">Confirm or edit before scheduling</p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 dark:text-slate-400 mb-1">📅 Date</label>
                            <input
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 dark:text-slate-400 mb-1">🕐 Time</label>
                            <input
                                type="time"
                                value={editTime}
                                onChange={(e) => setEditTime(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 dark:text-slate-400 mb-1">👨‍⚕️ Doctor (optional)</label>
                            <input
                                type="text"
                                value={editDoctor}
                                placeholder="e.g. Dr. Sharma"
                                onChange={(e) => setEditDoctor(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
                            />
                        </div>
                    </div>

                    {/* ✅ NEW: warn if calendar not connected */}
                    {googleConnected === false && (
                        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-700 dark:text-yellow-400">
                            ⚠️ Google Calendar not connected — appointment will be saved in the app but <strong>not</strong> added to Google Calendar.{" "}
                            <button
                                onClick={handleConnectGoogle}
                                className="underline font-semibold hover:no-underline"
                            >
                                Connect now
                            </button>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={reset}
                            className="flex-1 py-3 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                        >
                            ← Back
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={loading}
                            className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Scheduling...
                                </>
                            ) : (
                                "📅 Schedule Appointment"
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 3: Done ── */}
            {step === "done" && result && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-gray-100 dark:border-slate-800 p-8 text-center">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-2xl font-bold dark:text-white mb-2">Appointment Scheduled!</h3>
                    <p className="text-gray-600 dark:text-slate-400 mb-2">{result.message}</p>

                    {/* ✅ NEW: show clearly whether Google Calendar was updated */}
                    {result.google_event_id ? (
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-4">
                            ✅ Added to Google Calendar
                        </p>
                    ) : (
                        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-700 dark:text-yellow-400">
                            ⚠️ Saved in app, but <strong>not added to Google Calendar</strong> because your account isn't connected.{" "}
                            <button
                                onClick={handleConnectGoogle}
                                className="underline font-semibold hover:no-underline"
                            >
                                Connect Google Calendar
                            </button>
                            {" "}to enable this for future uploads.
                        </div>
                    )}

                    <p className="text-sm text-gray-400 dark:text-slate-500 mb-8">
                        You'll receive email reminders 1 day and 2 hours before your appointment.
                    </p>
                    <button
                        onClick={reset}
                        className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold shadow-lg transition-all"
                    >
                        Upload Another Report
                    </button>
                </div>
            )}

            {/* ── Error ── */}
            {step === "error" && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-red-100 dark:border-red-900/50 p-8 text-center">
                    <div className="text-5xl mb-4">❌</div>
                    <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Something went wrong</h3>
                    <p className="text-gray-600 dark:text-slate-400 mb-6">{errorMsg}</p>
                    <button
                        onClick={reset}
                        className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold shadow-lg transition-all"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}

// Convert "11:00 AM" → "11:00" for <input type="time">
function convertTo24(timeStr) {
    if (!timeStr || timeStr.includes("default")) return "10:00";
    try {
        const [time, modifier] = timeStr.split(" ");
        let [hours, minutes] = time.split(":");
        if (modifier === "PM" && hours !== "12") hours = String(parseInt(hours) + 12);
        if (modifier === "AM" && hours === "12") hours = "00";
        return `${hours.padStart(2, "0")}:${minutes}`;
    } catch {
        return "10:00";
    }
}