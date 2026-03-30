import React, { useState } from 'react';
import AssessmentForm from '../Assessment/AssessmentForm';
import ResultsDisplay from '../Assessment/ResultsDisplay';

function AssessmentView({ childId, assessmentType }) {
    const [result, setResult] = useState(null);
    const [showForm, setShowForm] = useState(true);

    if (result) {
        return <ResultsDisplay result={result} onRetake={() => setShowForm(true)} />;
    }

    if (showForm) {
        // You would need to fetch the appropriate assessment ID based on child stage and type
        return (
            <AssessmentForm
                assessmentId={1} // Replace with dynamic ID
                childId={childId}
                onComplete={(data) => {
                    setResult(data);
                    setShowForm(false);
                }}
            />
        );
    }

    return null;
}

export default AssessmentView;