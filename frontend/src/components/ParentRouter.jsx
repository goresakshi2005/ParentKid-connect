import React from 'react';
import ParentDashboard from '../pages/ParentDashboard';

// ParentRouter now only serves regular (non-expecting) parents.
// Expecting parents go directly to /dashboard/pregnancy via their own route in App.js
function ParentRouter() {
    return <ParentDashboard />;
}

export default ParentRouter;