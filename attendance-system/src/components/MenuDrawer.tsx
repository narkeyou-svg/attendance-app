import React from 'react';
import {
  X,
  Clock,
  Calendar,
  LayoutDashboard,
  FileSpreadsheet,
  Settings,
  Laptop,
  Volume2,
  VolumeX,
  ChevronRight,
  Calculator,
} from 'lucide-react';
import { sound } from '../utils/sound';

export type AppTab = 'kiosk' | 'timecard' | 'payroll' | 'summary' | 'export' | 'settings';

interface MenuDrawerProps {
  isOpen: boolean;
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  openLocalGuide: () => void;
  onClose: () => void;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  isOpen,
  activeTab,
  onSelectTab,
  openLocalGuide,
  onClose,
}) => {
  if (!isOpen) return null;

  const [soundOn, setSoundOn] = React.useState(sound.isEnabled());

  const handleToggleSound = () => {
    const next = sound.toggleSound();
    setSoundOn(next);
  };

  const menuItems = [
    {
      id: 'kiosk',
      label: '出退勤の打刻（メイン画面）',
      desc: 'お名前を選んで出勤・退勤の打刻を行います',
      icon: <Clock className="w-5 h-5 text-emerald-600" />,
      badge: '日常業務',
    },
    {
      id: 'payroll',
      label: '給与計算・締め処理（タイムカード集計）',
      desc: '打刻漏れの自動チェック・残業手当(1.25倍)計算・紙のA4印刷・給与Excel出力',
      icon: <Calculator className="w-5 h-5 text-emerald-600" />,
      badge: '★月末おすすめ',
    },
    {
      id: 'timecard',
      label: 'タイムカード・打刻修正',
      desc: '個人別の勤務台帳の確認や、押し間違いの修正・削除を行います',
      icon: <Calendar className="w-5 h-5 text-indigo-600" />,
    },
    {
      id: 'summary',
      label: '月次集計・残業管理ダッシュボード',
      desc: '全員の労働時間・残業時間の合計と36協定アラートを確認します',
      icon: <LayoutDashboard className="w-5 h-5 text-amber-600" />,
    },
    {
      id: 'export',
      label: 'Excel (.xlsx) / CSV出力',
      desc: '月次集計表や全社員一括台帳をエクセルファイルで出力します',
      icon: <FileSpreadsheet className="w-5 h-5 text-emerald-600" />,
    },
    {
      id: 'settings',
      label: '従業員マスタ・勤務設定',
      desc: '従業員の登録、時給・基本給、締め日（末日・20日等）の設定',
      icon: <Settings className="w-5 h-5 text-slate-600" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-sm sm:max-w-md bg-white h-full shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">メニュー</h3>
            <p className="text-xs text-slate-400">集計・給与計算・管理機能</p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>閉じる</span>
          </button>
        </div>

        {/* Navigation list */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2">
          {menuItems.map(item => {
            const isCurrent = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id as AppTab);
                  onClose();
                }}
                className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                  isCurrent
                    ? 'bg-emerald-50 border-emerald-400 shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 group-hover:bg-white transition-colors flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm sm:text-base font-bold text-slate-900">
                        {item.label}
                      </div>
                      {item.badge && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {item.desc}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 flex-shrink-0" />
              </button>
            );
          })}

          <div className="pt-3 border-t border-slate-200 space-y-2">
            {/* Local Guide */}
            <button
              onClick={() => {
                openLocalGuide();
                onClose();
              }}
              className="w-full text-left p-3 rounded-2xl bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-200 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <Laptop className="w-5 h-5 text-indigo-600" />
                <span className="text-xs sm:text-sm font-bold text-indigo-900">
                  PCローカル実行手順ガイド
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-indigo-400" />
            </button>

            {/* Audio Toggle */}
            <button
              onClick={handleToggleSound}
              className="w-full text-left p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                {soundOn ? <Volume2 className="w-5 h-5 text-emerald-600" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  打刻音案内：{soundOn ? 'あり (ON)' : 'なし (OFF)'}
                </span>
              </div>
              <span className="text-xs text-slate-500">切替</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
