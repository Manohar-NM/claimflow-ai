import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LogOut,
  RefreshCw,
  Shield,
  User as UserIcon,
  Building2,
  Menu,
  Bell,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  onLogoutClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  onLogoutClick,
}) => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDemoSwitch = async () => {
    if (!user) return;
    const isHospital = user.role === 'HOSPITAL_STAFF';
    const targetEmail = isHospital ? 'tpa@claimflow.demo' : 'hospital@claimflow.demo';
    const targetPass = isHospital ? 'TPAManager@2026!' : 'HospitalStaff@2026!';

    try {
      const newUser = await login(targetEmail, targetPass);
      setIsProfileOpen(false);
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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur shadow-clinical">
      <div className="flex items-center space-x-3">
        {/* Mobile Menu Toggle Button */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label="Toggle Navigation Drawer"
          className="lg:hidden rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-xs border border-brand-500/20">
            <Shield className="h-5 w-5 text-teal-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                ClaimFlow AI
              </span>
              <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-teal-700 border border-teal-200 uppercase">
                Clinical SaaS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Hospital Cashless Claims & TPA Workspace
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Role & Hospital / TPA badge */}
        <div className="hidden md:flex flex-col items-end text-right">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-900">
            <Building2 className="h-3.5 w-3.5 text-brand-600" />
            <span className="truncate max-w-[200px]">{user?.organization}</span>
          </div>
          <span className="text-[11px] font-medium text-slate-500">
            {user?.role === 'HOSPITAL_STAFF' ? 'Hospital Billing Lead' : 'TPA Senior Underwriter'}
          </span>
        </div>

        {/* 1-Click Quick Demo Role Switcher */}
        <button
          onClick={handleDemoSwitch}
          title="Switch between Hospital Staff and TPA Underwriter demo accounts"
          className="flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 transition-all shadow-clinical"
        >
          <RefreshCw className="h-3.5 w-3.5 text-brand-600" />
          <span className="hidden sm:inline">
            Switch to {user?.role === 'HOSPITAL_STAFF' ? 'TPA Underwriter' : 'Hospital Staff'}
          </span>
          <span className="sm:hidden">Switch</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <Bell className="h-4 w-4" />
          </button>
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-teal-500 ring-2 ring-white"></span>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            aria-expanded={isProfileOpen}
            className="flex items-center space-x-2 rounded-xl p-1.5 hover:bg-slate-100 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-100 text-brand-700 font-bold text-xs border border-brand-200">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'CF'}
            </div>
            <div className="hidden lg:block text-left text-xs">
              <div className="font-bold text-slate-900 truncate max-w-[120px]">{user?.name}</div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-3 shadow-clinical-lg border border-slate-200 animate-in fade-in zoom-in-95 duration-150 z-50">
              <div className="p-2 border-b border-slate-100">
                <p className="font-bold text-xs text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-2 inline-flex items-center space-x-1 rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 border border-brand-200">
                  <Sparkles className="h-3 w-3" />
                  <span>{user?.role === 'HOSPITAL_STAFF' ? 'Hospital Staff Desk' : 'TPA Underwriter Desk'}</span>
                </div>
              </div>

              <div className="py-2">
                <button
                  type="button"
                  onClick={handleDemoSwitch}
                  className="w-full flex items-center space-x-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Switch Role</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onLogoutClick?.();
                  }}
                  className="w-full flex items-center space-x-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out of ClaimFlow</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

