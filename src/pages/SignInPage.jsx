// client/src/pages/SignInPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const [showPassword, setShowPassword] = useState(false);

  // Sign In fields
  const [signinIdentifier, setSigninIdentifier] = useState('');
  const [signinPassword, setSigninPassword] = useState('');

  // Sign Up fields
  const [signupStage, setSignupStage] = useState(1);
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupOtp, setSignupOtp] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  // Forgot Password fields
  const [forgotStage, setForgotStage] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');

  const displayMessage = (text, isError = false) => {
    setMessage({ text, isError });
  };

  // 1. Sign In Submit
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

  // 2. Sign Up - Send OTP
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

  // 2. Sign Up - Create Account
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
      login(signupPhone.trim(), signupName.trim());
      showToast('Account created successfully!');
      navigate('/');
    } catch (err) {
      displayMessage(err.message || 'Error creating account.', true);
    } finally {
      setLoading(false);
    }
  };

  // 3. Forgot Password - Send Code
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

  // 3. Forgot Password - Verify Code
  const handleForgotVerifyOtp = async (e) => {
    e.preventDefault();
    if (!forgotOtp.trim()) {
      displayMessage('Please enter the verification code.', true);
      return;
    }
    setLoading(true);
    displayMessage('');
    try {
      await apiVerifyOtp(forgotEmail.trim(), forgotOtp.trim());
      displayMessage('Code verified. Set your new password.');
      setForgotStage(3);
    } catch (err) {
      displayMessage(err.message || 'Invalid or expired code.', true);
    } finally {
      setLoading(false);
    }
  };

  // 3. Forgot Password - Reset Password
  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
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
      await apiVerifyOtpAndReset({
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword
      });
      showToast('Password reset successfully! Please sign in.');
      setMode('signin');
      displayMessage('Password reset successfully! Please sign in.');
    } catch (err) {
      displayMessage(err.message || 'Failed to reset password.', true);
    } finally {
      setLoading(false);
    }
  };

  let formTitle = 'Welcome Back';
  let formDescription = 'Sign in to access your NexsusMarket account';
  let toggleText = "Don't have an account?";
  let toggleLinkText = 'Sign Up';

  if (mode === 'signup') {
    formTitle = 'Create Account';
    formDescription = 'Join the future of shopping today';
    toggleText = 'Already have an account?';
    toggleLinkText = 'Sign In';
  } else if (mode === 'forgot') {
    formTitle = 'Reset Password';
    formDescription = 'Recover your account access.';
    toggleText = 'Remembered it?';
    toggleLinkText = 'Sign In';
  }

  const handleToggle = (e) => {
    e.preventDefault();
    setMessage({ text: '', isError: false });
    if (mode === 'signin') {
      setMode('signup');
      setSignupStage(1);
    } else {
      setMode('signin');
      setForgotStage(1);
    }
  };

  return (
    <div className="signin-page-wrapper">
      <div className="signin-container">
        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <Link
            to="/"
            title="Back to Home"
            className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/20 text-purple-300 text-xl mb-2 border border-purple-500/30 hover:bg-purple-500/40 transition cursor-pointer"
          >
            <i className="fas fa-atom logo-spin"></i>
          </Link>
          <h2 id="form-title" className="text-2xl font-bold">
            {formTitle}
          </h2>
          <p id="form-description" className="text-xs text-gray-300 mt-1">
            {formDescription}
          </p>
        </div>

        {/* 1. Sign In Form */}
        {mode === 'signin' && (
          <form id="signin-form" className="space-y-4" onSubmit={handleSignInSubmit}>
            <div className="input-group">
              <input
                id="signin-identifier"
                type="text"
                required
                placeholder="Mobile Number or Email"
                value={signinIdentifier}
                onChange={(e) => setSigninIdentifier(e.target.value)}
              />
              <i className="fas fa-user input-icon"></i>
            </div>

            <div className="input-group">
              <input
                id="signin-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Password"
                value={signinPassword}
                onChange={(e) => setSigninPassword(e.target.value)}
              />
              <i className="fas fa-lock input-icon"></i>
              <i
                className={`fas ${showPassword ? 'fa-eye' : 'fa-eye-slash'} toggle-password-icon`}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>

            <div className="flex items-center justify-between text-xs">
              <a
                href="#"
                id="forgot-password-link-main"
                className="text-purple-300 hover:text-white transition"
                onClick={(e) => {
                  e.preventDefault();
                  setMode('forgot');
                  setForgotStage(1);
                  setMessage({ text: '', isError: false });
                }}
              >
                Forgot Password?
              </a>
            </div>

            <button type="submit" className="submit-btn w-full mt-2" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* 2. Sign Up Form */}
        {mode === 'signup' && (
          <form
            id="signup-form"
            className="space-y-4"
            onSubmit={signupStage === 1 ? handleSendSignupOtp : handleCreateAccount}
          >
            {signupStage === 1 ? (
              <div id="signup-details-stage" className="space-y-4">
                <div className="input-group">
                  <input
                    id="signup-name"
                    type="text"
                    required
                    placeholder="Full Name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                  />
                  <i className="fas fa-user input-icon"></i>
                </div>

                <div className="input-group">
                  <input
                    id="signup-phone"
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    maxLength="10"
                    placeholder="Mobile Number (10 digits)"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                  />
                  <i className="fas fa-phone input-icon"></i>
                </div>

                <div className="flex gap-2">
                  <div className="input-group flex-grow mb-0">
                    <input
                      id="signup-email"
                      type="email"
                      required
                      placeholder="Email Address"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                    />
                    <i className="fas fa-envelope input-icon"></i>
                  </div>
                </div>

                <button
                  type="button"
                  id="send-otp-btn"
                  onClick={handleSendSignupOtp}
                  disabled={loading}
                  className="w-full !bg-gray-800/80 hover:!bg-gray-700 !text-gray-100 !shadow-none border border-gray-500"
                >
                  {loading ? 'Sending Code...' : 'Send Code'}
                </button>
              </div>
            ) : (
              <div id="signup-verification-stage" className="space-y-4">
                <div className="p-2 bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs text-purple-100 text-center">
                  Code sent to your email
                </div>

                <div className="input-group">
                  <input
                    id="signup-otp"
                    type="text"
                    required
                    placeholder="Enter 6-Digit Code"
                    value={signupOtp}
                    onChange={(e) => setSignupOtp(e.target.value)}
                  />
                  <i className="fas fa-key input-icon"></i>
                </div>

                <div className="input-group">
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength="6"
                    placeholder="Create Password (min. 6 chars)"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                  <i className="fas fa-lock input-icon"></i>
                  <i
                    className={`fas ${showPassword ? 'fa-eye' : 'fa-eye-slash'} toggle-password-icon`}
                    onClick={() => setShowPassword(!showPassword)}
                  ></i>
                </div>

                <div>
                  <button type="submit" id="create-account-btn" className="w-full mt-2" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </div>
            )}
          </form>
        )}

        {/* 3. Forgot Password Form */}
        {mode === 'forgot' && (
          <form id="forgot-password-form" className="space-y-4">
            {forgotStage === 1 && (
              <div id="email-stage" className="space-y-4">
                <div className="input-group">
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    placeholder="Enter your registered email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                  <i className="fas fa-envelope input-icon"></i>
                </div>
                <button
                  type="button"
                  onClick={handleForgotRequestOtp}
                  disabled={loading}
                  className="w-full mt-2"
                >
                  {loading ? 'Sending...' : 'Send Reset Code'}
                </button>
              </div>
            )}

            {forgotStage === 2 && (
              <div id="otp-verification-stage" className="space-y-4">
                <div className="input-group">
                  <input
                    id="forgot-otp"
                    type="text"
                    required
                    placeholder="Enter 6-Digit Code"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                  />
                  <i className="fas fa-key input-icon"></i>
                </div>
                <button
                  type="button"
                  onClick={handleForgotVerifyOtp}
                  disabled={loading}
                  className="w-full mt-2"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>
            )}

            {forgotStage === 3 && (
              <div id="new-password-stage" className="space-y-4">
                <div className="input-group">
                  <input
                    id="forgot-new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength="6"
                    placeholder="New Password"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                  />
                  <i className="fas fa-lock input-icon"></i>
                  <i
                    className={`fas ${showPassword ? 'fa-eye' : 'fa-eye-slash'} toggle-password-icon`}
                    onClick={() => setShowPassword(!showPassword)}
                  ></i>
                </div>

                <div className="input-group">
                  <input
                    id="forgot-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Confirm New Password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  />
                  <i className="fas fa-check-circle input-icon"></i>
                  <i
                    className={`fas ${showPassword ? 'fa-eye' : 'fa-eye-slash'} toggle-password-icon`}
                    onClick={() => setShowPassword(!showPassword)}
                  ></i>
                </div>

                <button
                  type="button"
                  onClick={handleForgotResetPassword}
                  disabled={loading}
                  className="w-full mt-2"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            )}
          </form>
        )}

        {/* Message */}
        <div
          id="message"
          className={`text-center text-xs font-semibold min-h-[16px] mt-3 ${
            message.isError ? 'text-red-400' : 'text-purple-300'
          }`}
        >
          {message.text}
        </div>

        {/* Toggle Footer */}
        <div className="mt-6 pt-4 border-t border-gray-500/30 text-center">
          <p id="toggle-container" className="text-xs text-gray-300">
            <span id="signin-toggle-text">{toggleText}</span>
            <a
              href="#"
              id="toggle-link"
              onClick={handleToggle}
              className="font-bold text-purple-300 hover:text-white ml-1 underline decoration-2 underline-offset-4"
            >
              {toggleLinkText}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
