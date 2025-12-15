import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import CandidateDashboard from './pages/CandidateDashboardNew.jsx';
import WorkspacePage from './pages/WorkspacePage.jsx';
import NotFound from './pages/NotFound.jsx';
import LogoutPage from './pages/LogoutPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import CreateInterview from './pages/CreateInterview.jsx';
import InterviewDetail from './pages/InterviewDetail.jsx';
import InterviewResultDetail from './pages/InterviewResultDetail.jsx';
import CandidateDetail from './pages/CandidateDetail.jsx';
import CandidateResultDetail from './pages/CandidateResultDetail.jsx';
import InterviewSuccessPage from './pages/InterviewSuccessPage.jsx';

// New Learning Platform Pages
import MyLearningPath from './pages/MyLearningPath.jsx';
import Onboarding from './pages/Onboarding.jsx';
import WrittenPractice from './pages/WrittenPractice.jsx';
import Workspace from './pages/Workspace.jsx';
import ResultsReport from './pages/ResultsReport.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />

      {/* Learning Platform Routes (New) */}
      <Route
        path="/learning"
        element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <MyLearningPath />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <Onboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/practice/written/:moduleId"
        element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <WrittenPractice />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workspace/:moduleId"
        element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <Workspace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/results/:sessionId"
        element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <ResultsReport />
          </ProtectedRoute>
        }
      />

      {/* Legacy Candidate Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <CandidateDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate-dashboard"
        element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <CandidateDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workspace"
        element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <WorkspacePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate"
        element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <CandidateDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interview/success"
        element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <InterviewSuccessPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/candidate/results/:sessionId"
        element={
          <ProtectedRoute allowedRoles={['candidate']}>
            <CandidateResultDetail />
          </ProtectedRoute>
        }
      />

      <Route path="/logout" element={<LogoutPage />} />
      <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
}

export default App;


