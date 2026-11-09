import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';
import { LogoutModal } from '../components/common/LogoutModal';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col font-sans text-slate-800">
      <Header
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onLogoutClick={() => setIsLogoutModalOpen(true)}
      />

      <div className="flex flex-1 relative">
        {/* Desktop Fixed Clinical Sidebar */}
        <div className="hidden lg:block">
          <Sidebar onLogoutClick={() => setIsLogoutModalOpen(true)} />
        </div>

        {/* Mobile Navigation Drawer & Backdrop */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Slide-out Drawer */}
            <div className="relative z-50 flex h-full w-72 max-w-xs flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Navigation
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <Sidebar
                  className="w-full border-r-0 min-h-full"
                  onItemClick={() => setIsMobileMenuOpen(false)}
                  onLogoutClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsLogoutModalOpen(true);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Global Accessible Logout Confirmation Modal */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          logout();
        }}
        userName={user?.name}
        userRole={user?.role}
      />
    </div>
  );
};

