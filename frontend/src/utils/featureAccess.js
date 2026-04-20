/**
 * Check if the user has access to a specific feature.
 * @param {Object} user - The user object from AuthContext
 * @param {string} feature - The feature key to check
 * @returns {boolean}
 */
export const hasFeature = (user, feature) => {
  if (!user || !user.features) return false;
  return user.features.includes(feature);
};

export const FEATURE_PLAN_MAPPING = {
  growth_tracking: "FREE",
  mentor_chat: "FREE",
  assessment: "FREE",
  magic_fix: "STARTER",
  career_discovery: "STARTER",
  mental_health_guide: "GROWTH",
  study_planner: "GROWTH",
  screen_intelligence: "FAMILY",
  relationship_ai: "FAMILY",
  appointment: "FAMILY",
  voice_wellness: "FAMILY",
};

export const getRequiredPlan = (feature) => {
  return FEATURE_PLAN_MAPPING[feature] || "UPGRADE";
};
