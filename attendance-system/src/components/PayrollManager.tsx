import React, { useState } from 'react';
import {
  Calculator,
  Download,
  AlertTriangle,
  CheckCircle,
  Printer,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  User,
  Clock,
  ArrowRight,
  Edit2,
  DollarSign,
} from 'lucide-react';
import { AttendanceRecord, Employee, WorkSettings } from '../types/attendance';
import {
  calculateEmployeeMonthlySummary,
  minutesToDecimalHours,
  minutesToTimeString,
  getDateRangeForPeriod,
} from '../utils/timeCalculations';
import { exportPayrollCalculationExcel, exportPayrollSoftwareCSV } from '../utils/excelExport';
import { RecordEditModal } from './RecordEditModal';

interface PayrollManagerProps {
  employees: Employee[];
  records: AttendanceRecord[];
  settings: WorkSettings;
  onUpdateSettings: (settings: WorkSettings) => void;
  onSaveRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (recordId: string) => void;
}

export const PayrollManager: React.FC<PayrollManagerProps> = ({
  employees,
  records,
  settings,
  onUpdateSettings,
  onSaveRecord,
  onDeleteRecord,
}) => {
  const [yearMonth, setYearMonth] = useState('2026-10');
  const [activeTab, setActiveTab] = useState<'summary' | 'errors' | 'paper_card'>('summary');
  const [selectedCardEmpId, setSelectedCardEmpId] = useState(employees[0]?.id || '');

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [targetDate, setTargetDate] = useState<string>('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  const activeEmployees = employees.filter(e => e.isActive);
  const { startDate, endDate } = getDateRangeForPeriod(yearMonth, settings.closingDay);

  // Calculate summaries for all
  const summaries = activeEmployees.map(emp => {
    return calculateEmployeeMonthlySummary(emp, yearMonth, records, settings);
  });

  // Collect all incomplete days (missing in or out) across the entire company for this period
  const errorItems: Array<{
    employee: Employee;
    date: string;
    dayOfWeek: string;
    clockIn?: string;
    clockOut?: string;
    reason: string;
    recordId?: string;
  }> = [];

  summaries.forEach(s => {
    s.dailyCalculations.forEach(d => {
      if (d.status === 'incomplete') {
        let reason = '打刻不備';
        if (d.clockIn && !d.clockOut) reason = '出勤打刻のみ（退勤忘れ）';
        else if (!d.clockIn && d.clockOut) reason = '退勤打刻のみ（出勤忘れ）';

        const rec = records.find(r => r.employeeId === s.employee.id && r.date === d.date);

        errorItems.push({
          employee: s.employee,
          date: d.date,
          dayOfWeek: d.dayOfWeek,
          clockIn: d.clockIn,
          clockOut: d.clockOut,
          reason,
          recordId: rec?.id,
        });
      }
    });
  });

  // Totals for payroll
  let totalCompanyWorkMinutes = 0;
  let totalCompanyOvertimeMinutes = 0;
  let totalCompanyOvertimePay = 0;
  let totalCompanyEstimatedPay = 0;

  summaries.forEach(s => {
    totalCompanyWorkMinutes += s.totalWorkMinutes;
    totalCompanyOvertimeMinutes += s.overtimeMinutes;
    totalCompanyOvertimePay += s.estimatedOvertimePay;
    totalCompanyEstimatedPay += s.estimatedTotalPay;
  });

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

  // Open correction modal
  const handleOpenFix = (emp: Employee, dateStr: string) => {
    const existing = records.find(r => r.employeeId === emp.id && r.date === dateStr) || null;
    setEditingEmployee(emp);
    setEditingRecord(existing);
    setTargetDate(dateStr);
    setEditModalOpen(true);
  };

  // Export handlers
  const handleExportExcel = () => {
    exportPayrollCalculationExcel(yearMonth, employees, records, settings);
  };

  const handleExportCSV = () => {
    exportPayrollSoftwareCSV(yearMonth, employees, records, settings);
  };

  // Print paper timecard
  const handlePrint = () => {
    window.print();
  };

  const selectedCardEmployee = employees.find(e => e.id === selectedCardEmpId) || employees[0];
  const selectedCardSummary = selectedCardEmployee
    ? calculateEmployeeMonthlySummary(selectedCardEmployee, yearMonth, records, settings)
    : null;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
              <Calculator className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900">
              給与計算・締め処理センター
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            タイムカードの時間を自動集計し、各人の実働・残業（1.25倍手当）・深夜時間を算出して給与計算を効率化します
          </p>
        </div>

        {/* Closing day and Month */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Closing day selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-600">給与締め日:</span>
            <select
              value={settings.closingDay}
              onChange={(e) => onUpdateSettings({ ...settings, closingDay: e.target.value as WorkSettings['closingDay'] })}
              className="font-bold text-slate-800 bg-white border border-slate-300 rounded px-2 py-0.5"
            >
              <option value="end_of_month">末日締め (1日〜末日)</option>
              <option value="20th">20日締め (前月21日〜20日)</option>
              <option value="25th">25日締め (前月26日〜25日)</option>
              <option value="15th">15日締め (前月16日〜15日)</option>
            </select>
          </div>

          {/* Month stepper */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:shadow-xs"
              title="前月"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-mono font-black text-sm text-slate-800">
              {yearMonth}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:shadow-xs"
              title="翌月"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Target Period Badge */}
      <div className="flex items-center justify-between text-xs font-semibold px-2 text-slate-500">
        <span>
          集計対象期間: <strong className="text-slate-800 font-mono text-sm">{startDate} 〜 {endDate}</strong>
        </span>
        <span>
          対象従業員: <strong className="text-slate-800">{activeEmployees.length}名</strong>
        </span>
      </div>

      {/* 3 Tabs: 給与集計表 / 締め前エラーチェック / 紙のタイムカード印刷 */}
      <div className="flex border-b-2 border-slate-200 space-x-2">
        <button
          onClick={() => setActiveTab('summary')}
          className={`py-3 px-4 font-bold text-sm border-b-4 -mb-[2px] transition-colors flex items-center gap-2 ${
            activeTab === 'summary'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>給与集計一覧表</span>
        </button>

        <button
          onClick={() => setActiveTab('errors')}
          className={`py-3 px-4 font-bold text-sm border-b-4 -mb-[2px] transition-colors flex items-center gap-2 ${
            activeTab === 'errors'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className={`w-4 h-4 ${errorItems.length > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
          <span>締め前打刻エラーチェック</span>
          {errorItems.length > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-700">
              {errorItems.length}件
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
              正常 0件
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('paper_card')}
          className={`py-3 px-4 font-bold text-sm border-b-4 -mb-[2px] transition-colors flex items-center gap-2 ${
            activeTab === 'paper_card'
              ? 'border-emerald-600 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>紙のタイムカード様式（A4印刷）</span>
        </button>
      </div>

      {/* TAB 1: SUMMARY TABLE */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          {/* KPI Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <div className="text-xs text-slate-500 font-bold">全社実働時間合計</div>
              <div className="text-2xl font-black text-indigo-700 font-mono mt-1">
                {minutesToDecimalHours(totalCompanyWorkMinutes)}h
              </div>
              <div className="text-[11px] text-slate-400">
                時分: {minutesToTimeString(totalCompanyWorkMinutes)}
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <div className="text-xs text-slate-500 font-bold">全社残業時間合計</div>
              <div className="text-2xl font-black text-amber-600 font-mono mt-1">
                {minutesToDecimalHours(totalCompanyOvertimeMinutes)}h
              </div>
              <div className="text-[11px] text-slate-400">法定外時間外労働分</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <div className="text-xs text-slate-500 font-bold">残業手当概算 (1.25倍)</div>
              <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
                ¥{totalCompanyOvertimePay.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-400">割増分を含む概算額</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200">
              <div className="text-xs text-slate-500 font-bold">打刻不備件数</div>
              <div className={`text-2xl font-black mt-1 ${errorItems.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {errorItems.length}件
              </div>
              <div className="text-[11px] text-slate-400">
                {errorItems.length > 0 ? '給与確定前に要修正' : 'すべて正常に記録済'}
              </div>
            </div>
          </div>

          {/* Action Download Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="text-xs text-slate-600">
              給与ソフト（弥生・freee・マネーフォワード等）への取り込みや社労士・税理士への提出用ファイルを出力できます。
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-xs transition-all"
              >
                <Download className="w-4 h-4" />
                <span>給与計算用Excel (.xlsx)</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-xs font-black rounded-xl shadow-xs transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>給与用CSV (BOM付)</span>
              </button>
            </div>
          </div>

          {/* Aggregated Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">社員番号</th>
                    <th className="px-4 py-3">氏名</th>
                    <th className="px-3 py-3">区分</th>
                    <th className="px-3 py-3 text-center">出勤日数</th>
                    <th className="px-3 py-3 text-center text-indigo-900">総実働(h)</th>
                    <th className="px-3 py-3 text-center">所定内(h)</th>
                    <th className="px-3 py-3 text-center text-amber-700 font-black">普通残業(h)</th>
                    <th className="px-3 py-3 text-center">深夜(h)</th>
                    <th className="px-3 py-3 text-right">単価/時給</th>
                    <th className="px-4 py-3 text-right text-emerald-800 font-black">残業手当(1.25倍)</th>
                    <th className="px-4 py-3 text-right font-black">概算総支給額</th>
                    <th className="px-3 py-3 text-center">状態</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summaries.map(s => {
                    const hasError = s.incompleteDays > 0;
                    return (
                      <tr key={s.employee.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-slate-600">{s.employee.code}</td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{s.employee.name}</div>
                          <div className="text-[10px] text-slate-400">{s.employee.department}</div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            s.employee.employmentType === 'part_time'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {s.employee.employmentType === 'part_time' ? 'パート' : '正社員'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center font-bold">{s.workDays}日</td>
                        <td className="px-3 py-3 text-center font-mono font-bold text-indigo-700">
                          {minutesToDecimalHours(s.totalWorkMinutes)}
                        </td>
                        <td className="px-3 py-3 text-center font-mono text-slate-600">
                          {minutesToDecimalHours(s.regularMinutes)}
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-black text-amber-600">
                          {minutesToDecimalHours(s.overtimeMinutes)}
                        </td>
                        <td className="px-3 py-3 text-center font-mono text-purple-600">
                          {s.lateNightMinutes > 0 ? minutesToDecimalHours(s.lateNightMinutes) : '-'}
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-slate-600">
                          ¥{(s.employee.hourlyWage || 1200).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                          ¥{s.estimatedOvertimePay.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-black text-slate-900">
                          ¥{s.estimatedTotalPay.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {hasError ? (
                            <button
                              onClick={() => {
                                setActiveTab('errors');
                              }}
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 hover:bg-rose-200"
                            >
                              不備あり
                            </button>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              正常
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ERROR CHECKING */}
      {activeTab === 'errors' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 rounded-2xl border-2 border-amber-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-950 text-sm">
                給与計算前の打刻漏れ・不備チェック
              </h4>
              <p className="text-xs text-amber-900 mt-1">
                紙のタイムカードでは月末に1枚ずつ確認していた「退勤の押し忘れ」「出勤の押し忘れ」を自動抽出しています。右側の「修正する」を押して正しい時刻を入力すると、即座に正しい実働・残業時間が再計算されます。
              </p>
            </div>
          </div>

          {errorItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">打刻不備はありません</h3>
              <p className="text-xs text-slate-500">
                すべての打刻データが正常に揃っています。このまま給与計算を行っていただけます。
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  確認・修正が必要な打刻 ({errorItems.length}件)
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {errorItems.map((item, idx) => (
                  <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl ${item.employee.avatarColor} text-white font-bold flex items-center justify-center text-xs flex-shrink-0`}>
                        {item.employee.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{item.employee.name}</span>
                          <span className="text-xs text-slate-500 font-mono">{item.employee.code} · {item.employee.department}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span className="font-mono font-bold text-slate-800">{item.date} ({item.dayOfWeek})</span>
                          <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            {item.reason}
                          </span>
                          <span className="text-slate-500">
                            出勤: {item.clockIn || 'なし'} / 退勤: {item.clockOut || 'なし'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenFix(item.employee, item.date)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex-shrink-0"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>時刻を入力して修正</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAPER TIMECARD PRINT VIEW */}
      {activeTab === 'paper_card' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700">印刷する社員を選択:</label>
              <select
                value={selectedCardEmpId}
                onChange={(e) => setSelectedCardEmpId(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5"
              >
                {activeEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.code} - {emp.name} ({emp.department})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>A4用紙に印刷 (またはPDF保存)</span>
            </button>
          </div>

          {/* Printable Timecard Sheet */}
          {selectedCardEmployee && selectedCardSummary && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-300 shadow-sm max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
              {/* Sheet Header */}
              <div className="border-b-2 border-slate-800 pb-4 mb-4 flex items-start justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    出勤簿 (タイムカード台帳)
                  </h1>
                  <p className="text-xs text-slate-600 mt-1">
                    {settings.companyName}　対象年月度：{yearMonth}
                  </p>
                </div>

                {/* Hanko / Approval box */}
                <div className="flex border border-slate-400 text-center text-[10px]">
                  <div className="border-r border-slate-400 w-16">
                    <div className="bg-slate-100 py-0.5 font-bold border-b border-slate-400">管理者</div>
                    <div className="h-12 flex items-center justify-center text-slate-300">印</div>
                  </div>
                  <div className="border-r border-slate-400 w-16">
                    <div className="bg-slate-100 py-0.5 font-bold border-b border-slate-400">担当者</div>
                    <div className="h-12 flex items-center justify-center text-slate-300">印</div>
                  </div>
                  <div className="w-16">
                    <div className="bg-slate-100 py-0.5 font-bold border-b border-slate-400">本人</div>
                    <div className="h-12 flex items-center justify-center text-slate-300">印</div>
                  </div>
                </div>
              </div>

              {/* Employee info header */}
              <div className="grid grid-cols-4 gap-2 text-xs border border-slate-300 p-2.5 bg-slate-50 mb-4">
                <div>社員番号: <strong className="font-mono">{selectedCardEmployee.code}</strong></div>
                <div>氏名: <strong className="text-sm">{selectedCardEmployee.name}</strong></div>
                <div>所属: <strong>{selectedCardEmployee.department}</strong></div>
                <div>締め期間: <span className="font-mono">{selectedCardSummary.startDate} 〜 {selectedCardSummary.endDate}</span></div>
              </div>

              {/* Daily Table */}
              <table className="w-full text-center text-[11px] border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-400 py-1 px-1 w-10">日</th>
                    <th className="border border-slate-400 py-1 px-1 w-8">曜</th>
                    <th className="border border-slate-400 py-1 px-1.5 w-16">出勤</th>
                    <th className="border border-slate-400 py-1 px-1.5 w-16">退勤</th>
                    <th className="border border-slate-400 py-1 px-1.5 w-12">休憩</th>
                    <th className="border border-slate-400 py-1 px-1.5 w-16">実働</th>
                    <th className="border border-slate-400 py-1 px-1.5 w-16 font-bold">残業</th>
                    <th className="border border-slate-400 py-1 px-1.5 w-14">深夜</th>
                    <th className="border border-slate-400 py-1 px-2 text-left">備考・修正理由</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCardSummary.dailyCalculations.map(day => (
                    <tr key={day.date} className={day.isWeekend ? 'bg-slate-50' : ''}>
                      <td className="border border-slate-300 py-0.5 font-mono">{day.date.slice(8)}</td>
                      <td className={`border border-slate-300 py-0.5 font-bold ${
                        day.dayOfWeek === '土' ? 'text-blue-700' : (day.dayOfWeek === '日' ? 'text-red-700' : '')
                      }`}>
                        {day.dayOfWeek}
                      </td>
                      <td className="border border-slate-300 py-0.5 font-mono">{day.clockIn || ''}</td>
                      <td className="border border-slate-300 py-0.5 font-mono">{day.clockOut || ''}</td>
                      <td className="border border-slate-300 py-0.5 font-mono">{day.breakMinutes > 0 ? `${day.breakMinutes}分` : ''}</td>
                      <td className="border border-slate-300 py-0.5 font-mono font-bold">
                        {day.totalWorkMinutes > 0 ? minutesToTimeString(day.totalWorkMinutes) : ''}
                      </td>
                      <td className="border border-slate-300 py-0.5 font-mono font-bold">
                        {day.overtimeMinutes > 0 ? minutesToTimeString(day.overtimeMinutes) : ''}
                      </td>
                      <td className="border border-slate-300 py-0.5 font-mono">
                        {day.lateNightMinutes > 0 ? minutesToTimeString(day.lateNightMinutes) : ''}
                      </td>
                      <td className="border border-slate-300 py-0.5 px-2 text-left text-[10px] truncate max-w-xs">
                        {day.note || (day.isModified ? '修正済' : '')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Monthly Totals Footer */}
              <div className="mt-3 border border-slate-400 p-3 bg-slate-50 grid grid-cols-4 gap-2 text-xs">
                <div>出勤日数: <strong>{selectedCardSummary.workDays} 日</strong></div>
                <div>総実働時間: <strong>{minutesToDecimalHours(selectedCardSummary.totalWorkMinutes)} 時間</strong></div>
                <div>時間外残業: <strong className="text-amber-700">{minutesToDecimalHours(selectedCardSummary.overtimeMinutes)} 時間</strong></div>
                <div>深夜労働: <strong>{minutesToDecimalHours(selectedCardSummary.lateNightMinutes)} 時間</strong></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Record Edit Modal */}
      {editingEmployee && (
        <RecordEditModal
          isOpen={editModalOpen}
          employee={editingEmployee}
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
      )}
    </div>
  );
};
