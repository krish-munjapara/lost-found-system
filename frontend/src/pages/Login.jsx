/**
 * Guardian-Link — Login Page
 * Authentication page with branded visual panel.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Target, Users, Globe, ChevronDown, Check, ArrowRight } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [language, setLanguage] = useState('English');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

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
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-sm text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
          >
            <Globe className="w-4 h-4" /> {language} <ChevronDown className="w-3 h-3" />
          </button>
          {langDropdownOpen && (
            <div className="absolute top-full mt-2 right-0 min-w-[140px] bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden py-1">
              {['English', 'Hindi'].map((lang) => (
                <div
                  key={lang}
                  className="px-3 py-2 text-sm text-slate-800 hover:bg-slate-50 cursor-pointer flex justify-between"
                  onClick={() => { setLanguage(lang); setLangDropdownOpen(false); }}
                >
                  <span>{lang === 'English' ? '🇺🇸 English' : '🇮🇳 हिन्दी'}</span>
                  {language === lang && <Check className="w-4 h-4 text-blue-600" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Brand */}
        <div className="flex items-center gap-3 mb-10 w-full max-w-[400px]">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="text-lg font-bold text-slate-900 leading-tight">
            Guardian-Link
            <span className="block text-xs font-normal text-slate-500">Child Safety System</span>
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-[400px] animate-fadeIn">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
          <p className="text-sm text-slate-500 mb-8">Enter your credentials to access your dashboard</p>

          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            {error && <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg border border-red-100">{error}</div>}

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-900" htmlFor="login-email">Email Address</label>
              <input
                type="email" id="login-email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-3 border border-slate-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                placeholder="you@example.com" required
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-900" htmlFor="login-password">Password</label>
                <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">Forgot password?</Link>
              </div>
              <input
                type="password" id="login-password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-3 border border-slate-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                placeholder="••••••••" required
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full mt-2 py-3 px-6 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 relative overflow-hidden group disabled:opacity-50"
            >
              <span className="relative z-10 flex items-center gap-2">
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </span>
              <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-150 rounded-full transition-transform duration-500 ease-out origin-center" />
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-slate-500">
            Don't have an account? <Link to="/register" className="text-blue-600 font-medium hover:text-blue-700 hover:underline">Create one</Link>
          </p>

          <div className="text-center mt-4 pt-4 border-t border-slate-200">
            <Link to="/public-feed" className="text-sm text-slate-500 hover:text-blue-600 flex items-center justify-center gap-1.5 transition-colors">
              <Globe className="w-4 h-4" />
              View Public Alert Feed
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
