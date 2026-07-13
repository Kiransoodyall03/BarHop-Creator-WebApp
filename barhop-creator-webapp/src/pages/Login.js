import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GoogleButton from 'react-google-button';
import { loginWithEmail, loginWithGoogle } from '../firebase/authService';
import { createUserDocument } from '../firebase/userService';
import { useError } from '../context/ErrorContext';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/ui/Button';
import { Label, Input } from '../components/ui/Field';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { showError, showSuccess } = useError();
  const { resolvedTheme } = useTheme();

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-4 py-12">
      <div className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-80" />

      <div className="relative w-full max-w-md rounded-2xl border border-edge bg-surface-raised p-8 shadow-card">
        <Link
          to="/"
          className="font-display text-3xl font-bold tracking-tight text-content"
        >
          BarHop
        </Link>
        <h1 className="mt-4 font-display text-2xl font-bold text-content">
          Welcome Back
        </h1>
        <p className="mt-1 text-sm text-content-muted">
          Sign in to your creator account
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label className="mb-0">Email</Label>
            <Input
              className="text-sm"
              type="email"
              name="email"
              placeholder="jane@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="mb-0">Password</Label>
            <Input
              className="text-sm"
              type="password"
              name="password"
              placeholder="Your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <Button
            type="submit"
            className="mt-2 w-full py-3"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-content-faint before:h-px before:flex-1 before:bg-edge after:h-px after:flex-1 after:bg-edge">
          or
        </div>

        <div className="flex justify-center">
          <GoogleButton
            type={resolvedTheme}
            onClick={handleGoogle}
            disabled={loading}
          />
        </div>

        <p className="mt-6 text-center text-sm text-content-muted">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-primary transition-colors hover:text-primary-hover"
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
