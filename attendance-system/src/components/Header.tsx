import React, { useEffect, useState } from 'react';
import { Menu, ArrowLeft, Clock } from 'lucide-react';
import { AppTab } from './MenuDrawer';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  openMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openMenu,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  });

  const formattedTime = currentTime.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const isKiosk = activeTab === 'kiosk';

  // If in kiosk mode: Just a super clean, minimal top strip with live clock and menu button
  if (isKiosk) {
    return (
      <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-2 flex items-center justify-between">
        {/* Simple live clock */}
        <div className="flex items-center gap-2.5 text-slate-700">
          <Clock className="w-5 h-5 text-emerald-600" />
          <span className="text-base sm:text-lg font-bold text-slate-600">{formattedDate}</span>
          <span className="text-xl sm:text-2xl font-mono font-black text-slate-900 tracking-wider">
            {formattedTime}
          </span>
        </div>

        {/* Discreet Menu Button */}
        <button
          onClick={openMenu}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 active:scale-95 text-slate-700 text-sm font-bold rounded-2xl border-2 border-slate-300 shadow-2xs transition-all cursor-pointer"
          aria-label="メニュー"
        >
          <Menu className="w-4 h-4 text-slate-600" />
          <span>メニュー</span>
        </button>
      </header>
    );
  }

  // If in admin view (payroll, timecard, summary, export, settings):
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-sm sticky top-0 z-30 print:hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => setActiveTab('kiosk')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold text-sm rounded-xl shadow transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>打刻画面へ戻る</span>
        </button>

        <button
          onClick={openMenu}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-sm font-bold rounded-xl border border-slate-700 transition-all cursor-pointer"
        >
          <Menu className="w-4 h-4 text-indigo-400" />
          <span>メニュー</span>
        </button>
      </div>
    </header>
  );
};
