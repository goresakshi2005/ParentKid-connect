import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { FiPlus, FiEdit, FiTrash2, FiUser, FiX } from 'react-icons/fi';

function ChildManagement({ onRefresh, children }) {
    const { token } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [showTeenNotice, setShowTeenNotice] = useState(false);
    const [teenCode, setTeenCode] = useState('');
    const [formData, setFormData] = useState({ name: '', date_of_birth: '' });
    const [editingId, setEditingId] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let savedChild = null;
            if (editingId) {
                // For editing, we only send name and date_of_birth
                const res = await axios.put(
                    `${process.env.REACT_APP_API_URL}/children/${editingId}/`,
                    { name: formData.name, date_of_birth: formData.date_of_birth },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                savedChild = res.data;
            } else {
                // For new child, only send name and date_of_birth
                const res = await axios.post(
                    `${process.env.REACT_APP_API_URL}/children/`,
                    { name: formData.name, date_of_birth: formData.date_of_birth },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                savedChild = res.data;
            }
            const isTeen = !editingId && savedChild && savedChild.stage === 'teen_age';
            onRefresh();
            setShowModal(false);
            if (isTeen && savedChild) {
                setTeenCode(savedChild.invite_code);
                setShowTeenNotice(true);
            }
            setFormData({ name: '', date_of_birth: '' });
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
        setFormData({ name: child.name, date_of_birth: child.date_of_birth });
        setEditingId(child.id);
        setShowModal(true);
    };

    // Helper to format the stage label for display in the edit modal
    const getStageLabel = (stage) => {
        const stages = {
            pregnancy: 'Pregnancy',
            early_childhood: 'Early Childhood (0-5)',
            growing_stage: 'Growing (6-12)',
            teen_age: 'Teen (13-21)'   // updated range
        };
        return stages[stage] || stage;
    };

    return (
        <>
            {/* Add Child Button */}
            <button
                onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', date_of_birth: '' }); }}
                className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 shadow-lg flex items-center gap-2 font-bold transition-all"
            >
                <FiPlus /> Add New Child
            </button>

            {/* Modal for Add/Edit */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 dark:border-slate-800 relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                        >
                            <FiX size={24} />
                        </button>
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

                            {/* Stage is now read-only and displayed only when editing */}
                            {editingId && (
                                <div>
                                    <label className="block text-sm font-semibold mb-2 dark:text-slate-300">Stage (auto-calculated)</label>
                                    <div className="px-4 py-2.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-700 dark:text-slate-300">
                                        {getStageLabel(children.find(c => c.id === editingId)?.stage)}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                        Based on date of birth
                                    </p>
                                </div>
                            )}

                            {children && children.length > 0 && !editingId && (
                                <div className="border-t pt-4 mt-2">
                                    <label className="block text-sm font-semibold mb-2 dark:text-slate-300">Existing Children</label>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {children.map(child => (
                                            <div key={child.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-slate-800 rounded-lg">
                                                <span className="dark:text-white">{child.name}</span>
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={() => editChild(child)} className="text-blue-600 hover:text-blue-800 dark:text-pink-400">
                                                        <FiEdit />
                                                    </button>
                                                    <button type="button" onClick={() => handleDelete(child.id)} className="text-red-600 hover:text-red-800">
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-all dark:text-slate-300">
                                    Cancel
                                </button>
                                <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 shadow-lg font-semibold transition-all">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Teen Invite Code Notice Modal (unchanged) */}
            {showTeenNotice && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl w-full max-w-md text-center shadow-2xl border border-gray-100 dark:border-slate-800">
                        <div className="w-20 h-20 bg-blue-100 dark:bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 dark:text-pink-500 text-3xl">
                            📱
                        </div>
                        <h3 className="text-2xl font-bold mb-3 dark:text-white">Connect with your Teen</h3>
                        <p className="text-gray-600 dark:text-slate-400 mb-6">
                            Ask your teen to sign up as "Teen" and enter this Invite Code:
                        </p>
                        <div className="bg-gray-100 dark:bg-slate-800 p-5 rounded-2xl font-mono text-3xl font-bold tracking-widest mb-8 select-all text-blue-700 dark:text-pink-400 border-2 border-dashed border-blue-200 dark:border-pink-500/30">
                            {teenCode}
                        </div>
                        <button
                            onClick={() => setShowTeenNotice(false)}
                            className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 dark:bg-pink-600 dark:hover:bg-pink-700 shadow-lg transition-all"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default ChildManagement;