/**
 * Email Verification Page
 */

import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle } from 'lucide-react';
import { authApi } from '../services/api';

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Invalid verification link'); return; }
    authApi.verifyEmail(token)
      .then((data) => { setStatus('success'); setMessage(data.message); localStorage.setItem('email_verified', 'true'); })
      .catch((err) => { setStatus('error'); setMessage(err.message); });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="text-center max-w-md">
        {status === 'loading' && <p className="text-slate-500">Verifying your email...</p>}
        {status === 'success' && <><CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" /><p className="text-green-700">{message}</p></>}
        {status === 'error' && <><XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" /><p className="text-red-600">{message}</p></>}
        <Link to="/login" className="inline-block mt-6 text-blue-600">Go to Login</Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
