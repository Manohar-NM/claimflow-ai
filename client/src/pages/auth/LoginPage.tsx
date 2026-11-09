import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, Building2, UserCheck, AlertCircle, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50/80 flex flex-col justify-center items-center p-4 selection:bg-brand-500 selection:text-white relative">
      {/* Subtle clinical background grid/gradient pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-clinical mb-3 border border-brand-500/30">
            <Shield className="h-7 w-7 text-teal-300" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">ClaimFlow AI</h1>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Hospital Cashless Claims & TPA Adjudication Workspace
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-clinical">
          {/* Reviewer 1-Click Demo Accounts Switcher */}
          <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50/50 p-4">
            <div className="flex items-center space-x-1.5 mb-2.5">
              <Sparkles className="h-3.5 w-3.5 text-teal-700" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                Reviewer 1-Click Quick Demo Access
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('HOSPITAL_STAFF')}
                className="flex items-center justify-center space-x-1.5 rounded-xl border border-brand-200 bg-white py-2 px-3 text-xs font-semibold text-brand-700 hover:bg-brand-50 hover:border-brand-300 transition-all shadow-2xs"
              >
                <Building2 className="h-3.5 w-3.5 text-brand-600" />
                <span>Hospital Staff</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('TPA_MANAGER')}
                className="flex items-center justify-center space-x-1.5 rounded-xl border border-teal-200 bg-white py-2 px-3 text-xs font-semibold text-teal-800 hover:bg-teal-50 hover:border-teal-300 transition-all shadow-2xs"
              >
                <UserCheck className="h-3.5 w-3.5 text-teal-600" />
                <span>TPA Underwriter</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hospital.org"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Account Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center space-x-2 rounded-xl bg-brand-600 py-3 text-sm font-bold text-white hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600/50 transition-all shadow-md shadow-brand-600/20 disabled:opacity-50"
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

          <div className="mt-6 text-center text-xs text-slate-400">
            <span>Secure JWT authentication with role-based access control.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
