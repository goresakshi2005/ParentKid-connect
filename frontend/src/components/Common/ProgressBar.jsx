import React from 'react';

function ProgressBar({ value, max = 100, label, color = 'blue' }) {
    const percentage = (value / max) * 100;
    const colorClasses = {
        blue: 'bg-blue-600',
        green: 'bg-green-600',
        yellow: 'bg-yellow-600',
        red: 'bg-red-600'
    };

    return (
        <div className="w-full">
            {label && <div className="flex justify-between mb-1"><span>{label}</span><span>{value}%</span></div>}
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className={`${colorClasses[color]} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
}

export default ProgressBar;