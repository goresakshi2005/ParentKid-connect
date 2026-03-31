import React from 'react';

const AssessmentSelector = ({ onSelect }) => {
    return (
        <div className="max-w-2xl mx-auto p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border dark:border-slate-800 animate-in fade-in zoom-in duration-500">
            <h2 className="text-3xl font-black mb-8 dark:text-white text-center tracking-tight">
                Choose Assessment <span className="dark:text-pink-500">Type</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
                <button
                    onClick={() => onSelect('parent')}
                    className="group relative p-8 text-left rounded-2xl border-2 border-gray-100 dark:border-slate-800 hover:border-blue-600 dark:hover:border-pink-500 transition-all hover:shadow-2xl hover:-translate-y-1 bg-gray-50 dark:bg-slate-800/50"
                >
                    <div className="w-14 h-14 bg-blue-100 dark:bg-pink-500/10 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                        👨‍👩‍👧‍👦
                    </div>
                    <h3 className="text-xl font-bold mb-3 dark:text-white">Parent Review</h3>
                    <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed">
                        I am a parent completing this review to track my child's developmental milestones and growth.
                    </p>
                    <div className="absolute bottom-4 right-4 text-blue-600 dark:text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity font-black">
                        START →
                    </div>
                </button>

                <button
                    onClick={() => onSelect('child')}
                    className="group relative p-8 text-left rounded-2xl border-2 border-gray-100 dark:border-slate-800 hover:border-green-600 dark:hover:border-pink-500 transition-all hover:shadow-2xl hover:-translate-y-1 bg-gray-50 dark:bg-slate-800/50"
                >
                    <div className="w-14 h-14 bg-green-100 dark:bg-pink-500/10 rounded-xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                        👶
                    </div>
                    <h3 className="text-xl font-bold mb-3 dark:text-white">Child Self-Review</h3>
                    <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed">
                        I am helping my child complete their own fun assessment to understand their perspective.
                    </p>
                    <div className="absolute bottom-4 right-4 text-green-600 dark:text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity font-black">
                        START →
                    </div>
                </button>
            </div>

            <p className="mt-10 text-center text-gray-500 dark:text-slate-500 text-sm italic">
                The assessment questions will look different based on your selection.
            </p>
        </div>
    );
};

export default AssessmentSelector;
