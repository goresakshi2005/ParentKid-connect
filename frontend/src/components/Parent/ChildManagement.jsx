import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FiPlus, FiEdit, FiTrash2, FiUser } from 'react-icons/fi';

function ChildManagement({ children, selectedChild, onSelect, onRefresh }) {
  const { token, user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [showTeenNotice, setShowTeenNotice] = useState(false);
  const [teenCode, setTeenCode] = useState('');
  const [formData, setFormData] = useState({ name: '', date_of_birth: '', stage: 'early_childhood' });
  const [editingId, setEditingId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let savedChild = null;
      if (editingId) {
        const res = await axios.put(
          `${process.env.REACT_APP_API_URL}/children/${editingId}/`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        savedChild = res.data;
      } else {
        const res = await axios.post(
          `${process.env.REACT_APP_API_URL}/children/`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        savedChild = res.data;
      }
      const isTeen = !editingId && formData.stage === 'teen_age';
      onRefresh();
      setShowForm(false);
      if (isTeen && savedChild) {
        setTeenCode(savedChild.invite_code);
        setShowTeenNotice(true);
      }
      setFormData({ name: '', date_of_birth: '', stage: 'early_childhood' });
      setEditingId(null);
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving child');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this child? All data will be lost.')) {
      try {
        await axios.delete(
          `${process.env.REACT_APP_API_URL}/children/${id}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        onRefresh();
      } catch (error) {
        alert('Error deleting child');
      }
    }
  };

  const editChild = (child) => {
    setFormData({ name: child.name, date_of_birth: child.date_of_birth, stage: child.stage });
    setEditingId(child.id);
    setShowForm(true);
  };

  return (
    <div className="card dark:bg-slate-900 border dark:border-slate-800 shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold dark:text-white">Children</h2>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', date_of_birth: '', stage: 'early_childhood' }); }}
          className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 shadow-lg dark:shadow-pink-500/20 transition-all duration-300"
        >
          <FiPlus className="text-xl" />
        </button>
      </div>

      <div className="space-y-3">
        {children.map(child => (
          <div
            key={child.id}
            className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-300 ${selectedChild?.id === child.id ? 'bg-blue-50 dark:bg-pink-500/10 border-l-4 border-blue-600 dark:border-pink-500' : 'hover:bg-gray-50 dark:hover:bg-slate-800 border border-transparent dark:border-slate-800/50'}`}
            onClick={() => onSelect(child)}
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-lg ${selectedChild?.id === child.id ? 'bg-blue-600/10 text-blue-600 dark:bg-pink-500/20 dark:text-pink-400' : 'bg-gray-100 text-gray-500 dark:bg-slate-800'}`}>
                <FiUser className="text-xl" />
              </div>
              <div>
                <p className="font-semibold dark:text-white">{child.name}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Age: {child.age}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={(e) => { e.stopPropagation(); editChild(child); }} className="text-blue-600 hover:text-blue-800 dark:text-pink-400 dark:hover:text-pink-300 transition-colors"><FiEdit /></button>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(child.id); }} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"><FiTrash2 /></button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-slate-800">
            <h3 className="text-2xl font-bold mb-6 dark:text-white">{editingId ? 'Edit Child' : 'Add Child'}</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-slate-300">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-pink-500 dark:text-white transition-all"
                  placeholder="Enter child's name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-slate-300">Date of Birth</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-pink-500 dark:text-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 dark:text-slate-300">Stage</label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-pink-500 dark:text-white transition-all"
                >
                  <option value="pregnancy">Pregnancy</option>
                  <option value="early_childhood">Early Childhood (0-5)</option>
                  <option value="growing_stage">Growing (6-12)</option>
                  <option value="teen_age">Teen (13-20)</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all dark:text-slate-300">Cancel</button>
                <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 shadow-lg dark:shadow-pink-500/20 font-semibold transition-all">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTeenNotice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl w-full max-w-md text-center shadow-2xl border border-gray-100 dark:border-slate-800">
            <div className="w-20 h-20 bg-blue-100 dark:bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 dark:text-pink-500 text-3xl">
              📱
            </div>
            <h3 className="text-2xl font-bold mb-3 dark:text-white">Connect with your Teen</h3>
            <p className="text-gray-600 dark:text-slate-400 mb-6">
              Ask your teen to download the app, signup as a "Teen", and enter this Invite Code to link with you:
            </p>
            <div className="bg-gray-100 dark:bg-slate-800 p-5 rounded-2xl font-mono text-3xl font-bold tracking-widest mb-8 select-all text-blue-700 dark:text-pink-400 border-2 border-dashed border-blue-200 dark:border-pink-500/30">
              {teenCode}
            </div>
            <button
              onClick={() => setShowTeenNotice(false)}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 shadow-lg dark:shadow-pink-500/20 transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChildManagement;