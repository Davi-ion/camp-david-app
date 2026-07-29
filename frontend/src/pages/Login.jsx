import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const API = import.meta.env.VITE_API_URL || 'https://camp-david-app.onrender.com';

const BG_IMAGES = [
  '/bg1.jpg',
  '/bg2.jpg',
  '/bg3.jpeg',
  '/bg4.jpg',
  '/bg5.jpg',
  '/bg6.jpg',
  '/bg7.jpg',
  '/bg8.jpg',
];

export default function Login() {
  const { dispatch } = useApp();
  const navigate = useNavigate();

  const [currentBg, setCurrentBg] = useState(0);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // Force password change flow
  const [forceChange, setForceChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Cinematic background slideshow timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % BG_IMAGES.length);
    }, 5500);
    return () => clearInterval(interval);
  }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please enter your email/username and password');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        triggerShake();
        setLoading(false);
        return;
      }

      if (data.user.forcePasswordChange) {
        localStorage.setItem('camp_token', data.token);
        setForceChange(true);
        setLoading(false);
        return;
      }

      try {
        const campersRes = await fetch(`${API}/api/campers?status=active`, {
          headers: { 'Authorization': `Bearer ${data.token}` }
        });
        if (campersRes.ok) {
          const campersData = await campersRes.json();
          dispatch({ type: 'SET_CAMPERS', payload: campersData.campers || [] });
        }
      } catch (err) {
        console.error('Failed to fetch campers on login', err);
      }

      dispatch({ type: 'LOGIN', payload: data });
      navigate('/');
    } catch {
      setError('Could not connect to server. Please try again.');
      triggerShake();
      setLoading(false);
    }
  };

  const handleForceChange = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('camp_token');
      const res = await fetch(`${API}/api/auth/force-change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to update password');
        triggerShake();
        setLoading(false);
        return;
      }

      dispatch({ type: 'LOGIN', payload: data });
      navigate('/');
    } catch {
      setError('Could not connect to server.');
      triggerShake();
      setLoading(false);
    }
  };

  return (
    <div className="login-cinema-container">
      {/* Cinematic Background Crossfade Slideshow */}
      <div className="cinema-bg-stack">
        {BG_IMAGES.map((imgSrc, idx) => (
          <div
            key={imgSrc}
            className={`cinema-bg-slide ${idx === currentBg ? 'active' : ''}`}
            style={{ backgroundImage: `url(${imgSrc})` }}
          />
        ))}
      </div>

      {/* Lush Green Overlay */}
      <div className="cinema-green-overlay" />

      {/* Header Navigation Bar */}
      <header className="cinema-header">
        <div className="cinema-brand-wrap">
          <img src="/logo-white.png" alt="Camp David Logo" className="cinema-logo-img" />
        </div>
      </header>

      {/* Main Split Body: Hero Text Left + Login Card Right */}
      <main className="cinema-main">
        {/* Left Hero Section */}
        <div className="cinema-hero-content">
          <div className="cinema-eyebrow">
            <span className="cinema-eyebrow-line" />
            <span className="cinema-eyebrow-text">WELCOME TO CAMP DAVID</span>
          </div>

          <h1 className="cinema-title">
            <span className="cinema-title-white">Timeless</span>
            <span className="cinema-title-white">Global</span>
            <span className="cinema-title-peach">Teens</span>
            <span className="cinema-title-peach">Experience.</span>
          </h1>

          <p className="cinema-subtitle">
            A non-denominational gathering of teenagers from around the world for an experience of a lifetime.
          </p>

          <div className="cinema-date-badge">
            Camp David 2026 · 29 July 2026 – 2 August 2026
          </div>

          {/* Carousel Dots Indicator */}
          <div className="cinema-dots">
            {BG_IMAGES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`cinema-dot ${idx === currentBg ? 'active' : ''}`}
                onClick={() => setCurrentBg(idx)}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Right Floating Glassmorphism Login Card */}
        <div className="cinema-login-wrap">
          <div 
            className="cinema-login-card"
            style={shake ? { animation: 'shake 0.4s ease' } : {}}
          >
            <div className="cinema-card-header">
              <img src="/logo-white.png" alt="Logo" className="cinema-card-logo" />
              <h2 className="cinema-card-title">
                {forceChange ? 'Set New Password' : 'Staff Sign In'}
              </h2>
              <p className="cinema-card-sub">
                {forceChange 
                  ? 'Update your password for first-time login'
                  : "Enter your David's Army credentials to access portal"}
              </p>
            </div>

            {error && (
              <div className="cinema-error-alert">
                {error}
              </div>
            )}

            {!forceChange ? (
              <form onSubmit={handleLogin} className="cinema-form">
                <div className="form-group">
                  <label className="cinema-label">Email or Username</label>
                  <input
                    type="text"
                    className="form-control cinema-input"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@campdavid.org or username"
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="cinema-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control cinema-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      disabled={loading}
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      className="cinema-toggle-pw"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className="cinema-form-options">
                  <label className="cinema-checkbox-label">
                    <input type="checkbox" className="cinema-checkbox" />
                    <span>Remember Me</span>
                  </label>
                  <Link to="/forgot-password" className="cinema-forgot-link">
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="cinema-submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Signing in…' : 'SIGN IN'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleForceChange} className="cinema-form">
                <p className="cinema-force-notice">
                  Welcome! For security reasons, you must set a new password before continuing.
                </p>

                <div className="form-group">
                  <label className="cinema-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control cinema-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      disabled={loading}
                      autoFocus
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      className="cinema-toggle-pw"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="cinema-submit-btn"
                  disabled={loading}
                >
                  {loading ? 'Updating…' : 'SAVE & CONTINUE'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
