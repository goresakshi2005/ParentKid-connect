import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ChildManagement from '../components/Parent/ChildManagement';
import ProgressTracking from '../components/Parent/ProgressTracking';

function ParentDashboard() {
  const { user, token } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, [token]);

  const fetchChildren = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/children/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const childList = response.data.results || response.data;
      setChildren(childList);
      if (childList.length > 0) {
        setSelectedChild(childList[0]);
      }
    } catch (error) {
      console.error('Failed to fetch children:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20">Loading dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Parent Dashboard</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <ChildManagement
            children={children}
            selectedChild={selectedChild}
            onSelect={setSelectedChild}
            onRefresh={fetchChildren}
          />
        </div>

        <div className="md:col-span-2">
          {selectedChild ? (
            <ProgressTracking childId={selectedChild.id} child={selectedChild} />
          ) : (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <p className="text-gray-600 mb-4">No children added yet.</p>
              <button
                onClick={() => {/* Open add child modal */ }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add First Child
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ParentDashboard;