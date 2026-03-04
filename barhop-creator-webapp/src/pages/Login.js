import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Auth.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // TODO: wire up Firebase Auth
      // await signInWithEmailAndPassword(auth, formData.email, formData.password);
      console.log('Login submitted:', formData);
      navigate('/dashboard'); // update when dashboard route exists
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <div className="auth">
      <div className="auth__card">
        <Link to="/" className="auth__logo">BarHop</Link>

        <h1 className="auth__title">Welcome Back</h1>
        <p className="auth__subtitle">Sign in to your creator account</p>

        {error && <div className="auth__error">{error}</div>}

        <form className="auth__form" onSubmit={handleSubmit}>
          <div className="form__group">
            <label className="form__label">Email</label>
            <input
              className="form__input"
              type="email"
              name="email"
              placeholder="jane@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form__group">
            <label className="form__label">Password</label>
            <input
              className="form__input"
              type="password"
              name="password"
              placeholder="Your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="auth__submit">
            Sign In
          </button>
        </form>

        <div className="auth__divider">or</div>

        <p className="auth__footer">
          Don't have an account? <Link to="/register">Sign up free</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;