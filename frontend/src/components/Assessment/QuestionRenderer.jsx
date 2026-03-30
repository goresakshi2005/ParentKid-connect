import React from 'react';

function QuestionRenderer({ question, answer, onChange }) {
    const { id, text, type, options } = question;

    const handleChange = (value) => {
        onChange(id, value);
    };

    if (type === 'mcq') {
        return (
            <div className="space-y-2">
                <label className="block font-medium">{text}</label>
                <select
                    value={answer?.value || ''}
                    onChange={(e) => handleChange({ value: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded"
                >
                    <option value="">Select an option</option>
                    {options.map((opt, idx) => (
                        <option key={idx} value={opt.score}>{opt.label}</option>
                    ))}
                </select>
            </div>
        );
    }

    if (type === 'msq') {
        return (
            <div className="space-y-2">
                <label className="block font-medium">{text}</label>
                <div className="space-y-1">
                    {options.map((opt, idx) => (
                        <label key={idx} className="flex items-center gap-2">
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
                            />
                            {opt.label}
                        </label>
                    ))}
                </div>
            </div>
        );
    }

    if (type === 'text') {
        return (
            <div className="space-y-2">
                <label className="block font-medium">{text}</label>
                <textarea
                    value={answer?.text || ''}
                    onChange={(e) => handleChange({ text: e.target.value })}
                    className="w-full p-2 border rounded"
                    rows="3"
                />
            </div>
        );
    }

    return null;
}

export default QuestionRenderer;