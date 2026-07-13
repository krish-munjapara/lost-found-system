/**
 * Reset Password Page
 */

import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { authApi } from '../services/api';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      navigate('/login');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">
        <h1 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white"><Shield className="w-7 h-7 text-blue-600" /> Reset Password</h1>
        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="password" className="input-field w-full" placeholder="New password (min 8)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          <input type="password" className="input-field w-full" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <button type="submit" disabled={loading || !token} className="btn-primary w-full">Reset Password</button>
        </form>
        <p className="text-center mt-4 text-sm"><Link to="/login" className="text-blue-600">Back to login</Link></p>
      </div>
    </div>
  );
};

export default ResetPassword;
