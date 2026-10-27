import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  FileText,
  User,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { AttendanceRecord, Employee, WorkSettings } from '../types/attendance';
import {
  exportMonthlySummaryToExcel,
  exportFullCompanyWorkbook,
  exportEmployeeDetailToExcel,
  exportMonthlySummaryToCSV,
} from '../utils/excelExport';
import {
  calculateEmployeeMonthlySummary,
  minutesToDecimalHours,
  minutesToTimeString,
} from '../utils/timeCalculations';

interface ExcelExportPanelProps {
  employees: Employee[];
  records: AttendanceRecord[];
  settings: WorkSettings;
}

export const ExcelExportPanel: React.FC<ExcelExportPanelProps> = ({
  employees,
  records,
  settings,
}) => {
  const [yearMonth, setYearMonth] = useState('2026-10');
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  const activeEmployees = employees.filter(e => e.isActive);
  const selectedEmp = employees.find(e => e.id === selectedEmpId) || employees[0];

  const notifyExport = (msg: string) => {
    setExportSuccessMessage(msg);
    setTimeout(() => setExportSuccessMessage(null), 5000);
  };

  const handleExportSummaryExcel = () => {
    exportMonthlySummaryToExcel(yearMonth, employees, records, settings);
    notifyExport(`「${yearMonth} 月次勤怠集計一覧.xlsx」を出力しました。`);
  };

  const handleExportFullWorkbook = () => {
    exportFullCompanyWorkbook(yearMonth, employees, records, settings);
    notifyExport(`「${yearMonth} 全社勤怠台帳一括（全社員シート付き）.xlsx」を出力しました。`);
  };

  const handleExportEmployeeExcel = () => {
    if (!selectedEmp) return;
    exportEmployeeDetailToExcel(selectedEmp, yearMonth, records, settings);
    notifyExport(`「${selectedEmp.name}様 ${yearMonth} タイムカード.xlsx」を出力しました。`);
  };

  const handleExportCSV = () => {
    exportMonthlySummaryToCSV(yearMonth, employees, records, settings);
    notifyExport(`「${yearMonth} 勤怠データ.csv」を出力しました。`);
  };

  // Preview data
  const previewSummaries = activeEmployees.slice(0, 5).map(emp => {
    return calculateEmployeeMonthlySummary(emp, yearMonth, records, settings);
  });

  return (
    <div className="space-y-6">
      {/* Header notice */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>Excel (.xlsx) / CSV 出力センター</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            出勤・退勤時刻、休憩、総労働時間、残業時間、深夜時間を集計したエクセルファイルをワンクリックで出力できます
          </p>
        </div>

        {/* Target Month */}
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <Calendar className="w-4 h-4 text-slate-500" />
          <label className="text-xs font-semibold text-slate-700">対象年月:</label>
          <input
            type="month"
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Success Notification */}
      {exportSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-bold animate-slide-down">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{exportSuccessMessage}</span>
        </div>
      )}

      {/* Export Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Monthly Summary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs flex flex-col justify-between transition-all group">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">月次勤怠集計一覧</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              全{activeEmployees.length}名の出勤日数、総実働時間、残業時間、深夜時間を1枚にまとめた月次サマリー表です。
            </p>
          </div>
          <button
            onClick={handleExportSummaryExcel}
            className="mt-4 w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Excel出力 (.xlsx)</span>
          </button>
        </div>

        {/* Card 2: Full multi-sheet Workbook */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-xs flex flex-col justify-between transition-all group">
          <div>
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">全社員一括台帳ブック</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              集計サマリーシートに加え、全社員20名分の個人別日次タイムカードシートが1つのExcelブックにまとまっています。
            </p>
          </div>
          <button
            onClick={handleExportFullWorkbook}
            className="mt-4 w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>一括ブック出力 (.xlsx)</span>
          </button>
        </div>

        {/* Card 3: Single Employee Detail */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-sky-300 shadow-xs flex flex-col justify-between transition-all group">
          <div>
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <User className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">個別社員タイムカード</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              選択した特定の従業員の1か月分の日別打刻・残業・修正履歴を記載したタイムカード台帳です。
            </p>
            <div className="mt-2.5">
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {activeEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleExportEmployeeExcel}
            className="mt-4 w-full py-2.5 px-3 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-600/20 flex items-center justify-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>個人票出力 (.xlsx)</span>
          </button>
        </div>

        {/* Card 4: CSV Export */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-slate-400 shadow-xs flex flex-col justify-between transition-all group">
          <div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">CSVデータ出力 (BOM付)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              給与計算ソフトや他社システムへの連携用です。UTF-8 BOM付きのため、Excelでダブルクリックしても文字化けしません。
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="mt-4 w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>CSV出力 (.csv)</span>
          </button>
        </div>
      </div>

      {/* Export Preview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            出力データのプレビュー (抜粋) - {yearMonth}
          </h4>
          <span className="text-[11px] text-slate-500">
            ※Excelファイル内には全{activeEmployees.length}名分のデータが完全に出力されます
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">社員番号</th>
                <th className="px-4 py-2.5">氏名</th>
                <th className="px-3 py-2.5">部署</th>
                <th className="px-3 py-2.5 text-center">出勤日数</th>
                <th className="px-3 py-2.5 text-center">総実働(h)</th>
                <th className="px-3 py-2.5 text-center">所定内(h)</th>
                <th className="px-3 py-2.5 text-center text-amber-700">残業(h)</th>
                <th className="px-3 py-2.5 text-center">残業(時:分)</th>
                <th className="px-3 py-2.5 text-center">深夜(h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {previewSummaries.map((s) => (
                <tr key={s.employee.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono text-slate-600">{s.employee.code}</td>
                  <td className="px-4 py-2 font-bold text-slate-900">{s.employee.name}</td>
                  <td className="px-3 py-2 text-slate-600">{s.employee.department}</td>
                  <td className="px-3 py-2 text-center font-bold">{s.workDays}日</td>
                  <td className="px-3 py-2 text-center font-mono font-bold text-indigo-600">
                    {minutesToDecimalHours(s.totalWorkMinutes)}
                  </td>
                  <td className="px-3 py-2 text-center font-mono">
                    {minutesToDecimalHours(s.regularMinutes)}
                  </td>
                  <td className="px-3 py-2 text-center font-mono font-bold text-amber-600">
                    {minutesToDecimalHours(s.overtimeMinutes)}
                  </td>
                  <td className="px-3 py-2 text-center font-mono text-slate-600">
                    {minutesToTimeString(s.overtimeMinutes)}
                  </td>
                  <td className="px-3 py-2 text-center font-mono text-purple-600">
                    {minutesToDecimalHours(s.lateNightMinutes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
