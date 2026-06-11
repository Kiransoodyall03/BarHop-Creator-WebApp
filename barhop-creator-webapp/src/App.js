import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorProvider } from './context/ErrorContext';
import ErrorBoundary from './components/ErrorBoundary';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateVenue from './pages/CreateVenue';
import Preview from './pages/Preview';
import './App.css';
import './styles/ErrorToast.css';
import DashboardLayout from './components/DashboardLayout';

function PublicRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? <Navigate to="/dashboard" replace /> : children;
}

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <ErrorBoundary>
      <ErrorProvider>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
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
                <Route path="/venue/create" element={<CreateVenue />} />
                <Route path="/venue/edit/:id" element={<CreateVenue />} />
                <Route path="/venue/preview/:id" element={<Preview />} />
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </ErrorProvider>
    </ErrorBoundary>
  );
}

export default App;
