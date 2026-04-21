import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { hasFeature, getRequiredPlan } from '../../utils/featureAccess';
import UpgradeModal from '../Pricing/UpgradeModal';
import { motion } from 'framer-motion';

/**
 * FeatureGuard wraps components that require specific subscription features.
 * If the user doesn't have the feature, it shows a blurred overlay or an upgrade UI.
 */
const FeatureGuard = ({ feature, children, showOverlay = true, className = "", compact = false }) => {
  const { user } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);
  
  const isLocked = !hasFeature(user, feature);
  const requiredPlan = getRequiredPlan(feature);

  if (!isLocked) {
    return <>{children}</>;
  }

  if (!showOverlay) {
    // Just hide the children if showOverlay is false
    return null;
  }

  return (
    <div className={`relative overflow-hidden w-full h-full ${className}`}>
      {/* Blurred background content */}
      <div className="filter blur-sm pointer-events-none select-none h-full w-full">
        {children}
      </div>

      {/* Overlay UI */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-xl p-3 text-center"
      >
        <div className={`bg-white/90 dark:bg-gray-800/90 ${compact ? 'p-4' : 'p-8'} rounded-2xl shadow-2xl ${compact ? 'max-w-[200px]' : 'max-w-md'} border border-white/20`}>
          <div className={`${compact ? 'text-2xl mb-1' : 'text-5xl mb-4'}`}>🔒</div>
          <h3 className={`${compact ? 'text-sm' : 'text-2xl'} font-bold text-gray-900 dark:text-white mb-1`}>
            Locked
          </h3>
          {!compact && (
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
              This feature is available in the <span className="font-bold text-indigo-600 dark:text-indigo-400">{requiredPlan}</span> plan. 
              Upgrade now to unlock full access.
            </p>
          )}
          <button
            onClick={() => setShowUpgrade(true)}
            className={`w-full ${compact ? 'py-1.5 text-xs' : 'py-3'} bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all transform hover:scale-[1.02]`}
          >
            {compact ? 'Unlock' : 'Upgrade Now'}
          </button>
        </div>
      </motion.div>

      {showUpgrade && (
        <UpgradeModal 
          isOpen={showUpgrade} 
          onClose={() => setShowUpgrade(false)} 
          featureName={feature}
          requiredPlan={requiredPlan}
        />
      )}
    </div>
  );
};

export default FeatureGuard;
