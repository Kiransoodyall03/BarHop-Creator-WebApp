import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ErrorProvider } from "./context/ErrorContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Landing   from "./pages/Landing";
import Register  from "./pages/Register";
import Login     from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreateVenue from "./pages/CreateVenue";
import Preview from "./pages/Preview";
import "./App.css";
import "./styles/ErrorToast.css";

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
              <Route path="/" element={<Landing />} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/venue/create" element={<PrivateRoute><CreateVenue /></PrivateRoute>} />
              <Route path="/venue/preview" element={<PrivateRoute><Preview /></PrivateRoute>} />
            </Routes>
          </Router>
        </AuthProvider>
      </ErrorProvider>
    </ErrorBoundary>
  );
}

export default App;