import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleButton from "react-google-button";
import { loginWithEmail, loginWithGoogle } from "../firebase/authService";
import { createUserDocument } from "../firebase/userService";
import "../styles/Auth.css";
import { useError } from "../context/ErrorContext";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useError();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithEmail(formData.email, formData.password);
      showSuccess("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      showError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      await createUserDocument(result.user);
      showSuccess("Successfully signed in with Google!");
      navigate("/dashboard");
    } catch (err) {
      showError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <Link to="/" className="auth__logo">BarHop</Link>
        <h1 className="auth__title">Welcome Back</h1>
        <p className="auth__subtitle">Sign in to your creator account</p>

        <form className="auth__form" onSubmit={handleSubmit}>
          <div className="form__group">
            <label className="form__label">Email</label>
            <input className="form__input" type="email" name="email"
              placeholder="jane@example.com" value={formData.email}
              onChange={handleChange} required />
          </div>
          <div className="form__group">
            <label className="form__label">Password</label>
            <input className="form__input" type="password" name="password"
              placeholder="Your password" value={formData.password}
              onChange={handleChange} required />
          </div>
          <button type="submit" className="auth__submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="auth__divider">or</div>

        <div className="google-btn-wrapper">
          <GoogleButton
            type="dark"
            onClick={handleGoogle}
            disabled={loading}
          />
        </div>

        <p className="auth__footer">
          Don't have an account? <Link to="/register">Sign up free</Link>
        </p>
      </div>
    </div>
  );
}

function friendlyError(code) {
  switch (code) {
    case "auth/user-not-found":       return "No account found with this email.";
    case "auth/wrong-password":       return "Incorrect password. Please try again.";
    case "auth/invalid-email":        return "Please enter a valid email address.";
    case "auth/too-many-requests":    return "Too many attempts. Please try again later.";
    case "auth/popup-closed-by-user": return "Google sign-in was cancelled.";
    case "auth/popup-blocked":        return "Popup was blocked. Please allow popups for this site.";
    default:                          return "Something went wrong. Please try again.";
  }
}

export default Login;