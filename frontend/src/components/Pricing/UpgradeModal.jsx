import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const UpgradeModal = ({ isOpen, onClose, featureName, requiredPlan, maybeLaterPath = '/dashboard/parent' }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden max-w-lg w-full border border-white/10"
        >
          {/* Header Image/Gradient */}
          <div className="h-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center relative">
            <div className="absolute top-4 right-4">
               <button 
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
               >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
            </div>
            <div className="text-6xl">🚀</div>
          </div>

          <div className="p-8">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 text-center">
              Elevate Your Experience
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
              Unlock <span className="text-indigo-600 font-semibold">{featureName?.replace('_', ' ').toUpperCase()}</span> and many more premium features with our <span className="font-bold">{requiredPlan}</span> plan.
            </p>

            <div className="space-y-4 mb-8">
              {[
                "Advanced AI Insights",
                "Unlimited Profiles",
                "Detailed Performance Reports",
                "Priority Support"
              ].map((benefit, i) => (
                <div key={i} className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">{benefit}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={() => {
                  navigate('/pricing');
                  onClose();
                }}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-[1.01] active:scale-[0.98]"
              >
                Go to Plans
              </button>
              <button
                onClick={() => {
                  navigate(maybeLaterPath);
                  onClose();
                }}
                className="w-full py-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UpgradeModal;
