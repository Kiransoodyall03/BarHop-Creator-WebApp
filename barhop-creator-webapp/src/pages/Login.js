import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GoogleButton from 'react-google-button';
import { loginWithEmail, loginWithGoogle } from '../firebase/authService';
import { createUserDocument } from '../firebase/userService';
import { useError } from '../context/ErrorContext';

const labelClass =
  'text-xs font-semibold uppercase tracking-wider text-gray-400';
const inputClass =
  'w-full rounded-lg border border-white/10 bg-surface px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition focus:border-accent/60 focus:ring-1 focus:ring-accent/40';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useError();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithEmail(formData.email, formData.password);
      showSuccess('Welcome back!');
      navigate('/dashboard');
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
      showSuccess('Successfully signed in with Google!');
      navigate('/dashboard');
    } catch (err) {
      showError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-deep px-4 py-12 text-gray-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-neon-violet/10 via-accent/5 to-transparent" />

      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-surface-card p-8">
        <Link to="/" className="font-display text-3xl tracking-wider text-white">
          BarHop
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-white">Welcome Back</h1>
        <p className="mt-1 text-sm text-gray-400">
          Sign in to your creator account
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Email</label>
            <input
              className={inputClass}
              type="email"
              name="email"
              placeholder="jane@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Password</label>
            <input
              className={inputClass}
              type="password"
              name="password"
              placeholder="Your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-accent py-3 font-semibold text-black transition hover:bg-accent-dim hover:shadow-glow-amber disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-gray-500 before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">
          or
        </div>

        <div className="flex justify-center">
          <GoogleButton type="dark" onClick={handleGoogle} disabled={loading} />
        </div>

        <p className="mt-6 text-center text-sm text-gray-400">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-accent transition hover:text-accent-dim"
          >
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}

function friendlyError(code) {
  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Popup was blocked. Please allow popups for this site.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export default Login;
