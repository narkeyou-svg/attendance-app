import { AttendanceRecord, DayCalculation, Employee, EmployeeMonthlySummary, WorkSettings } from '../types/attendance';

export function timeStringToMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

export function minutesToTimeString(minutes: number | null): string {
  if (minutes === null || isNaN(minutes) || minutes < 0) return '--:--';
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function minutesToJapaneseDuration(minutes: number): string {
  if (isNaN(minutes) || minutes <= 0) return '0分';
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

export function minutesToDecimalHours(minutes: number): number {
  if (isNaN(minutes) || minutes <= 0) return 0;
  return Math.round((minutes / 60) * 100) / 100;
}

export function applyRounding(minutes: number, roundTo: number): number {
  if (roundTo <= 1) return minutes;
  return Math.floor(minutes / roundTo) * roundTo;
}

/**
 * Calculate late night minutes (between 22:00 and 05:00 next day)
 */
export function calculateLateNightMinutes(startMin: number, endMin: number): number {
  let lateNight = 0;
  // If work extends past 22:00 (1320 mins)
  if (endMin > 22 * 60) {
    const lateStart = Math.max(startMin, 22 * 60);
    const lateEnd = Math.min(endMin, 29 * 60); // 05:00 next morning (24+5=29h)
    if (lateEnd > lateStart) {
      lateNight += lateEnd - lateStart;
    }
  }
  // Early morning 00:00 - 05:00
  if (startMin < 5 * 60) {
    const earlyEnd = Math.min(endMin, 5 * 60);
    if (earlyEnd > startMin) {
      lateNight += earlyEnd - startMin;
    }
  }
  return lateNight;
}

/**
 * Calculate day attendance details
 */
export function calculateDay(
  dateStr: string,
  record: AttendanceRecord | undefined,
  settings: WorkSettings
): DayCalculation {
  const dateObj = new Date(dateStr + 'T00:00:00');
  const dayIndex = dateObj.getDay();
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  const dayOfWeek = dayNames[dayIndex];
  const isWeekend = dayIndex === 0 || dayIndex === 6;

  if (!record || (!record.clockIn && !record.clockOut)) {
    return {
      date: dateStr,
      dayOfWeek,
      isWeekend,
      breakMinutes: 0,
      totalWorkMinutes: 0,
      regularMinutes: 0,
      overtimeMinutes: 0,
      lateNightMinutes: 0,
      status: isWeekend ? 'weekend' : 'absent',
      note: record?.note,
      isModified: record?.isModified,
      isIncomplete: false,
    };
  }

  const inMins = timeStringToMinutes(record.clockIn);
  const outMins = timeStringToMinutes(record.clockOut);

  // Incomplete: only one punch exists
  if (inMins === null || outMins === null) {
    return {
      date: dateStr,
      dayOfWeek,
      isWeekend,
      clockIn: record.clockIn,
      clockOut: record.clockOut,
      breakMinutes: record.breakMinutes || 0,
      totalWorkMinutes: 0,
      regularMinutes: 0,
      overtimeMinutes: 0,
      lateNightMinutes: 0,
      status: 'incomplete',
      note: record.note,
      isModified: record.isModified,
      isIncomplete: true,
    };
  }

  // Handle shift across midnight if outMins < inMins
  const adjustedOutMins = outMins < inMins ? outMins + 24 * 60 : outMins;

  // Total gross duration in minutes
  const grossMinutes = Math.max(0, adjustedOutMins - inMins);

  // Determine break time
  let breakMins = record.breakMinutes;
  if (settings.autoBreakRule === 'auto_60' && (breakMins === undefined || breakMins === null || breakMins === 0)) {
    if (grossMinutes > 6 * 60) {
      breakMins = 60;
    } else {
      breakMins = 0;
    }
  } else if (settings.autoBreakRule === 'auto_statutory') {
    if (grossMinutes > 8 * 60) breakMins = 60;
    else if (grossMinutes > 6 * 60) breakMins = 45;
    else breakMins = 0;
  }
  if (!breakMins) breakMins = 0;

  // Net working minutes
  const netMinutes = Math.max(0, grossMinutes - breakMins);

  // Standard threshold (e.g., 8 hours = 480 mins)
  const thresholdMins = settings.overtimeThresholdHours * 60;
  const regularMinutes = Math.min(netMinutes, thresholdMins);
  const overtimeMinutes = Math.max(0, netMinutes - thresholdMins);

  // Late night work (22:00 - 05:00)
  const lateNightMinutes = calculateLateNightMinutes(inMins, adjustedOutMins);

  return {
    date: dateStr,
    dayOfWeek,
    isWeekend,
    clockIn: record.clockIn,
    clockOut: record.clockOut,
    breakMinutes: breakMins,
    totalWorkMinutes: netMinutes,
    regularMinutes,
    overtimeMinutes,
    lateNightMinutes,
    status: 'present',
    note: record.note || (record.modificationReason ? `[修正] ${record.modificationReason}` : undefined),
    isModified: record.isModified,
    isIncomplete: false,
  };
}

/**
 * Get date range according to closing day
 */
export function getDateRangeForPeriod(
  yearMonth: string,
  closingDay: WorkSettings['closingDay'] = 'end_of_month'
): { startDate: string; endDate: string; dates: string[] } {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12

  if (closingDay === 'end_of_month') {
    const numDays = new Date(year, month, 0).getDate();
    const dates: string[] = [];
    for (let d = 1; d <= numDays; d++) {
      const dayStr = d.toString().padStart(2, '0');
      dates.push(`${yearStr}-${monthStr.padStart(2, '0')}-${dayStr}`);
    }
    return {
      startDate: `${yearStr}-${monthStr.padStart(2, '0')}-01`,
      endDate: `${yearStr}-${monthStr.padStart(2, '0')}-${numDays.toString().padStart(2, '0')}`,
      dates,
    };
  }

  // E.g. 20th closing: Prev month 21st to this month 20th
  const closingDayNum = closingDay === '20th' ? 20 : (closingDay === '25th' ? 25 : (closingDay === '15th' ? 15 : 10));
  const startDayNum = closingDayNum + 1;

  // Previous month
  const prevDate = new Date(year, month - 2, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth() + 1;
  const numDaysInPrev = new Date(prevYear, prevMonth, 0).getDate();

  const dates: string[] = [];
  // Dates in prev month
  for (let d = startDayNum; d <= numDaysInPrev; d++) {
    const dStr = d.toString().padStart(2, '0');
    const mStr = prevMonth.toString().padStart(2, '0');
    dates.push(`${prevYear}-${mStr}-${dStr}`);
  }
  // Dates in this month
  for (let d = 1; d <= closingDayNum; d++) {
    const dStr = d.toString().padStart(2, '0');
    dates.push(`${yearStr}-${monthStr.padStart(2, '0')}-${dStr}`);
  }

  return {
    startDate: dates[0] || `${yearStr}-${monthStr.padStart(2, '0')}-01`,
    endDate: dates[dates.length - 1] || `${yearStr}-${monthStr.padStart(2, '0')}-${closingDayNum}`,
    dates,
  };
}

export function getDatesInMonth(yearMonth: string): string[] {
  return getDateRangeForPeriod(yearMonth, 'end_of_month').dates;
}

/**
 * Calculate full monthly summary for an employee with payroll estimations
 */
export function calculateEmployeeMonthlySummary(
  employee: Employee,
  yearMonth: string,
  records: AttendanceRecord[],
  settings: WorkSettings,
  closingDayOverride?: WorkSettings['closingDay']
): EmployeeMonthlySummary {
  const closingDay = closingDayOverride || settings.closingDay || 'end_of_month';
  const { startDate, endDate, dates } = getDateRangeForPeriod(yearMonth, closingDay);

  // Filter records within date range
  const recordMap = new Map<string, AttendanceRecord>();
  records.forEach(r => {
    if (r.employeeId === employee.id && r.date >= startDate && r.date <= endDate) {
      recordMap.set(r.date, r);
    }
  });

  const dailyCalculations: DayCalculation[] = dates.map(dateStr => {
    return calculateDay(dateStr, recordMap.get(dateStr), settings);
  });

  let workDays = 0;
  let totalWorkMinutes = 0;
  let regularMinutes = 0;
  let overtimeMinutes = 0;
  let lateNightMinutes = 0;
  let totalBreakMinutes = 0;
  let incompleteDays = 0;

  dailyCalculations.forEach(day => {
    if (day.status === 'present') {
      workDays++;
      totalWorkMinutes += day.totalWorkMinutes;
      regularMinutes += day.regularMinutes;
      overtimeMinutes += day.overtimeMinutes;
      lateNightMinutes += day.lateNightMinutes;
      totalBreakMinutes += day.breakMinutes;
    } else if (day.status === 'incomplete') {
      incompleteDays++;
    }
  });

  // Payroll estimate
  const hourlyRate = employee.hourlyWage || 1200;
  let estimatedBasePay = 0;

  if (employee.employmentType === 'part_time') {
    estimatedBasePay = Math.round((regularMinutes / 60) * hourlyRate);
  } else {
    estimatedBasePay = employee.monthlySalary || Math.round((regularMinutes / 60) * hourlyRate);
  }

  // Overtime pay (1.25x statutory overtime premium)
  const estimatedOvertimePay = Math.round((overtimeMinutes / 60) * hourlyRate * 1.25);
  // Late night pay (0.25x late-night premium)
  const estimatedLateNightPay = Math.round((lateNightMinutes / 60) * hourlyRate * 0.25);
  const estimatedTotalPay = estimatedBasePay + estimatedOvertimePay + estimatedLateNightPay;

  return {
    employee,
    yearMonth,
    startDate,
    endDate,
    workDays,
    totalWorkMinutes,
    regularMinutes,
    overtimeMinutes,
    lateNightMinutes,
    totalBreakMinutes,
    incompleteDays,
    dailyCalculations,
    estimatedBasePay,
    estimatedOvertimePay,
    estimatedLateNightPay,
    estimatedTotalPay,
  };
}

export type EmployeeCurrentStatus = 'not_clocked_in' | 'working' | 'on_break' | 'clocked_out';

export function getEmployeeCurrentStatus(
  employeeId: string,
  todayStr: string,
  records: AttendanceRecord[]
): {
  status: EmployeeCurrentStatus;
  record?: AttendanceRecord;
  lastActionTime?: string;
} {
  const record = records.find(r => r.employeeId === employeeId && r.date === todayStr);

  if (!record || !record.clockIn) {
    return { status: 'not_clocked_in' };
  }

  if (record.clockOut) {
    return { status: 'clocked_out', record, lastActionTime: record.clockOut };
  }

  if (record.breakStart && !record.breakEnd) {
    return { status: 'on_break', record, lastActionTime: record.breakStart };
  }

  return { status: 'working', record, lastActionTime: record.clockIn };
}
