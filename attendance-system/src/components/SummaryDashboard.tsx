import React, { useState } from 'react';
import {
  Users,
  Clock,
  AlertTriangle,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  ArrowUpDown,
  Building,
} from 'lucide-react';
import { AttendanceRecord, Employee, WorkSettings } from '../types/attendance';
import {
  calculateEmployeeMonthlySummary,
  minutesToTimeString,
  minutesToDecimalHours,
} from '../utils/timeCalculations';
import { exportMonthlySummaryToExcel } from '../utils/excelExport';

interface SummaryDashboardProps {
  employees: Employee[];
  records: AttendanceRecord[];
  settings: WorkSettings;
  onOpenEmployeeTimecard: (employeeId: string) => void;
}

export const SummaryDashboard: React.FC<SummaryDashboardProps> = ({
  employees,
  records,
  settings,
  onOpenEmployeeTimecard,
}) => {
  const [yearMonth, setYearMonth] = useState<string>('2026-10');
  const [sortField, setSortField] = useState<'code' | 'name' | 'workDays' | 'totalHours' | 'overtimeHours'>('overtimeHours');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [selectedDept, setSelectedDept] = useState<string>('all');

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

  const activeEmployees = employees.filter(e => e.isActive);

  // Compute summary for all active employees
  const allSummaries = activeEmployees.map(emp => {
    return calculateEmployeeMonthlySummary(emp, yearMonth, records, settings);
  });

  // Calculate totals
  let companyTotalWorkMinutes = 0;
  let companyTotalOvertimeMinutes = 0;
  let highOvertimeCount = 0;
  let totalIncompleteDays = 0;

  allSummaries.forEach(s => {
    companyTotalWorkMinutes += s.totalWorkMinutes;
    companyTotalOvertimeMinutes += s.overtimeMinutes;
    if (s.overtimeMinutes > settings.monthlyOvertimeWarningHours * 60) {
      highOvertimeCount++;
    }
    totalIncompleteDays += s.incompleteDays;
  });

  const avgOvertimeHours = activeEmployees.length > 0
    ? minutesToDecimalHours(companyTotalOvertimeMinutes / activeEmployees.length)
    : 0;

  // Department aggregation
  const deptMap = new Map<string, { count: number; totalMins: number; otMins: number }>();
  allSummaries.forEach(s => {
    const d = s.employee.department;
    const curr = deptMap.get(d) || { count: 0, totalMins: 0, otMins: 0 };
    curr.count++;
    curr.totalMins += s.totalWorkMinutes;
    curr.otMins += s.overtimeMinutes;
    deptMap.set(d, curr);
  });

  const departmentList = ['all', ...Array.from(deptMap.keys())];

  // Filter & Sort
  const filteredSummaries = allSummaries.filter(s => {
    if (selectedDept !== 'all' && s.employee.department !== selectedDept) return false;
    return true;
  });

  filteredSummaries.sort((a, b) => {
    let diff = 0;
    if (sortField === 'code') diff = a.employee.code.localeCompare(b.employee.code);
    else if (sortField === 'name') diff = a.employee.name.localeCompare(b.employee.name);
    else if (sortField === 'workDays') diff = a.workDays - b.workDays;
    else if (sortField === 'totalHours') diff = a.totalWorkMinutes - b.totalWorkMinutes;
    else if (sortField === 'overtimeHours') diff = a.overtimeMinutes - b.overtimeMinutes;
    return sortAsc ? diff : -diff;
  });

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default descending
    }
  };

  const handleDownloadExcel = () => {
    exportMonthlySummaryToExcel(yearMonth, employees, records, settings);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span>月次勤怠・残業集計ダッシュボード</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            全{activeEmployees.length}名の労働時間・残業・深夜労働の集計と36協定アラート
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Stepper */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:shadow-xs transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-mono font-bold text-sm text-slate-800">
              {yearMonth}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:shadow-xs transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Excel Export */}
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>集計表Excel出力 (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>対象従業員数</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {activeEmployees.length} <span className="text-xs font-normal text-slate-500">名</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">全社稼働状況</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>全社総実働時間</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            {minutesToDecimalHours(companyTotalWorkMinutes)} <span className="text-xs font-normal text-slate-500">h</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            時:分換算 {minutesToTimeString(companyTotalWorkMinutes)}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>全社総残業時間</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {minutesToDecimalHours(companyTotalOvertimeMinutes)} <span className="text-xs font-normal text-slate-500">h</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            1人あたり平均: {avgOvertimeHours}h
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>36協定アラート</span>
            <AlertTriangle className={`w-4 h-4 ${highOvertimeCount > 0 ? 'text-rose-600 animate-bounce' : 'text-slate-400'}`} />
          </div>
          <div className={`text-2xl font-black mt-1 ${highOvertimeCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {highOvertimeCount} <span className="text-xs font-normal text-slate-500">名 ({settings.monthlyOvertimeWarningHours}h超過)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            打刻不備: {totalIncompleteDays}件
          </div>
        </div>
      </div>

      {/* Department Breakdown Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Building className="w-4 h-4 text-slate-500" />
          <span>部署別の稼働・残業状況</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Array.from(deptMap.entries()).map(([dept, val]) => {
            const deptAvgOt = val.count > 0 ? minutesToDecimalHours(val.otMins / val.count) : 0;
            return (
              <div
                key={dept}
                onClick={() => setSelectedDept(dept === selectedDept ? 'all' : dept)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedDept === dept
                    ? 'bg-indigo-50 border-indigo-500 shadow-xs ring-2 ring-indigo-500/20'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold text-slate-800 truncate">{dept}</div>
                <div className="text-[11px] text-slate-500 mt-1">{val.count} 名所属</div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xs text-slate-500">残業計:</span>
                  <span className="text-sm font-black font-mono text-amber-600">
                    {minutesToDecimalHours(val.otMins)}h
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 text-right">
                  (平均 {deptAvgOt}h/人)
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Employee Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              従業員別集計一覧 ({filteredSummaries.length}名)
            </h3>
            <span className="text-xs text-slate-500">
              列見出しをクリックするとソート（並び替え）できます
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">部署絞り込み:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {departmentList.map(d => (
                <option key={d} value={d}>
                  {d === 'all' ? '全部署' : d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th
                  onClick={() => handleSort('code')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-200/60"
                >
                  <div className="flex items-center gap-1">
                    <span>社員番号</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('name')}
                  className="px-4 py-3 cursor-pointer hover:bg-slate-200/60"
                >
                  <div className="flex items-center gap-1">
                    <span>氏名</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-3 py-3">部署</th>
                <th
                  onClick={() => handleSort('workDays')}
                  className="px-3 py-3 text-center cursor-pointer hover:bg-slate-200/60"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>出勤日数</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalHours')}
                  className="px-3 py-3 text-center cursor-pointer hover:bg-slate-200/60 text-indigo-900"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>総実働時間</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-3 py-3 text-center">所定内</th>
                <th
                  onClick={() => handleSort('overtimeHours')}
                  className="px-3 py-3 text-center cursor-pointer hover:bg-slate-200/60 text-amber-800"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>時間外残業</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="px-3 py-3 text-center">深夜時間</th>
                <th className="px-3 py-3 text-center">不備</th>
                <th className="px-3 py-3">アラート</th>
                <th className="px-4 py-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSummaries.map((s) => {
                const isOvertimeWarn = s.overtimeMinutes > settings.monthlyOvertimeWarningHours * 60;
                return (
                  <tr key={s.employee.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-600">
                      {s.employee.code}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{s.employee.name}</div>
                      <div className="text-[10px] text-slate-400">{s.employee.kana}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px]">
                        {s.employee.department}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-slate-800">
                      {s.workDays}日
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-indigo-600">
                      {minutesToDecimalHours(s.totalWorkMinutes)}h
                      <span className="block text-[10px] text-slate-400 font-normal">
                        ({minutesToTimeString(s.totalWorkMinutes)})
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-slate-600">
                      {minutesToDecimalHours(s.regularMinutes)}h
                    </td>
                    <td className={`px-3 py-3 text-center font-mono font-bold ${
                      isOvertimeWarn ? 'text-rose-600' : 'text-amber-600'
                    }`}>
                      {minutesToDecimalHours(s.overtimeMinutes)}h
                      <span className="block text-[10px] text-slate-400 font-normal">
                        ({minutesToTimeString(s.overtimeMinutes)})
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center font-mono text-purple-600">
                      {s.lateNightMinutes > 0 ? `${minutesToDecimalHours(s.lateNightMinutes)}h` : '-'}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {s.incompleteDays > 0 ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                          {s.incompleteDays}件
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {isOvertimeWarn ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          超過注意
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          正常
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onOpenEmployeeTimecard(s.employee.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors whitespace-nowrap"
                      >
                        タイムカード
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
