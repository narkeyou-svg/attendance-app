import * as XLSX from 'xlsx';
import { AttendanceRecord, Employee, WorkSettings } from '../types/attendance';
import {
  calculateEmployeeMonthlySummary,
  minutesToJapaneseDuration,
  minutesToTimeString,
  minutesToDecimalHours,
  getDateRangeForPeriod,
} from './timeCalculations';

/**
 * Download a workbook as an .xlsx file in the browser
 */
function downloadWorkbook(workbook: XLSX.WorkBook, filename: string): void {
  XLSX.writeFile(workbook, filename, { bookType: 'xlsx', type: 'binary' });
}

/**
 * 1. Export company-wide monthly summary to Excel (.xlsx)
 */
export function exportMonthlySummaryToExcel(
  yearMonth: string,
  employees: Employee[],
  records: AttendanceRecord[],
  settings: WorkSettings
): void {
  const activeEmployees = employees.filter(e => e.isActive);
  const rows: Array<Record<string, string | number>> = [];

  activeEmployees.forEach(emp => {
    const summary = calculateEmployeeMonthlySummary(emp, yearMonth, records, settings);
    rows.push({
      '社員番号': emp.code,
      '氏名': emp.name,
      'ふりがな': emp.kana,
      '部署': emp.department,
      '役職': emp.role,
      '対象年月': yearMonth,
      '出勤日数': summary.workDays,
      '未打刻・不備日数': summary.incompleteDays,
      '総実働時間 (時間)': minutesToDecimalHours(summary.totalWorkMinutes),
      '総実働時間 (時:分)': minutesToTimeString(summary.totalWorkMinutes),
      '所定内労働 (時間)': minutesToDecimalHours(summary.regularMinutes),
      '時間外残業 (時間)': minutesToDecimalHours(summary.overtimeMinutes),
      '時間外残業 (時:分)': minutesToTimeString(summary.overtimeMinutes),
      '深夜労働 (時間)': minutesToDecimalHours(summary.lateNightMinutes),
      '休憩時間合計 (時間)': minutesToDecimalHours(summary.totalBreakMinutes),
      '36協定超過アラート': summary.overtimeMinutes > settings.monthlyOvertimeWarningHours * 60 ? '要対応 (超過)' : '正常',
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet['!cols'] = [
    { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
    { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `${yearMonth} 勤怠集計`);

  const filename = `勤怠集計一覧_${yearMonth}_${settings.companyName.replace(/\s+/g, '_')}.xlsx`;
  downloadWorkbook(workbook, filename);
}

/**
 * 2. Export detailed monthly timecard for a single employee
 */
export function exportEmployeeDetailToExcel(
  employee: Employee,
  yearMonth: string,
  records: AttendanceRecord[],
  settings: WorkSettings
): void {
  const summary = calculateEmployeeMonthlySummary(employee, yearMonth, records, settings);
  const rows: Array<Record<string, string | number>> = [];

  summary.dailyCalculations.forEach(day => {
    rows.push({
      '日付': day.date,
      '曜日': day.dayOfWeek,
      '出勤時刻': day.clockIn || '',
      '退勤時刻': day.clockOut || '',
      '休憩(分)': day.breakMinutes > 0 ? day.breakMinutes : '',
      '実働時間(時:分)': day.totalWorkMinutes > 0 ? minutesToTimeString(day.totalWorkMinutes) : '',
      '実働(h)': day.totalWorkMinutes > 0 ? minutesToDecimalHours(day.totalWorkMinutes) : '',
      '残業時間(時:分)': day.overtimeMinutes > 0 ? minutesToTimeString(day.overtimeMinutes) : '',
      '残業(h)': day.overtimeMinutes > 0 ? minutesToDecimalHours(day.overtimeMinutes) : '',
      '深夜(h)': day.lateNightMinutes > 0 ? minutesToDecimalHours(day.lateNightMinutes) : '',
      'ステータス': day.status === 'present' ? '出勤' : (day.status === 'incomplete' ? '打刻不備' : (day.isWeekend ? '休日' : '欠勤/休み')),
      '修正フラグ': day.isModified ? '修正済' : '',
      '備考・修正理由': day.note || '',
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet['!cols'] = [
    { wch: 12 }, { wch: 6 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 },
    { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
    { wch: 28 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `${employee.name} (${yearMonth})`);

  const filename = `タイムカード_${employee.code}_${employee.name}_${yearMonth}.xlsx`;
  downloadWorkbook(workbook, filename);
}

/**
 * 3. Export a complete multi-sheet workbook (Overview + All 20 Employees tabs)
 */
export function exportFullCompanyWorkbook(
  yearMonth: string,
  employees: Employee[],
  records: AttendanceRecord[],
  settings: WorkSettings
): void {
  const workbook = XLSX.utils.book_new();
  const activeEmployees = employees.filter(e => e.isActive);

  // Sheet 1: Summary
  const summaryRows: Array<Record<string, string | number>> = [];
  activeEmployees.forEach(emp => {
    const summary = calculateEmployeeMonthlySummary(emp, yearMonth, records, settings);
    summaryRows.push({
      '社員番号': emp.code,
      '氏名': emp.name,
      '部署': emp.department,
      '出勤日数': summary.workDays,
      '総実働時間 (h)': minutesToDecimalHours(summary.totalWorkMinutes),
      '総残業時間 (h)': minutesToDecimalHours(summary.overtimeMinutes),
      '深夜時間 (h)': minutesToDecimalHours(summary.lateNightMinutes),
      '打刻不備': summary.incompleteDays > 0 ? `${summary.incompleteDays}日` : 'なし',
      '残業アラート': summary.overtimeMinutes > settings.monthlyOvertimeWarningHours * 60 ? '注意(>45h)' : '正常',
    });
  });

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet['!cols'] = [
    { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(workbook, summarySheet, '全社勤怠サマリー');

  // Sheet 2..N: Individual Employees
  activeEmployees.forEach(emp => {
    const summary = calculateEmployeeMonthlySummary(emp, yearMonth, records, settings);
    const detailRows: Array<Record<string, string | number>> = [];

    summary.dailyCalculations.forEach(day => {
      detailRows.push({
        '日付': day.date,
        '曜日': day.dayOfWeek,
        '出勤': day.clockIn || '',
        '退勤': day.clockOut || '',
        '休憩(分)': day.breakMinutes || '',
        '実働(h)': day.totalWorkMinutes > 0 ? minutesToDecimalHours(day.totalWorkMinutes) : '',
        '残業(h)': day.overtimeMinutes > 0 ? minutesToDecimalHours(day.overtimeMinutes) : '',
        '状態': day.status === 'present' ? '出勤' : (day.isWeekend ? '休日' : (day.status === 'incomplete' ? '不備' : '欠勤')),
        '修正': day.isModified ? '修正' : '',
        '備考': day.note || '',
      });
    });

    const empSheet = XLSX.utils.json_to_sheet(detailRows);
    empSheet['!cols'] = [
      { wch: 12 }, { wch: 6 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 6 }, { wch: 20 }
    ];
    const sheetName = `${emp.code}_${emp.name}`.slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, empSheet, sheetName);
  });

  const filename = `全社勤怠台帳一括_${yearMonth}_${settings.companyName.replace(/\s+/g, '_')}.xlsx`;
  downloadWorkbook(workbook, filename);
}

/**
 * 4. Export CSV with UTF-8 BOM
 */
export function exportMonthlySummaryToCSV(
  yearMonth: string,
  employees: Employee[],
  records: AttendanceRecord[],
  settings: WorkSettings
): void {
  const activeEmployees = employees.filter(e => e.isActive);
  const headers = [
    '社員番号', '氏名', 'フリガナ', '部署', '役職', '対象年月',
    '出勤日数', '総実働時間(h)', '総残業時間(h)', '深夜時間(h)', '総休憩時間(h)', '不備日数'
  ];

  const csvRows: string[] = [];
  csvRows.push(headers.map(h => `"${h}"`).join(','));

  activeEmployees.forEach(emp => {
    const summary = calculateEmployeeMonthlySummary(emp, yearMonth, records, settings);
    const row = [
      emp.code,
      emp.name,
      emp.kana,
      emp.department,
      emp.role,
      yearMonth,
      summary.workDays.toString(),
      minutesToDecimalHours(summary.totalWorkMinutes).toString(),
      minutesToDecimalHours(summary.overtimeMinutes).toString(),
      minutesToDecimalHours(summary.lateNightMinutes).toString(),
      minutesToDecimalHours(summary.totalBreakMinutes).toString(),
      summary.incompleteDays.toString(),
    ];
    csvRows.push(row.map(val => `"${val.replace(/"/g, '""')}"`).join(','));
  });

  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `勤怠データ_${yearMonth}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 5. Export dedicated Payroll Calculation Sheet (給与計算用Excelシート)
 */
export function exportPayrollCalculationExcel(
  yearMonth: string,
  employees: Employee[],
  records: AttendanceRecord[],
  settings: WorkSettings
): void {
  const activeEmployees = employees.filter(e => e.isActive);
  const rows: Array<Record<string, string | number>> = [];

  activeEmployees.forEach(emp => {
    const summary = calculateEmployeeMonthlySummary(emp, yearMonth, records, settings);
    const empTypeLabel = emp.employmentType === 'part_time' ? 'パート・バイト' : '正社員';

    rows.push({
      '社員番号': emp.code,
      '氏名': emp.name,
      '雇用区分': empTypeLabel,
      '部署': emp.department,
      '締め期間': `${summary.startDate} 〜 ${summary.endDate}`,
      '出勤日数': summary.workDays,
      '打刻不備(件)': summary.incompleteDays,
      '総実働時間 (h)': minutesToDecimalHours(summary.totalWorkMinutes),
      '所定内労働 (h)': minutesToDecimalHours(summary.regularMinutes),
      '普通残業時間 (h)': minutesToDecimalHours(summary.overtimeMinutes),
      '深夜労働時間 (h)': minutesToDecimalHours(summary.lateNightMinutes),
      '基準単価・時給 (円)': emp.hourlyWage || (emp.monthlySalary ? Math.round(emp.monthlySalary / 160) : 1200),
      '基本給相当額 (円)': summary.estimatedBasePay,
      '残業手当 (1.25倍) (円)': summary.estimatedOvertimePay,
      '深夜手当 (0.25倍) (円)': summary.estimatedLateNightPay,
      '概算総支給額 (円)': summary.estimatedTotalPay,
      '給与締めステータス': summary.incompleteDays > 0 ? '要打刻確認' : '計算可能',
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet['!cols'] = [
    { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 24 },
    { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
    { wch: 16 }, { wch: 18 }, { wch: 16 }, { wch: 18 }, { wch: 18 },
    { wch: 18 }, { wch: 16 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `給与計算用_${yearMonth}`);

  const filename = `給与計算用集計表_${yearMonth}_${settings.companyName.replace(/\s+/g, '_')}.xlsx`;
  downloadWorkbook(workbook, filename);
}

/**
 * 6. Export CSV for Payroll Software (弥生・freee・MF汎用)
 */
export function exportPayrollSoftwareCSV(
  yearMonth: string,
  employees: Employee[],
  records: AttendanceRecord[],
  settings: WorkSettings
): void {
  const activeEmployees = employees.filter(e => e.isActive);
  const headers = [
    '社員番号', '氏名', '部署', '雇用区分', '出勤日数', '総実働時間', '普通残業時間', '深夜労働時間', '基準時給', '残業手当概算', '打刻不備件数'
  ];

  const csvRows: string[] = [];
  csvRows.push(headers.map(h => `"${h}"`).join(','));

  activeEmployees.forEach(emp => {
    const summary = calculateEmployeeMonthlySummary(emp, yearMonth, records, settings);
    const row = [
      emp.code,
      emp.name,
      emp.department,
      emp.employmentType === 'part_time' ? 'パート' : '正社員',
      summary.workDays.toString(),
      minutesToDecimalHours(summary.totalWorkMinutes).toString(),
      minutesToDecimalHours(summary.overtimeMinutes).toString(),
      minutesToDecimalHours(summary.lateNightMinutes).toString(),
      (emp.hourlyWage || 1200).toString(),
      summary.estimatedOvertimePay.toString(),
      summary.incompleteDays.toString(),
    ];
    csvRows.push(row.map(val => `"${val.replace(/"/g, '""')}"`).join(','));
  });

  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `給与計算データ_${yearMonth}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
