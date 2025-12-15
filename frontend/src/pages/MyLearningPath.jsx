import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/client.js';
import { motion } from 'framer-motion';
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
    Grid,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import {
    SchoolRounded,
    PlayArrowRounded,
    ExpandMoreRounded,
    CheckCircleRounded,
    RadioButtonUncheckedRounded,
    TrendingUpRounded,
    AccessTimeRounded,
    EmojiEventsRounded,
} from '@mui/icons-material';

const MyLearningPath = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const theme = useTheme();

    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState(null);
    const [hasPlan, setHasPlan] = useState(false);
    const [error, setError] = useState('');
    const [expandedModule, setExpandedModule] = useState(null);

    useEffect(() => {
        fetchLearningPlan();
    }, []);

    const fetchLearningPlan = async () => {
        try {
            const { data } = await api.get('/api/learning/plan');
            setHasPlan(data.has_plan);
            setPlan(data.plan);
            if (data.has_plan && data.plan?.curriculum?.modules?.length > 0) {
                setExpandedModule(data.plan.curriculum.modules[0].id);
            }
        } catch (err) {
            setError('Failed to load learning plan');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStartModule = (moduleId) => {
        navigate(`/practice/written/${moduleId}`);
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

    if (!hasPlan) {
        return (
            <>
                <Navbar />
                <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <SchoolRounded sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
                        <Typography variant="h3" fontWeight={800} gutterBottom>
                            Start Your Learning Journey
                        </Typography>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                            Upload your CV and let AI create a personalized 4-week study plan tailored to your target role.
                        </Typography>
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => navigate('/onboarding')}
                            sx={{ borderRadius: 50, px: 6, py: 2, fontSize: '1.1rem' }}
                        >
                            Create My Learning Plan
                        </Button>
                    </motion.div>
                </Container>
            </>
        );
    }

    const curriculum = plan?.curriculum || {};
    const modules = curriculum.modules || [];
    const weakPoints = curriculum.weak_points || [];

    return (
        <>
            <Navbar />
            <Box
                sx={{
                    minHeight: '100vh',
                    background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    pt: 4,
                    pb: 8,
                }}
            >
                <Container maxWidth="lg">
                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                        <Box sx={{ mb: 4, color: 'white' }}>
                            <Typography variant="h3" fontWeight={800} gutterBottom>
                                🎯 Your Learning Path
                            </Typography>
                            <Typography variant="h6" sx={{ opacity: 0.9 }}>
                                Target Role: <strong>{plan?.target_role || 'Software Engineer'}</strong>
                            </Typography>
                        </Box>
                    </motion.div>

                    {/* Stats Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 3, borderRadius: 4, textAlign: 'center' }}>
                                <TrendingUpRounded sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                                <Typography variant="h4" fontWeight={700}>{modules.length}</Typography>
                                <Typography color="text.secondary">Modules</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 3, borderRadius: 4, textAlign: 'center' }}>
                                <AccessTimeRounded sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                                <Typography variant="h4" fontWeight={700}>{curriculum.total_estimated_hours || 40}</Typography>
                                <Typography color="text.secondary">Hours Estimated</Typography>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 3, borderRadius: 4, textAlign: 'center' }}>
                                <EmojiEventsRounded sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                                <Typography variant="h4" fontWeight={700}>
                                    {modules.reduce((acc, m) => acc + getModuleProgress(m.id), 0)}
                                </Typography>
                                <Typography color="text.secondary">Questions Completed</Typography>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Focus Areas */}
                    {weakPoints.length > 0 && (
                        <Paper sx={{ p: 3, mb: 4, borderRadius: 4 }}>
                            <Typography variant="h6" fontWeight={700} gutterBottom>
                                📍 Focus Areas Identified
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {weakPoints.map((point, idx) => (
                                    <Chip key={idx} label={point} color="warning" variant="outlined" sx={{ mb: 1 }} />
                                ))}
                            </Stack>
                        </Paper>
                    )}

                    {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                    {/* Modules */}
                    <Stack spacing={2}>
                        {modules.map((module, idx) => {
                            const progressPercent = getProgressPercent(module.id, module);
                            const isCompleted = progressPercent === 100;

                            return (
                                <motion.div
                                    key={module.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <Accordion
                                        expanded={expandedModule === module.id}
                                        onChange={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
                                        sx={{
                                            borderRadius: '16px !important',
                                            '&:before': { display: 'none' },
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreRounded />}
                                            sx={{
                                                py: 2,
                                                px: 3,
                                                backgroundColor: isCompleted ? alpha(theme.palette.success.main, 0.1) : 'transparent'
                                            }}
                                        >
                                            <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%', pr: 2 }}>
                                                {isCompleted ? (
                                                    <CheckCircleRounded color="success" sx={{ fontSize: 28 }} />
                                                ) : (
                                                    <RadioButtonUncheckedRounded color="action" sx={{ fontSize: 28 }} />
                                                )}
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Typography variant="h6" fontWeight={700}>
                                                        Week {module.week}: {module.title}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {module.focus_area}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={`${getModuleProgress(module.id)}/${getTotalQuestions(module)}`}
                                                    size="small"
                                                    color={isCompleted ? 'success' : 'default'}
                                                />
                                            </Stack>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ px: 3, pb: 3 }}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={progressPercent}
                                                sx={{ height: 8, borderRadius: 4, mb: 3 }}
                                            />

                                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                                Goals:
                                            </Typography>
                                            <Stack spacing={1} sx={{ mb: 3 }}>
                                                {(module.goals || []).map((goal, gIdx) => (
                                                    <Typography key={gIdx} variant="body2" color="text.secondary">
                                                        • {goal}
                                                    </Typography>
                                                ))}
                                            </Stack>

                                            <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                                Practice Questions ({getTotalQuestions(module)}):
                                            </Typography>
                                            <Stack spacing={1} sx={{ mb: 3 }}>
                                                {(module.practice_questions || []).slice(0, 3).map((q, qIdx) => (
                                                    <Paper key={qIdx} sx={{ p: 2, backgroundColor: alpha(theme.palette.background.default, 0.5) }}>
                                                        <Stack direction="row" alignItems="center" spacing={1}>
                                                            <Chip label={q.difficulty} size="small" color={
                                                                q.difficulty === 'easy' ? 'success' :
                                                                    q.difficulty === 'medium' ? 'warning' : 'error'
                                                            } />
                                                            <Chip label={q.type} size="small" variant="outlined" />
                                                        </Stack>
                                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                                            {q.question?.substring(0, 100)}...
                                                        </Typography>
                                                    </Paper>
                                                ))}
                                            </Stack>

                                            <Button
                                                variant="contained"
                                                startIcon={<PlayArrowRounded />}
                                                onClick={() => handleStartModule(module.id)}
                                                sx={{ borderRadius: 50 }}
                                            >
                                                {progressPercent > 0 ? 'Continue Practice' : 'Start Practice'}
                                            </Button>
                                        </AccordionDetails>
                                    </Accordion>
                                </motion.div>
                            );
                        })}
                    </Stack>
                </Container>
            </Box>
        </>
    );
};

export default MyLearningPath;
