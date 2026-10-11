import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { NIGERIAN_STATES } from '../../data/nigeriaStates.ts';
import { NigerianFlag } from '../common/NigerianFlag.tsx';
import { X, ShieldCheck, Mail, Lock, User, MapPin, CheckCircle2, AlertCircle, ArrowRight, Heart } from 'lucide-react';
import { apiFetch, extractErrorMessage } from '../../lib/api.ts';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    authModalMode,
    lastVerificationCode,
    closeAuthModal,
    openLogin,
    openRegister,
    login,
    register,
    verifyEmail,
    resendCode,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'verify' | 'forgot'>(authModalMode);

  // Sync with context mode
  React.useEffect(() => {
    setMode(authModalMode);
  }, [authModalMode]);

  // Login form
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState<number>(24);
  const [state, setState] = useState<string>('Lagos');
  const [city, setCity] = useState<string>('Ikeja');

  // Verify form
  const [verificationCode, setVerificationCode] = useState(lastVerificationCode || '');

  // Forgot password form
  const [forgotEmail, setForgotEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);

  // Status & errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!loginIdentifier.trim() || !loginPassword) {
      setError('Please provide your email/username and password.');
      return;
    }

    setLoading(true);
    try {
      await login(loginIdentifier.trim(), loginPassword);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Login failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanName = name.trim();
    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanCity = city.trim();

    if (!cleanName) {
      setError('Please enter your full name.');
      return;
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      setError('Username must be at least 3 characters long.');
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
      setError('Username must be 3-30 characters and contain only letters, numbers, and underscores.');
      return;
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address (e.g. name@domain.ng).');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (isNaN(Number(age)) || Number(age) < 18) {
      setError('You must be at least 18 years old to join NaijaMatch.');
      return;
    }

    if (!cleanCity) {
      setError('Please enter your city or area.');
      return;
    }

    setLoading(true);
    try {
      const code = await register({
        name: cleanName,
        username: cleanUsername,
        email: cleanEmail,
        password,
        age: Number(age),
        state,
        city: cleanCity,
      });
      if (code) {
        setVerificationCode(code);
      }
      setMode('verify');
      setSuccessMsg('Registration successful! Please confirm your 6-digit email code.');
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Registration failed. Please check your details and try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyEmail(verificationCode.trim());
      closeAuthModal();
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Verification failed. Please check code.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    try {
      const newCode = await resendCode();
      if (newCode) setVerificationCode(newCode);
      setSuccessMsg(`New verification code generated: ${newCode}`);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Could not resend code. Please try again.'));
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ recoveryCode: string; message: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail }),
      });
      setRecoveryCode(res.recoveryCode);
      setForgotStep(2);
      setSuccessMsg(`Recovery code generated: ${res.recoveryCode}`);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Error requesting password reset.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: forgotEmail, code: recoveryCode, newPassword }),
      });
      setSuccessMsg('Password reset successful! Please log in with your new password.');
      setMode('login');
      setLoginIdentifier(forgotEmail);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Error resetting password.'));
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = async (identifier: string, pass: string) => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await login(identifier, pass);
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Sign in failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden my-6">
        
        {/* Top Flag Banner & Header */}
        <div className="bg-[#008751] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Prominent Nigerian Flag Component */}
            <div className="w-10 h-7 overflow-hidden rounded-md border border-white/40 shadow-xs">
              <NigerianFlag aspectRatio="3:2" shadow={false} rounded={false} border={false} />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight flex items-center gap-1.5">
                <span>NAIJAMATCH</span>
                <Heart className="w-3.5 h-3.5 text-rose-300 fill-rose-300" />
              </h2>
              <p className="text-[11px] text-emerald-100 font-medium">Find Love. Find Your Person.</p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher if login or register */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-3 text-center transition-colors border-b-2 ${
                mode === 'login'
                  ? 'border-[#008751] text-[#008751] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-3 text-center transition-colors border-b-2 ${
                mode === 'register'
                  ? 'border-[#008751] text-[#008751] bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Free Account (18+)
            </button>
          </div>
        )}

        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#008751]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ================= LOGIN ================= */}
          {mode === 'login' && (
            <div>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address or Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. chioma@example.ng or chioma_tech"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#008751] focus:ring-1 focus:ring-[#008751]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(null); }}
                      className="text-xs text-[#008751] hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#008751] focus:ring-1 focus:ring-[#008751]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-[#008751] text-white font-bold text-sm hover:bg-[#007043] transition disabled:opacity-50 shadow-xs flex items-center justify-center gap-2"
                >
                  {loading ? 'Authenticating...' : 'Sign In to NaijaMatch'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Verified One-Click Access for Testing */}
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  Verified Accounts for Quick Testing
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => quickDemoLogin('admin@naijaconnect.ng', 'NaijaAdmin2026!')}
                    className="p-2 text-left rounded-lg border border-slate-200 hover:border-[#008751] hover:bg-emerald-50/40 transition text-xs"
                  >
                    <div className="font-bold text-slate-900 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#008751]" />
                      Safety Admin
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">admin@naijaconnect.ng</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => quickDemoLogin('chioma@example.ng', 'Naija2026!')}
                    className="p-2 text-left rounded-lg border border-slate-200 hover:border-[#008751] hover:bg-emerald-50/40 transition text-xs"
                  >
                    <div className="font-bold text-slate-900">Chioma Adebayo</div>
                    <div className="text-[10px] text-slate-500 truncate">Lekki, Lagos (Age 27)</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= REGISTER ================= */}
          {mode === 'register' && (
            <div className="space-y-4">
              {/* Prominent Nigerian Flag Banner in Registration */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
                <NigerianFlag aspectRatio="16:9" className="h-24 w-full" shadow={false} rounded={false} border={false} />
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Olumide Johnson"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#008751]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. olumide_j"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#008751]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@domain.ng"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#008751]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Password (min 6 chars)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#008751]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Age (18+ only)
                    </label>
                    <input
                      type="number"
                      min={18}
                      max={110}
                      required
                      value={age}
                      onChange={(e) => setAge(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#008751]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nigerian State (36 + FCT)
                    </label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-[#008751]"
                    >
                      {NIGERIAN_STATES.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.name} ({s.zone})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      City / Area
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Lekki, Maitama, Garki"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#008751]"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-slate-500">
                  By registering, you confirm you are 18+ and agree to NaijaMatch Safety & Community Values: Genuine dating intent, mutual respect, zero harassment.
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-[#008751] text-white font-bold text-sm hover:bg-[#007043] transition disabled:opacity-50 shadow-xs"
                >
                  {loading ? 'Creating Your Profile...' : 'Join NaijaMatch 🇳🇬'}
                </button>
              </form>
            </div>
          )}

          {/* ================= VERIFY EMAIL ================= */}
          {mode === 'verify' && (
            <div className="text-center space-y-4">
              <div className="w-16 mx-auto">
                <NigerianFlag aspectRatio="2:1" className="h-8 w-full" shadow={false} />
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">Verify Your Email Address</h3>
                <p className="text-xs text-slate-600 mt-1">
                  We sent a 6-digit confirmation code to verify your Nigerian account.
                </p>
              </div>

              {lastVerificationCode && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-[#008751] flex items-center justify-between">
                  <span>Demo Code: <strong>{lastVerificationCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => setVerificationCode(lastVerificationCode)}
                    className="text-[11px] bg-[#008751] text-white px-2.5 py-1 rounded-lg font-bold"
                  >
                    Paste Code
                  </button>
                </div>
              )}

              <form onSubmit={handleVerifySubmit} className="space-y-4">
                <input
                  type="text"
                  maxLength={10}
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full text-center tracking-widest text-lg font-mono py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-[#008751]"
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleResend}
                    className="flex-1 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50"
                  >
                    Resend Code
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 text-xs font-bold text-white bg-[#008751] rounded-xl hover:bg-[#007043]"
                  >
                    {loading ? 'Verifying...' : 'Confirm & Complete'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================= FORGOT PASSWORD ================= */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Account Recovery</h3>
                <p className="text-xs text-slate-600 mt-1">
                  {forgotStep === 1
                    ? 'Enter your registered email address to receive a secure recovery code.'
                    : 'Enter your recovery code and your new password.'}
                </p>
              </div>

              {forgotStep === 1 ? (
                <form onSubmit={handleForgotRequest} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. chioma@example.ng"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#008751]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="py-2 px-3 text-xs text-slate-600 hover:text-slate-900"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2 rounded-xl bg-[#008751] text-white font-bold text-xs hover:bg-[#007043]"
                    >
                      Send Reset Code
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Reset Code
                    </label>
                    <input
                      type="text"
                      required
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      New Password (min 6 chars)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 rounded-xl bg-[#008751] text-white font-bold text-xs hover:bg-[#007043]"
                  >
                    Reset & Sign In
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
