import React, { useState } from 'react';
import { X, Save, Trash2, Edit3, AlertTriangle, Clock } from 'lucide-react';
import { AttendanceRecord, Employee } from '../types/attendance';

interface RecordEditModalProps {
  isOpen: boolean;
  employee: Employee | null;
  initialRecord?: AttendanceRecord | null;
  targetDate: string; // YYYY-MM-DD
  onSave: (updatedRecord: AttendanceRecord) => void;
  onDelete?: (recordId: string) => void;
  onClose: () => void;
}

export const RecordEditModal: React.FC<RecordEditModalProps> = ({
  isOpen,
  employee,
  initialRecord,
  targetDate,
  onSave,
  onDelete,
  onClose,
}) => {
  if (!isOpen || !employee) return null;

  const [date, setDate] = useState(initialRecord?.date || targetDate);
  const [clockIn, setClockIn] = useState(initialRecord?.clockIn ? initialRecord.clockIn.slice(0, 5) : '09:00');
  const [clockOut, setClockOut] = useState(initialRecord?.clockOut ? initialRecord.clockOut.slice(0, 5) : '18:00');
  const [hasClockOut, setHasClockOut] = useState(Boolean(initialRecord?.clockOut || !initialRecord));
  const [breakMinutes, setBreakMinutes] = useState(initialRecord?.breakMinutes ?? 60);
  const [reasonCategory, setReasonCategory] = useState('押し間違いの修正');
  const [customReason, setCustomReason] = useState(initialRecord?.modificationReason || '');
  const [note, setNote] = useState(initialRecord?.note || '');

  const quickReasons = [
    '押し間違いの修正',
    '打刻漏れによる事後修正',
    '直行直帰のため手動登録',
    '残業申請に基づく修正',
    '誤操作による取り消し・変更',
  ];

  const handleSave = () => {
    const finalReason = customReason.trim()
      ? `${reasonCategory}: ${customReason.trim()}`
      : reasonCategory;

    const recordToSave: AttendanceRecord = {
      id: initialRecord?.id || `rec-${employee.id}-${date}`,
      employeeId: employee.id,
      date,
      clockIn: clockIn || undefined,
      clockOut: hasClockOut && clockOut ? clockOut : undefined,
      breakMinutes: Number(breakMinutes) || 0,
      note: note.trim() || undefined,
      isModified: true,
      modifiedAt: new Date().toISOString(),
      modificationReason: finalReason,
      createdVia: 'manual',
    };

    onSave(recordToSave);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">勤怠打刻データの修正・手動登録</h2>
              <p className="text-xs text-slate-400">
                押し間違いや打刻漏れの時刻・内容を修正できます
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Employee badge */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className={`w-10 h-10 rounded-xl ${employee.avatarColor} text-white font-bold flex items-center justify-center`}>
              {employee.name.charAt(0)}
            </div>
            <div>
              <span className="text-xs font-mono text-slate-500">{employee.code} · {employee.department}</span>
              <div className="font-bold text-slate-900">{employee.name}</div>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              対象年月日
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* In / Out times */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-emerald-800 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                出勤時刻
              </label>
              <input
                type="time"
                value={clockIn}
                onChange={(e) => setClockIn(e.target.value)}
                className="w-full px-3 py-2 text-base font-mono font-semibold border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-rose-800 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  退勤時刻
                </label>
                <label className="text-[11px] text-slate-500 flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasClockOut}
                    onChange={(e) => setHasClockOut(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  退勤打刻あり
                </label>
              </div>
              <input
                type="time"
                value={clockOut}
                disabled={!hasClockOut}
                onChange={(e) => setClockOut(e.target.value)}
                className={`w-full px-3 py-2 text-base font-mono font-semibold border rounded-lg focus:ring-2 focus:outline-none ${
                  hasClockOut
                    ? 'border-slate-300 focus:ring-rose-500 text-slate-900'
                    : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          {/* Break Duration */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              休憩時間 (分)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="480"
                step="5"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-32 px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-xs text-slate-500">分（標準: 60分）</span>
              <div className="flex gap-1 ml-auto">
                {[0, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setBreakMinutes(mins)}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      breakMinutes === mins
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {mins}分
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reason for Modification */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              修正・変更の理由
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickReasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReasonCategory(r)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    reasonCategory === r
                      ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="詳細メモ（例: 誤って退勤ボタンを押してしまったため取り消し修正）"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* General Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              業務備考 (任意)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="有給休暇取得、半休、出張など"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {initialRecord?.isModified && (
            <div className="p-2.5 bg-slate-100 rounded-lg text-slate-600 text-xs">
              <p className="font-semibold text-slate-700">過去の修正履歴あり:</p>
              <p className="text-slate-500 mt-0.5">{initialRecord.modificationReason || '手動修正'}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div>
            {initialRecord && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('この日の打刻記録を完全に削除しますか？')) {
                    onDelete(initialRecord.id);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>記録を削除</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              閉じる
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-500/25 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>修正を保存する</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
