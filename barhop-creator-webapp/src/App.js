import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorProvider } from './context/ErrorContext';
import { ThemeProvider } from './context/ThemeContext';
import {
  VerificationProvider,
  useVerification,
} from './context/VerificationContext';
import ErrorBoundary from './components/ErrorBoundary';
import { FullScreenSpinner } from './components/ui/Spinner';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateVenue from './pages/CreateVenue';
import Preview from './pages/Preview';
import Settings from './pages/Settings';
import PricingDashboard from './pages/PricingDashboard';
import Reservations from './pages/Reservations';
import PrivacyPolicy from './pages/PrivacyPolicy';
import DashboardLayout from './components/DashboardLayout';

function PublicRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? <Navigate to="/dashboard" replace /> : children;
}

// /register hosts the whole onboarding wizard, including Paystack
// business verification, so signed-in-but-unverified owners must be able
// to reach it — only verified owners are bounced to the dashboard.
function RegisterRoute({ children }) {
  const { currentUser } = useAuth();
  const { verificationStatus, loading } = useVerification();
  if (currentUser && loading) return <FullScreenSpinner />;
  if (currentUser && verificationStatus === 'VERIFIED')
    return <Navigate to="/dashboard" replace />;
  return children;
}

// The dashboard is exclusive to verified business owners: anyone who
// hasn't completed Paystack verification is sent back to finish the
// registration wizard.
function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  const { verificationStatus, loading } = useVerification();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (loading) return <FullScreenSpinner />;
  if (verificationStatus !== 'VERIFIED')
    return <Navigate to="/register" replace />;
  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ErrorProvider>
        <AuthProvider>
          <VerificationProvider>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route
                  path="/register"
                  element={
                    <RegisterRoute>
                      <Register />
                    </RegisterRoute>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />

                {/* Wrapped Dashboard Routes */}
                <Route
                  element={
                    <PrivateRoute>
                      <DashboardLayout />
                    </PrivateRoute>
                  }
                >
                  {/* Every route inside here will have the Sidebar locked on the left! */}
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/plans" element={<PricingDashboard />} />
                  <Route path="/reservations" element={<Reservations />} />
                  <Route path="/venue/create" element={<CreateVenue />} />
                  <Route path="/venue/edit/:id" element={<CreateVenue />} />
                  <Route path="/venue/preview/:id" element={<Preview />} />
                </Route>
              </Routes>
            </Router>
          </VerificationProvider>
        </AuthProvider>
        </ErrorProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
