import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

/**
 * GoogleCallback.jsx
 *
 * This page handles the redirect from Google OAuth.
 * Google sends the user here with ?code=... in the URL.
 * We extract the code, send it to our backend to exchange for tokens,
 * and then redirect back to the pregnancy dashboard.
 *
 * Route: /google-callback  (add this to App.js)
 */
function GoogleCallback() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState('connecting'); // connecting | success | error
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const error = params.get('error');

        if (error) {
            setStatus('error');
            setErrorMsg('Google authorization was denied or cancelled.');
            return;
        }

        if (!code) {
            setStatus('error');
            setErrorMsg('No authorization code received from Google.');
            return;
        }

        if (!token) {
            // Not logged in — redirect to login
            navigate('/login/parent');
            return;
        }

        // Exchange the code for tokens via our backend
        axios
            .post(
                `${process.env.REACT_APP_API_URL}/users/google_oauth_callback/`,
                { code },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            .then(() => {
                setStatus('success');
                // Redirect to pregnancy dashboard after a short delay
                setTimeout(() => navigate('/dashboard/pregnancy'), 1500);
            })
            .catch((err) => {
                setStatus('error');
                setErrorMsg(
                    err.response?.data?.error ||
                    'Failed to connect Google Calendar. Please try again.'
                );
            });
    }, [token, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-10 max-w-md w-full text-center border dark:border-slate-800">

                {status === 'connecting' && (
                    <>
                        <div className="w-14 h-14 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                        <h2 className="text-xl font-bold dark:text-white mb-2">Connecting Google Calendar...</h2>
                        <p className="text-gray-500 dark:text-slate-400 text-sm">
                            Please wait while we link your Google account.
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">
                            Google Calendar Connected!
                        </h2>
                        <p className="text-gray-500 dark:text-slate-400 text-sm">
                            Your appointments will now appear in Google Calendar.
                            Redirecting you back...
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="text-6xl mb-4">❌</div>
                        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
                            Connection Failed
                        </h2>
                        <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">{errorMsg}</p>
                        <button
                            onClick={() => navigate('/dashboard/pregnancy')}
                            className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold shadow-md transition-all"
                        >
                            Back to Dashboard
                        </button>
                    </>
                )}

            </div>
        </div>
    );
}

export default GoogleCallback;