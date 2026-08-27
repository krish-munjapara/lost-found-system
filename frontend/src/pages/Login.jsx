/**
 * Guardian-Link — Login Page
 * Authentication page with branded visual panel.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Target, Users, Globe, ChevronDown, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

// Google Icon SVG component
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const Login = () => {
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [language, setLanguage] = useState('English');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { login, setPendingSignup, clearPendingSignup } = useAuth();
  const { isReady, setGoogleCallback, renderGoogleButton } = useGoogleAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authApi.login(email, password);
      login(data);
      if (data.role === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // Set up Google callback and render button
  useEffect(() => {
    if (!isReady) return;

    // Clear any stale pending signup state before new Google authentication
    clearPendingSignup();

    // Set the callback for this component
    setGoogleCallback(async (response) => {
      try {
        console.log('[GOOGLE] GIS callback received');
        if (!response || !response.credential) {
          throw new Error('Google credential not received');
        }
        console.log('[GOOGLE] Credential received');
        
        // response.credential is the Google ID token (JWT)
        console.log('[GOOGLE] Sending credential to backend');
        const data = await authApi.googleAuth(response.credential);
        console.log('[GOOGLE] Backend response received');
        console.log('[GOOGLE] Response type:', data.requires_profile_completion ? 'pending signup' : 'existing user');
        
        // Check if this is a pending signup (new Google user)
        if (data.requires_profile_completion) {
          console.log('[GOOGLE] New user - navigating to complete-profile');
          setPendingSignup(data);
          navigate('/complete-profile');
        } else {
          // Existing user - normal login
          console.log('[GOOGLE] Existing user - navigating to dashboard/admin');
          login(data);
          if (data.role === 'Admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        }
      } catch (err) {
        console.error('[GOOGLE] Error in callback:', err.message);
        setError(err.message || 'Google authentication failed');
        setGoogleLoading(false);
      }
    });

    // Render the Google button
    renderGoogleButton('google-signin-button-login');
  }, [isReady, setGoogleCallback, renderGoogleButton, navigate, login, setPendingSignup]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.lang-switch')) setLangDropdownOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Left Visual Panel */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-10 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle,rgba(59,130,246,0.15)_0%,transparent_70%)]" />
        <div className="relative z-10 text-center max-w-md">
          <div className="w-64 h-64 mx-auto mb-8 bg-blue-500/20 rounded-full flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.3)] animate-float">
            <Shield className="w-32 h-32 text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Reuniting Families with AI</h2>
          <p className="text-white/70 leading-relaxed mb-8">
            Guardian-Link uses intelligent matching to help identify and locate missing children faster than ever before.
          </p>
          <div className="flex flex-col gap-4 text-left">
            {[
              { icon: Shield, text: 'Secure & Encrypted Platform' },
              { icon: Target, text: 'AI-Powered Face Matching' },
              { icon: Users, text: 'Community-Driven Reports' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80 text-sm">
                <div className="w-9 h-9 rounded-md bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-blue-300" />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-[520px] flex flex-col justify-center items-center p-6 md:p-10 bg-slate-50 relative">
        {/* Language Switcher */}
        <div className="absolute top-6 right-6 z-50 lang-switch">
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-sm text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2"
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            aria-label="Toggle language selector"
            aria-expanded={langDropdownOpen}
          >
            <Globe className="w-4 h-4" /> {language} <ChevronDown className="w-3 h-3" />
          </button>
          {langDropdownOpen && (
            <div className="absolute top-full mt-2 right-0 min-w-[140px] bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden py-1">
              {['English', 'Hindi'].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  className="w-full px-3 py-2 text-sm text-slate-800 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                  onClick={() => { setLanguage(lang); setLangDropdownOpen(false); }}
                >
                  <span>{lang === 'English' ? '🇺🇸 English' : '🇮🇳 हिन्दी'}</span>
                  {language === lang && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Brand */}
        <div className="w-full max-w-[400px] flex flex-col items-start gap-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              Guardian-Link
              <span className="block text-xs font-normal text-slate-500">Child Safety System</span>
            </div>
          </div>

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[15px] font-medium text-slate-600 hover:text-blue-600 cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 rounded-md group"
            aria-label="Back to the home page"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
            Back to Home
          </Link>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-[400px] animate-fadeIn mt-7">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
          <p className="text-sm text-slate-500 mb-7">Enter your credentials to access your dashboard</p>

          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            {error && <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg border border-red-100">{error}</div>}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-900" htmlFor="login-email">Email Address</label>
              <input
                type="email" id="login-email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-3 border border-slate-200 rounded-lg text-sm bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 focus-visible:ring-4 focus-visible:ring-blue-500/20"
                placeholder="you@example.com" autoComplete="email" required
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-900" htmlFor="login-password">Password</label>
                <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 rounded-sm" aria-label="Recover your password">Forgot password?</Link>
              </div>
              <input
                type="password" id="login-password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-3 border border-slate-200 rounded-lg text-sm bg-white shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 focus-visible:ring-4 focus-visible:ring-blue-500/20"
                placeholder="••••••••" autoComplete="current-password" required
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full mt-2 py-3 px-6 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 text-white font-semibold text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 relative overflow-hidden group disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2"
            >
              <span className="relative z-10 flex items-center gap-2">
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </span>
              <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-150 rounded-full transition-transform duration-500 ease-out origin-center" />
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs text-slate-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          {/* Google Button Container */}
          <div id="google-signin-button-login" className="w-full flex justify-center"></div>

          <p className="text-center mt-6 text-sm text-slate-500">
            Don't have an account? <Link to="/register" className="text-blue-600 font-medium hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 rounded-sm">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
