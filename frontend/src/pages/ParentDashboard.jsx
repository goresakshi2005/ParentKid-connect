// frontend/src/pages/ParentDashboard.jsx
// This dashboard is ONLY for regular (non-expecting) parents.
// Expecting/pregnancy parents are routed to /dashboard/pregnancy directly.

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ChildCard from '../components/Parent/ChildCard';
import ChildManagement from '../components/Parent/ChildManagement';
import AssessmentView from '../components/Parent/AssessmentView';
import ChildSelfAssessment from '../components/Child/ChildSelfAssessment';
import ResultsDisplay from '../components/Assessment/ResultsDisplay';
import Loading from '../components/Common/Loading';
import { getCareerDiscoveryResults, deleteCareerDiscoveryResult } from '../services/assessmentService';

function ParentDashboard() {
    const { token } = useAuth();
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [takingParentAssessment, setTakingParentAssessment] = useState(false);
    const [takingChildSelfAssessment, setTakingChildSelfAssessment] = useState(null);
    const [parentResult, setParentResult] = useState(null);
    const [showParentResult, setShowParentResult] = useState(false);
    const [careerResults, setCareerResults] = useState([]);
    const [showCareerHistory, setShowCareerHistory] = useState(false);

    useEffect(() => {
        fetchChildren();
        fetchParentResults();
    }, [token]);

    const fetchChildren = async () => {
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/children/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const childList = response.data.results || response.data;
            setChildren(childList);
        } catch (error) {
            console.error('Failed to fetch children:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchParentResults = async () => {
        try {
            const [assessRes, careerRes] = await Promise.all([
                axios.get(
                    `${process.env.REACT_APP_API_URL}/assessments/my_results/`,
                    { headers: { Authorization: `Bearer ${token}` } }
                ),
                getCareerDiscoveryResults()
            ]);
            const results = assessRes.data.results || assessRes.data;
            const parentOnlyResults = results.filter(r => r.user && !r.child);
            if (parentOnlyResults.length > 0) {
                setParentResult(parentOnlyResults[0]);
            }
            setCareerResults(careerRes.data.results || careerRes.data);
        } catch (error) {
            console.error('Failed to fetch parent results:', error);
        }
    };

    const handleTakeChildSelfAssessment = (childId) => setTakingChildSelfAssessment(childId);
    const handleChildAssessmentComplete = () => fetchChildren();
    const handleCloseChildAssessment = () => setTakingChildSelfAssessment(null);

    const handleDeleteCareerResult = async (id) => {
        if (!window.confirm('Delete this teen career discovery result?')) return;
        try {
            await deleteCareerDiscoveryResult(id);
            setCareerResults((prev) => prev.filter(r => r.id !== id));
        } catch (error) {
            alert('Failed to delete career result.');
        }
    };

    const handleParentAssessmentComplete = (resultData) => {
        setParentResult(resultData);
        setTakingParentAssessment(false);
        setShowParentResult(true);
    };

    const handleRetakeParent = () => {
        setShowParentResult(false);
        setTakingParentAssessment(true);
    };

    if (loading) return <Loading />;

    if (takingParentAssessment) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button onClick={() => setTakingParentAssessment(false)} className="mb-6 text-blue-600 dark:text-pink-400 hover:underline flex items-center gap-2">
                    ← Back to Dashboard
                </button>
                <AssessmentView assessmentType="parent" onComplete={handleParentAssessmentComplete} />
            </div>
        );
    }

    if (showParentResult && parentResult) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button onClick={() => setShowParentResult(false)} className="mb-6 text-blue-600 dark:text-pink-400 hover:underline flex items-center gap-2">
                    ← Back to Dashboard
                </button>
                <ResultsDisplay result={parentResult} onRetake={handleRetakeParent} />
            </div>
        );
    }

    if (takingChildSelfAssessment) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button onClick={handleCloseChildAssessment} className="mb-6 text-blue-600 dark:text-pink-400 hover:underline flex items-center gap-2">
                    ← Back to Dashboard
                </button>
                <ChildSelfAssessment
                    childId={takingChildSelfAssessment}
                    onComplete={handleChildAssessmentComplete}
                    onClose={handleCloseChildAssessment}
                />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-wrap justify-between items-center mb-8">
                <h1 className="text-4xl font-extrabold dark:text-white tracking-tight">
                    Parent <span className="dark:text-pink-500">Dashboard</span>
                </h1>
                <ChildManagement onRefresh={fetchChildren} children={children} />
            </div>

            {/* Parent Assessment Section */}
            <div className="mb-10">
                {parentResult && !showParentResult ? (
                    <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-green-700 dark:text-green-400">Your Last Assessment</h3>
                                <p className="text-2xl font-black text-green-600 dark:text-green-300">{parentResult.final_score}%</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Completed on {new Date(parentResult.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowParentResult(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                    View Full Results
                                </button>
                                <button onClick={() => setTakingParentAssessment(true)} className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:border-pink-500 dark:text-pink-400">
                                    Retake Assessment
                                </button>
                            </div>
                        </div>
                    </div>
                ) : !parentResult && !showParentResult ? (
                    <button
                        onClick={() => setTakingParentAssessment(true)}
                        className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 dark:bg-pink-600 dark:hover:bg-pink-700 shadow-lg transition-all flex items-center gap-2"
                    >
                        📋 Take Parent Assessment
                    </button>
                ) : null}

                {showParentResult && parentResult && (
                    <div className="mt-4">
                        <ResultsDisplay result={parentResult} onRetake={handleRetakeParent} />
                    </div>
                )}
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                    Assess your own parenting style and environment.
                </p>
            </div>

            {/* Mentor Chat Section */}
            <div className="mb-10">
                <a
                    href="/mentor-chat"
                    className="block bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-2xl border border-blue-200 dark:border-slate-700 hover:shadow-lg transition-all group"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-600 dark:bg-pink-600 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                💬
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Chat with a Mentor</h3>
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    Get one-on-one guidance from an expert mentor
                                </p>
                            </div>
                        </div>
                        <span className="text-blue-600 dark:text-pink-400 font-medium text-sm group-hover:translate-x-1 transition-transform">
                            Open Chat →
                        </span>
                    </div>
                </a>
            </div>

            {/* Children Section */}
            <h2 className="text-2xl font-bold mb-6 dark:text-white">Your Children</h2>
            {children.length === 0 ? (
                <div className="card dark:bg-slate-900 border dark:border-slate-800 p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-blue-100 dark:bg-pink-500/10 rounded-full flex items-center justify-center mb-6 text-4xl">👶</div>
                    <p className="text-gray-600 dark:text-slate-400 mb-8 text-xl">No children added to your profile yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {children.map((child) => (
                        <div key={child.id}>
                            <ChildCard child={child} onTakeAssessment={handleTakeChildSelfAssessment} />

                        </div>
                    ))}
                </div>
            )}

            {/* Career Discovery Insights for Teens */}
            {careerResults && careerResults.length > 0 && (
                <div className="mt-12 mb-10">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                            <span className="p-2 bg-violet-500/10 rounded-lg text-violet-500">🚀</span>
                            Teen Career Discoveries
                        </h2>
                        <button
                            onClick={() => setShowCareerHistory(!showCareerHistory)}
                            className="px-6 py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 shadow-lg transition-all flex items-center gap-2 text-sm"
                        >
                            {showCareerHistory ? "Hide Career Discoveries" : "View Previous Career Discoveries"}
                        </button>
                    </div>
                    
                    {showCareerHistory && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {careerResults.map((cres, idx) => {
                            const childName = cres.child_details?.name || 'Teen';
                            return (
                                <div key={cres.id || idx} className="p-6 bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-violet-100 dark:border-slate-700 shadow-sm transition hover:shadow-md">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center flex-wrap gap-2">
                                            <span className="px-3 py-1 bg-violet-600 text-white rounded-full text-xs font-bold shadow-sm">
                                                {childName}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                {new Date(cres.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteCareerResult(cres.id)}
                                            title="Delete"
                                            className="text-gray-400 hover:text-red-500 transition"
                                        >
                                            🗑
                                        </button>
                                    </div>
                                    <h3 className="text-xl font-black text-gray-800 dark:text-white mb-2 leading-tight">
                                        {cres.best_career_emoji} {cres.best_career_title}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-slate-400 italic mb-4 line-clamp-3">
                                        "{cres.best_career_why}"
                                    </p>
                                    
                                    <div className="mb-4">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Key Strengths</p>
                                        <div className="flex flex-wrap gap-2">
                                            {(cres.trait_labels || []).map((trait, t) => (
                                                <span key={t} className="px-2 py-1 bg-white dark:bg-slate-700 text-violet-600 dark:text-pink-400 text-xs font-semibold rounded border border-violet-100 dark:border-slate-600">
                                                    {trait}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ParentDashboard;