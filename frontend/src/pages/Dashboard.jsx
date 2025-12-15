import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/client';

export default function Dashboard() {
    const navigate = useNavigate();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    // Get user from localStorage
    const userStr = localStorage.getItem('hr_user');
    const user = userStr ? JSON.parse(userStr) : null;

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/learning/plans');
            if (response.data.success) {
                setPlans(response.data.plans || []);
            }
        } catch (err) {
            console.error('Failed to fetch plans:', err);
            setError('Failed to load plans');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (planId) => {
        if (!confirm('Are you sure you want to delete this plan?')) return;

        try {
            setDeletingId(planId);
            const response = await api.delete(`/api/learning/plan/${planId}`);
            if (response.data.success) {
                setPlans(prev => prev.filter(p => p.id !== planId));
            }
        } catch (err) {
            console.error('Failed to delete plan:', err);
            alert('Failed to delete plan');
        } finally {
            setDeletingId(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('hr_user');
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <header className="border-b border-white/10 backdrop-blur-sm bg-black/20">
                <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                        EngCoach
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-white/60">Hello, {user?.username || 'User'}</span>
                        <button
                            onClick={() => navigate('/onboarding')}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg text-white font-medium hover:opacity-90 transition"
                        >
                            + New Plan
                        </button>
                        <button
                            onClick={handleLogout}
                            className="text-white/60 hover:text-white transition"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-12">
                <h2 className="text-3xl font-bold text-white mb-8">Your Learning Plans</h2>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-white/60">Loading plans...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="text-red-400">{error}</p>
                        <button onClick={fetchPlans} className="mt-4 text-cyan-400 hover:underline">
                            Retry
                        </button>
                    </div>
                ) : plans.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-white/60 text-lg mb-4">No learning plans yet</p>
                        <button
                            onClick={() => navigate('/onboarding')}
                            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg text-white font-medium hover:opacity-90 transition"
                        >
                            Create Your First Plan
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        <AnimatePresence>
                            {plans.map((plan, index) => (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -100 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:bg-white/10 transition"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold text-white mb-2">
                                                {plan.target_role || 'Learning Plan'}
                                            </h3>
                                            <p className="text-white/60 text-sm mb-4">
                                                Created: {new Date(plan.created_at).toLocaleDateString()}
                                            </p>
                                            {plan.curriculum?.weeks && (
                                                <div className="flex gap-2 flex-wrap">
                                                    {plan.curriculum.weeks.slice(0, 4).map((week, i) => (
                                                        <span
                                                            key={i}
                                                            className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full"
                                                        >
                                                            Week {week.week_number}: {week.theme}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => navigate('/path')}
                                                className="px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleDelete(plan.id)}
                                                disabled={deletingId === plan.id}
                                                className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition disabled:opacity-50"
                                            >
                                                {deletingId === plan.id ? '...' : 'Delete'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}
