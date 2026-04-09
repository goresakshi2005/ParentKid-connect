import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FiArrowLeft, FiSend, FiZap, FiActivity, FiMessageCircle, 
  FiAlertCircle, FiCheckCircle, FiClock, FiTarget, FiUser, FiInfo
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const RelationshipIntelligencePage = () => {
    const { childId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [child, setChild] = useState(null);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);

    const [parentInput, setParentInput] = useState({
        mood: '',
        thoughts: '',
        problem: ''
    });

    const [childInput, setChildInput] = useState({
        mood: '',
        thoughts: '',
        problem: ''
    });

    useEffect(() => {
        const fetchChild = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/children/${childId}/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setChild(response.data);
            } catch (err) {
                console.error("Error fetching child:", err);
            }
        };
        if (token && childId) fetchChild();
    }, [childId, token]);

    const handleAnalyze = async () => {
        if (!parentInput.mood || !childInput.mood) {
            alert("Please fill in at least the mood for both parent and child.");
            return;
        }

        setAnalyzing(true);
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/relationship/analyze/`, {
                parent: parentInput,
                child: childInput
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setResult(response.data);
        } catch (err) {
            console.error("Analysis failed:", err);
            alert("Failed to analyze communication. Please try again.");
        } finally {
            setAnalyzing(false);
        }
    };

    if (!child && !loading) return <div className="p-10 text-center">Loading child data...</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors"
                >
                    <FiArrowLeft /> Back to Dashboard
                </button>

                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                        Relationship Intelligence AI
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
                        Bridging the gap between you and <span className="font-bold text-indigo-600 dark:text-indigo-400">{child?.name}</span>
                    </p>
                </div>

                {!result ? (
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Parent Input Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl text-indigo-600 dark:text-indigo-400">
                                    <FiUser size={24} />
                                </div>
                                <h2 className="text-2xl font-bold dark:text-white">Parent's Perspective</h2>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">How are you feeling?</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Stressed, concerned, hopeful..."
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                                        value={parentInput.mood}
                                        onChange={(e) => setParentInput({...parentInput, mood: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">What's on your mind?</label>
                                    <textarea 
                                        placeholder="Briefly describe your thoughts..."
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all h-24"
                                        value={parentInput.thoughts}
                                        onChange={(e) => setParentInput({...parentInput, thoughts: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">The main problem/conflict?</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Screen time, academic pressure, chores..."
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                                        value={parentInput.problem}
                                        onChange={(e) => setParentInput({...parentInput, problem: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Child Input Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-purple-100 dark:bg-purple-500/20 rounded-2xl text-purple-600 dark:text-purple-400">
                                    <FiMessageCircle size={24} />
                                </div>
                                <h2 className="text-2xl font-bold dark:text-white">{child?.name}'s Perspective</h2>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Their likely mood?</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Defensive, sad, frustrated..."
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-purple-500 dark:text-white transition-all"
                                        value={childInput.mood}
                                        onChange={(e) => setChildInput({...childInput, mood: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">What are they thinking?</label>
                                    <textarea 
                                        placeholder="From their perspective, what's going on?"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-purple-500 dark:text-white transition-all h-24"
                                        value={childInput.thoughts}
                                        onChange={(e) => setChildInput({...childInput, thoughts: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">The problem as they see it?</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Not being heard, lack of freedom..."
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-purple-500 dark:text-white transition-all"
                                        value={childInput.problem}
                                        onChange={(e) => setChildInput({...childInput, problem: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 flex justify-center mt-4">
                            <button 
                                onClick={handleAnalyze}
                                disabled={analyzing}
                                className="px-12 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-xl shadow-2xl hover:scale-105 transition-all flex items-center gap-3 disabled:opacity-70 disabled:hover:scale-100"
                            >
                                {analyzing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                                        Analyzing Dynamics...
                                    </>
                                ) : (
                                    <>
                                        <FiZap className="text-yellow-300 text-2xl" />
                                        Generate Intelligence Report
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                        {/* Summary Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-2xl">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <FiActivity className="text-indigo-200" />
                                        <span className="uppercase tracking-widest text-xs font-bold text-indigo-100">Root Cause Identified</span>
                                    </div>
                                    <h3 className="text-3xl font-bold">{result.insights.root_cause}</h3>
                                    <p className="text-indigo-100 mt-2 max-w-2xl">{result.insights.summary}</p>
                                </div>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 min-w-[140px]">
                                        <div className="text-4xl font-black">{result.insights.alignment_score}%</div>
                                        <div className="text-[10px] uppercase mt-1 text-indigo-200 font-bold tracking-tighter">Alignment</div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 min-w-[140px]">
                                        <div className="text-4xl font-black">{result.confidence_score}%</div>
                                        <div className="text-[10px] uppercase mt-1 text-indigo-200 font-bold tracking-tighter">AI Confidence</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Analysis Grid */}
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-lg border border-slate-100 dark:border-slate-800">
                                <h4 className="text-slate-400 dark:text-slate-500 uppercase text-xs font-bold mb-4 flex items-center gap-2">
                                    <FiInfo /> Communication Styles
                                </h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                        <span className="text-xs dark:text-slate-300">Parent</span>
                                        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm capitalize">{result.insights.communication_styles.parent}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                        <span className="text-xs dark:text-slate-300">Child</span>
                                        <span className="font-bold text-purple-600 dark:text-purple-400 text-sm capitalize">{result.insights.communication_styles.child}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-lg border border-slate-100 dark:border-slate-800">
                                <h4 className="text-slate-400 dark:text-slate-500 uppercase text-xs font-bold mb-4 flex items-center gap-2">
                                    <FiActivity /> Emotion Detection
                                </h4>
                                <div className="space-y-3">
                                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Parent</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                                result.emotion_analysis.parent.intensity === 'High' ? 'bg-red-100 text-red-600' : 
                                                result.emotion_analysis.parent.intensity === 'Medium' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                                            }`}>
                                                {result.emotion_analysis.parent.intensity}
                                            </span>
                                        </div>
                                        <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm capitalize">{result.emotion_analysis.parent.emotion}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Child</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                                result.emotion_analysis.child.intensity === 'High' ? 'bg-red-100 text-red-600' : 
                                                result.emotion_analysis.child.intensity === 'Medium' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                                            }`}>
                                                {result.emotion_analysis.child.intensity}
                                            </span>
                                        </div>
                                        <p className="font-bold text-purple-600 dark:text-purple-400 text-sm capitalize">{result.emotion_analysis.child.emotion}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-lg border border-slate-100 dark:border-slate-800">
                                <h4 className="text-slate-400 dark:text-slate-500 uppercase text-xs font-bold mb-4 flex items-center gap-2">
                                    <FiAlertCircle /> The Mismatch
                                </h4>
                                <p className="text-slate-700 dark:text-slate-300 italic text-sm leading-relaxed">
                                    "{result.insights.mismatch}"
                                </p>
                            </div>
                        </div>

                        {/* Separate Guidance */}
                        <div className="grid md:grid-cols-2 gap-8">
                            {/* For Parent */}
                            <div className="bg-indigo-50 dark:bg-indigo-500/5 rounded-3xl p-8 border border-indigo-100 dark:border-indigo-500/10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-indigo-600 rounded-lg text-white font-bold text-sm">PARA</div>
                                    <h3 className="text-2xl font-bold dark:text-white">Guidance for Parent</h3>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-xs font-bold uppercase text-indigo-500 dark:text-indigo-400 mb-1">Heart of the Matter</p>
                                        <p className="text-slate-700 dark:text-slate-300">{result.parent_guidance.child_feelings}</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border-l-4 border-red-500">
                                        <p className="text-xs font-bold uppercase text-red-500 mb-1 flex items-center gap-1"><FiAlertCircle /> What NOT to say</p>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">"{result.parent_guidance.avoid}"</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border-l-4 border-green-500">
                                        <p className="text-xs font-bold uppercase text-green-500 mb-1 flex items-center gap-1"><FiTarget /> What TO say</p>
                                        <p className="text-indigo-600 dark:text-indigo-400 font-bold leading-relaxed">{result.parent_guidance.say_this}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <p className="text-xs font-bold uppercase text-indigo-500 dark:text-indigo-400 mb-1 flex items-center gap-1"><FiMessageCircle /> Tone</p>
                                            <p className="text-sm dark:text-slate-300">{result.parent_guidance.tone}</p>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold uppercase text-indigo-500 dark:text-indigo-400 mb-1 flex items-center gap-1"><FiClock /> Best Timing</p>
                                            <p className="text-sm dark:text-slate-300">{result.parent_guidance.timing}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* For Child */}
                            <div className="bg-purple-50 dark:bg-purple-500/5 rounded-3xl p-8 border border-purple-100 dark:border-purple-500/10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-purple-600 rounded-lg text-white font-bold text-sm">KID</div>
                                    <h3 className="text-2xl font-bold dark:text-white">Guidance for {child?.name}</h3>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-xs font-bold uppercase text-purple-500 dark:text-purple-400 mb-1">What your Parent means</p>
                                        <p className="text-slate-700 dark:text-slate-300">{result.child_guidance.parent_intent}</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border-l-4 border-red-500">
                                        <p className="text-xs font-bold uppercase text-red-500 mb-1 flex items-center gap-1"><FiAlertCircle /> What NOT to say</p>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">"{result.child_guidance.avoid}"</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border-l-4 border-green-500">
                                        <p className="text-xs font-bold uppercase text-green-500 mb-1 flex items-center gap-1"><FiTarget /> What TO say</p>
                                        <p className="text-purple-600 dark:text-purple-400 font-bold leading-relaxed">{result.child_guidance.say_this}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <p className="text-xs font-bold uppercase text-purple-500 dark:text-purple-400 mb-1 flex items-center gap-1"><FiMessageCircle /> Approach</p>
                                            <p className="text-sm dark:text-slate-300">{result.child_guidance.approach}</p>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-bold uppercase text-purple-500 dark:text-purple-400 mb-1 flex items-center gap-1"><FiClock /> Best Timing</p>
                                            <p className="text-sm dark:text-slate-300">{result.child_guidance.timing}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Conversation Preview */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800">
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 dark:text-white">
                                <FiMessageCircle className="text-indigo-500" /> Ideal Conversation Preview
                            </h3>
                            <div className="space-y-4 max-w-3xl mx-auto">
                                {result.conversation_preview.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.parent ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                                            msg.parent 
                                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-slate-800 dark:text-slate-200 rounded-tl-none border border-indigo-100 dark:border-indigo-500/20' 
                                            : 'bg-purple-600 text-white rounded-tr-none shadow-purple-500/20'
                                        }`}>
                                            <p className="text-xs font-bold uppercase opacity-60 mb-1">{msg.parent ? 'Parent' : child?.name}</p>
                                            <p className="text-lg leading-snug">{msg.parent || msg.child}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Suggestions */}
                        <div className="bg-slate-900 dark:bg-black rounded-3xl p-8 text-white">
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <FiCheckCircle className="text-green-400" /> Actionable Next Steps
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {result.actions.map((action, idx) => (
                                    <div key={idx} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-start gap-4">
                                        <div className="bg-indigo-500 h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold">{idx + 1}</div>
                                        <p className="text-lg text-slate-200">{action}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-center pb-12">
                            <button 
                                onClick={() => setResult(null)}
                                className="px-8 py-3 border-2 border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            >
                                Start New Analysis
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RelationshipIntelligencePage;
