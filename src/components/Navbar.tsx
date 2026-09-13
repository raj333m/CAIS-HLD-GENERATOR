'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  FileText,
  UserCheck,
  LogOut,
  Layers,
  ChevronDown,
  Sparkles,
  Sun,
  Moon,
  History,
  LayoutDashboard,
  Eye,
  RotateCcw,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, setPreviewRole, resetPreview } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  if (!user) return null;

  const realRole = user.realRole || user.role;
  const isRealAdmin = realRole === 'ADMIN';

  const roleColors: Record<string, string> = {
    BA: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    REVIEWER: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    ADMIN: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  const navItemClass = (path: string) =>
    `flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all ${
      pathname === path
        ? 'bg-[#C0272D]/15 text-[#C0272D] dark:text-red-400 border border-[#C0272D]/30 shadow-xs'
        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
    }`;

  return (
    <>
      {/* Admin Preview Mode Persistent Top Indicator Banner */}
      {isRealAdmin && user.previewRole && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 py-1.5 px-4 text-xs font-bold text-amber-300 flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>
              Previewing UI as <strong>{user.previewRole}</strong> — You are logged in as System Admin (write actions perform with Admin credentials)
            </span>
          </div>
          <button
            onClick={resetPreview}
            className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-bold flex items-center gap-1 border border-amber-500/40 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Return to Admin View</span>
          </button>
        </div>
      )}

      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-400 dark:from-white dark:via-slate-200 dark:to-blue-300">
                  CAIS HLD Generator
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">Experian • Equifax • TransUnion</p>
            </div>
          </Link>

          {/* Navigation links - 3 primary tabs: Dashboard, Consolidated HLD, & CAIS Changes Audit Logs */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/dashboard" className={navItemClass('/dashboard')}>
              <LayoutDashboard className="w-4 h-4 text-emerald-400" />
              <span>Dashboard</span>
            </Link>

            <Link href="/document" className={navItemClass('/document')}>
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Consolidated HLD</span>
            </Link>

            <Link href="/changes" className={navItemClass('/changes')}>
              <History className="w-4 h-4 text-purple-400" />
              <span>CAIS Changes Audit Logs 2026</span>
            </Link>
          </nav>

          {/* Right side controls: Theme Toggle, Role Display / Admin Preview, Log Out */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-blue-500/50 text-slate-300 hover:text-white transition-all shadow-xs flex items-center justify-center cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Role Display: "Preview as ▾" Dropdown for System Admin ONLY, Static Badge for BA / Reviewer */}
            {isRealAdmin ? (
              <div className="relative">
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-blue-500/50 text-xs font-medium transition-all cursor-pointer"
                  title="Preview application as a different role (Admin only)"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-400 hidden sm:inline">Preview as:</span>
                  <span
                    className={`px-2 py-0.5 rounded border text-[11px] font-bold tracking-wide ${
                      roleColors[user.role]
                    }`}
                  >
                    {user.role}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {showRoleMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50">
                    <div className="px-2 py-1 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Preview as Role
                    </div>
                    <button
                      onClick={() => {
                        setPreviewRole('BA');
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer ${
                        user.role === 'BA' ? 'bg-blue-600/20 text-blue-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>BA (Author)</span>
                      {user.role === 'BA' && <UserCheck className="w-3.5 h-3.5 text-blue-400" />}
                    </button>
                    <button
                      onClick={() => {
                        setPreviewRole('REVIEWER');
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer ${
                        user.role === 'REVIEWER' ? 'bg-purple-600/20 text-purple-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>Reviewer / Lead</span>
                      {user.role === 'REVIEWER' && <UserCheck className="w-3.5 h-3.5 text-purple-400" />}
                    </button>
                    <button
                      onClick={() => {
                        setPreviewRole(null);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer ${
                        user.role === 'ADMIN' && !user.previewRole ? 'bg-amber-600/20 text-amber-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>System Admin</span>
                      {user.role === 'ADMIN' && !user.previewRole && <UserCheck className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Non-Admin: Static, Non-Interactive Role Badge */
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono">
                <span className="text-slate-400 hidden sm:inline">Role:</span>
                <span
                  className={`px-2 py-0.5 rounded border text-[11px] font-bold tracking-wide ${
                    roleColors[user.role]
                  }`}
                >
                  {user.role}
                </span>
              </div>
            )}

            {/* Prominently Labelled Log Out Button */}
            <button
              onClick={logout}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-200 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 font-bold text-xs flex items-center gap-2 transition-all shadow-xs cursor-pointer"
              title="Log Out of CAIS HLD Generator"
            >
              <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
