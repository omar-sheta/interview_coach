import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import CandidateDashboard from './pages/CandidateDashboardNew.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminResultsPage from './pages/AdminResultsPage.jsx';
import WorkspacePage from './pages/WorkspacePage.jsx';
import NotFound from './pages/NotFound.jsx';
import LogoutPage from './pages/LogoutPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminInterviews from './pages/AdminInterviews.jsx';
import CreateInterview from './pages/CreateInterview.jsx';
import InterviewDetail from './pages/InterviewDetail.jsx';
import AdminCandidates from './pages/AdminCandidates.jsx';
import AdminAnalytics from './pages/AdminAnalytics.jsx';
import InterviewResultDetail from './pages/InterviewResultDetail.jsx';
import CandidateDetail from './pages/CandidateDetail.jsx';
import CandidateResultDetail from './pages/CandidateResultDetail.jsx';
import InterviewSuccessPage from './pages/InterviewSuccessPage.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';

// New Learning Platform Pages
import MyLearningPath from './pages/MyLearningPath.jsx';
import Onboarding from './pages/Onboarding.jsx';
import WrittenPractice from './pages/WrittenPractice.jsx';

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

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="interviews" element={<AdminInterviews />} />
        <Route path="interviews/create" element={<CreateInterview />} />
        <Route path="interviews/:id" element={<InterviewDetail />} />
        <Route path="candidates" element={<AdminCandidates />} />
        <Route path="candidates/:id" element={<CandidateDetail />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="results" element={<AdminResultsPage />} />
        <Route path="results/:sessionId" element={<InterviewResultDetail />} />
      </Route>

      <Route path="/logout" element={<LogoutPage />} />
      <Route path="/unauthorized" element={<div>Unauthorized Access</div>} />
      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
}

export default App;

