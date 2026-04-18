import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FiX, FiCheck, FiArrowRight, FiArrowLeft, FiAlertTriangle, FiHeart, FiUser, FiZap, FiTarget, FiMessageCircle } from 'react-icons/fi';
import Loading from '../components/Common/Loading';

function MagicFixPage() {
    const { childId } = useParams();
    const navigate = useNavigate();
    const { token } = useAuth();
    
    const [child, setChild] = useState(null);
    const [loadingInfo, setLoadingInfo] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [form, setForm] = useState({
        problem: '',
        behavior: '',
        mood: 'normal',
        context: ''
    });

    const [result, setResult] = useState(null);
    const [currentStep, setCurrentStep] = useState(0); // For "swipeable" cards interaction

    useEffect(() => {
        const fetchChild = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/children/${childId}/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setChild(res.data);
            } catch (err) {
                console.error("Failed to load child", err);
            } finally {
                setLoadingInfo(false);
            }
        };
        fetchChild();
    }, [childId, token]);

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!form.problem || !form.behavior) return alert("Please fill in the problem and behavior.");
        
        setIsSubmitting(true);
        try {
            const res = await axios.post(
                `${process.env.REACT_APP_API_URL}/relationship/magic-fix/`,
                {
                    child_id: childId,
                    problem: form.problem,
                    behavior: form.behavior,
                    mood: form.mood,
                    context: form.context
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            if (res.data.error) {
                alert(res.data.error);
            } else {
                setResult(res.data);
                setCurrentStep(0); // Reset to first card
            }
        } catch (err) {
            console.error(err);
            alert("Magic Fix Engine is currently recharging. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingInfo) return <Loading />;

    const renderForm = () => (
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-pink-100 dark:border-slate-800 transition-all">
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500 mb-6 flex items-center gap-3">
                <FiZap className="text-pink-500" /> Magic Fix Engine
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
                Instant, zero-theory actions to de-escalate and resolve conflict with {child?.name || 'your child'}.
            </p>

            <form onSubmit={handleGenerate} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                         What's the problem?
                    </label>
                    <input 
                        type="text"
                        placeholder="e.g., Won't get off their phone, ignoring chores..."
                        className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-pink-500 focus:outline-none transition-shadow hover:shadow-inner"
                        value={form.problem}
                        onChange={e => setForm({...form, problem: e.target.value})}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        How are they behaving physically?
                    </label>
                    <input 
                        type="text"
                        placeholder="e.g., Yelling, slamming doors, silent treatment..."
                        className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-pink-500 focus:outline-none transition-shadow hover:shadow-inner"
                        value={form.behavior}
                        onChange={e => setForm({...form, behavior: e.target.value})}
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex justify-between items-end">
                        <span>Child's Current Mood</span>
                        <span className="text-xs text-slate-400 font-normal">Adapts the response</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {['normal', 'angry', 'sad', 'silent'].map((moodOption) => (
                            <button
                                type="button"
                                key={moodOption}
                                onClick={() => setForm({...form, mood: moodOption})}
                                className={`p-3 rounded-xl border text-sm font-bold capitalize transition-all ${
                                    form.mood === moodOption 
                                        ? 'bg-pink-50 dark:bg-pink-900/30 border-pink-500 text-pink-600 dark:text-pink-400 shadow-sm' 
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                                }`}
                            >
                                {moodOption}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex justify-between items-end">
                        <span>Context (Optional)</span>
                        <span className="text-xs text-slate-400 font-normal">e.g., At dinner, late for school</span>
                    </label>
                    <input 
                        type="text"
                        placeholder="Where and when is this happening?"
                        className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-pink-500 focus:outline-none transition-shadow hover:shadow-inner"
                        value={form.context}
                        onChange={e => setForm({...form, context: e.target.value})}
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-extrabold rounded-2xl shadow-lg hover:shadow-pink-500/30 transition-all flex justify-center items-center gap-2 transform hover:-translate-y-1 disabled:opacity-70 disabled:transform-none"
                    >
                        {isSubmitting ? 'Casting Magic...' : '🪄 Generate Magic Fix'}
                    </button>
                </div>
            </form>
        </div>
    );

    const renderCardContent = () => {
        if (!result) return null;

        const cards = [
            {
                title: "Why This is Happening",
                content: result.why,
                icon: <FiTarget className="text-4xl text-blue-500" />,
                bg: "bg-blue-50 dark:bg-blue-900/20 shadow-blue-100/50"
            },
            {
                title: "Step 1: Do This NOW",
                content: result.step1,
                icon: <FiZap className="text-4xl text-yellow-500" />,
                bg: "bg-yellow-50 dark:bg-yellow-900/20 shadow-yellow-100/50"
            },
            {
                title: "Step 2: Say Exactly This",
                content: `"${result.step2}"`,
                icon: <FiMessageCircle className="text-4xl text-pink-500" />,
                bg: "bg-pink-50 dark:bg-pink-900/20 shadow-pink-100/50 font-serif italic text-2xl"
            },
            {
                title: "Step 3: Connect",
                content: result.step3,
                icon: <FiHeart className="text-4xl text-rose-500" />,
                bg: "bg-rose-50 dark:bg-rose-900/20 shadow-rose-100/50"
            },
            {
                title: "Next Steps",
                content: result.next,
                icon: <FiArrowRight className="text-4xl text-indigo-500" />,
                bg: "bg-indigo-50 dark:bg-indigo-900/20 shadow-indigo-100/50"
            },
            {
                title: "Avoid Doing These",
                content: (
                    <ul className="space-y-3">
                        {(result.avoid || []).map((a, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <FiX className="text-red-500 mt-1 flex-shrink-0" />
                                <span className="text-red-700 dark:text-red-400 font-medium">{a}</span>
                            </li>
                        ))}
                    </ul>
                ),
                icon: <FiAlertTriangle className="text-4xl text-red-500" />,
                bg: "bg-red-50 dark:bg-red-900/20 shadow-red-100/50"
            }
        ];

        const card = cards[currentStep];

        return (
            <div className="max-w-md mx-auto w-full">
                <div className="flex justify-between items-center mb-6 px-4">
                    <button 
                        onClick={() => setResult(null)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                    >
                        <FiX className="text-2xl" />
                    </button>
                    <div className="flex gap-2">
                        {cards.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-6 bg-pink-500' : 'w-2 bg-slate-200 dark:bg-slate-700'}`}
                            />
                        ))}
                    </div>
                </div>

                <div className={`relative min-h-[360px] p-8 rounded-[2rem] shadow-2xl border border-white/50 dark:border-slate-700 flex flex-col justify-center items-center text-center transition-all duration-500 transform ${card.bg}`}>
                    <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-full shadow-lg inline-block">
                        {card.icon}
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 uppercase tracking-wider">{card.title}</h3>
                    <div className={`text-lg dark:text-slate-200 ${card.content.includes && card.content.includes('"') ? 'text-2xl font-serif text-pink-700 dark:text-pink-300 leading-relaxed' : 'text-slate-700 font-medium'}`}>
                        {card.content}
                    </div>
                </div>

                <div className="flex justify-between items-center mt-10 px-4">
                    <button 
                        onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                        disabled={currentStep === 0}
                        className={`p-4 rounded-full transition-all ${currentStep === 0 ? 'opacity-0 cursor-default' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xl hover:-translate-x-1'}`}
                    >
                         <FiArrowLeft className="text-2xl" />
                    </button>
                    
                    {currentStep < cards.length - 1 ? (
                        <button 
                            onClick={() => setCurrentStep(Math.min(cards.length - 1, currentStep + 1))}
                            className="p-6 bg-pink-500 hover:bg-pink-600 text-white rounded-full shadow-xl shadow-pink-500/40 hover:shadow-pink-500/60 transition-all hover:scale-105 active:scale-95 flex items-center justify-center animate-pulse-slow"
                        >
                             <FiArrowRight className="text-3xl" />
                        </button>
                    ) : (
                        <button 
                            onClick={() => navigate('/dashboard/parent')}
                            className="px-8 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-full shadow-xl shadow-green-500/40 transition-all hover:scale-105 flex items-center justify-center gap-2"
                        >
                             <FiCheck className="text-2xl" /> Done
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 bg-slate-50 dark:bg-slate-950 font-sans">
            <div className="max-w-4xl mx-auto">
                <button 
                    onClick={() => navigate('/dashboard/parent')} 
                    className="mb-8 font-semibold text-slate-500 hover:text-pink-500 dark:text-slate-400 flex items-center gap-2 transition-colors uppercase tracking-wider text-sm"
                >
                    <FiArrowLeft /> Dashboard
                </button>
                
                {!result ? renderForm() : renderCardContent()}
            </div>
        </div>
    );
}

export default MagicFixPage;
