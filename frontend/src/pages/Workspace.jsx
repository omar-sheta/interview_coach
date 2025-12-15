import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import { motion } from 'framer-motion';
import {
    Terminal,
    Code,
    MessageSquare,
    FolderOpen,
    Puzzle,
    Settings,
    Send,
    Lightbulb,
    Timer,
    CheckCircle,
    Play,
    X,
    MoreHorizontal,
    PenTool,
    Hand,
    Square,
    ArrowRight,
    Trash2,
    Plus,
    Minus,
    Loader2,
    Maximize2
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { Button } from '../components/ui';

const Workspace = () => {
    const { moduleId } = useParams();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') || 'coaching';
    const navigate = useNavigate();
    const { user } = useAuth();
    const chatEndRef = useRef(null);

    // Session state
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Module/Question state
    const [questionText, setQuestionText] = useState('');
    const [targetRole, setTargetRole] = useState('');

    // Code editor state
    const [code, setCode] = useState('# Start coding here...\n\ndef solution():\n    pass\n');

    // Chat state
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [sending, setSending] = useState(false);

    // Timer state (interview mode)
    const [timeLimit, setTimeLimit] = useState(null);
    const [startedAt, setStartedAt] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(null);

    // Scroll chat to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initialize session
    useEffect(() => {
        fetchModuleAndStartSession();
    }, [moduleId, mode]);

    // Timer countdown
    useEffect(() => {
        if (mode !== 'interview' || !startedAt || !timeLimit) return;

        const interval = setInterval(() => {
            const start = new Date(startedAt).getTime();
            const now = Date.now();
            const elapsed = Math.floor((now - start) / 1000);
            const remaining = (timeLimit * 60) - elapsed;

            if (remaining <= 0) {
                setTimeRemaining(0);
                clearInterval(interval);
                handleSubmit();
            } else {
                setTimeRemaining(remaining);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [startedAt, timeLimit, mode]);

    const fetchModuleAndStartSession = async () => {
        try {
            setLoading(true);

            const planResponse = await api.get('/api/learning/plan');
            const plan = planResponse.data.plan;
            const role = plan?.target_role || 'Software Engineer';
            setTargetRole(role);

            const modules = plan?.curriculum?.modules || [];
            const currentModule = modules.find(m => m.id === moduleId);

            let question = '';
            if (currentModule) {
                const questions = currentModule.practice_questions || [];
                if (questions.length > 0) {
                    question = questions[0].question || '';
                } else {
                    question = `${currentModule.title}: ${currentModule.focus_area || ''}`;
                }
            }
            setQuestionText(question);

            const { data } = await api.post('/api/mentor/session/start', {
                module_id: moduleId,
                mode: mode,
                time_limit_minutes: mode === 'interview' ? 45 : null,
                question_text: question,
                target_role: role
            });
            setSessionId(data.session_id);
            setTimeLimit(data.time_limit_minutes);
            setStartedAt(data.started_at);

            const problemIntro = question ? `\n\n**Today's Problem:**\n${question}` : '';
            const welcomeMsg = mode === 'coaching'
                ? `I see you're working on a problem. Remember to check your base cases first. Let me know if you need any hints!`
                : `Welcome to your mock interview. Please read the problem and start working on your solution. I'll observe and ask clarifying questions.`;

            setMessages([{ role: 'assistant', content: welcomeMsg }]);
        } catch (err) {
            setError('Failed to start session');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!userInput.trim() || sending) return;

        const userMessage = userInput.trim();
        setUserInput('');
        setSending(true);

        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

        try {
            const { data } = await api.post('/api/mentor/ask', {
                session_id: sessionId,
                code: code,
                question: userMessage
            });

            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '⚠️ Error getting response. Please try again.'
            }]);
        } finally {
            setSending(false);
        }
    };

    const handleAskForHint = () => {
        if (mode !== 'coaching') return;
        setUserInput("Can you give me a hint on how to approach this problem?");
    };

    const handleSubmit = async () => {
        if (mode === 'interview') {
            navigate(`/results/pending/${sessionId}`);
        } else {
            alert('Submission grading coming soon!');
        }
    };

    const formatTime = (seconds) => {
        if (seconds === null) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="h-screen w-screen bg-bg-dark flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary-blue animate-spin" />
            </div>
        );
    }

    const isCoaching = mode === 'coaching';

    return (
        <div className="h-screen w-screen bg-bg-dark flex flex-col overflow-hidden font-display text-slate-200">
            {/* Top Header */}
            <header className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-[#0B1120] shrink-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-blue rounded-lg flex items-center justify-center">
                        <Terminal size={18} className="text-white" />
                    </div>
                    <span className="font-bold text-white tracking-tight">EngCoach</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-primary-blue/10 text-primary-blue font-medium border border-primary-blue/20">
                        Pro
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {mode === 'interview' && (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${timeRemaining && timeRemaining < 300
                                ? 'bg-danger/10 border-danger/30 text-danger'
                                : 'bg-slate-800 border-slate-700 text-slate-300'
                            }`}>
                            <Timer size={14} />
                            <span className="text-sm font-bold font-mono">{formatTime(timeRemaining)}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        <span className="text-xs font-medium text-slate-300">Environment Active</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-blue to-accent-purple ring-2 ring-slate-700 cursor-pointer" />
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Slim Sidebar */}
                <nav className="w-16 bg-[#0B1120] border-r border-white/10 flex flex-col items-center py-4 gap-6 shrink-0 z-10">
                    <button className="p-2 rounded-lg bg-primary-blue/20 text-primary-blue relative group">
                        <Code size={20} />
                        <span className="absolute left-14 bg-slate-800 text-xs px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                            Editor
                        </span>
                    </button>
                    <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative group">
                        <MessageSquare size={20} />
                        <span className="absolute left-14 bg-slate-800 text-xs px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                            Mentorship
                        </span>
                    </button>
                    <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative group">
                        <FolderOpen size={20} />
                        <span className="absolute left-14 bg-slate-800 text-xs px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                            Files
                        </span>
                    </button>
                    <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative group">
                        <Puzzle size={20} />
                        <span className="absolute left-14 bg-slate-800 text-xs px-2 py-1 rounded border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                            Extensions
                        </span>
                    </button>
                    <div className="mt-auto">
                        <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                            <Settings size={20} />
                        </button>
                    </div>
                </nav>

                {/* Main Workspace Grid */}
                <main className="flex-1 flex overflow-hidden">
                    {/* Column 1: The Mentor (20%) */}
                    <section className="w-[20%] min-w-[300px] flex flex-col border-r border-white/10 bg-bg-dark relative">
                        <div className="h-10 px-4 flex items-center border-b border-white/10 bg-card-surface">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                <MessageSquare size={14} />
                                The Mentor
                            </span>
                            <button className="ml-auto text-slate-400 hover:text-white">
                                <MoreHorizontal size={16} />
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
                            <div className="text-center py-4">
                                <p className="text-xs text-slate-500">Today</p>
                            </div>

                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${msg.role === 'user'
                                            ? 'bg-primary-blue/20 border border-primary-blue/30'
                                            : 'bg-slate-700 border border-slate-600'
                                        }`}>
                                        {msg.role === 'user' ? '👤' : '🤖'}
                                    </div>
                                    <div className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : ''} max-w-[85%]`}>
                                        <span className="text-[11px] font-medium text-slate-400">
                                            {msg.role === 'user' ? 'You' : 'AI Mentor'}
                                        </span>
                                        <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                                ? 'bg-primary-blue rounded-tr-none text-white'
                                                : 'bg-slate-800 rounded-tl-none border border-slate-700 text-slate-200'
                                            }`}>
                                            <p>{msg.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {sending && (
                                <div className="flex items-center gap-2 text-slate-400">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-xs">Thinking...</span>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 border-t border-white/10 bg-card-surface">
                            <div className="flex flex-col gap-2">
                                {isCoaching && (
                                    <button
                                        onClick={handleAskForHint}
                                        className="w-full flex items-center justify-center gap-2 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg transition-all active:scale-[0.98] border border-slate-600/50"
                                    >
                                        <Lightbulb size={16} className="text-yellow-400" />
                                        Ask for Hint
                                    </button>
                                )}
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={userInput}
                                        onChange={(e) => setUserInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Type a message..."
                                        className="w-full bg-bg-dark text-sm text-white placeholder-slate-500 rounded-lg border border-slate-700 px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-blue focus:border-primary-blue"
                                        disabled={sending}
                                    />
                                    <button
                                        onClick={sendMessage}
                                        disabled={sending}
                                        className="absolute right-2 top-2 text-slate-400 hover:text-primary-blue transition-colors disabled:opacity-50"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Column 2: The Code (50%) */}
                    <section className="flex-1 min-w-[400px] flex flex-col bg-bg-dark relative">
                        {/* Editor Header */}
                        <div className="h-10 flex bg-bg-dark border-b border-white/10">
                            {/* Tabs */}
                            <div className="flex items-end">
                                <div className="h-10 px-4 flex items-center gap-2 bg-card-surface border-r border-t-2 border-t-primary-blue border-r-white/10 min-w-[140px]">
                                    <span className="text-yellow-400">📄</span>
                                    <span className="text-sm text-white font-medium">solution.py</span>
                                    <button className="ml-auto text-slate-500 hover:text-white">
                                        <X size={12} />
                                    </button>
                                </div>
                                <div className="h-10 px-4 flex items-center gap-2 hover:bg-card-surface/50 border-r border-white/10 min-w-[140px] cursor-pointer">
                                    <span className="text-blue-400">📄</span>
                                    <span className="text-sm text-slate-400">tests.py</span>
                                </div>
                            </div>

                            {/* Run Actions */}
                            <div className="ml-auto flex items-center px-2 gap-2">
                                <button className="flex items-center gap-2 px-4 py-1.5 bg-success/10 hover:bg-success/20 text-success border border-success/20 rounded text-xs font-bold transition-all active:scale-[0.98]">
                                    <Play size={16} fill="currentColor" />
                                    RUN
                                </button>
                            </div>
                        </div>

                        {/* Editor Body */}
                        <div className="flex-1 bg-bg-dark">
                            <Editor
                                height="100%"
                                defaultLanguage="python"
                                theme="vs-dark"
                                value={code}
                                onChange={(value) => setCode(value || '')}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 13,
                                    fontFamily: 'JetBrains Mono, monospace',
                                    wordWrap: 'on',
                                    lineHeight: 24,
                                    padding: { top: 16 },
                                    scrollBeyondLastLine: false,
                                }}
                            />
                        </div>

                        {/* Console Output */}
                        <div className="h-32 border-t border-white/10 bg-[#0B1120] flex flex-col">
                            <div className="flex items-center justify-between px-4 py-1 bg-card-surface/50 border-b border-white/5">
                                <span className="text-xs uppercase font-bold text-slate-500">Terminal</span>
                                <div className="flex gap-2">
                                    <button className="text-slate-500 hover:text-slate-300">
                                        <Maximize2 size={14} />
                                    </button>
                                    <button className="text-slate-500 hover:text-slate-300">
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="p-3 font-mono text-xs text-slate-300 overflow-y-auto">
                                <p className="text-slate-500">user@engcoach:~/practice$ python solution.py</p>
                                <p className="mt-1 text-success">Ready to run your code...</p>
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="text-success">➜</span>
                                    <span className="text-cyan-400">~/practice</span>
                                    <span className="w-1.5 h-3 bg-slate-500 animate-pulse block" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Column 3: Whiteboard (30%) */}
                    <section className="w-[30%] min-w-[350px] flex flex-col border-l border-white/10 bg-bg-dark relative overflow-hidden">
                        {/* Header */}
                        <div className="h-10 px-4 flex items-center border-b border-white/10 bg-card-surface">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                <PenTool size={14} />
                                Whiteboard
                            </span>
                            <div className="ml-auto flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 px-2 py-0.5 border border-slate-700 rounded bg-slate-800">
                                    ReadOnly
                                </span>
                                <button className="text-slate-400 hover:text-white">
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Canvas Area */}
                        <div className="flex-1 relative dot-grid cursor-grab active:cursor-grabbing">
                            {/* Floating Toolbar */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-card rounded-full px-2 py-1.5 flex items-center gap-1 shadow-lg z-10">
                                <button className="p-2 rounded-full hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors">
                                    <Hand size={18} />
                                </button>
                                <button className="p-2 rounded-full bg-primary-blue text-white shadow-sm transition-transform hover:scale-105">
                                    <PenTool size={18} />
                                </button>
                                <button className="p-2 rounded-full hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors">
                                    <Square size={18} />
                                </button>
                                <button className="p-2 rounded-full hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors">
                                    <ArrowRight size={18} />
                                </button>
                                <div className="w-px h-4 bg-white/20 mx-1" />
                                <button className="p-2 rounded-full hover:bg-slate-700/50 text-slate-300 hover:text-red-400 transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {/* Placeholder Diagram */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                                <svg width="400" height="300" viewBox="0 0 400 300" fill="none">
                                    <rect x="50" y="100" width="80" height="60" rx="4" stroke="#94A3B8" strokeWidth="2" fill="rgba(30,41,59,0.5)" />
                                    <text x="90" y="135" fill="#CBD5E1" fontSize="12" textAnchor="middle">Database</text>
                                    <path d="M130 130 L190 130" stroke="#64748B" strokeWidth="2" markerEnd="url(#arrowhead)" />
                                    <rect x="190" y="90" width="100" height="80" rx="4" stroke="#3B82F6" strokeWidth="2" fill="rgba(30,41,59,0.5)" />
                                    <text x="240" y="135" fill="#93C5FD" fontSize="12" textAnchor="middle">API Server</text>
                                    <path d="M290 130 L350 130" stroke="#64748B" strokeWidth="2" markerEnd="url(#arrowhead)" />
                                    <circle cx="380" cy="130" r="30" stroke="#10B981" strokeWidth="2" fill="rgba(30,41,59,0.5)" />
                                    <text x="380" y="135" fill="#6EE7B7" fontSize="10" textAnchor="middle">Client</text>
                                    <defs>
                                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                            <polygon points="0 0, 10 3.5, 0 7" fill="#64748B" />
                                        </marker>
                                    </defs>
                                </svg>
                            </div>

                            {/* Zoom Controls */}
                            <div className="absolute bottom-4 right-4 glass-card rounded-lg flex flex-col shadow-lg">
                                <button className="p-2 text-slate-400 hover:text-white border-b border-white/10">
                                    <Plus size={16} />
                                </button>
                                <button className="p-2 text-slate-400 hover:text-white">
                                    <Minus size={16} />
                                </button>
                            </div>
                        </div>
                    </section>
                </main>
            </div>

            {/* Bottom Submit Bar */}
            <div className="h-14 border-t border-white/10 bg-card-surface px-4 flex items-center justify-end gap-4 shrink-0">
                <Button
                    variant={isCoaching ? 'primary' : 'danger'}
                    icon={CheckCircle}
                    onClick={handleSubmit}
                >
                    {isCoaching ? '✅ Check My Work' : '🏁 End Interview & Submit'}
                </Button>
            </div>
        </div>
    );
};

export default Workspace;
