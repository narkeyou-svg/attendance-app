import React, { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit2,
  Plus,
  AlertCircle,
  Clock,
  CheckCircle2,
  Building,
  User,
} from 'lucide-react';
import { AttendanceRecord, Employee, WorkSettings } from '../types/attendance';
import {
  calculateEmployeeMonthlySummary,
  minutesToTimeString,
  minutesToDecimalHours,
} from '../utils/timeCalculations';
import { exportEmployeeDetailToExcel } from '../utils/excelExport';
import { RecordEditModal } from './RecordEditModal';

interface TimecardViewProps {
  employees: Employee[];
  records: AttendanceRecord[];
  settings: WorkSettings;
  selectedEmployeeId?: string;
  onSaveRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (recordId: string) => void;
}

export const TimecardView: React.FC<TimecardViewProps> = ({
  employees,
  records,
  settings,
  selectedEmployeeId: initialEmployeeId,
  onSaveRecord,
  onDeleteRecord,
}) => {
  const [currentEmpId, setCurrentEmpId] = useState<string>(
    initialEmployeeId || (employees[0] ? employees[0].id : '')
  );
  const [yearMonth, setYearMonth] = useState<string>('2026-10');

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [targetDate, setTargetDate] = useState<string>('');
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  const employee = employees.find(e => e.id === currentEmpId) || employees[0];
  if (!employee) {
    return <div className="p-6 text-center text-slate-500">従業員が登録されていません。</div>;
  }

  const summary = calculateEmployeeMonthlySummary(employee, yearMonth, records, settings);

  // Month navigation
  const handlePrevMonth = () => {
    const [y, m] = yearMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const newY = prevDate.getFullYear();
    const newM = (prevDate.getMonth() + 1).toString().padStart(2, '0');
    setYearMonth(`${newY}-${newM}`);
  };

  const handleNextMonth = () => {
    const [y, m] = yearMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const newY = nextDate.getFullYear();
    const newM = (nextDate.getMonth() + 1).toString().padStart(2, '0');
    setYearMonth(`${newY}-${newM}`);
  };

  // Open edit modal for specific date
  const handleEditRow = (dateStr: string) => {
    const existing = records.find(r => r.employeeId === employee.id && r.date === dateStr) || null;
    setEditingRecord(existing);
    setTargetDate(dateStr);
    setEditModalOpen(true);
  };

  // Open add new record
  const handleAddNew = () => {
    setEditingRecord(null);
    setTargetDate(`${yearMonth}-01`);
    setEditModalOpen(true);
  };

  // Export this employee
  const handleExportExcel = () => {
    exportEmployeeDetailToExcel(employee, yearMonth, records, settings);
  };

  return (
    <div className="space-y-5">
      {/* Top Filter and Switcher Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Employee Switcher */}
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl ${employee.avatarColor} text-white font-bold flex items-center justify-center shadow-xs flex-shrink-0`}>
            {employee.name.charAt(0)}
          </div>
          <div className="flex-1 sm:flex-initial">
            <label className="block text-[11px] text-slate-500 font-medium">対象の従業員を選択</label>
            <select
              value={employee.id}
              onChange={(e) => setCurrentEmpId(e.target.value)}
              className="text-base font-bold text-slate-900 bg-transparent border-b-2 border-indigo-500 py-0.5 focus:outline-none cursor-pointer"
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.code} - {emp.name} ({emp.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Month selector & Excel download */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Stepper */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:shadow-xs transition-all"
              title="前月"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-mono font-bold text-sm text-slate-800">
              {yearMonth}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:shadow-xs transition-all"
              title="翌月"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Add Manual record */}
          <button
            onClick={handleAddNew}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>打刻の手動追加</span>
          </button>

          {/* Export button */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Excel出力 (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Monthly Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">出勤日数</div>
          <div className="text-xl font-black text-slate-900 mt-1">
            {summary.workDays} <span className="text-xs font-normal text-slate-500">日</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">総実働時間</div>
          <div className="text-xl font-black text-indigo-600 mt-1">
            {minutesToTimeString(summary.totalWorkMinutes)}
            <span className="text-xs font-normal text-slate-500 ml-1">
              ({minutesToDecimalHours(summary.totalWorkMinutes)}h)
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">所定内時間</div>
          <div className="text-xl font-black text-slate-700 mt-1">
            {minutesToTimeString(summary.regularMinutes)}
            <span className="text-xs font-normal text-slate-500 ml-1">
              ({minutesToDecimalHours(summary.regularMinutes)}h)
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between">
            <span>時間外残業</span>
            {summary.overtimeMinutes > settings.monthlyOvertimeWarningHours * 60 && (
              <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded">超過注意</span>
            )}
          </div>
          <div className={`text-xl font-black mt-1 ${
            summary.overtimeMinutes > settings.monthlyOvertimeWarningHours * 60 ? 'text-rose-600' : 'text-amber-600'
          }`}>
            {minutesToTimeString(summary.overtimeMinutes)}
            <span className="text-xs font-normal text-slate-500 ml-1">
              ({minutesToDecimalHours(summary.overtimeMinutes)}h)
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">深夜労働時間</div>
          <div className="text-xl font-black text-purple-600 mt-1">
            {minutesToTimeString(summary.lateNightMinutes)}
            <span className="text-xs font-normal text-slate-500 ml-1">
              ({minutesToDecimalHours(summary.lateNightMinutes)}h)
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] text-slate-500 font-medium">打刻不備日数</div>
          <div className={`text-xl font-black mt-1 ${summary.incompleteDays > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {summary.incompleteDays} <span className="text-xs font-normal text-slate-500">日</span>
          </div>
        </div>
      </div>

      {/* Daily Timecard Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-800">
              {yearMonth} 勤怠台帳詳細 (日別)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            各行の「修正」ボタンを押すと、時刻や休憩時間を編集できます
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">日付</th>
                <th className="px-2 py-3 text-center">曜日</th>
                <th className="px-3 py-3 text-center text-emerald-800">出勤</th>
                <th className="px-3 py-3 text-center text-rose-800">退勤</th>
                <th className="px-3 py-3 text-center">休憩</th>
                <th className="px-3 py-3 text-center text-indigo-900">実働</th>
                <th className="px-3 py-3 text-center text-amber-800">残業</th>
                <th className="px-3 py-3 text-center">深夜</th>
                <th className="px-3 py-3">状態</th>
                <th className="px-4 py-3">備考・修正理由</th>
                <th className="px-3 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.dailyCalculations.map((day) => {
                const isSaturday = day.dayOfWeek === '土';
                const isSunday = day.dayOfWeek === '日';
                const isOffDay = isSaturday || isSunday;

                return (
                  <tr
                    key={day.date}
                    className={`hover:bg-slate-50 transition-colors ${
                      isSaturday ? 'bg-blue-50/30' : (isSunday ? 'bg-red-50/30' : '')
                    }`}
                  >
                    <td className="px-4 py-2.5 font-mono font-medium text-slate-800">
                      {day.date.slice(5)}
                    </td>
                    <td className="px-2 py-2.5 text-center font-bold">
                      <span className={`px-1.5 py-0.5 rounded text-[11px] ${
                        isSaturday ? 'text-blue-700 bg-blue-100' : (isSunday ? 'text-red-700 bg-red-100' : 'text-slate-600')
                      }`}>
                        {day.dayOfWeek}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-semibold text-emerald-700">
                      {day.clockIn || '--:--'}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-semibold text-rose-700">
                      {day.clockOut || '--:--'}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-slate-600">
                      {day.breakMinutes > 0 ? `${day.breakMinutes}分` : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold text-indigo-700">
                      {day.totalWorkMinutes > 0 ? minutesToTimeString(day.totalWorkMinutes) : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold text-amber-600">
                      {day.overtimeMinutes > 0 ? minutesToTimeString(day.overtimeMinutes) : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center font-mono text-purple-600">
                      {day.lateNightMinutes > 0 ? minutesToTimeString(day.lateNightMinutes) : '-'}
                    </td>
                    <td className="px-3 py-2.5">
                      {day.status === 'present' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          出勤
                        </span>
                      )}
                      {day.status === 'incomplete' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          打刻不備
                        </span>
                      )}
                      {day.status === 'weekend' && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          休日
                        </span>
                      )}
                      {day.status === 'absent' && (
                        <span className="text-[10px] text-slate-400">
                          -
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-[11px] text-slate-600 max-w-xs truncate">
                      {day.isModified && (
                        <span className="inline-block mr-1.5 px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold rounded text-[10px]">
                          修正済
                        </span>
                      )}
                      <span>{day.note || ''}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => handleEditRow(day.date)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>修正</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Edit Modal */}
      <RecordEditModal
        isOpen={editModalOpen}
        employee={employee}
        initialRecord={editingRecord}
        targetDate={targetDate}
        onSave={(updated) => {
          onSaveRecord(updated);
          setEditModalOpen(false);
        }}
        onDelete={(id) => {
          onDeleteRecord(id);
          setEditModalOpen(false);
        }}
        onClose={() => setEditModalOpen(false)}
      />
    </div>
  );
};
