import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GoogleButton from 'react-google-button';
import { loginWithEmail, loginWithGoogle } from '../firebase/authService';
import { createUserDocument } from '../firebase/userService';
import { useError } from '../context/ErrorContext';
import {
  AUTH_RINGS,
  Band,
  CARD_LAYERS,
  FIELD,
  FIELD_LABEL,
  GradientLine,
  MarketingNav,
  MarketingPage,
  OrDivider,
  OrbitRings,
  SectionCopy,
  SlabCard,
  marketingButton,
} from '../components/ui/Marketing';

// Public sign-in. Built from the Landing page's kit: white nav and footer
// bracketing a dark band, copy on the left behind gradient orbit rings,
// and the form on a white slab card stacked over offset colour slabs —
// the same construction Landing uses for its product screenshots.

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
    <MarketingPage
      // Already on /login, so the nav drops its Login entry.
      nav={<MarketingNav links={[]} cta={{ label: 'Get Started', to: '/register' }} />}
    >
      <Band
        tone="dark"
        copy={
          <SectionCopy
            as="h1"
            tone="dark"
            variant="warm"
            heading={
              <>
                Welcome Back to
                <br />
                <GradientLine variant="warm">Your Night Shift</GradientLine>
              </>
            }
          >
            Sign in to your creator account to publish venue cards, read your
            live swipe analytics, and manage tonight&rsquo;s guestlist.
          </SectionCopy>
        }
        visual={
          <>
            <OrbitRings rings={AUTH_RINGS.column} />
            <div className="relative mx-auto w-full max-w-[440px]">
              <SlabCard layers={CARD_LAYERS.warm}>
                <h2 className="font-display text-2xl font-bold text-black">
                  Sign In
                </h2>
                <p className="mt-1 font-mono text-sm text-brand-muted">
                  Verified venue owners only.
                </p>

                <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-1.5">
                    <label className={FIELD_LABEL} htmlFor="login-email">
                      Email
                    </label>
                    <input
                      id="login-email"
                      className={FIELD}
                      type="email"
                      name="email"
                      placeholder="jane@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className={FIELD_LABEL} htmlFor="login-password">
                      Password
                    </label>
                    <input
                      id="login-password"
                      className={FIELD}
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
                    className={marketingButton('warm', 'lg', 'mt-2 w-full')}
                    disabled={loading}
                  >
                    {loading ? 'Signing in…' : 'Sign In'}
                  </button>
                </form>

                <div className="my-6">
                  <OrDivider />
                </div>

                <div className="flex justify-center">
                  <GoogleButton
                    type="light"
                    onClick={handleGoogle}
                    disabled={loading}
                  />
                </div>

                <p className="mt-6 text-center font-mono text-sm text-brand-muted">
                  Don&apos;t have an account?{' '}
                  <Link
                    to="/register"
                    className="font-display font-bold text-brand-pink hover:underline"
                  >
                    Sign up free
                  </Link>
                </p>
              </SlabCard>
            </div>
          </>
        }
      />
    </MarketingPage>
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
