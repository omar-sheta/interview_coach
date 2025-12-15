import React, { useState, useRef } from 'react';
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

    const handleGeneratePlan = async () => {
        setLoading(true);
        setError('');
        setActiveStep(2);

        try {
            const formData = new FormData();
            formData.append('target_role', targetRole);

            if (cvFile) {
                formData.append('cv_file', cvFile);
            } else {
                formData.append('cv_text', cvText);
            }

            const { data } = await api.post('/api/learning/generate', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (data.success) {
                setGeneratedPlan(data.plan);
            } else {
                setError(data.message || 'Failed to generate plan');
                setActiveStep(1);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to generate learning plan');
            setActiveStep(1);
        } finally {
            setLoading(false);
        }
    };

    const handleGoToLearning = () => {
        navigate('/learning');
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
                        <h2 className="text-white text-lg font-bold tracking-tight">CodeForge</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="ghost-button">Sign In</button>
                        <Button variant="primary" size="sm">Get Started</Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-80px)]">
                <GlassCard className="w-full max-w-2xl p-8 sm:p-10" hover={false}>
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                            Welcome to CodeForge
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
                                    className="flex flex-col h-full justify-center items-center text-center gap-8"
                                >
                                    {loading ? (
                                        <>
                                            <div className="relative w-full max-w-md">
                                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary-blue w-2/3 relative shimmer" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-medium text-white flex items-center gap-2">
                                                    <Loader2 className="animate-spin" size={20} />
                                                    Parsing Resume...
                                                </h3>
                                                <p className="text-slate-400 text-sm">
                                                    Extracting proficiency in React, Node.js, and System Design.
                                                </p>
                                            </div>
                                        </>
                                    ) : generatedPlan ? (
                                        <>
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center"
                                            >
                                                <CheckCircle className="text-success" size={40} />
                                            </motion.div>
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-bold text-white">Your Plan is Ready! 🎉</h3>
                                                <p className="text-slate-400">
                                                    We've created a personalized learning path based on your experience.
                                                </p>
                                            </div>
                                            <Button variant="primary" size="lg" icon={Rocket} onClick={handleGoToLearning}>
                                                Start Learning
                                            </Button>
                                        </>
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
