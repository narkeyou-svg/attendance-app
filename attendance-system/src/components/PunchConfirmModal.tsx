import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Clock, LogIn, LogOut, Coffee, ArrowRight, X } from 'lucide-react';
import { Employee, PunchType } from '../types/attendance';

interface PunchConfirmModalProps {
  isOpen: boolean;
  employee: Employee | null;
  punchType: PunchType;
  currentTimestamp: Date;
  onConfirm: (note?: string) => void;
  onCancel: () => void;
}

export const PunchConfirmModal: React.FC<PunchConfirmModalProps> = ({
  isOpen,
  employee,
  punchType,
  currentTimestamp,
  onConfirm,
  onCancel,
}) => {
  const [note, setNote] = useState('');

  if (!isOpen || !employee) return null;

  const typeConfig: Record<PunchType, { title: string; color: string; bg: string; border: string; icon: React.ReactNode; btnClass: string }> = {
    clock_in: {
      title: '出勤',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: <LogIn className="w-8 h-8 text-emerald-600" />,
      btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25',
    },
    clock_out: {
      title: '退勤',
      color: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      icon: <LogOut className="w-8 h-8 text-rose-600" />,
      btnClass: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25',
    },
    break_start: {
      title: '休憩入り',
      color: 'text-amber-700',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: <Coffee className="w-8 h-8 text-amber-600" />,
      btnClass: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/25',
    },
    break_end: {
      title: '休憩戻り',
      color: 'text-blue-700',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: <ArrowRight className="w-8 h-8 text-blue-600" />,
      btnClass: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25',
    },
  };

  const config = typeConfig[punchType];

  const dateStr = currentTimestamp.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  const timeStr = currentTimestamp.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const handleConfirm = () => {
    onConfirm(note.trim() ? note.trim() : undefined);
    setNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header decoration */}
        <div className={`px-6 pt-6 pb-5 border-b ${config.bg} ${config.border}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              打刻内容の確認
            </span>
            <button
              onClick={onCancel}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200/60">
              {config.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-black ${config.color}`}>
                  【 {config.title} 】
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                ボタンを確定すると現在時刻で記録されます
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Employee Info Card */}
          <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className={`w-12 h-12 rounded-xl ${employee.avatarColor} text-white font-bold text-lg flex items-center justify-center shadow-sm`}>
              {employee.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">{employee.code}</span>
                <span className="text-xs bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded font-medium">
                  {employee.department}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 truncate">
                {employee.name}
              </h3>
            </div>
          </div>

          {/* Time Display */}
          <div className="bg-slate-900 text-white rounded-xl p-4 text-center shadow-inner">
            <p className="text-xs text-slate-400 font-medium mb-1">{dateStr}</p>
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-6 h-6 text-emerald-400 animate-pulse" />
              <span className="text-3xl font-mono font-black tracking-widest text-emerald-400">
                {timeStr}
              </span>
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              備考メモ (任意：直行直帰・遅延など)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例: 電車遅延15分、直行のため、午前半休 等"
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 text-slate-800"
              maxLength={50}
            />
          </div>

          {/* Caution text */}
          <div className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-200/70 text-amber-800 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              押し間違えた場合でも、直後の画面や「タイムカード履歴」からいつでも時刻を修正できます。
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            キャンセル (戻る)
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className={`px-6 py-2.5 text-sm font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2 ${config.btnClass}`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>この内容で打刻する</span>
          </button>
        </div>
      </div>
    </div>
  );
};
