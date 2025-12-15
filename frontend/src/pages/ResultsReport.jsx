import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import { motion } from 'framer-motion';
import {
    Terminal,
    ArrowLeft,
    Share2,
    Download,
    CheckCircle,
    AlertTriangle,
    Sparkles,
    ArrowRight,
    Clock,
    BarChart2,
    Loader2
} from 'lucide-react';
import { GlassCard, Button, Badge } from '../components/ui';

const ResultsReport = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchResults();
    }, [sessionId]);

    const fetchResults = async () => {
        try {
            // TODO: Replace with actual API call
            // const { data } = await api.get(`/api/results/${sessionId}`);

            // Mock data for now
            setTimeout(() => {
                setResults({
                    score: 85,
                    status: 'excellent',
                    summary: 'You demonstrated a strong understanding of database sharding and caching strategies. Focus on optimizing latency in your load balancing configuration to reach the next level.',
                    strengths: [
                        { title: 'Solid Database Sharding Strategy', description: 'Your choice of consistent hashing for user data distribution minimizes rebalancing overhead.' },
                        { title: 'Effective Caching Implementation', description: 'Correct usage of Redis with Write-Through pattern to ensure data consistency.' },
                        { title: 'Scalable API Design', description: 'Resource-oriented URL structure follows best practices.' },
                    ],
                    weaknesses: [
                        { title: 'Latency in Load Balancing', description: 'Round-robin approach may cause uneven distribution with varying request processing times.' },
                        { title: 'Missing Dead Letter Queue', description: 'Order processing lacks a failure recovery mechanism for unprocessable messages.' },
                        { title: 'Single Point of Failure', description: 'The primary authentication service lacks redundancy.' },
                    ],
                    nextLesson: {
                        title: 'Advance to Microservices',
                        description: 'Based on your results, you\'re ready to tackle distributed systems complexity. This module covers decomposition patterns, saga patterns, and service mesh basics.',
                        duration: '45 mins',
                        level: 'Intermediate',
                    },
                    assessmentTitle: 'System Design Assessment',
                    completedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                });
                setLoading(false);
            }, 1500);
        } catch (err) {
            setError('Failed to load results');
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-bg-dark flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary-blue animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Loading your results...</p>
                </div>
            </div>
        );
    }

    if (error || !results) {
        return (
            <div className="min-h-screen bg-bg-dark flex items-center justify-center">
                <GlassCard className="max-w-md text-center">
                    <AlertTriangle className="w-16 h-16 text-danger mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Unable to Load Results</h2>
                    <p className="text-slate-400 mb-4">{error}</p>
                    <Button variant="primary" onClick={() => navigate('/learning')}>
                        Back to Dashboard
                    </Button>
                </GlassCard>
            </div>
        );
    }

    const progressOffset = ((100 - results.score) / 100) * 276.46;

    return (
        <div className="min-h-screen bg-bg-dark text-slate-100 flex flex-col font-display">
            {/* Navigation */}
            <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-bg-dark/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
                    <div className="flex items-center gap-3 text-white">
                        <div className="flex w-8 h-8 items-center justify-center rounded bg-primary-blue/20 text-primary-blue shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                            <Terminal size={18} />
                        </div>
                        <h2 className="text-lg font-bold tracking-tight">CodeForge</h2>
                    </div>
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
                        <a className="hover:text-white transition-colors cursor-pointer">Dashboard</a>
                        <a className="text-white">Assessments</a>
                        <a className="hover:text-white transition-colors cursor-pointer">Mentorship</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-blue to-accent-purple ring-2 ring-white/10" />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-8">
                {/* Breadcrumbs & Heading */}
                <div className="flex flex-col gap-1 mb-10">
                    <button
                        onClick={() => navigate('/learning')}
                        className="flex items-center gap-2 text-xs font-medium text-primary-blue mb-2 hover:text-blue-400 transition-colors"
                    >
                        <ArrowLeft size={14} />
                        <span>Back to Dashboard</span>
                    </button>
                    <div className="flex flex-wrap justify-between items-end gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white">{results.assessmentTitle}</h1>
                            <p className="text-slate-400 mt-1">E-Commerce Scalability & Architecture • Completed on {results.completedDate}</p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="secondary" icon={Share2}>Share Result</Button>
                            <Button variant="secondary" icon={Download}>Export PDF</Button>
                        </div>
                    </div>
                </div>

                {/* Score Hero Section */}
                <section className="flex flex-col items-center justify-center py-8 mb-12 relative">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-blue/10 rounded-full blur-[80px] pointer-events-none" />

                    <motion.div
                        className="relative w-48 h-48 rounded-full flex items-center justify-center mb-6"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* Outer Ring (Track) */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="44" fill="transparent" stroke="#1e293b" strokeWidth="8" strokeLinecap="round" />
                            {/* Progress Ring */}
                            <motion.circle
                                cx="50" cy="50" r="44"
                                fill="transparent"
                                stroke="#3B82F6"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray="276.46"
                                initial={{ strokeDashoffset: 276.46 }}
                                animate={{ strokeDashoffset: progressOffset }}
                                transition={{ duration: 1.5, ease: 'easeOut' }}
                                className="drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                            />
                        </svg>
                        <div className="flex flex-col items-center z-10">
                            <span className="text-5xl font-bold text-white tracking-tighter">{results.score}</span>
                            <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest mt-1">/ 100</span>
                        </div>
                    </motion.div>

                    <div className="text-center space-y-2">
                        <Badge variant="success" pulse>
                            Excellent Performance
                        </Badge>
                        <p className="text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
                            {results.summary}
                        </p>
                    </div>
                </section>

                {/* 2x2 Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                    {/* Card 1: Strengths */}
                    <GlassCard className="hover:border-success/30 group">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center text-success group-hover:scale-110 transition-transform duration-300">
                                <CheckCircle size={20} />
                            </div>
                            <h3 className="text-lg font-semibold text-white">Key Strengths</h3>
                        </div>
                        <div className="space-y-4">
                            {results.strengths.map((item, idx) => (
                                <div key={idx}>
                                    <div className="flex gap-4 items-start">
                                        <CheckCircle size={18} className="text-success mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-200">{item.title}</p>
                                            <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                                        </div>
                                    </div>
                                    {idx < results.strengths.length - 1 && (
                                        <div className="h-px w-full bg-white/5 mt-4" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    {/* Card 2: Weaknesses */}
                    <GlassCard className="hover:border-danger/30 group">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-danger/10 flex items-center justify-center text-danger group-hover:scale-110 transition-transform duration-300">
                                <AlertTriangle size={20} />
                            </div>
                            <h3 className="text-lg font-semibold text-white">Areas for Improvement</h3>
                        </div>
                        <div className="space-y-4">
                            {results.weaknesses.map((item, idx) => (
                                <div key={idx}>
                                    <div className="flex gap-4 items-start">
                                        <AlertTriangle size={18} className="text-danger mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-slate-200">{item.title}</p>
                                            <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                                        </div>
                                    </div>
                                    {idx < results.weaknesses.length - 1 && (
                                        <div className="h-px w-full bg-white/5 mt-4" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    {/* Card 3: Diagram Review */}
                    <GlassCard className="flex flex-col group h-full">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Diagram Review</h3>
                                    <p className="text-xs text-slate-400">AI Annotated Feedback</p>
                                </div>
                            </div>
                            <button className="text-xs font-medium text-primary-blue hover:text-blue-400 transition-colors">
                                View Fullscreen
                            </button>
                        </div>
                        <div className="relative flex-1 rounded-lg overflow-hidden border border-white/10 min-h-[200px] bg-slate-900/50 flex items-center justify-center">
                            <div className="text-center text-slate-500">
                                <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">System diagram preview</p>
                                <p className="text-xs mt-1">3 AI insights detected</p>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Card 4: Next Steps */}
                    <GlassCard className="flex flex-col justify-between group h-full relative overflow-hidden">
                        {/* Decorative background */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-blue/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-primary-blue/10 flex items-center justify-center text-primary-blue group-hover:scale-110 transition-transform duration-300">
                                    <BarChart2 size={20} />
                                </div>
                                <h3 className="text-lg font-semibold text-white">Recommended Path</h3>
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2">{results.nextLesson.title}</h4>
                            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                                {results.nextLesson.description}
                            </p>
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-xs text-slate-300">
                                    <Clock size={14} className="text-slate-500" />
                                    <span>Est. {results.nextLesson.duration}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-300">
                                    <BarChart2 size={14} className="text-slate-500" />
                                    <span>{results.nextLesson.level} Level</span>
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            fullWidth
                            icon={ArrowRight}
                            iconPosition="right"
                            onClick={() => navigate('/learning')}
                        >
                            Start Next Lesson
                        </Button>
                    </GlassCard>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full border-t border-white/5 bg-bg-dark py-8 mt-auto">
                <div className="mx-auto max-w-[1200px] px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                    <p>© 2024 CodeForge Inc. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a className="hover:text-slate-300 transition-colors cursor-pointer">Privacy Policy</a>
                        <a className="hover:text-slate-300 transition-colors cursor-pointer">Terms of Service</a>
                        <a className="hover:text-slate-300 transition-colors cursor-pointer">Help Center</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ResultsReport;
