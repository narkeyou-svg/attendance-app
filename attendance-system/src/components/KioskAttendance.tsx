import React, { useState, useEffect } from 'react';
import { RotateCcw, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AttendanceRecord, Employee, PunchLogEntry, PunchType, WorkSettings } from '../types/attendance';
import { getEmployeeCurrentStatus } from '../utils/timeCalculations';
import { sound } from '../utils/sound';
import { PunchActionModal } from './PunchActionModal';
import { RecordEditModal } from './RecordEditModal';

interface KioskAttendanceProps {
  employees: Employee[];
  records: AttendanceRecord[];
  logs: PunchLogEntry[];
  settings: WorkSettings;
  onPunch: (employeeId: string, punchType: PunchType, note?: string) => void;
  onUndoLastPunch: (logEntry: PunchLogEntry) => void;
  onSaveRecord: (record: AttendanceRecord) => void;
}

export const KioskAttendance: React.FC<KioskAttendanceProps> = ({
  employees,
  records,
  logs,
  onPunch,
  onUndoLastPunch,
  onSaveRecord,
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [punchModalOpen, setPunchModalOpen] = useState(false);

  // Edit modal (for correcting mistake)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  // Live time
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = now.toISOString().split('T')[0];
  const currentTimeStr = now.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  // Recent success notification
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const activeEmployees = employees.filter(e => e.isActive);

  // Handle employee click -> Opens the punch screen for that employee
  const handleEmployeeClick = (emp: Employee) => {
    setSelectedEmployee(emp);
    setPunchModalOpen(true);
  };

  // Perform punch from modal
  const handlePerformPunch = (employeeId: string, punchType: PunchType, note?: string) => {
    onPunch(employeeId, punchType, note);
    sound.playSuccess();

    try {
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    const typeNames: Record<PunchType, string> = {
      clock_in: '出勤',
      clock_out: '退勤',
      break_start: '休憩入り',
      break_end: '休憩戻り',
    };

    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      setSuccessNotice(`${emp.name}さんの【${typeNames[punchType]}】を記録しました。`);
      setTimeout(() => {
        setSuccessNotice(null);
      }, 7000);
    }
  };

  // Check last log for quick undo
  const activeLogs = logs.filter(l => !l.cancelled && l.date === todayStr);
  const latestLog = activeLogs.length > 0 ? activeLogs[activeLogs.length - 1] : null;

  const handleUndo = () => {
    if (!latestLog) return;
    sound.playUndo();
    onUndoLastPunch(latestLog);
    setSuccessNotice(null);
  };

  // Open edit modal directly from punch modal or mistake button
  const handleOpenEdit = (emp: Employee) => {
    const rec = records.find(r => r.employeeId === emp.id && r.date === todayStr) || null;
    setEditingEmployee(emp);
    setEditingRecord(rec);
    setEditModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Undo Alert (If someone just clocked in/out) */}
      {successNotice && (
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-3 animate-slide-down">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-extrabold text-base">{successNotice}</span>
          </div>
          {latestLog && (
            <button
              onClick={handleUndo}
              className="px-4 py-1.5 bg-white text-emerald-800 text-xs font-black rounded-xl shadow hover:bg-emerald-50 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>いまの打刻を取り消す</span>
            </button>
          )}
        </div>
      )}

      {/* 20-Employee Cards (Big, clean, large text, high contrast) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
        {activeEmployees.map(emp => {
          const empStatus = getEmployeeCurrentStatus(emp.id, todayStr, records);

          return (
            <button
              key={emp.id}
              type="button"
              onClick={() => handleEmployeeClick(emp)}
              className="bg-white hover:bg-indigo-50/50 active:scale-98 border-2 border-slate-300 hover:border-indigo-500 rounded-3xl p-4 sm:p-5 text-left transition-all shadow-xs hover:shadow-md flex flex-col justify-between min-h-[115px] sm:min-h-[130px] cursor-pointer group"
            >
              {/* Furigana */}
              <div className="text-xs text-slate-500 font-medium truncate">
                {emp.kana}
              </div>

              {/* Big Name */}
              <div className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-indigo-700 transition-colors my-1 truncate">
                {emp.name}
              </div>

              {/* Status Badge */}
              <div className="mt-1">
                {empStatus.status === 'working' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-black bg-emerald-100 text-emerald-900 border border-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    出勤中
                  </span>
                )}

                {empStatus.status === 'on_break' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-black bg-amber-100 text-amber-900 border border-amber-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-pulse"></span>
                    休憩中
                  </span>
                )}

                {empStatus.status === 'clocked_out' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-black bg-purple-100 text-purple-900 border border-purple-300">
                    退勤済
                  </span>
                )}

                {empStatus.status === 'not_clocked_in' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-bold bg-slate-100 text-slate-700 border border-slate-300">
                    未出勤
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Punch Action Modal (Opens when name is clicked) */}
      <PunchActionModal
        isOpen={punchModalOpen}
        employee={selectedEmployee}
        records={records}
        todayStr={todayStr}
        currentTimeStr={currentTimeStr}
        onPunch={handlePerformPunch}
        onOpenEdit={handleOpenEdit}
        onClose={() => setPunchModalOpen(false)}
      />

      {/* Record Edit Modal (For correcting mistake) */}
      {editingEmployee && (
        <RecordEditModal
          isOpen={editModalOpen}
          employee={editingEmployee}
          initialRecord={editingRecord}
          targetDate={todayStr}
          onSave={(updated) => {
            onSaveRecord(updated);
            setEditModalOpen(false);
          }}
          onClose={() => setEditModalOpen(false)}
        />
      )}
    </div>
  );
};
