import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Container,
    Card,
    CardContent,
    Typography,
    Button,
    Box,
    CircularProgress,
    Alert,
    LinearProgress,
    Paper,
    Stack,
    Chip,
    useTheme,
    alpha,
    Tabs,
    Tab,
    TextField,
    IconButton,
    Tooltip,
    Divider,
} from '@mui/material';
import {
    CodeRounded,
    CloudUploadRounded,
    SendRounded,
    ArrowBackRounded,
    LightbulbRounded,
    CheckCircleRounded,
    NavigateNextRounded,
    NavigateBeforeRounded,
} from '@mui/icons-material';

const WrittenPractice = () => {
    const { moduleId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const theme = useTheme();
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [module, setModule] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [error, setError] = useState('');

    // Input state
    const [activeTab, setActiveTab] = useState(0);
    const [textAnswer, setTextAnswer] = useState('');
    const [uploadedFile, setUploadedFile] = useState(null);

    // Feedback state
    const [feedback, setFeedback] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);

    useEffect(() => {
        fetchModuleDetails();
    }, [moduleId]);

    const fetchModuleDetails = async () => {
        try {
            const { data } = await api.get(`/api/learning/plan/module/${moduleId}`);
            setModule(data.module);
        } catch (err) {
            setError('Failed to load module');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const currentQuestion = module?.practice_questions?.[currentQuestionIndex];

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp'];
            if (allowedTypes.includes(file.type)) {
                setUploadedFile(file);
                setError('');
            } else {
                setError('Please upload a PDF or image file');
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/gif', 'image/webp'];
            if (allowedTypes.includes(file.type)) {
                setUploadedFile(file);
                setError('');
            } else {
                setError('Please upload a PDF or image file');
            }
        }
    };

    const handleSubmit = async () => {
        if (!textAnswer.trim() && !uploadedFile) {
            setError('Please provide an answer or upload a file');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('module_id', moduleId);
            formData.append('question_id', currentQuestion.id);
            formData.append('question_text', currentQuestion.question);
            formData.append('question_type', currentQuestion.type || 'coding');

            if (textAnswer.trim()) {
                formData.append('text_answer', textAnswer);
            }
            if (uploadedFile) {
                formData.append('file_upload', uploadedFile);
            }

            const { data } = await api.post('/api/practice/submit', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (data.success) {
                setFeedback(data.feedback);
                setShowFeedback(true);
            } else {
                setError(data.message || 'Submission failed');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to submit answer');
        } finally {
            setSubmitting(false);
        }
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < (module?.practice_questions?.length || 0) - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            resetState();
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            resetState();
        }
    };

    const resetState = () => {
        setTextAnswer('');
        setUploadedFile(null);
        setFeedback(null);
        setShowFeedback(false);
        setError('');
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                    <CircularProgress size={60} />
                </Box>
            </>
        );
    }

    if (!module) {
        return (
            <>
                <Navbar />
                <Container maxWidth="md" sx={{ mt: 8 }}>
                    <Alert severity="error">Module not found</Alert>
                    <Button onClick={() => navigate('/learning')} sx={{ mt: 2 }}>
                        Back to Learning Path
                    </Button>
                </Container>
            </>
        );
    }

    const progress = ((currentQuestionIndex + 1) / (module.practice_questions?.length || 1)) * 100;

    return (
        <>
            <Navbar />
            <Box
                sx={{
                    minHeight: '100vh',
                    background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)'
                        : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                    pt: 2,
                    pb: 8,
                }}
            >
                <Container maxWidth="xl">
                    {/* Header */}
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                        <IconButton onClick={() => navigate('/learning')}>
                            <ArrowBackRounded />
                        </IconButton>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h5" fontWeight={700}>
                                {module.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Week {module.week} • {module.focus_area}
                            </Typography>
                        </Box>
                        <Chip label={`${currentQuestionIndex + 1}/${module.practice_questions?.length}`} />
                    </Stack>

                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{ height: 6, borderRadius: 3, mb: 3 }}
                    />

                    <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
                        {/* Left Panel - Question */}
                        <Paper
                            sx={{
                                flex: 1,
                                p: 4,
                                borderRadius: 4,
                                minHeight: 400,
                            }}
                        >
                            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                                <Chip
                                    label={currentQuestion?.type || 'coding'}
                                    color="primary"
                                    size="small"
                                />
                                <Chip
                                    label={currentQuestion?.difficulty || 'medium'}
                                    color={
                                        currentQuestion?.difficulty === 'easy' ? 'success' :
                                            currentQuestion?.difficulty === 'hard' ? 'error' : 'warning'
                                    }
                                    size="small"
                                    variant="outlined"
                                />
                            </Stack>

                            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
                                {currentQuestion?.question || 'No question available'}
                            </Typography>

                            {currentQuestion?.hints?.length > 0 && (
                                <Paper
                                    sx={{
                                        p: 2,
                                        backgroundColor: alpha(theme.palette.info.main, 0.1),
                                        borderRadius: 2,
                                    }}
                                >
                                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                        <LightbulbRounded color="info" fontSize="small" />
                                        <Typography variant="subtitle2" fontWeight={600}>Hints:</Typography>
                                    </Stack>
                                    {currentQuestion.hints.map((hint, idx) => (
                                        <Typography key={idx} variant="body2" color="text.secondary">
                                            • {hint}
                                        </Typography>
                                    ))}
                                </Paper>
                            )}

                            <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                                <Button
                                    startIcon={<NavigateBeforeRounded />}
                                    onClick={handlePrevQuestion}
                                    disabled={currentQuestionIndex === 0}
                                >
                                    Previous
                                </Button>
                                <Button
                                    endIcon={<NavigateNextRounded />}
                                    onClick={handleNextQuestion}
                                    disabled={currentQuestionIndex >= (module.practice_questions?.length || 0) - 1}
                                >
                                    Next
                                </Button>
                            </Stack>
                        </Paper>

                        {/* Right Panel - Answer/Feedback */}
                        <Paper
                            sx={{
                                flex: 1,
                                p: 4,
                                borderRadius: 4,
                                minHeight: 400,
                            }}
                        >
                            <AnimatePresence mode="wait">
                                {showFeedback ? (
                                    <motion.div
                                        key="feedback"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                    >
                                        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                                            <CheckCircleRounded color="success" sx={{ fontSize: 32 }} />
                                            <Typography variant="h5" fontWeight={700}>
                                                AI Coach Feedback
                                            </Typography>
                                        </Stack>

                                        {feedback && (
                                            <>
                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 2,
                                                    mb: 3,
                                                    p: 2,
                                                    borderRadius: 2,
                                                    backgroundColor: alpha(
                                                        feedback.score >= 70 ? theme.palette.success.main :
                                                            feedback.score >= 40 ? theme.palette.warning.main :
                                                                theme.palette.error.main, 0.1
                                                    )
                                                }}>
                                                    <Typography variant="h2" fontWeight={800} color={
                                                        feedback.score >= 70 ? 'success.main' :
                                                            feedback.score >= 40 ? 'warning.main' : 'error.main'
                                                    }>
                                                        {feedback.score}
                                                    </Typography>
                                                    <Typography variant="body1" color="text.secondary">
                                                        / 100
                                                    </Typography>
                                                </Box>

                                                {feedback.strengths?.length > 0 && (
                                                    <Box sx={{ mb: 3 }}>
                                                        <Typography variant="subtitle2" fontWeight={700} color="success.main" gutterBottom>
                                                            ✅ Strengths:
                                                        </Typography>
                                                        {feedback.strengths.map((s, i) => (
                                                            <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>• {s}</Typography>
                                                        ))}
                                                    </Box>
                                                )}

                                                {feedback.areas_to_improve?.length > 0 && (
                                                    <Box sx={{ mb: 3 }}>
                                                        <Typography variant="subtitle2" fontWeight={700} color="warning.main" gutterBottom>
                                                            📈 Areas to Improve:
                                                        </Typography>
                                                        {feedback.areas_to_improve.map((a, i) => (
                                                            <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>• {a}</Typography>
                                                        ))}
                                                    </Box>
                                                )}

                                                {feedback.ideal_solution && (
                                                    <Box sx={{ mb: 3 }}>
                                                        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                                            💡 Ideal Solution:
                                                        </Typography>
                                                        <Paper sx={{ p: 2, backgroundColor: alpha(theme.palette.background.default, 0.5) }}>
                                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                                                {feedback.ideal_solution}
                                                            </Typography>
                                                        </Paper>
                                                    </Box>
                                                )}

                                                {feedback.follow_up_question && (
                                                    <Alert severity="info" sx={{ mb: 3 }}>
                                                        <Typography variant="subtitle2" fontWeight={700}>
                                                            🤔 Follow-up to consider:
                                                        </Typography>
                                                        {feedback.follow_up_question}
                                                    </Alert>
                                                )}
                                            </>
                                        )}

                                        <Button
                                            variant="contained"
                                            onClick={resetState}
                                            sx={{ borderRadius: 50 }}
                                        >
                                            Try Again
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="input"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                    >
                                        <Tabs
                                            value={activeTab}
                                            onChange={(_, v) => setActiveTab(v)}
                                            sx={{ mb: 3 }}
                                        >
                                            <Tab icon={<CodeRounded />} label="Type" />
                                            <Tab icon={<CloudUploadRounded />} label="Upload" />
                                        </Tabs>

                                        {activeTab === 0 ? (
                                            <TextField
                                                fullWidth
                                                multiline
                                                rows={12}
                                                placeholder="Write your solution here... (supports code)"
                                                value={textAnswer}
                                                onChange={(e) => setTextAnswer(e.target.value)}
                                                sx={{
                                                    '& .MuiInputBase-root': {
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.9rem',
                                                    },
                                                }}
                                            />
                                        ) : (
                                            <Paper
                                                onDrop={handleDrop}
                                                onDragOver={(e) => e.preventDefault()}
                                                onClick={() => fileInputRef.current?.click()}
                                                sx={{
                                                    p: 4,
                                                    minHeight: 250,
                                                    textAlign: 'center',
                                                    border: `2px dashed ${uploadedFile ? theme.palette.success.main : theme.palette.divider}`,
                                                    borderRadius: 4,
                                                    backgroundColor: uploadedFile
                                                        ? alpha(theme.palette.success.main, 0.05)
                                                        : alpha(theme.palette.background.default, 0.5),
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <input
                                                    type="file"
                                                    ref={fileInputRef}
                                                    accept=".pdf,image/*"
                                                    onChange={handleFileChange}
                                                    style={{ display: 'none' }}
                                                />
                                                {uploadedFile ? (
                                                    <>
                                                        <CheckCircleRounded sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                                                        <Typography variant="h6" fontWeight={600} color="success.main">
                                                            {uploadedFile.name}
                                                        </Typography>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CloudUploadRounded sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                                                        <Typography variant="h6" fontWeight={600}>
                                                            Drop your solution here
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                            PDF or image files
                                                        </Typography>
                                                        <Alert severity="info" sx={{ maxWidth: 400 }}>
                                                            💡 <strong>Pro Tip:</strong> Draw your system design on paper, take a photo, and upload it here!
                                                        </Alert>
                                                    </>
                                                )}
                                            </Paper>
                                        )}

                                        {error && (
                                            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
                                                {error}
                                            </Alert>
                                        )}

                                        <Box sx={{ mt: 3, textAlign: 'right' }}>
                                            <Button
                                                variant="contained"
                                                size="large"
                                                endIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendRounded />}
                                                onClick={handleSubmit}
                                                disabled={submitting || (!textAnswer.trim() && !uploadedFile)}
                                                sx={{ borderRadius: 50, px: 4 }}
                                            >
                                                {submitting ? 'Submitting...' : 'Submit for Review'}
                                            </Button>
                                        </Box>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Paper>
                    </Box>
                </Container>
            </Box>
        </>
    );
};

export default WrittenPractice;
