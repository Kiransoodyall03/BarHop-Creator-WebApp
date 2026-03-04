import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Auth.css';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match.');
    }

    try {
      // TODO: wire up Firebase Auth
      // const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      console.log('Register submitted:', formData);
      navigate('/login');
    } catch (err) {
      setError(err.message);
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
              <input
                className="form__input"
                type="text"
                name="firstName"
                placeholder="Jane"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form__group">
              <label className="form__label">Last Name</label>
              <input
                className="form__input"
                type="text"
                name="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

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
              placeholder="Min. 8 characters"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form__group">
            <label className="form__label">Confirm Password</label>
            <input
              className="form__input"
              type="password"
              name="confirmPassword"
              placeholder="Repeat your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="auth__submit">
            Create Account
          </button>
        </form>

        <p className="auth__footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;