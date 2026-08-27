/**
 * Guardian-Link — Complete Profile Page
 * For new Google users to complete their profile information with inline mobile OTP verification.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, MapPin, Search, Globe, User, Mail, Phone, Map, CheckCircle, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { userApi, authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { user, profileComplete, applyUser, pendingProfileCompletion, pendingToken, pendingGoogleData, login, clearPendingSignup } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // OTP-related state
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendDisabled, setResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(60);

  // Redirect if profile is already complete
  useEffect(() => {
    if (profileComplete) {
      navigate('/dashboard');
    }
  }, [profileComplete, navigate]);

  // Load user data (for existing incomplete users)
  useEffect(() => {
    if (user && !pendingProfileCompletion) {
      setFullName(user.full_name || user.name || '');
      setEmail(user.email || '');
      setMobile(user.mobile || '');
      setGender(user.gender || 'Other');
      setAddress(user.address || '');
    }
  }, [user, pendingProfileCompletion]);

  // Load pending Google data (for new Google users)
  useEffect(() => {
    if (pendingProfileCompletion && pendingGoogleData) {
      setFullName(pendingGoogleData.google_name || '');
      setEmail(pendingGoogleData.google_email || '');
    }
  }, [pendingProfileCompletion, pendingGoogleData]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0 && otpSent && !otpVerified) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setResendDisabled(false);
    }
  }, [countdown, otpSent, otpVerified]);

  const isValidMobile = (mobile) => mobile && mobile.length >= 10;

  const handleSendOTP = async () => {
    if (!isValidMobile(mobile)) {
      setOtpError('Please enter a valid mobile number (at least 10 digits)');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      await authApi.sendOTP(mobile, 'profile_completion');
      setOtpSent(true);
      setCountdown(60);
      setResendDisabled(true);
      setOtpError('');
    } catch (err) {
      setOtpError(err.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setOtpError('Please enter the complete 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    setOtpError('');

    try {
      // For pending Google signups, include pending_token
      if (pendingProfileCompletion && pendingToken) {
        await authApi.verifyOTP(mobile, otp, pendingToken);
      } else {
        await authApi.verifyOTP(mobile, otp);
      }
      setOtpVerified(true);
      setOtpError('');
    } catch (err) {
      setOtpError(err.message || 'Invalid or expired OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!isValidMobile(mobile)) {
      setError('Please enter a valid mobile number (at least 10 digits)');
      return;
    }
    if (!otpVerified) {
      setError('Please verify your mobile number with OTP');
      return;
    }
    if (!gender || !['Male', 'Female', 'Other'].includes(gender)) {
      setError('Please select a valid gender');
      return;
    }
    if (!address || address.length < 3) {
      setError('Please enter a valid address (at least 3 characters)');
      return;
    }

    setLoading(true);

    try {
      if (pendingProfileCompletion && pendingToken) {
        // New Google user - call complete-google-profile endpoint
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/complete-google-profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pending_token: pendingToken,
            mobile,
            gender,
            address,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to complete profile');
        }
        
        const tokenData = await response.json();
        
        // Clear pending signup state
        clearPendingSignup();
        
        // Login with the new JWT tokens
        login(tokenData);
        
        setSuccess(true);
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        // Existing incomplete user - use normal profile update
        await userApi.updateProfile({
          mobile,
          gender,
          address,
          profile_complete: true,
          mobile_verified: true,
        });
        
        // Refresh user data using existing authApi.getMe
        const data = await authApi.getMe();
        if (data?.user) {
          applyUser(data.user);
        }
        
        setSuccess(true);
        
        // Redirect to dashboard after short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to complete profile');
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

  const canSubmit = isValidMobile(mobile) && otpVerified && gender && ['Male', 'Female', 'Other'].includes(gender) && address && address.length >= 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-12 flex-col justify-center items-center text-white">
        <div className="max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-12 h-12" />
            <h1 className="text-4xl font-bold">Guardian-Link</h1>
          </div>
          <p className="text-xl mb-8 text-blue-100">
            Complete your profile to continue using Guardian-Link and help reunite missing children with their families.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6" />
              <span>Track missing children across locations</span>
            </div>
            <div className="flex items-center gap-3">
              <Search className="w-6 h-6" />
              <span>AI-powered facial recognition matching</span>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6" />
              <span>Global community reporting network</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Complete Your Profile</h2>
              <p className="text-gray-600">Please provide a few more details to get started</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name - Read-only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* Email - Read-only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed pr-10"
                  />
                  <CheckCircle className="w-5 h-5 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Verified by Google
                </p>
              </div>

              {/* Mobile - Required with inline OTP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => {
                      setMobile(e.target.value);
                      // Reset OTP state if mobile changes
                      if (otpSent && e.target.value !== mobile) {
                        setOtpSent(false);
                        setOtpVerified(false);
                        setOtp('');
                        setOtpError('');
                      }
                    }}
                    placeholder="Enter your mobile number"
                    className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition ${
                      otpVerified 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    disabled={otpVerified}
                    required
                  />
                  {!otpVerified && isValidMobile(mobile) && !otpSent && (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={otpLoading}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition flex items-center gap-2 whitespace-nowrap"
                    >
                      {otpLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send OTP'
                      )}
                    </button>
                  )}
                  {otpVerified && (
                    <div className="px-4 py-3 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Verified
                    </div>
                  )}
                </div>

                {/* OTP Input Section */}
                {otpSent && !otpVerified && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      <span>OTP sent to {formatMobile(mobile)}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => {
                          if (/^\d*$/.test(e.target.value)) {
                            setOtp(e.target.value);
                            setOtpError('');
                          }
                        }}
                        placeholder="Enter 6-digit OTP"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOTP}
                        disabled={otpLoading || otp.length !== 6}
                        className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition flex items-center gap-2 whitespace-nowrap"
                      >
                        {otpLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Verify'
                        )}
                      </button>
                    </div>

                    {/* Resend Section */}
                    <div className="flex items-center justify-between text-sm">
                      {resendDisabled ? (
                        <div className="flex items-center gap-2 text-gray-500">
                          <Clock className="w-4 h-4" />
                          Resend OTP in {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOTP}
                          disabled={otpLoading}
                          className="text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed transition"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* OTP Error */}
                {otpError && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {otpError}
                  </div>
                )}
              </div>

              {/* Gender - Required */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Address - Required */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Map className="w-4 h-4" />
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your address"
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Complete Profile'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
