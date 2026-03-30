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
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Children</h2>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', date_of_birth: '', stage: 'early_childhood' }); }}
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
        >
          <FiPlus />
        </button>
      </div>

      <div className="space-y-2">
        {children.map(child => (
          <div
            key={child.id}
            className={`flex items-center justify-between p-3 rounded cursor-pointer ${selectedChild?.id === child.id ? 'bg-blue-100 border-l-4 border-blue-600' : 'hover:bg-gray-100'}`}
            onClick={() => onSelect(child)}
          >
            <div className="flex items-center gap-3">
              <FiUser className="text-gray-500" />
              <div>
                <p className="font-medium">{child.name}</p>
                <p className="text-xs text-gray-500">Age: {child.age}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={(e) => { e.stopPropagation(); editChild(child); }} className="text-blue-600 hover:text-blue-800"><FiEdit /></button>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(child.id); }} className="text-red-600 hover:text-red-800"><FiTrash2 /></button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-4">{editingId ? 'Edit Child' : 'Add Child'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                  required
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stage</label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({...formData, stage: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="pregnancy">Pregnancy</option>
                  <option value="early_childhood">Early Childhood (0-5)</option>
                  <option value="growing_stage">Growing (6-12)</option>
                  <option value="teen_age">Teen (13-20)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTeenNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 text-2xl">
              📱
            </div>
            <h3 className="text-xl font-bold mb-2">Connect with your Teen</h3>
            <p className="text-gray-600 mb-4">
              Ask your teen to download the app, signup as a "Teen", and enter this Invite Code to link with you:
            </p>
            <div className="bg-gray-100 p-3 rounded font-mono text-2xl tracking-widest mb-6 select-all">
              {teenCode}
            </div>
            <button 
              onClick={() => setShowTeenNotice(false)}
              className="w-full py-2 bg-blue-600 text-white rounded font-semibold"
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