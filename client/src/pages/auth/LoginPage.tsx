import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, Building2, UserCheck, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (loginEmail?: string, loginPassword?: string) => {
    setError(null);
    setIsSubmitting(true);
    const targetEmail = loginEmail || email;
    const targetPassword = loginPassword || password;

    try {
      const user = await login(targetEmail, targetPassword);
      if (user.role === 'HOSPITAL_STAFF') {
        navigate('/hospital/dashboard');
      } else {
        navigate('/tpa/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = (role: 'HOSPITAL_STAFF' | 'TPA_MANAGER') => {
    if (role === 'HOSPITAL_STAFF') {
      setEmail('hospital@claimflow.demo');
      setPassword('HospitalStaff@2026!');
      handleLogin('hospital@claimflow.demo', 'HospitalStaff@2026!');
    } else {
      setEmail('tpa@claimflow.demo');
      setPassword('TPAManager@2026!');
      handleLogin('tpa@claimflow.demo', 'TPAManager@2026!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 selection:bg-brand-500 selection:text-white">
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(14,165,233,0.15),rgba(255,255,255,0))]"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-xl shadow-brand-500/20 mb-3 border border-brand-400/30">
            <Shield className="h-7 w-7 text-teal-300" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">ClaimFlow AI</h1>
          <p className="mt-1 text-xs text-slate-400">
            Hospital Cashless Claims & TPA Adjudication Workspace
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-800/80 p-8 shadow-2xl backdrop-blur-md">
          {/* Reviewer 1-Click Demo Accounts Switcher */}
          <div className="mb-6 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 block mb-2">
              ⚡ Reviewer 1-Click Quick Demo Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('HOSPITAL_STAFF')}
                className="flex items-center justify-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-xs"
              >
                <Building2 className="h-3.5 w-3.5 text-brand-400" />
                <span>Hospital Staff</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('TPA_MANAGER')}
                className="flex items-center justify-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800 py-2 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-xs"
              >
                <UserCheck className="h-3.5 w-3.5 text-teal-400" />
                <span>TPA Underwriter</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 flex items-center space-x-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hospital.org"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/50 py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Account Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/50 py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center space-x-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all shadow-lg shadow-brand-600/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center space-x-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Authenticating...</span>
                </span>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            <span>Secure JWT authentication with role-based access control.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
