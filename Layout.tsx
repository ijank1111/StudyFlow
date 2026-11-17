"use client";

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Settings, 
  LogOut, 
  PlusCircle, 
  Users, 
  LayoutDashboard, 
  BarChart3, 
  Copy, 
  Zap,
  Menu,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const navItems = [
    { path: '/', icon: BookOpen, label: 'Dashboard' },
    { path: '/board', icon: LayoutDashboard, label: 'Task Board' },
    { path: '/performance', icon: BarChart3, label: 'Analytics' },
    { path: '/templates', icon: Copy, label: 'Templates' },
    { path: '/shared', icon: Users, label: 'Shared' },
    { path: '/friends', icon: Users, label: 'Friends' },
    { path: '/preferences', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row p-4 lg:p-6 gap-6">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 floating-nav rounded-3xl z-50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-xl tracking-tight text-slate-900">StudyFlow</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar / Navigation */}
      <aside className={`
        fixed inset-0 z-40 lg:relative lg:inset-auto
        ${isMobileMenuOpen ? 'flex' : 'hidden lg:flex'}
        flex-col w-full lg:w-72 floating-nav rounded-[2.5rem] p-6 transition-all duration-300
      `}>
        <div className="hidden lg:flex items-center gap-4 mb-12 px-2">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 rounded-2xl shadow-xl shadow-indigo-100">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">StudyFlow</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 translate-x-1' 
                    : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'scale-110' : 'group-hover:scale-110 transition-transform'}`} />
                <span className="font-bold text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 space-y-4">
          <Link
            to="/new"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            New Plan
          </Link>
          
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl h-12 px-5"
            onClick={handleLogout}
          >
            <LogOut className="mr-4 h-4 w-4" />
            <span className="font-bold text-sm">Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative">
        <div className="max-w-6xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;