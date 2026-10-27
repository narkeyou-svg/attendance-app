import React, { useState } from 'react';
import {
  X,
  LogIn,
  LogOut,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit3,
} from 'lucide-react';
import { AttendanceRecord, Employee, PunchType } from '../types/attendance';
import { getEmployeeCurrentStatus } from '../utils/timeCalculations';

interface PunchActionModalProps {
  isOpen: boolean;
  employee: Employee | null;
  records: AttendanceRecord[];
  todayStr: string;
  currentTimeStr: string;
  onPunch: (employeeId: string, punchType: PunchType, note?: string) => void;
  onOpenEdit: (employee: Employee) => void;
  onClose: () => void;
}

export const PunchActionModal: React.FC<PunchActionModalProps> = ({
  isOpen,
  employee,
  records,
  todayStr,
  currentTimeStr,
  onPunch,
  onOpenEdit,
  onClose,
}) => {
  // Confirmation sub-step
  const [confirmingType, setConfirmingType] = useState<PunchType | null>(null);

  if (!isOpen || !employee) return null;

  const currentStatus = getEmployeeCurrentStatus(employee.id, todayStr, records);

  const handleSelectType = (type: PunchType) => {
    setConfirmingType(type);
  };

  const handleConfirmPunch = () => {
    if (!confirmingType) return;
    onPunch(employee.id, confirmingType);
    setConfirmingType(null);
    onClose();
  };

  const handleCancelConfirm = () => {
    setConfirmingType(null);
  };

  const typeConfig: Record<PunchType, { name: string; verb: string; bg: string; hoverBg: string; border: string }> = {
    clock_in: {
      name: '出勤',
      verb: '出勤する',
      bg: 'bg-emerald-600',
      hoverBg: 'hover:bg-emerald-500',
      border: 'border-emerald-700',
    },
    clock_out: {
      name: '退勤',
      verb: '退勤する',
      bg: 'bg-rose-600',
      hoverBg: 'hover:bg-rose-500',
      border: 'border-rose-700',
    },
    break_start: {
      name: '休憩',
      verb: '休憩する',
      bg: 'bg-amber-600',
      hoverBg: 'hover:bg-amber-500',
      border: 'border-amber-700',
    },
    break_end: {
      name: '戻り',
      verb: '戻る',
      bg: 'bg-blue-600',
      hoverBg: 'hover:bg-blue-500',
      border: 'border-blue-700',
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border-4 border-slate-300 overflow-hidden">
        {/* Header with Close */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white">
              {employee.name}
            </span>
            <span className="text-lg text-slate-300 font-bold">さん</span>
          </div>

          <button
            onClick={() => {
              setConfirmingType(null);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-base font-black rounded-2xl border border-slate-700 transition-all cursor-pointer"
          >
            <X className="w-6 h-6 text-slate-400" />
            <span>閉じる</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6">
          {/* Current Status Banner */}
          <div className="p-4 bg-slate-100 rounded-2xl border-2 border-slate-300 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-600 font-bold block mb-1">
                いまの状態
              </span>
              <div>
                {currentStatus.status === 'working' && (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-base sm:text-lg font-black bg-emerald-100 text-emerald-900 border-2 border-emerald-400">
                    <span className="w-3 h-3 rounded-full bg-emerald-600 animate-pulse"></span>
                    出勤中 ({currentStatus.lastActionTime}〜)
                  </span>
                )}
                {currentStatus.status === 'clocked_out' && (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-base sm:text-lg font-black bg-purple-100 text-purple-900 border-2 border-purple-400">
                    退勤済 ({currentStatus.lastActionTime})
                  </span>
                )}
                {currentStatus.status === 'not_clocked_in' && (
                  <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-base sm:text-lg font-bold bg-slate-200 text-slate-700">
                    未出勤（まだ打刻されていません）
                  </span>
                )}
                {currentStatus.status === 'on_break' && (
                  <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-base sm:text-lg font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    休憩中 ({currentStatus.lastActionTime}〜)
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-600 block font-bold">現在時刻</span>
              <span className="text-xl sm:text-2xl font-mono font-black text-slate-900">{currentTimeStr}</span>
            </div>
          </div>

          {/* If Confirmation is ACTIVE */}
          {confirmingType ? (
            <div className="p-6 bg-amber-50 border-3 border-amber-400 rounded-3xl space-y-5 animate-scale-up">
              <div className="text-center space-y-2">
                <p className="text-lg font-bold text-slate-700">
                  {employee.name} さん
                </p>
                <div className="text-3xl sm:text-4xl font-black text-slate-900">
                  【 {typeConfig[confirmingType].name} 】
                  <span className="text-xl sm:text-2xl font-bold text-slate-700 ml-1">を記録します</span>
                </div>
                <p className="text-base font-bold text-indigo-800 font-mono">
                  現在時刻: {currentTimeStr}
                </p>
                <p className="text-sm font-bold text-amber-950 pt-1">
                  よろしいですか？ 間違いがなければ下の緑ボタンを押してください。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <button
                  type="button"
                  onClick={handleCancelConfirm}
                  className="py-4 sm:py-5 px-4 bg-white hover:bg-slate-100 text-slate-700 font-black text-lg sm:text-xl rounded-2xl border-3 border-slate-300 transition-colors text-center cursor-pointer active:scale-95 shadow-xs"
                >
                  いいえ (戻る)
                </button>

                <button
                  type="button"
                  onClick={handleConfirmPunch}
                  className={`py-4 sm:py-5 px-4 ${typeConfig[confirmingType].bg} ${typeConfig[confirmingType].hoverBg} text-white font-black text-xl sm:text-2xl rounded-2xl shadow-xl transition-transform active:scale-95 text-center flex items-center justify-center gap-2 cursor-pointer border-3 ${typeConfig[confirmingType].border}`}
                >
                  <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7" />
                  <span>はい ({typeConfig[confirmingType].verb})</span>
                </button>
              </div>
            </div>
          ) : (
            /* HUGE Punch Buttons: 出勤 and 退勤 ONLY */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:gap-5">
                {/* Massive Clock In Button */}
                <button
                  type="button"
                  onClick={() => handleSelectType('clock_in')}
                  className="py-8 sm:py-10 px-4 rounded-3xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black shadow-xl transition-all flex flex-col items-center justify-center gap-3 border-4 border-emerald-700 cursor-pointer group"
                >
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <LogIn className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </div>
                  <span className="text-3xl sm:text-4xl tracking-wider">出　勤</span>
                  <span className="text-sm sm:text-base font-bold text-emerald-100 bg-emerald-700/60 px-3 py-1 rounded-full">
                    仕事を始めるとき
                  </span>
                </button>

                {/* Massive Clock Out Button */}
                <button
                  type="button"
                  onClick={() => handleSelectType('clock_out')}
                  className="py-8 sm:py-10 px-4 rounded-3xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black shadow-xl transition-all flex flex-col items-center justify-center gap-3 border-4 border-rose-700 cursor-pointer group"
                >
                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <LogOut className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </div>
                  <span className="text-3xl sm:text-4xl tracking-wider">退　勤</span>
                  <span className="text-sm sm:text-base font-bold text-rose-100 bg-rose-700/60 px-3 py-1 rounded-full">
                    仕事が終わったとき
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Mistake Correction Button */}
          <div className="pt-2 border-t-2 border-slate-200">
            <button
              type="button"
              onClick={() => {
                onOpenEdit(employee);
                onClose();
              }}
              className="w-full py-3.5 px-4 bg-slate-50 hover:bg-slate-100 active:scale-98 text-slate-700 text-sm sm:text-base font-bold rounded-2xl border-2 border-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Edit3 className="w-5 h-5 text-indigo-600" />
              <span>間違えて押しちゃったとき（時刻の修正・取り消し）</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
