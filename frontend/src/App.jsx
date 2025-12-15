import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LoginPage from './pages/LoginPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import NotFound from './pages/NotFound.jsx';
import LogoutPage from './pages/LogoutPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// EngCoach Core Pages
import MyLearningPath from './pages/MyLearningPath.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Workspace from './pages/Workspace.jsx';
import ResultsReport from './pages/ResultsReport.jsx';
import Dashboard from './pages/Dashboard.jsx';

function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/logout" element={<LogoutPage />} />

        {/* EngCoach Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <Dashboard />
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
          path="/path"
          element={
            <ProtectedRoute allowedRoles={['candidate']}>
              <MyLearningPath />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspace/:sessionId"
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

        {/* Legacy redirect */}
        <Route path="/learning" element={<Navigate to="/path" replace />} />

        {/* Error Routes */}
        <Route path="/unauthorized" element={<div className="min-h-screen bg-bg-dark flex items-center justify-center text-white">Unauthorized Access</div>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
