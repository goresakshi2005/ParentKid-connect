import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiArrowLeft, FiActivity, FiZap } from 'react-icons/fi';

const EarlyChildhoodIntelligencePage = () => {
    const { childId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        fetchHistory();
    }, [childId]);

    const fetchHistory = async () => {
        try {
            const res = await axios.get(
                `${process.env.REACT_APP_API_URL}/early-childhood/history/${childId}/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setHistory(res.data);
        } catch (err) {
            console.error("Failed to fetch history:", err);
        }
    };
    
    const [formData, setFormData] = useState({
        child_id: childId,
        age: '',
        gender: '',
        weight: '',
        height: '',
        speech_status: '',
        response_name: '',
        eye_contact: '',
        motor_skills: '',
        social_behavior: '',
        eating_habit: '',
        sleep_hours: '',
        screen_time: '',
        problem_selected: '',
        symptoms: '',
        parent_text: '',
        emotional_score: '',
        routine_score: '',
        behavior_score: '',
        input_confidence: 'High'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAnalyze = async () => {
        if (!formData.age || !formData.problem_selected) {
            setError("Age and Current Problem are required.");
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await axios.post(
                `${process.env.REACT_APP_API_URL}/early-childhood/analyze/`, 
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setResult(res.data.analysis);
        } catch (err) {
            setError(err.response?.data?.error || "Analysis failed.");
        } finally {
            setLoading(false);
            fetchHistory(); // refresh history after adding new tracking
        }
    };

    const handleViewHistoryItem = (item) => {
        setResult(item.analysis_result);
        setShowHistory(false);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 mt-10 bg-white dark:bg-slate-900 shadow-xl rounded-2xl border border-gray-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => navigate('/dashboard/parent')} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-all font-medium">
                    <FiArrowLeft /> Back to Dashboard
                </button>
                {history.length > 0 && !result && (
                    <button 
                        onClick={() => setShowHistory(!showHistory)} 
                        className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-slate-800 dark:text-blue-400 rounded-xl font-bold hover:bg-blue-200 transition-all"
                    >
                        {showHistory ? 'New Tracking' : 'Past Tracking'}
                    </button>
                )}
            </div>
            
            <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white flex items-center gap-2 mb-8">
                <span className="p-2 bg-green-100 dark:bg-teal-500/20 text-green-600 dark:text-teal-400 rounded-xl">
                    <FiActivity />
                </span>
                Early Childhood Tracking (0-6 yrs)
            </h1>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">{error}</div>}

            {showHistory ? (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold dark:text-white mb-4">Past Tracking History</h2>
                    {history.length === 0 ? (
                        <p className="text-gray-500">No past trackings found.</p>
                    ) : (
                        history.map((item, idx) => (
                            <div key={idx} className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 flex justify-between items-center">
                                <div>
                                    <p className="font-bold dark:text-white text-lg">Report from {new Date(item.created_at).toLocaleDateString()}</p>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">Problem: {item.problem_selected}</p>
                                </div>
                                <button 
                                    onClick={() => handleViewHistoryItem(item)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                                >
                                    View Report
                                </button>
                            </div>
                        ))
                    )}
                </div>
            ) : !result ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1 dark:text-white">Age (Years/Months)</label>
                            <input type="text" name="age" className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="e.g. 2.5" onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 dark:text-white">Gender</label>
                            <input type="text" name="gender" className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 dark:text-white">Weight (kg)</label>
                            <input type="number" name="weight" className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 dark:text-white">Height (cm)</label>
                            <input type="number" name="height" className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" onChange={handleChange} />
                        </div>
                    </div>

                    <h3 className="font-bold text-lg dark:text-white mt-6 border-b pb-2">Development (Parent Observed)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1 dark:text-white">Speech Ability</label>
                            <input type="text" name="speech_status" placeholder="e.g. Babbles, single words" className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 dark:text-white">Responds to Name</label>
                            <input type="text" name="response_name" placeholder="Yes/No/Sometimes" className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 dark:text-white">Eye Contact</label>
                            <input type="text" name="eye_contact" placeholder="Good/Poor" className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 dark:text-white">Motor Skills</label>
                            <input type="text" name="motor_skills" placeholder="Crawls, walks, clumsy?" className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" onChange={handleChange} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold mb-1 dark:text-white">Social Interaction</label>
                            <input type="text" name="social_behavior" placeholder="Plays with others?" className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" onChange={handleChange} />
                        </div>
                    </div>

                    <h3 className="font-bold text-lg dark:text-white mt-6 border-b pb-2">Habits</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1 dark:text-white">Eating Pattern</label>
                            <input type="text" name="eating_habit" className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 dark:text-white">Sleep (hrs/day)</label>
                            <input type="number" name="sleep_hours" className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 dark:text-white">Screen Time (hrs)</label>
                            <input type="number" name="screen_time" className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" onChange={handleChange} />
                        </div>
                    </div>

                    <h3 className="font-bold text-lg dark:text-white mt-6 border-b pb-2">Scores</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1 dark:text-white">Emotional Score (1-10)</label>
                            <input type="number" name="emotional_score" className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 dark:text-white">Routine Score (1-10)</label>
                            <input type="number" name="routine_score" className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 dark:text-white">Behavior Score (1-10)</label>
                            <input type="number" name="behavior_score" className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" onChange={handleChange} />
                        </div>
                    </div>

                    <h3 className="font-bold text-lg dark:text-white mt-6 border-b pb-2">Concerns</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1 dark:text-white">Current Problem (Required)</label>
                            <input type="text" name="problem_selected" placeholder="e.g. Frequent tantrums" className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 dark:text-white">Symptoms</label>
                            <input type="text" name="symptoms" placeholder="e.g. Crying, lack of appetite" className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" onChange={handleChange} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 dark:text-white">Parent Description Details</label>
                            <textarea name="parent_text" rows="3" className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:border-slate-700 dark:text-white" onChange={handleChange}></textarea>
                        </div>
                    </div>

                    <button 
                        onClick={handleAnalyze} 
                        disabled={loading}
                        className="w-full py-4 text-lg font-bold bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all mt-6 shadow-lg"
                    >
                        {loading ? 'Analyzing...' : <><FiZap /> Get AI Assessment Tracker</>}
                    </button>
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    <div className="p-6 rounded-2xl shadow border-2 inline-block w-full bg-blue-50 dark:bg-slate-800 border-blue-200 dark:border-blue-800">
                        <h2 className="text-xl font-bold mb-2 dark:text-white">
                            🔍 Identified Deficiency / Concern
                        </h2>
                        <p className="text-gray-700 dark:text-slate-300 font-medium">
                            {result.deficiency}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                            <h3 className="font-bold text-lg mb-3">🧐 Why it is happening</h3>
                            <p className="text-gray-700 dark:text-slate-300">{result.why_it_is_happening}</p>
                            
                            <h3 className="font-bold text-lg mt-6 mb-3 text-green-600">✅ What to Do</h3>
                            <p className="text-gray-700 dark:text-slate-300">{result.what_to_do}</p>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                            <h3 className="font-bold text-lg mb-3 text-blue-600">🛠️ How to Do (Step-by-Step)</h3>
                            <ul className="list-decimal pl-5 space-y-2 text-gray-700 dark:text-slate-300">
                                {result.how_to_do?.map((step, i) => <li key={i}>{step}</li>)}
                            </ul>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-2xl border border-green-200 dark:border-green-800 shadow-sm">
                            <h3 className="font-bold text-lg mb-3 text-green-700">🌟 Existing Good Habits</h3>
                            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-slate-300">
                                {result.good_habits?.map((habit, i) => <li key={i}>{habit}</li>)}
                            </ul>
                        </div>
                        
                        <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-2xl border border-red-200 dark:border-red-800 shadow-sm">
                            <h3 className="font-bold text-lg mb-3 text-red-700">⚠️ Existing Bad Habits</h3>
                            <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-slate-300">
                                {result.bad_habits?.map((habit, i) => <li key={i}>{habit}</li>)}
                            </ul>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-2xl border border-blue-100 dark:border-blue-800 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 text-blue-800 dark:text-blue-300">🎯 Daily Routine Plan</h3>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <span className="font-bold w-24">Morning</span>
                                <span className="text-gray-700 dark:text-slate-300">{result.daily_routine_plan?.morning}</span>
                            </div>
                            <div className="flex gap-4">
                                <span className="font-bold w-24">Afternoon</span>
                                <span className="text-gray-700 dark:text-slate-300">{result.daily_routine_plan?.afternoon}</span>
                            </div>
                            <div className="flex gap-4">
                                <span className="font-bold w-24">Evening</span>
                                <span className="text-gray-700 dark:text-slate-300">{result.daily_routine_plan?.evening}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/10 p-6 rounded-2xl border border-purple-200 dark:border-purple-800 shadow-sm">
                        <h3 className="font-bold text-lg mb-3 text-purple-700">⏳ Expected Improvement Timeline</h3>
                        <p className="text-gray-700 dark:text-slate-300 text-lg">{result.expected_improvement_timeline}</p>
                    </div>

                    <button onClick={() => setResult(null)} className="w-full mt-6 py-4 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-white rounded-xl font-bold transition-all shadow-md">
                        Start Over
                    </button>
                </div>
            )}
        </div>
    );
};

export default EarlyChildhoodIntelligencePage;
