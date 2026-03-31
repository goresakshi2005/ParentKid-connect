import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import AssessmentForm from '../Assessment/AssessmentForm';
import ResultsDisplay from '../Assessment/ResultsDisplay';
import Loading from '../Common/Loading';

function AssessmentView({ childId, assessmentType, onComplete }) {
    const { token } = useAuth();
    const { getUserTier } = useSubscription();
    const [assessment, setAssessment] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (assessmentType) {
            fetchRecommendedAssessment();
        }
    }, [assessmentType, childId]);

    const fetchRecommendedAssessment = async () => {
        setLoading(true);
        try {
            const tier = getUserTier();
            let url = `${process.env.REACT_APP_API_URL}/assessments/recommended/?type=${assessmentType}&tier=${tier}`;
            if (childId) {
                url += `&child_id=${childId}`;
            }
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAssessment(response.data);
        } catch (error) {
            console.error('Failed to fetch assessment:', error);
            alert(error.response?.data?.error || 'No assessment available for your plan');
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = (resultData) => {
        setResult(resultData);
        if (onComplete) onComplete(resultData);
    };

    const handleRetake = () => {
        setResult(null);
        fetchRecommendedAssessment();
    };

    if (loading) return <Loading />;

    if (result) {
        return <ResultsDisplay result={result} onRetake={handleRetake} />;
    }

    if (assessment) {
        return (
            <AssessmentForm
                assessmentId={assessment.id}
                childId={childId}
                onComplete={handleComplete}
            />
        );
    }

    return <div className="text-center py-10">No assessment found.</div>;
}

export default AssessmentView;