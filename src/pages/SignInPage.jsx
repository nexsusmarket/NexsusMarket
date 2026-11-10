// client/src/pages/SignInPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  signIn as apiSignIn, 
  sendSignupOtp as apiSendSignupOtp, 
  createAccount as apiCreateAccount,
  requestPasswordReset as apiRequestPasswordReset,
  verifyOtp as apiVerifyOtp,
  verifyOtpAndReset as apiVerifyOtpAndReset
} from '../api/apiService';

export default function SignInPage() {
  const { login, showToast } = useAuth();
  const navigate = useNavigate();

  // Mode: 'signin' | 'signup' | 'forgot'
  const [mode, setMode] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', isError: false });

  // Sign In fields
  const [signinIdentifier, setSigninIdentifier] = useState('');
  const [signinPassword, setSigninPassword] = useState('');

  // Sign Up fields
  const [signupStage, setSignupStage] = useState(1); // 1: details, 2: otp & password
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupOtp, setSignupOtp] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Forgot Password fields
  const [forgotStage, setForgotStage] = useState(1); // 1: email, 2: otp, 3: new pass
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');

  const displayMessage = (text, isError = false) => {
    setMessage({ text, isError });
  };

  // 1. Handle Sign In
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    if (!signinIdentifier || !signinPassword) {
      displayMessage('Please enter your mobile/email and password.', true);
      return;
    }
    setLoading(true);
    displayMessage('');
    try {
      const data = await apiSignIn({ identifier: signinIdentifier, password: signinPassword });
      login(data.token, data.name);
      showToast('Welcome back! Login successful.');
      navigate('/');
    } catch (err) {
      displayMessage(err.message || 'Login failed. Please check your credentials.', true);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Sign Up - Step 1: Send OTP
  const handleSendSignupOtp = async (e) => {
    e.preventDefault();
    if (!signupName.trim() || !signupPhone.trim() || !signupEmail.trim()) {
      displayMessage('Please fill all fields.', true);
      return;
    }
    if (!/^\d{10}$/.test(signupPhone.trim())) {
      displayMessage('Please enter a valid 10-digit mobile number.', true);
      return;
    }
    setLoading(true);
    displayMessage('');
    try {
      const data = await apiSendSignupOtp({
        name: signupName.trim(),
        phone: signupPhone.trim(),
        email: signupEmail.trim()
      });
      displayMessage(data.message || 'Verification code sent to your email.');
      setSignupStage(2);
    } catch (err) {
      displayMessage(err.message || 'Error sending code.', true);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Sign Up - Step 2: Verify & Create
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!signupOtp.trim() || !signupPassword) {
      displayMessage('Please enter the verification code and password.', true);
      return;
    }
    if (signupPassword.length < 6) {
      displayMessage('Password must be at least 6 characters long.', true);
      return;
    }
    setLoading(true);
    displayMessage('');
    try {
      await apiCreateAccount({
        name: signupName.trim(),
        phone: signupPhone.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        otp: signupOtp.trim()
      });
      // Auto login with phone as token
      login(signupPhone.trim(), signupName.trim());
      showToast('Account created successfully! Welcome to NexsusMarket.');
      navigate('/');
    } catch (err) {
      displayMessage(err.message || 'Error creating account.', true);
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Forgot Password - Stage 1
  const handleForgotRequestOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      displayMessage('Please enter your email address.', true);
      return;
    }
    setLoading(true);
    displayMessage('');
    try {
      const data = await apiRequestPasswordReset(forgotEmail.trim());
      displayMessage(data.message || 'Verification code sent.');
      setForgotStage(2);
    } catch (err) {
      displayMessage(err.message || 'Failed to send reset code.', true);
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Forgot Password - Stage 2
  const handleForgotVerifyOtp = async (e) => {
    e.preventDefault();
    if (!forgotOtp.trim()) {
      displayMessage('Please enter the OTP.', true);
      return;
    }
    setLoading(true);
    displayMessage('');
    try {
      const data = await apiVerifyOtp(forgotEmail.trim(), forgotOtp.trim());
      displayMessage(data.message || 'OTP verified. Set new password.');
      setForgotStage(3);
    } catch (err) {
      displayMessage(err.message || 'Incorrect verification code.', true);
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Forgot Password - Stage 3
  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    if (forgotNewPassword.length < 6) {
      displayMessage('Password must be at least 6 characters.', true);
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      displayMessage('Passwords do not match.', true);
      return;
    }
    setLoading(true);
    displayMessage('');
    try {
      const data = await apiVerifyOtpAndReset({
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword
      });
      showToast(data.message || 'Password reset successfully! Please sign in.');
      setMode('signin');
      setForgotStage(1);
    } catch (err) {
      displayMessage(err.message || 'Error resetting password.', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl text-white">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-2xl font-black tracking-tight text-white hover:opacity-90 transition mb-2">
            <i className="fas fa-atom text-3xl text-cyan-400 logo-spin"></i>
            <span className="bg-gradient-to-r from-white via-indigo-200 to-yellow-300 bg-clip-text text-transparent">
              NexsusMarket
            </span>
          </Link>
          <h2 className="text-xl font-bold mt-2">
            {mode === 'signin' && 'Sign In to Your Account'}
            {mode === 'signup' && 'Create Your Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-gray-300 text-xs mt-1">
            {mode === 'signin' && 'Enter your credentials to continue shopping'}
            {mode === 'signup' && 'Join thousands of smart shoppers today'}
            {mode === 'forgot' && 'Recover access to your account'}
          </p>
        </div>

        {/* Global Feedback Message */}
        {message.text && (
          <div className={`p-3 rounded-xl mb-6 text-sm font-medium ${
            message.isError 
              ? 'bg-red-500/20 border border-red-500/40 text-red-200' 
              : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-200'
          }`}>
            <i className={`fas ${message.isError ? 'fa-exclamation-triangle' : 'fa-check-circle'} mr-2`}></i>
            {message.text}
          </div>
        )}

        {/* MODE 1: SIGN IN */}
        {mode === 'signin' && (
          <form onSubmit={handleSignInSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">
                Phone Number or Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <i className="fas fa-user text-sm"></i>
                </span>
                <input
                  type="text"
                  value={signinIdentifier}
                  onChange={(e) => setSigninIdentifier(e.target.value)}
                  placeholder="9876543210 or user@example.com"
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-gray-300 uppercase">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setMessage({ text: '', isError: false });
                  }}
                  className="text-xs text-yellow-300 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <i className="fas fa-lock text-sm"></i>
                </span>
                <input
                  type="password"
                  value={signinPassword}
                  onChange={(e) => setSigninPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition duration-200 mt-2 flex items-center justify-center"
            >
              {loading ? (
                <i className="fas fa-spinner fa-spin mr-2"></i>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        )}

        {/* MODE 2: SIGN UP */}
        {mode === 'signup' && (
          <div>
            {signupStage === 1 ? (
              <form onSubmit={handleSendSignupOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Mobile Number (10 digits)</label>
                  <input
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition duration-200 mt-2 flex items-center justify-center"
                >
                  {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : 'Send Verification Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Verification Code (OTP)</label>
                  <input
                    type="text"
                    value={signupOtp}
                    onChange={(e) => setSignupOtp(e.target.value)}
                    placeholder="6-digit code"
                    maxLength={6}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 tracking-widest text-center font-bold text-lg"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Sent to {signupEmail}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Create Password</label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg transition duration-200 mt-2 flex items-center justify-center"
                >
                  {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : 'Verify & Create Account'}
                </button>

                <button
                  type="button"
                  onClick={() => setSignupStage(1)}
                  className="w-full text-center text-xs text-gray-400 hover:text-white underline mt-2"
                >
                  Back to edit details
                </button>
              </form>
            )}
          </div>
        )}

        {/* MODE 3: FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <div>
            {forgotStage === 1 && (
              <form onSubmit={handleForgotRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Your Registered Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition duration-200 mt-2 flex items-center justify-center"
                >
                  {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : 'Send Reset Code'}
                </button>
              </form>
            )}

            {forgotStage === 2 && (
              <form onSubmit={handleForgotVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Enter Reset OTP</label>
                  <input
                    type="text"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="6-digit code"
                    maxLength={6}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 tracking-widest text-center font-bold text-lg"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition duration-200 mt-2 flex items-center justify-center"
                >
                  {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : 'Verify Code'}
                </button>
              </form>
            )}

            {forgotStage === 3 && (
              <form onSubmit={handleForgotResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">New Password</label>
                  <input
                    type="password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 uppercase mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg transition duration-200 mt-2 flex items-center justify-center"
                >
                  {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : 'Reset Password'}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setMessage({ text: '', isError: false });
              }}
              className="w-full text-center text-xs text-yellow-300 hover:underline mt-4"
            >
              Back to Sign In
            </button>
          </div>
        )}

        {/* Mode Switch Footer */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-gray-300">
          {mode === 'signin' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setSignupStage(1);
                  setMessage({ text: '', isError: false });
                }}
                className="font-bold text-yellow-300 hover:underline"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setMessage({ text: '', isError: false });
                }}
                className="font-bold text-yellow-300 hover:underline"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

