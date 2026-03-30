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

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 dark:border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 dark:text-slate-400 font-medium italic">Loading your dashboard...</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-extrabold mb-10 dark:text-white tracking-tight">Parent <span className="dark:text-pink-500">Dashboard</span></h1>

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
            <div className="card dark:bg-slate-900 border dark:border-slate-800 p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-20 h-20 bg-blue-100 dark:bg-pink-500/10 rounded-full flex items-center justify-center mb-6 text-4xl">👶</div>
              <p className="text-gray-600 dark:text-slate-400 mb-8 text-xl">No children added to your profile yet.</p>
              <button
                onClick={() => {/* This is usually handled by the ChildManagement button above */ }}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 shadow-lg dark:shadow-pink-500/20 font-bold transition-all transform hover:scale-105"
              >
                Get Started: Add Your First Child
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ParentDashboard;