import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  HelpCircle,
  ShieldCheck,
  Inbox,
  LogOut,
  User as UserIcon,
  Building2,
  Shield,
  Activity,
} from 'lucide-react';

interface SidebarProps {
  onLogoutClick?: () => void;
  onItemClick?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onLogoutClick,
  onItemClick,
  className = '',
}) => {
  const { user } = useAuth();
  const isHospital = user?.role === 'HOSPITAL_STAFF';

  const hospitalNavItems = [
    { label: 'Overview Dashboard', path: '/hospital/dashboard', icon: LayoutDashboard },
    { label: 'Claims Workspace', path: '/hospital/claims', icon: FileText },
    { label: 'Create New Claim', path: '/hospital/claims/new', icon: PlusCircle },
  ];

  const tpaNavItems = [
    { label: 'Adjudication Dashboard', path: '/tpa/dashboard', icon: LayoutDashboard },
    { label: 'TPA Review Queue', path: '/tpa/queue', icon: Inbox },
    { label: 'Query Desk', path: '/tpa/queries', icon: HelpCircle },
  ];

  const navItems = isHospital ? hospitalNavItems : tpaNavItems;

  return (
    <aside
      className={`w-64 border-r border-slate-200 bg-white flex flex-col justify-between p-4 shrink-0 ${className}`}
    >
      <div className="space-y-6">
        {/* Navigation Section */}
        <div>
          <div className="px-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>{isHospital ? 'Hospital Billing' : 'TPA Underwriter'}</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="System Online"></span>
          </div>

          <nav className="mt-2.5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onItemClick}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-brand-50 text-brand-600 border border-brand-200 shadow-clinical'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* TPA Partner Network Quick Status */}
        <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-800 mb-2">
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              <span>TPA Network</span>
            </div>
            <span className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-md font-semibold border border-teal-200">
              5 Connected
            </span>
          </div>
          <ul className="space-y-1 text-slate-500 text-[11px]">
            <li className="flex items-center justify-between py-0.5">
              <span>Star Health</span>
              <span className="text-[10px] text-emerald-600 font-semibold">Active SLA</span>
            </li>
            <li className="flex items-center justify-between py-0.5">
              <span>Medi Assist</span>
              <span className="text-[10px] text-emerald-600 font-semibold">Active SLA</span>
            </li>
            <li className="flex items-center justify-between py-0.5">
              <span>Niva Bupa</span>
              <span className="text-[10px] text-emerald-600 font-semibold">Active SLA</span>
            </li>
            <li className="flex items-center justify-between py-0.5">
              <span>HDFC ERGO</span>
              <span className="text-[10px] text-emerald-600 font-semibold">Active SLA</span>
            </li>
            <li className="flex items-center justify-between py-0.5">
              <span>ICICI Lombard</span>
              <span className="text-[10px] text-emerald-600 font-semibold">Active SLA</span>
            </li>
          </ul>
        </div>
      </div>

      {/* User Profile & Primary Sidebar Logout Button */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700 font-bold shrink-0 text-xs border border-brand-200">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'CF'}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <div className="font-bold text-xs text-slate-900 truncate" title={user?.name}>
                {user?.name}
              </div>
              <div className="text-[11px] text-slate-500 truncate" title={user?.organization}>
                {user?.organization}
              </div>
            </div>
          </div>
        </div>

        {/* Primary Logout Action Button */}
        <button
          type="button"
          onClick={onLogoutClick}
          aria-label="Sign out of workspace"
          className="w-full flex items-center justify-center space-x-2 rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors shadow-2xs"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

