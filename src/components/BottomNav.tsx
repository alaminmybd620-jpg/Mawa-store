import React from 'react';
import { LayoutDashboard, ShoppingCart, TrendingDown, BookUser, Boxes, FileSpreadsheet } from 'lucide-react';

export type NavTab = 'dashboard' | 'sales' | 'expenses' | 'credit' | 'inventory' | 'reports';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  unpaidCreditsCount?: number;
  lowStockCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  unpaidCreditsCount = 0,
  lowStockCount = 0,
}) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'sales' as NavTab, label: 'বিক্রি', icon: ShoppingCart },
    { id: 'expenses' as NavTab, label: 'খরচ', icon: TrendingDown },
    { id: 'credit' as NavTab, label: 'বাকি খাতা', icon: BookUser, badge: unpaidCreditsCount > 0 ? unpaidCreditsCount : undefined },
    { id: 'inventory' as NavTab, label: 'মজুদ', icon: Boxes, badge: lowStockCount > 0 ? '!' : undefined },
    { id: 'reports' as NavTab, label: 'হিসাব খতিয়ান', icon: FileSpreadsheet },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-lg no-print md:hidden">
      <div className="max-w-md mx-auto flex items-center justify-around py-1.5 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                isActive
                  ? 'text-amber-700 font-bold scale-105'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-0.5 whitespace-nowrap ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-amber-700 mt-0.5 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
