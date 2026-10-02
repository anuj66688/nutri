'use client';

import React from 'react';
import {
  LayoutDashboard,
  UtensilsCrossed,
  FileSpreadsheet,
  LineChart,
  History,
  Sparkles,
  TrendingUp,
  User,
  HeartPulse
} from 'lucide-react';

export type NavTab = 'dashboard' | 'food' | 'labs' | 'lab-history' | 'history' | 'copilot';

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenDietModal: () => void;
  userName?: string;
  onOpenProfile: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  onOpenDietModal,
  userName = 'User',
  onOpenProfile
}) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'food' as NavTab, label: 'Food Log', icon: UtensilsCrossed },
    { id: 'labs' as NavTab, label: 'Lab Reports', icon: FileSpreadsheet },
    { id: 'lab-history' as NavTab, label: 'Lab History', icon: LineChart },
    { id: 'history' as NavTab, label: 'History', icon: History },
    { id: 'copilot' as NavTab, label: 'AI Copilot', icon: Sparkles }
  ];

  return (
    <>
      {/* Top Navbar for Desktop / Tablet */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('dashboard')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white block leading-tight">
                Nutrition Intelligence
              </span>
              <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400 block tracking-wider uppercase">
                Clinical Health Engine
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'opacity-70'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={onOpenDietModal}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/50 transition-all cursor-pointer shadow-2xs"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Is My Diet Working?</span>
            </button>

            <button
              onClick={onOpenProfile}
              className="flex items-center space-x-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-zinc-700"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline font-semibold">{userName}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation (Section 19: On mobile sidebar becomes bottom navigation) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg border-t border-slate-200 dark:border-zinc-800 px-2 py-1.5 flex justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-xl text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
