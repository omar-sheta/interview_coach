import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Terminal,
    Upload,
    FileText,
    Target,
    Sparkles,
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    Loader2,
    Rocket
} from 'lucide-react';
import { GlassCard, Button, Badge } from '../components/ui';

const Onboarding = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef(null);

    const [activeStep, setActiveStep] = useState(0);
    const [targetRole, setTargetRole] = useState('');
    const [cvFile, setCvFile] = useState(null);
    const [cvText, setCvText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedPlan, setGeneratedPlan] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const steps = [
        { label: 'Upload', icon: Upload },
        { label: 'Target', icon: Target },
        { label: 'Analyze', icon: Sparkles },
    ];

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type === 'application/pdf' || file.name.endsWith('.docx')) {
                setCvFile(file);
                setError('');
            } else {
                setError('Please upload a PDF or DOCX file');
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.type === 'application/pdf' || file.name.endsWith('.docx'))) {
            setCvFile(file);
            setError('');
        } else {
            setError('Please upload a PDF or DOCX file');
        }
    };

    const [loadingStepIndex, setLoadingStepIndex] = useState(0);
    const [analysisData, setAnalysisData] = useState({ skills: [], roleCategory: 'tech' });

    const [threads, setThreads] = useState([
        { id: 'cv', status: 'idle', logs: [] },
        { id: 'market', status: 'idle', logs: [] }
    ]);
    const [analysisFinished, setAnalysisFinished] = useState(false);

    const handleGeneratePlan = async () => {
        setLoading(true);
        setError('');
        setActiveStep(2);
        setAnalysisFinished(false);

        // Reset logs
        setThreads([
            { id: 'cv', status: 'running', logs: ['Initializing CV parser...', 'Extracting text layer...'] },
            { id: 'market', status: 'running', logs: ['Connecting to Market Intelligence Grid...', `Scanning job boards for "${targetRole}"...`] }
        ]);

        try {
            const formData = new FormData();
            formData.append('target_role', targetRole);

            if (cvFile) {
                formData.append('cv_file', cvFile);
            } else {
                formData.append('cv_text', cvText);
            }

            // THREAD 1: CV ANALYSIS
            const cvPromise = (async () => {
                try {
                    // Simulate processing time for "reading"
                    await new Promise(r => setTimeout(r, 800));
                    setThreads(prev => prev.map(t => t.id === 'cv' ? { ...t, logs: [...t.logs, 'Identifying key skill vectors...'] } : t));

                    const res = await api.post('/api/learning/analyze', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });

                    if (res.data.success) {
                        const skills = res.data.skills?.slice(0, 5).join(', ') || "technical skills";
                        setThreads(prev => prev.map(t => t.id === 'cv' ? {
                            ...t,
                            status: 'complete',
                            logs: [...t.logs, `✔ Extracted: ${skills}`, '✔ Experience timeline mapped']
                        } : t));
                    }
                } catch (e) {
                    setThreads(prev => prev.map(t => t.id === 'cv' ? { ...t, status: 'error', logs: [...t.logs, '❌ Failed to parse CV'] } : t));
                }
            })();

            // THREAD 2: MARKET SEARCH (STREAMING)
            const marketPromise = (async () => {
                try {
                    setThreads(prev => prev.map(t => t.id === 'market' ? { ...t, logs: [...t.logs, 'Initializing local Qwen3-32B model...'] } : t));

                    // Use simple relative path, Vite proxy handles the rest
                    const streamUrl = `/api/learning/market/stream?target_role=${encodeURIComponent(targetRole)}`;
                    console.log(`[Market] Connecting to stream: ${streamUrl}`);

                    const response = await fetch(streamUrl);

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`[Market] Stream error: ${response.status} ${response.statusText} - ${errorText}`);
                        throw new Error(`Server returned ${response.status}`);
                    }

                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();

                    let done = false;
                    let buffer = ''; // Buffer for partial lines

                    while (!done) {
                        const { value, done: doneReading } = await reader.read();
                        done = doneReading;
                        const chunkValue = decoder.decode(value, { stream: true });

                        // Add chunk to buffer
                        buffer += chunkValue;

                        // Split on newlines and add each complete line as a log entry
                        const lines = buffer.split('\n');

                        // Keep the last incomplete line in the buffer
                        buffer = lines.pop() || '';

                        // Add complete lines to logs
                        for (const line of lines) {
                            if (line.trim()) { // Skip empty lines
                                setThreads(prev => prev.map(t => t.id === 'market' ? {
                                    ...t,
                                    logs: [...t.logs, line.trim()]
                                } : t));
                            }
                        }
                    }

                    // Add any remaining buffer content
                    if (buffer.trim()) {
                        setThreads(prev => prev.map(t => t.id === 'market' ? {
                            ...t,
                            logs: [...t.logs, buffer.trim()]
                        } : t));
                    }

                    setThreads(prev => prev.map(t => t.id === 'market' ? {
                        ...t,
                        status: 'complete',
                        logs: [...t.logs, '✔ Analysis Stream Complete']
                    } : t));

                } catch (e) {
                    console.error("Market stream fail", e);
                    setThreads(prev => prev.map(t => t.id === 'market' ? {
                        ...t,
                        status: 'error',
                        logs: [...t.logs, `❌ Stream failed: ${e.message}`, 'Falling back to static analysis...']
                    } : t));
                }
            })();

            // Wait for analysis threads
            await Promise.all([cvPromise, marketPromise]);

            // Synthesize Plan
            setThreads(prev => [
                ...prev,
                { id: 'synthesis', status: 'running', logs: ['Synthesizing learning path...'] }
            ]);

            const { data } = await api.post('/api/learning/generate', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (data.success) {
                setAnalysisFinished(true);
                setTimeout(() => {
                    setGeneratedPlan(data.plan);
                }, 1000);
            } else {
                setError(data.message || 'Failed');
                setActiveStep(1);
            }

        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed');
            setActiveStep(1);
        }
    };

    const handleGoToLearning = () => {
        navigate('/path');
    };

    return (
        <div className="min-h-screen bg-bg-dark relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 mesh-gradient pointer-events-none" />
            <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-primary-blue/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-accent-purple/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Top Navigation */}
            <header className="relative z-10 w-full border-b border-white/5 bg-bg-dark/80 backdrop-blur-md">
                <div className="px-6 lg:px-8 py-4 flex items-center justify-between max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-blue/20 rounded-lg flex items-center justify-center text-primary-blue">
                            <Terminal size={20} />
                        </div>
                        <h2 className="text-white text-lg font-bold tracking-tight">EngCoach</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-slate-400">Hello, <span className="text-white font-medium">{user.username}</span></span>
                                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>Dashboard</Button>
                                <Button variant="ghost" size="sm" onClick={() => navigate('/logout')}>Sign Out</Button>
                            </div>
                        ) : (
                            <>
                                <button className="ghost-button" onClick={() => navigate('/login')}>Sign In</button>
                                <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>Get Started</Button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-80px)]">
                <GlassCard className="w-full max-w-2xl p-8 sm:p-10" hover={false}>
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                            Welcome to EngCoach
                        </h1>
                        <p className="text-slate-400">
                            Let's calibrate your mentorship path in just a few steps.
                        </p>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex items-center justify-between mb-10 px-2 relative">
                        {/* Progress Line Background */}
                        <div className="absolute top-4 left-0 w-full h-[2px] bg-slate-700/50 -z-10 rounded-full" />
                        {/* Active Progress Line */}
                        <div
                            className="absolute top-4 left-0 h-[2px] bg-primary-blue -z-10 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-500"
                            style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
                        />

                        {steps.map((step, idx) => {
                            const StepIcon = step.icon;
                            const isActive = idx === activeStep;
                            const isCompleted = idx < activeStep;

                            return (
                                <div key={idx} className="flex flex-col items-center gap-2 relative">
                                    <motion.div
                                        className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                      ring-4 ring-bg-dark z-10 transition-all duration-300
                      ${isCompleted ? 'bg-success text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]' : ''}
                      ${isActive ? 'bg-primary-blue text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]' : ''}
                      ${!isActive && !isCompleted ? 'bg-slate-800 border border-slate-600 text-slate-400' : ''}
                    `}
                                        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        {isCompleted ? <CheckCircle size={16} /> : idx + 1}
                                    </motion.div>
                                    <span className={`text-xs font-medium ${isActive ? 'text-primary-blue' : 'text-slate-500'}`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Error Display */}
                    {error && (
                        <motion.div
                            className="mb-6 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {error}
                        </motion.div>
                    )}

                    {/* Step Content */}
                    <div className="bg-slate-900/30 rounded-xl border border-white/5 p-6 mb-8 min-h-[320px]">
                        <AnimatePresence mode="wait">
                            {/* Step 1: Resume Upload */}
                            {activeStep === 0 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex flex-col h-full gap-6"
                                >
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-slate-300">Resume Upload</label>
                                        <Badge variant="primary">Required</Badge>
                                    </div>

                                    {/* Dropzone */}
                                    <div
                                        onDrop={handleDrop}
                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`
                      flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 
                      cursor-pointer transition-all duration-300 group relative overflow-hidden
                      ${isDragging ? 'border-primary-blue bg-primary-blue/5' : 'border-slate-600 hover:border-primary-blue'}
                      ${cvFile ? 'border-success bg-success/5' : ''}
                    `}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept=".pdf,.docx"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />

                                        <div className={`
                      w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300
                      ${cvFile ? 'bg-success/20 text-success' : 'bg-slate-800 border border-slate-700 group-hover:border-primary-blue/50 group-hover:text-primary-blue'}
                    `}>
                                            {cvFile ? <CheckCircle size={32} /> : <Upload size={32} className="text-slate-400 group-hover:text-primary-blue" />}
                                        </div>

                                        {cvFile ? (
                                            <>
                                                <h3 className="text-lg font-semibold text-success mb-1">{cvFile.name}</h3>
                                                <p className="text-slate-400 text-sm">Click to change file</p>
                                            </>
                                        ) : (
                                            <>
                                                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-blue/90 transition-colors">
                                                    Drop your CV to analyze skill gaps
                                                </h3>
                                                <p className="text-slate-400 text-sm text-center max-w-xs mb-6">
                                                    Drag & drop or click to browse. We'll extract your current tech stack automatically.
                                                </p>
                                                <div className="flex gap-3 text-xs text-slate-500 font-mono">
                                                    <span className="flex items-center gap-1"><FileText size={14} /> PDF</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-600 self-center" />
                                                    <span className="flex items-center gap-1"><FileText size={14} /> DOCX</span>
                                                    <span className="w-1 h-1 rounded-full bg-slate-600 self-center" />
                                                    <span>Max 5MB</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Target Role */}
                            {activeStep === 1 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex flex-col h-full gap-6 justify-center"
                                >
                                    <div className="space-y-4">
                                        <label className="block text-sm font-medium text-slate-300">
                                            What is your target role?
                                        </label>
                                        <div className="relative">
                                            <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                            <input
                                                type="text"
                                                value={targetRole}
                                                onChange={(e) => setTargetRole(e.target.value)}
                                                placeholder="e.g., Senior Backend Engineer at Uber"
                                                className="glass-input pl-12 py-4 text-lg"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-500 pl-1">
                                            We'll tailor the curriculum gap analysis based on industry standards for this role.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Analyzing */}
                            {activeStep === 2 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex flex-col h-full w-full"
                                >
                                    {loading ? (
                                        <div className="w-full h-full flex flex-col gap-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-lg font-mono font-bold text-white flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                                                    SYSTEM_ANALYSIS_ACTIVE
                                                </h3>
                                                <span className="text-xs font-mono text-slate-500">PID: 8675-309</span>
                                            </div>

                                            {/* Thread 1: CV Analysis */}
                                            <div className="bg-black/40 rounded-lg p-4 border border-white/5 font-mono text-xs overflow-hidden h-32 relative">
                                                <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                                                    <span className="text-primary-blue font-bold">THREAD_01: CV_PARSER</span>
                                                    {threads.find(t => t.id === 'cv')?.status === 'running' && <Loader2 className="animate-spin text-slate-500" size={14} />}
                                                    {threads.find(t => t.id === 'cv')?.status === 'complete' && <CheckCircle className="text-success" size={14} />}
                                                </div>
                                                <div className="flex flex-col gap-1 text-slate-400">
                                                    {threads.find(t => t.id === 'cv')?.logs.map((log, i) => (
                                                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                                                            <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                                                            {log}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Thread 2: Market Analysis */}
                                            <div className="bg-black/40 rounded-lg p-4 border border-white/5 font-mono text-xs overflow-hidden h-32 relative">
                                                <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                                                    <span className="text-accent-purple font-bold">THREAD_02: MARKET_INTEL</span>
                                                    {threads.find(t => t.id === 'market')?.status === 'running' && <Loader2 className="animate-spin text-slate-500" size={14} />}
                                                    {threads.find(t => t.id === 'market')?.status === 'complete' && <CheckCircle className="text-success" size={14} />}
                                                </div>
                                                <div className="flex flex-col gap-1 text-slate-400">
                                                    {threads.find(t => t.id === 'market')?.logs.map((log, i) => (
                                                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                                                            <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                                                            {log}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Synthesis / Finalizing */}
                                            {threads.find(t => t.id === 'synthesis') && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="bg-primary-blue/10 rounded-lg p-3 border border-primary-blue/30 font-mono text-xs flex items-center justify-center text-primary-blue gap-2"
                                                >
                                                    <Loader2 className="animate-spin" size={14} />
                                                    Synthesizing final roadmap...
                                                </motion.div>
                                            )}
                                        </div>
                                    ) : generatedPlan ? (
                                        <div className="flex flex-col h-full justify-center items-center text-center gap-8">
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center"
                                            >
                                                <CheckCircle className="text-success" size={40} />
                                            </motion.div>
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-bold text-white">Analysis Complete</h3>
                                                <p className="text-slate-400">
                                                    We've calibrated your roadmap against {targetRole} market data.
                                                </p>
                                            </div>
                                            <Button variant="primary" size="lg" icon={Rocket} onClick={handleGoToLearning}>
                                                View Roadmap
                                            </Button>
                                        </div>
                                    ) : null}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-2">
                        <button
                            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                            disabled={activeStep === 0 || loading}
                            className="ghost-button flex items-center gap-2 disabled:opacity-50"
                        >
                            <ArrowLeft size={18} />
                            Back
                        </button>

                        <div className="flex items-center gap-4">
                            <span className="text-xs text-slate-500 font-medium hidden sm:block">
                                Step {activeStep + 1} of {steps.length}
                            </span>

                            {activeStep === 0 && (
                                <Button
                                    variant="primary"
                                    icon={ArrowRight}
                                    iconPosition="right"
                                    disabled={!cvFile}
                                    onClick={() => setActiveStep(1)}
                                >
                                    Continue
                                </Button>
                            )}

                            {activeStep === 1 && (
                                <Button
                                    variant="primary"
                                    icon={Sparkles}
                                    disabled={!targetRole.trim() || loading}
                                    onClick={handleGeneratePlan}
                                    loading={loading}
                                >
                                    Generate Plan
                                </Button>
                            )}
                        </div>
                    </div>
                </GlassCard>
            </main>
        </div>
    );
};

export default Onboarding;
