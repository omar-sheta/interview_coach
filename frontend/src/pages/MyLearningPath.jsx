import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Terminal,
    Home,
    History,
    Settings,
    CheckCircle,
    Lock,
    Play,
    Video,
    Loader2,
    Sparkles
} from 'lucide-react';
import { GlassCard, Button, Badge } from '../components/ui';

const MyLearningPath = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState(null);
    const [hasPlan, setHasPlan] = useState(false);
    const [error, setError] = useState('');
    const [hoveredModule, setHoveredModule] = useState(null);

    useEffect(() => {
        fetchLearningPlan();
    }, []);

    const fetchLearningPlan = async () => {
        try {
            const { data } = await api.get('/api/learning/plan');
            setHasPlan(data.has_plan);
            setPlan(data.plan);
        } catch (err) {
            setError('Failed to load learning plan');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getModuleProgress = (moduleId) => {
        if (!plan?.progress?.[moduleId]) return 0;
        const moduleProgress = plan.progress[moduleId];
        return moduleProgress.completedQuestions?.length || 0;
    };

    const getTotalQuestions = (module) => {
        return module.practice_questions?.length || 0;
    };

    const getProgressPercent = (moduleId, module) => {
        const completed = getModuleProgress(moduleId);
        const total = getTotalQuestions(module);
        return total > 0 ? (completed / total) * 100 : 0;
    };

    const getOverallProgress = () => {
        if (!plan?.curriculum?.modules) return 0;
        const modules = plan.curriculum.modules;
        let completed = 0;
        modules.forEach((m, idx) => {
            if (getProgressPercent(m.id, m) >= 100) completed++;
        });
        return Math.round((completed / modules.length) * 100);
    };

    const getModuleStatus = (moduleIndex, module) => {
        const progress = getProgressPercent(module.id, module);
        if (progress >= 100) return 'completed';
        if (moduleIndex === 0) return 'current';

        // Check if previous module is completed
        const prevModule = plan?.curriculum?.modules?.[moduleIndex - 1];
        if (prevModule && getProgressPercent(prevModule.id, prevModule) >= 100) {
            return 'current';
        }
        return 'locked';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-dark flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary-blue animate-spin" />
            </div>
        );
    }

    if (!hasPlan) {
        return (
            <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
                <GlassCard className="max-w-md text-center">
                    <Sparkles className="w-16 h-16 text-primary-blue mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">No Learning Plan Yet</h2>
                    <p className="text-slate-400 mb-6">
                        Complete the onboarding to get your personalized learning path.
                    </p>
                    <Button variant="primary" onClick={() => navigate('/onboarding')}>
                        Start Onboarding
                    </Button>
                </GlassCard>
            </div>
        );
    }

    const modules = plan?.curriculum?.modules || [];

    return (
        <div className="min-h-screen bg-bg-dark flex overflow-hidden">
            {/* Sidebar */}
            <aside className="w-20 h-screen border-r border-white/10 flex flex-col items-center py-8 bg-bg-dark sticky top-0">
                {/* Brand */}
                <div className="mb-10 text-primary-blue">
                    <Terminal size={32} />
                </div>

                {/* Nav Items */}
                <nav className="flex flex-col gap-6 w-full items-center">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group relative"
                    >
                        <Home size={20} />
                        <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 z-50">
                            Dashboard
                        </span>
                    </button>
                    <button className="p-3 rounded-xl bg-primary-blue/10 text-primary-blue transition-all hover:bg-primary-blue/20 group relative">
                        <Sparkles size={20} />
                        <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 z-50">
                            Learning Path
                        </span>
                    </button>
                    <button className="p-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group relative">
                        <History size={20} />
                        <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 z-50">
                            History
                        </span>
                    </button>
                    <button className="p-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group relative">
                        <Settings size={20} />
                        <span className="absolute left-14 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 z-50">
                            Settings
                        </span>
                    </button>
                </nav>

                {/* User Profile */}
                <div className="mt-auto">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-blue to-accent-purple border-2 border-white/10" />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-screen overflow-y-auto relative">
                {/* Background Glows */}
                <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] left-[30%] w-[500px] h-[500px] bg-primary-blue/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[20%] w-[600px] h-[600px] bg-accent-purple/10 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
                    {/* Header */}
                    <header className="flex flex-col gap-6 mb-16">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-primary-blue font-medium tracking-wider text-sm mb-2 uppercase">
                                    Current Sprint
                                </p>
                                <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
                                    {plan?.target_role || 'Full Stack Mastery'}
                                </h1>
                                <p className="text-slate-400">Personalized Learning Path</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-white mb-1">{getOverallProgress()}%</div>
                                <p className="text-slate-500 text-sm">Overall Completion</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-800/50 rounded-full h-2 border border-white/5">
                            <motion.div
                                className="bg-gradient-to-r from-primary-blue to-cyan-400 h-2 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${getOverallProgress()}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                            />
                        </div>
                    </header>

                    {/* Timeline Skill Tree */}
                    <div className="relative flex flex-col">
                        {/* Vertical Line */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-slate-800 -translate-x-1/2 rounded-full" />

                        {/* Completed Progress Line */}
                        <motion.div
                            className="absolute left-1/2 top-0 w-1 bg-gradient-to-b from-success via-primary-blue to-slate-800 -translate-x-1/2 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.min(getOverallProgress() + 15, 100)}%` }}
                            transition={{ duration: 1.5, ease: 'easeOut' }}
                        />

                        {/* Modules */}
                        <div className="flex flex-col gap-24">
                            {modules.map((module, idx) => {
                                const status = getModuleStatus(idx, module);
                                const isLeft = idx % 2 === 0;
                                const progress = getProgressPercent(module.id, module);
                                const isHovered = hoveredModule === module.id;

                                return (
                                    <div
                                        key={module.id}
                                        className={`grid grid-cols-[1fr_auto_1fr] gap-8 items-center ${status === 'locked' ? 'opacity-60 hover:opacity-100' : ''
                                            } transition-opacity duration-300`}
                                        onMouseEnter={() => setHoveredModule(module.id)}
                                        onMouseLeave={() => setHoveredModule(null)}
                                    >
                                        {/* Left Side */}
                                        {isLeft ? (
                                            <div className="text-right">
                                                <ModuleCard
                                                    module={module}
                                                    status={status}
                                                    progress={progress}
                                                    isHovered={isHovered}
                                                    onPractice={() => navigate(`/workspace/${module.id}?mode=coaching`)}
                                                    onInterview={() => navigate(`/workspace/${module.id}?mode=interview`)}
                                                    idx={idx}
                                                />
                                            </div>
                                        ) : (
                                            <div />
                                        )}

                                        {/* Center Node */}
                                        <div className="relative z-10 flex items-center justify-center">
                                            <NodeCircle status={status} idx={idx} />
                                        </div>

                                        {/* Right Side */}
                                        {!isLeft ? (
                                            <div className="text-left">
                                                <ModuleCard
                                                    module={module}
                                                    status={status}
                                                    progress={progress}
                                                    isHovered={isHovered}
                                                    onPractice={() => navigate(`/workspace/${module.id}?mode=coaching`)}
                                                    onInterview={() => navigate(`/workspace/${module.id}?mode=interview`)}
                                                    idx={idx}
                                                />
                                            </div>
                                        ) : (
                                            <div />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

// Node Circle Component
const NodeCircle = ({ status, idx }) => {
    if (status === 'completed') {
        return (
            <div className="w-12 h-12 rounded-full bg-bg-dark border-2 border-success text-success flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] z-10">
                <CheckCircle size={20} />
            </div>
        );
    }

    if (status === 'current') {
        return (
            <div className="relative">
                <motion.div
                    className="absolute w-20 h-20 -inset-4 bg-primary-blue/20 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="w-14 h-14 rounded-full bg-bg-dark border-4 border-primary-blue text-white flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.6)] z-10 font-bold text-lg">
                    {idx + 1}
                </div>
            </div>
        );
    }

    return (
        <div className="w-10 h-10 rounded-full bg-bg-dark border-2 border-slate-700 text-slate-600 flex items-center justify-center z-10">
            <Lock size={14} />
        </div>
    );
};

// Module Card Component
const ModuleCard = ({ module, status, progress, isHovered, onPractice, onInterview, idx }) => {
    const isCompleted = status === 'completed';
    const isCurrent = status === 'current';
    const isLocked = status === 'locked';

    return (
        <motion.div
            className={`
        relative overflow-hidden rounded-2xl p-6 transition-all duration-300
        ${isCompleted ? 'glass-card border-success/30' : ''}
        ${isCurrent ? 'glass-card border-primary-blue/50 shadow-xl shadow-black/20' : ''}
        ${isLocked ? 'bg-slate-900/40 backdrop-blur-sm border border-white/5' : ''}
      `}
            whileHover={!isLocked ? { scale: 1.02, y: -4 } : {}}
        >
            {/* Status Badge */}
            {isCompleted && (
                <div className="absolute top-4 right-4 text-success">
                    <CheckCircle size={20} />
                </div>
            )}
            {isCurrent && (
                <Badge variant="primary" pulse className="absolute top-4 right-4">
                    Current Module
                </Badge>
            )}
            {isLocked && (
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <Lock size={14} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Locked</span>
                </div>
            )}

            {/* Title */}
            <h3 className={`text-xl font-bold mb-2 ${isLocked ? 'text-slate-300' : 'text-white'}`}>
                Week {idx + 1}: {module.title}
            </h3>

            {/* Description */}
            <p className={`text-sm mb-4 ${isLocked ? 'text-slate-500' : 'text-slate-400'}`}>
                {module.focus_area || module.goals?.[0] || 'Master core concepts and techniques.'}
            </p>

            {/* Score Badge (Completed) */}
            {isCompleted && (
                <Badge variant="success">
                    Score: {Math.round(progress)}/100
                </Badge>
            )}

            {/* Action Overlay (Current - Hover) */}
            <AnimatePresence>
                {isCurrent && isHovered && (
                    <motion.div
                        className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center gap-4 z-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <Button variant="success" icon={Play} onClick={onPractice}>
                            Practice
                        </Button>
                        <Button variant="danger" icon={Video} onClick={onInterview}>
                            Simulate
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Locked Overlay */}
            {isLocked && isHovered && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <p className="text-white text-sm font-medium flex items-center gap-2">
                        <Lock size={14} />
                        Complete Week {idx} to unlock
                    </p>
                </div>
            )}
        </motion.div>
    );
};

export default MyLearningPath;
