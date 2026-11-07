import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, RefreshCw, Shield, User as UserIcon, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();

  const handleDemoSwitch = async () => {
    if (!user) return;
    const isHospital = user.role === 'HOSPITAL_STAFF';
    const targetEmail = isHospital ? 'tpa@claimflow.demo' : 'hospital@claimflow.demo';
    const targetPass = isHospital ? 'TPAManager@2026!' : 'HospitalStaff@2026!';

    try {
      const newUser = await login(targetEmail, targetPass);
      if (newUser.role === 'HOSPITAL_STAFF') {
        navigate('/hospital/dashboard');
      } else {
        navigate('/tpa/dashboard');
      }
    } catch (err) {
      console.error('Failed to switch demo account:', err);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur">
      <div className="flex items-center space-x-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-white shadow-sm">
          <Shield className="h-5 w-5 text-teal-400" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold tracking-tight text-navy-900">ClaimFlow AI</span>
            <span className="rounded bg-teal-50 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-teal-700 border border-teal-200 uppercase">
              Enterprise v1.0
            </span>
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">Cashless Hospital Insurance & TPA Adjudication Workspace</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Role Badge & Organization Scope */}
        <div className="hidden md:flex flex-col items-end">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-800">
            <Building2 className="h-3.5 w-3.5 text-brand-600" />
            <span>{user?.organization}</span>
          </div>
          <span className="text-[11px] text-slate-500">
            {user?.role === 'HOSPITAL_STAFF' ? 'Hospital Billing Desk' : 'TPA Underwriter Desk'}
          </span>
        </div>

        {/* 1-Click Demo Switcher */}
        <button
          onClick={handleDemoSwitch}
          title="Switch to alternative demo role (Reviewer convenience)"
          className="flex items-center space-x-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
        >
          <RefreshCw className="h-3.5 w-3.5 text-brand-600" />
          <span className="hidden sm:inline">
            Switch to {user?.role === 'HOSPITAL_STAFF' ? 'TPA Underwriter' : 'Hospital Staff'}
          </span>
          <span className="sm:hidden">Switch Role</span>
        </button>

        {/* User Profile info */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            <UserIcon className="h-4 w-4" />
          </div>
          <div className="hidden lg:block text-left text-xs">
            <div className="font-semibold text-slate-800 truncate max-w-[130px]">{user?.name}</div>
            <div className="text-slate-400 truncate max-w-[130px]">{user?.email}</div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          title="Sign out of ClaimFlow AI"
          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
