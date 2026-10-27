export type PunchType = 'clock_in' | 'clock_out' | 'break_start' | 'break_end';

export interface Employee {
  id: string;
  code: string; // e.g. "EMP001"
  name: string; // e.g. "佐藤 健一"
  kana: string; // e.g. "サトウ ケンイチ"
  department: string; // e.g. "営業部"
  role: string; // e.g. "リーダー"
  isActive: boolean;
  avatarColor: string;
  employmentType?: 'full_time' | 'part_time' | 'contract'; // 正社員・パート・契約
  hourlyWage?: number; // 時給（パート等用）または時間単価
  monthlySalary?: number; // 基本給（正社員用）
  defaultStartTime?: string; // e.g. "09:00"
  defaultEndTime?: string; // e.g. "18:00"
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // "YYYY-MM-DD"
  clockIn?: string; // "HH:mm" or "HH:mm:ss"
  clockOut?: string; // "HH:mm" or "HH:mm:ss"
  breakMinutes: number; // in minutes (default 60 or calculated)
  breakStart?: string;
  breakEnd?: string;
  note?: string;
  isModified?: boolean; // true if manually edited or corrected
  modifiedAt?: string;
  modificationReason?: string;
  createdVia?: 'kiosk' | 'manual';
}

export interface PunchLogEntry {
  id: string;
  employeeId: string;
  timestamp: string; // ISO string
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm:ss"
  type: PunchType;
  note?: string;
  cancelled?: boolean;
}

export interface WorkSettings {
  standardWorkHours: number; // e.g., 8 hours
  standardStartTime: string; // "09:00"
  standardEndTime: string; // "18:00"
  autoBreakRule: 'manual' | 'auto_60' | 'auto_statutory'; // auto 60 min if > 6h
  roundingMinutes: number; // 1, 5, 10, 15 (打刻丸め)
  overtimeThresholdHours: number; // e.g. 8 hours/day
  monthlyOvertimeWarningHours: number; // e.g. 45 hours (36協定アラート)
  companyName: string;
  closingDay: 'end_of_month' | '20th' | '25th' | '15th' | '10th'; // 給与締め日
}

export interface DayCalculation {
  date: string;
  dayOfWeek: string;
  isWeekend: boolean;
  clockIn?: string;
  clockOut?: string;
  breakMinutes: number;
  totalWorkMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number; // 残業 (8時間超)
  lateNightMinutes: number; // 22:00〜05:00
  status: 'present' | 'absent' | 'leave' | 'weekend' | 'incomplete';
  note?: string;
  isModified?: boolean;
  isIncomplete?: boolean;
}

export interface EmployeeMonthlySummary {
  employee: Employee;
  yearMonth: string; // "YYYY-MM"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  workDays: number;
  totalWorkMinutes: number;
  regularMinutes: number;
  overtimeMinutes: number;
  lateNightMinutes: number;
  totalBreakMinutes: number;
  incompleteDays: number;
  dailyCalculations: DayCalculation[];
  // Payroll estimate
  estimatedBasePay: number;
  estimatedOvertimePay: number;
  estimatedLateNightPay: number;
  estimatedTotalPay: number;
}
