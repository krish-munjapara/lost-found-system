/**
 * Guardian-Link — OTP Verification Component
 * Production-quality mobile OTP verification UI.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Shield, Phone, Clock, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const OTPVerification = ({ mobile, purpose = 'registration', onSuccess, onCancel }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [countdown]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

    // Clear error when user types
    if (error) setError('');
  };

  const handleKeyDown = (index, e) => {
    // Backspace to go to previous input
    if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      if (i < 6) {
        newOtp[i] = pastedData[i];
      }
    }
    setOtp(newOtp);

    // Focus the last filled input
    const lastIndex = Math.min(pastedData.length, 6) - 1;
    if (inputRefs.current[lastIndex]) {
      inputRefs.current[lastIndex].focus();
    }
  };

  const handleResend = async () => {
    if (resendDisabled) return;

    setLoading(true);
    setError('');

    try {
      const { authApi } = await import('../services/api');
      await authApi.sendOTP(mobile, purpose);
      
      // Reset countdown
      setCountdown(60);
      setResendDisabled(true);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { authApi } = await import('../services/api');
      await authApi.verifyOTP(mobile, otpValue);
      
      setSuccess(true);
      
      // Call success callback after short delay
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const formatMobile = (mobile) => {
    if (mobile.length === 10) {
      return `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`;
    }
    return mobile;
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Mobile Verified!</h2>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Mobile Verification</h2>
          <p className="text-gray-600 text-sm">
            We've sent a 6-digit verification code to
          </p>
          <p className="text-gray-800 font-semibold mt-1 flex items-center justify-center gap-2">
            <Phone className="w-4 h-4" />
            {formatMobile(mobile)}
          </p>
        </div>

        {/* OTP Input */}
        <div className="mb-6">
          <div className="flex gap-2 justify-center">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={loading}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={loading || otp.join('').length !== 6}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify Mobile'
          )}
        </button>

        {/* Resend Section */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm mb-2">Didn't receive the code?</p>
          {resendDisabled ? (
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <Clock className="w-4 h-4" />
              Resend OTP in {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
            </div>
          ) : (
            <button
              onClick={handleResend}
              disabled={loading}
              className="text-blue-600 hover:text-blue-700 font-semibold text-sm disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Resend OTP
            </button>
          )}
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={loading}
            className="mt-4 w-full text-gray-600 hover:text-gray-800 text-sm disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default OTPVerification;
