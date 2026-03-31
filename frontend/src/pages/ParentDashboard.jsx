// frontend/src/pages/ParentDashboard.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ChildCard from '../components/Parent/ChildCard';
import ChildManagement from '../components/Parent/ChildManagement';
import AssessmentView from '../components/Parent/AssessmentView';
import ChildSelfAssessment from '../components/Child/ChildSelfAssessment';
import ResultsDisplay from '../components/Assessment/ResultsDisplay';

function ParentDashboard() {
    const { token, user } = useAuth();
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [takingParentAssessment, setTakingParentAssessment] = useState(false);
    const [takingChildSelfAssessment, setTakingChildSelfAssessment] = useState(null); // childId
    const [parentResult, setParentResult] = useState(null);
    const [showParentResult, setShowParentResult] = useState(false);

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
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/assessments/my_results/`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const results = response.data.results || response.data;
            const parentOnlyResults = results.filter(r => r.user && !r.child);
            if (parentOnlyResults.length > 0) {
                setParentResult(parentOnlyResults[0]);
            }
        } catch (error) {
            console.error('Failed to fetch parent results:', error);
        }
    };

    const handleTakeChildSelfAssessment = (childId) => {
        setTakingChildSelfAssessment(childId);
    };

    const handleChildAssessmentComplete = (resultData) => {
        setTakingChildSelfAssessment(null);
        fetchChildren(); // refresh to show updated results
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

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>;
    }

    // If taking child self‑assessment
    if (takingChildSelfAssessment) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button
                    onClick={() => setTakingChildSelfAssessment(null)}
                    className="mb-6 text-blue-600 dark:text-pink-400 hover:underline flex items-center gap-2"
                >
                    ← Back to Dashboard
                </button>
                <ChildSelfAssessment
                    childId={takingChildSelfAssessment}
                    onComplete={handleChildAssessmentComplete}
                />
            </div>
        );
    }

    // If taking parent assessment
    if (takingParentAssessment) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <button
                    onClick={() => setTakingParentAssessment(false)}
                    className="mb-6 text-blue-600 dark:text-pink-400 hover:underline flex items-center gap-2"
                >
                    ← Back to Dashboard
                </button>
                <AssessmentView
                    assessmentType="parent"
                    onComplete={handleParentAssessmentComplete}
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

            {/* Parent Assessment Section (unchanged) */}
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
                                <button
                                    onClick={() => setShowParentResult(true)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    View Full Results
                                </button>
                                <button
                                    onClick={() => setTakingParentAssessment(true)}
                                    className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 dark:border-pink-500 dark:text-pink-400"
                                >
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
                        <ChildCard
                            key={child.id}
                            child={child}
                            onTakeAssessment={handleTakeChildSelfAssessment}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default ParentDashboard;