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
  Clock,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
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
    <aside className="w-64 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4">
      <div className="space-y-6">
        <div>
          <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {isHospital ? 'Hospital Billing Portal' : 'TPA Underwriter Portal'}
          </div>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-semibold shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* TPA Provider quick list or SLA info */}
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs">
          <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
            <ShieldCheck className="h-4 w-4 text-brand-600" />
            <span>Supported TPAs</span>
          </div>
          <ul className="mt-2 space-y-1 text-slate-500">
            <li className="flex items-center justify-between">
              <span>Star Health</span>
              <span className="text-[10px] text-emerald-600 font-medium">Active</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Medi Assist</span>
              <span className="text-[10px] text-emerald-600 font-medium">Active</span>
            </li>
            <li className="flex items-center justify-between">
              <span>Niva Bupa</span>
              <span className="text-[10px] text-emerald-600 font-medium">Active</span>
            </li>
            <li className="flex items-center justify-between">
              <span>HDFC ERGO</span>
              <span className="text-[10px] text-emerald-600 font-medium">Active</span>
            </li>
            <li className="flex items-center justify-between">
              <span>ICICI Lombard</span>
              <span className="text-[10px] text-emerald-600 font-medium">Active</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Security & Audit compliance pill */}
      <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-center">
        <div className="flex items-center justify-center space-x-1 text-[11px] font-medium text-slate-500">
          <Clock className="h-3.5 w-3.5 text-teal-600" />
          <span>Audit Logged & Compliant</span>
        </div>
      </div>
    </aside>
  );
};
