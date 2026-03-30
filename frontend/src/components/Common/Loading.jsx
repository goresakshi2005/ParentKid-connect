import React from 'react';

function Loading({ size = 'medium' }) {
    const sizeClasses = {
        small: 'w-4 h-4',
        medium: 'w-8 h-8',
        large: 'w-12 h-12'
    };

    return (
        <div className="flex flex-col justify-center items-center py-12 space-y-4">
            <div className={`${sizeClasses[size]} border-4 border-gray-100 dark:border-pink-500/10 border-t-blue-600 dark:border-t-pink-600 rounded-full animate-spin shadow-sm`}></div>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400 italic animate-pulse">Just a moment...</p>
        </div>
    );
}

export default Loading;