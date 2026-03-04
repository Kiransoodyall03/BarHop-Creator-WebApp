import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleButton from "react-google-button";
import { registerWithEmail, loginWithGoogle } from "../firebase/authService";
import { createUserDocument } from "../firebase/userService";
import "../styles/Auth.css";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", password: "", confirmPassword: "",
  });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword)
      return setError("Passwords do not match.");
    if (formData.password.length < 8)
      return setError("Password must be at least 8 characters.");

    setLoading(true);
    try {
      console.log("Step 1: Attempting to register with email...");
      const { user } = await registerWithEmail(formData.email, formData.password);
      console.log("Step 2: Firebase Auth user created:", user.uid);

      console.log("Step 3: Saving user document to Firestore...");
      await createUserDocument(user, {
        firstName: formData.firstName,
        lastName:  formData.lastName,
      });
      console.log("Step 4: Firestore document saved. Navigating to dashboard...");

      navigate("/dashboard");
    } catch (err) {
      console.error("Registration error:", err.code, err.message);
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      console.log("Step 1: Attempting Google sign-in...");
      const { user } = await loginWithGoogle();
      console.log("Step 2: Google user signed in:", user.uid);

      console.log("Step 3: Saving user document to Firestore...");
      await createUserDocument(user);
      console.log("Step 4: Firestore document saved. Navigating to dashboard...");

      navigate("/dashboard");
    } catch (err) {
      console.error("Google sign-in error:", err.code, err.message);
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <Link to="/" className="auth__logo">BarHop</Link>
        <h1 className="auth__title">Join Up</h1>
        <p className="auth__subtitle">Create your creator account</p>
        {error && <div className="auth__error">{error}</div>}

        <form className="auth__form" onSubmit={handleSubmit}>
          <div className="form__row">
            <div className="form__group">
              <label className="form__label">First Name</label>
              <input className="form__input" type="text" name="firstName"
                placeholder="Jane" value={formData.firstName} onChange={handleChange} required />
            </div>
            <div className="form__group">
              <label className="form__label">Last Name</label>
              <input className="form__input" type="text" name="lastName"
                placeholder="Doe" value={formData.lastName} onChange={handleChange} required />
            </div>
          </div>
          <div className="form__group">
            <label className="form__label">Email</label>
            <input className="form__input" type="email" name="email"
              placeholder="jane@example.com" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form__group">
            <label className="form__label">Password</label>
            <input className="form__input" type="password" name="password"
              placeholder="Min. 8 characters" value={formData.password} onChange={handleChange} required />
          </div>
          <div className="form__group">
            <label className="form__label">Confirm Password</label>
            <input className="form__input" type="password" name="confirmPassword"
              placeholder="Repeat your password" value={formData.confirmPassword} onChange={handleChange} required />
          </div>
          <button type="submit" className="auth__submit" disabled={loading}>
            {loading ? "Creating account…" : "Create Account"}
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
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function friendlyError(code) {
  switch (code) {
    case "auth/email-already-in-use": return "An account with this email already exists.";
    case "auth/invalid-email":        return "Please enter a valid email address.";
    case "auth/weak-password":        return "Password must be at least 6 characters.";
    case "auth/popup-closed-by-user": return "Google sign-in was cancelled.";
    default:                          return "Something went wrong. Please try again.";
  }
}

export default Register;