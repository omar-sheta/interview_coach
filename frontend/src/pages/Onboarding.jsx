import React, { useState, useRef } from 'react';
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
    TextField,
    useTheme,
    alpha,
    Stepper,
    Step,
    StepLabel,
} from '@mui/material';
import {
    CloudUploadRounded,
    DescriptionRounded,
    SchoolRounded,
    RocketLaunchRounded,
    CheckCircleRounded,
} from '@mui/icons-material';

const Onboarding = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const theme = useTheme();
    const fileInputRef = useRef(null);

    const [activeStep, setActiveStep] = useState(0);
    const [targetRole, setTargetRole] = useState('');
    const [cvFile, setCvFile] = useState(null);
    const [cvText, setCvText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedPlan, setGeneratedPlan] = useState(null);

    const steps = ['Choose Your Goal', 'Upload CV', 'Generate Plan'];

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type === 'application/pdf') {
                setCvFile(file);
                setError('');
            } else {
                setError('Please upload a PDF file');
            }
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            setCvFile(file);
            setError('');
        } else {
            setError('Please upload a PDF file');
        }
    };

    const handleGeneratePlan = async () => {
        if (!targetRole.trim()) {
            setError('Please enter your target role');
            return;
        }
        if (!cvFile && !cvText.trim()) {
            setError('Please upload a CV or paste your experience');
            return;
        }

        setLoading(true);
        setError('');

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
                setActiveStep(2);
            } else {
                setError(data.message || 'Failed to generate plan');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || 'Failed to generate learning plan');
        } finally {
            setLoading(false);
        }
    };

    const handleGoToLearning = () => {
        navigate('/learning');
    };

    const renderStepContent = () => {
        switch (activeStep) {
            case 0:
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <RocketLaunchRounded sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                            <Typography variant="h4" fontWeight={700} gutterBottom>
                                What role are you preparing for?
                            </Typography>
                            <Typography color="text.secondary" sx={{ mb: 4 }}>
                                We'll customize your learning path based on your target position.
                            </Typography>
                            <TextField
                                fullWidth
                                label="Target Role"
                                placeholder="e.g., Senior Backend Engineer at Google"
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                sx={{ maxWidth: 500, mb: 4 }}
                                variant="outlined"
                            />
                            <Box>
                                <Button
                                    variant="contained"
                                    size="large"
                                    disabled={!targetRole.trim()}
                                    onClick={() => setActiveStep(1)}
                                    sx={{ borderRadius: 50, px: 6 }}
                                >
                                    Continue
                                </Button>
                            </Box>
                        </Box>
                    </motion.div>
                );

            case 1:
                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <Box sx={{ py: 4 }}>
                            <Typography variant="h4" fontWeight={700} gutterBottom textAlign="center">
                                Share Your Experience
                            </Typography>
                            <Typography color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
                                Upload your CV or paste your experience so we can identify areas to focus on.
                            </Typography>

                            {/* File Upload */}
                            <Paper
                                onDrop={handleDrop}
                                onDragOver={(e) => e.preventDefault()}
                                onClick={() => fileInputRef.current?.click()}
                                sx={{
                                    p: 4,
                                    mb: 3,
                                    textAlign: 'center',
                                    border: `2px dashed ${cvFile ? theme.palette.success.main : theme.palette.divider}`,
                                    borderRadius: 4,
                                    backgroundColor: cvFile
                                        ? alpha(theme.palette.success.main, 0.05)
                                        : alpha(theme.palette.background.default, 0.5),
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: theme.palette.primary.main,
                                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                    },
                                }}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                {cvFile ? (
                                    <>
                                        <CheckCircleRounded sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                                        <Typography variant="h6" fontWeight={600} color="success.main">
                                            {cvFile.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Click to change file
                                        </Typography>
                                    </>
                                ) : (
                                    <>
                                        <CloudUploadRounded sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                                        <Typography variant="h6" fontWeight={600}>
                                            Drop your CV here or click to browse
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            PDF files only
                                        </Typography>
                                    </>
                                )}
                            </Paper>

                            <Typography textAlign="center" color="text.secondary" sx={{ mb: 2 }}>
                                — or paste your experience below —
                            </Typography>

                            <TextField
                                fullWidth
                                multiline
                                rows={6}
                                label="Your Experience"
                                placeholder="Paste your resume content, work experience, education, projects, skills..."
                                value={cvText}
                                onChange={(e) => setCvText(e.target.value)}
                                disabled={!!cvFile}
                                sx={{ mb: 4 }}
                            />

                            <Stack direction="row" spacing={2} justifyContent="center">
                                <Button
                                    variant="outlined"
                                    onClick={() => setActiveStep(0)}
                                    sx={{ borderRadius: 50, px: 4 }}
                                >
                                    Back
                                </Button>
                                <Button
                                    variant="contained"
                                    size="large"
                                    disabled={loading || (!cvFile && !cvText.trim())}
                                    onClick={handleGeneratePlan}
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SchoolRounded />}
                                    sx={{ borderRadius: 50, px: 6 }}
                                >
                                    {loading ? 'Generating...' : 'Generate My Plan'}
                                </Button>
                            </Stack>

                            {loading && (
                                <Box sx={{ mt: 4, textAlign: 'center' }}>
                                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                                        Analyzing your experience and creating your personalized learning path...
                                    </Typography>
                                    <LinearProgress sx={{ maxWidth: 400, mx: 'auto' }} />
                                </Box>
                            )}
                        </Box>
                    </motion.div>
                );

            case 2:
                return (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                            <CheckCircleRounded sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                            <Typography variant="h3" fontWeight={800} gutterBottom>
                                Your Plan is Ready! 🎉
                            </Typography>
                            <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
                                We've created a personalized 4-week learning path based on your experience and goals.
                            </Typography>

                            {generatedPlan?.curriculum?.weak_points?.length > 0 && (
                                <Paper sx={{ p: 3, mb: 4, maxWidth: 500, mx: 'auto', textAlign: 'left' }}>
                                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                                        📍 Areas We'll Focus On:
                                    </Typography>
                                    {generatedPlan.curriculum.weak_points.map((point, idx) => (
                                        <Typography key={idx} variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            • {point}
                                        </Typography>
                                    ))}
                                </Paper>
                            )}

                            <Button
                                variant="contained"
                                size="large"
                                onClick={handleGoToLearning}
                                startIcon={<RocketLaunchRounded />}
                                sx={{ borderRadius: 50, px: 6, py: 1.5, fontSize: '1.1rem' }}
                            >
                                Start Learning
                            </Button>
                        </Box>
                    </motion.div>
                );

            default:
                return null;
        }
    };

    return (
        <>
            <Navbar />
            <Box
                sx={{
                    minHeight: '100vh',
                    background: theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, #121212 0%, #1e1e1e 100%)'
                        : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                    pt: 4,
                    pb: 8,
                }}
            >
                <Container maxWidth="md">
                    <Card
                        sx={{
                            borderRadius: 6,
                            overflow: 'hidden',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                        }}
                    >
                        <CardContent sx={{ p: { xs: 3, md: 6 } }}>
                            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                                {steps.map((label) => (
                                    <Step key={label}>
                                        <StepLabel>{label}</StepLabel>
                                    </Step>
                                ))}
                            </Stepper>

                            {error && (
                                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                                    {error}
                                </Alert>
                            )}

                            {renderStepContent()}
                        </CardContent>
                    </Card>
                </Container>
            </Box>
        </>
    );
};

export default Onboarding;
