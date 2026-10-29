import React, { useState, useEffect } from 'react';
import {
  Coffee,
  Cloud,
  CloudOff,
  LogIn,
  LogOut,
  Settings,
  Database,
  User,
  LayoutDashboard,
  ShoppingCart,
  TrendingDown,
  BookUser,
  Boxes,
  FileSpreadsheet,
  Maximize2,
  Minimize2,
  Keyboard,
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { formatBengaliDate, getTodayDateString } from '../utils/format';
import { NavTab } from './BottomNav';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  shopName: string;
  user: FirebaseUser | null;
  isOnline: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
  onOpenCashRegister: () => void;
  cashBalance: number;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  unpaidCreditsCount?: number;
  lowStockCount?: number;
  onOpenShortcuts?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  shopName,
  user,
  isOnline,
  onLogin,
  onLogout,
  onOpenSettings,
  onOpenBackup,
  onOpenCashRegister,
  cashBalance,
  activeTab,
  onTabChange,
  unpaidCreditsCount = 0,
  lowStockCount = 0,
  onOpenShortcuts,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen request failed:', e);
    }
  };

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'sales' as NavTab, label: 'বিক্রি', icon: ShoppingCart },
    { id: 'expenses' as NavTab, label: 'খরচ', icon: TrendingDown },
    {
      id: 'credit' as NavTab,
      label: 'বাকি খাতা',
      icon: BookUser,
      badge: unpaidCreditsCount > 0 ? unpaidCreditsCount : undefined,
    },
    {
      id: 'inventory' as NavTab,
      label: 'মজুদ স্টক',
      icon: Boxes,
      badge: lowStockCount > 0 ? '!' : undefined,
    },
    { id: 'reports' as NavTab, label: 'হিসাব খতিয়ান', icon: FileSpreadsheet },
  ];

  return (
    <header className="sticky top-0 z-40 bg-amber-950 text-amber-50 shadow-md no-print border-b border-amber-900/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Brand & Shop Info */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              onClick={() => onTabChange('dashboard')}
              className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 border border-amber-500/50 flex items-center justify-center text-amber-100 shadow-inner group-hover:from-amber-500 group-hover:to-amber-700 transition-colors">
                <Coffee className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-sm sm:text-base lg:text-lg font-bold tracking-tight text-white line-clamp-1">
                    {shopName || 'চা দোকান হিসাব খাতা'}
                  </h1>
                  <span className="hidden xl:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-900/90 border border-amber-800 text-amber-300">
                    {isOnline ? (
                      <>
                        <Cloud className="w-3 h-3 text-emerald-400" />
                        ক্লাউড
                      </>
                    ) : (
                      <>
                        <CloudOff className="w-3 h-3 text-amber-400" />
                        অফলাইন
                      </>
                    )}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-amber-200/80 hidden sm:block">
                  {formatBengaliDate(getTodayDateString())}
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Tabs (Visible on md/lg screens - Transforms into full website) */}
          <nav className="hidden md:flex items-center gap-1 bg-amber-900/60 p-1 rounded-2xl border border-amber-800/60 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-sm font-bold scale-[1.02]'
                      : 'text-amber-200 hover:text-white hover:bg-amber-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        item.badge === '!'
                          ? 'bg-amber-400 text-amber-950'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Controls & Tools */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Quick Cash In Drawer Pill */}
            <button
              onClick={onOpenCashRegister}
              title="ক্যাশ ড্রয়ার হিসাব দেখুন (শর্টকাট: C)"
              className="flex items-center gap-1.5 bg-amber-900/80 hover:bg-amber-900 border border-amber-700/60 px-2 sm:px-2.5 py-1.5 rounded-xl text-left transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <div className="text-right">
                <span className="block text-[9px] sm:text-[10px] text-amber-300 font-medium leading-none">
                  ড্রয়ারে ক্যাশ
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-400 leading-tight">
                  ৳ {cashBalance.toLocaleString('en-IN')}
                </span>
              </div>
            </button>

            {/* Chrome PWA Install Button */}
            <PWAInstallButton />

            {/* Desktop Keyboard Shortcuts Info Button */}
            {onOpenShortcuts && (
              <button
                onClick={onOpenShortcuts}
                title="কীবোর্ড শর্টকাট সহায়িকা (?)"
                className="hidden lg:flex p-2 rounded-xl bg-amber-900/60 hover:bg-amber-800 border border-amber-700/50 text-amber-200 transition-all active:scale-95 cursor-pointer"
              >
                <Keyboard className="w-4 h-4" />
              </button>
            )}

            {/* Fullscreen POS Mode Toggle (Chrome Optimized) */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'ফুলস্ক্রিন বন্ধ করুন (Esc)' : 'ফুলস্ক্রিন POS মোড (F)'}
              className="hidden sm:flex p-2 rounded-xl bg-amber-900/60 hover:bg-amber-800 border border-amber-700/50 text-amber-200 transition-all active:scale-95 cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Backup / Export */}
            <button
              onClick={onOpenBackup}
              title="ব্যাকআপ ও রিস্টোর"
              className="p-2 rounded-xl bg-amber-900/60 hover:bg-amber-800 border border-amber-700/50 text-amber-200 transition-all active:scale-95 cursor-pointer"
            >
              <Database className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              title="দোকান সেটিংস ও দাম পরিবর্তন (শর্টকাট: S)"
              className="p-2 rounded-xl bg-amber-900/60 hover:bg-amber-800 border border-amber-700/50 text-amber-200 transition-all active:scale-95 cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Auth Button */}
            {user ? (
              <div className="flex items-center gap-1.5 bg-amber-900/80 border border-amber-700/60 pl-2 pr-1 py-1 rounded-xl">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'দোকানদার'}
                    className="w-6 h-6 rounded-full border border-amber-400 object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-amber-800 flex items-center justify-center text-amber-200">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
                <span className="hidden xl:inline text-xs font-semibold text-amber-100 max-w-[80px] truncate">
                  {user.displayName?.split(' ')[0] || 'মালিক'}
                </span>
                <button
                  onClick={onLogout}
                  title="লগআউট করুন"
                  className="p-1 hover:bg-amber-800 rounded-lg text-amber-300 hover:text-white transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">লগইন</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
