import React, { useState } from "react";
import axios from "axios";

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

    const authHeaders = { Authorization: `Bearer ${token}` };

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
    };

    return (
        <div>
            <h2 className="text-3xl font-extrabold dark:text-white mb-2">
                📋 Upload Checkup Report
            </h2>
            <p className="text-gray-500 dark:text-slate-400 mb-8">
                Upload your pregnancy checkup report and we'll automatically schedule your next appointment in Google Calendar.
            </p>

            {/* ── STEP 1: Upload ── */}
            {step === "upload" && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-gray-100 dark:border-slate-800 p-8">
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-pink-400 dark:border-pink-600 rounded-xl p-10 cursor-pointer hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-all mb-6">
                        <span className="text-5xl mb-3">📁</span>
                        <span className="text-pink-600 dark:text-pink-400 font-semibold text-lg">
                            {file ? file.name : "Click to choose PDF or Image"}
                        </span>
                        <span className="text-gray-400 text-sm mt-1">Supports: PDF, PNG, JPG, JPEG</span>
                        <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => setFile(e.target.files[0])}
                        />
                    </label>

                    <button
                        onClick={handleUpload}
                        disabled={!file || loading}
                        className="w-full py-4 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg transition-all"
                    >
                        {loading ? "Extracting appointment..." : "Upload & Extract Appointment"}
                    </button>
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
                            className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg transition-all"
                        >
                            {loading ? "Scheduling..." : "📅 Schedule in Google Calendar"}
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