import React from 'react';

function QuestionRenderer({ question, answer, onChange }) {
    const { id, text, type, options } = question;

    const handleChange = (value) => {
        onChange(id, value);
    };

    if (type === 'mcq') {
        return (
            <div className="space-y-3">
                <label className="block font-bold dark:text-white text-lg">{text}</label>
                <select
                    value={answer?.value || ''}
                    onChange={(e) => handleChange({ value: parseInt(e.target.value) })}
                    className="w-full p-4 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-pink-500 dark:text-white transition-all outline-none appearance-none"
                >
                    <option value="">Select an option...</option>
                    {options.map((opt, idx) => (
                        <option key={idx} value={opt.score}>{opt.label}</option>
                    ))}
                </select>
            </div>
        );
    }

    if (type === 'msq') {
        return (
            <div className="space-y-4">
                <label className="block font-bold dark:text-white text-lg">{text}</label>
                <div className="grid grid-cols-1 gap-3">
                    {options.map((opt, idx) => (
                        <label key={idx} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer">
                            <input
                                type="checkbox"
                                checked={answer?.selected?.includes(opt.value) || false}
                                onChange={(e) => {
                                    const selected = answer?.selected || [];
                                    if (e.target.checked) {
                                        handleChange({ selected: [...selected, opt.value] });
                                    } else {
                                        handleChange({ selected: selected.filter(v => v !== opt.value) });
                                    }
                                }}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:checked:bg-pink-500 dark:focus:ring-pink-500"
                            />
                            <span className="text-gray-700 dark:text-slate-300 font-medium">{opt.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        );
    }

    if (type === 'text') {
        return (
            <div className="space-y-3">
                <label className="block font-bold dark:text-white text-lg">{text}</label>
                <textarea
                    value={answer?.text || ''}
                    onChange={(e) => handleChange({ text: e.target.value })}
                    className="w-full p-4 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-pink-500 dark:text-white transition-all outline-none"
                    placeholder="Type your response here..."
                    rows="4"
                />
            </div>
        );
    }

    return null;
}

export default QuestionRenderer;