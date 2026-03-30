import React from 'react';

function ProgressBar({ value, max = 100, label, color = 'blue' }) {
    const percentage = (value / max) * 100;
    const colorClasses = {
        blue: 'bg-blue-600 dark:bg-pink-600',
        green: 'bg-green-600',
        yellow: 'bg-yellow-600',
        orange: 'bg-orange-600',
        purple: 'bg-purple-600',
        red: 'bg-red-600'
    };

    return (
        <div className="w-full">
            {label && (
                <div className="flex justify-between mb-2">
                    <span className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">{label}</span>
                    <span className="text-sm font-black text-gray-700 dark:text-white">{value}%</span>
                </div>
            )}
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden shadow-inner">
                <div 
                    className={`${colorClasses[color] || colorClasses.blue} h-3 rounded-full transition-all duration-1000 ease-out`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
}

export default ProgressBar;