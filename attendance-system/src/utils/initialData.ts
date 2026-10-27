import { Employee, AttendanceRecord, WorkSettings } from '../types/attendance';

export const INITIAL_SETTINGS: WorkSettings = {
  companyName: '株式会社サンプルワークス',
  standardWorkHours: 8,
  standardStartTime: '09:00',
  standardEndTime: '18:00',
  autoBreakRule: 'auto_60',
  roundingMinutes: 1, // 1分単位 (15分・30分にも変更可能)
  overtimeThresholdHours: 8,
  monthlyOvertimeWarningHours: 45, // 36協定の目安
  closingDay: 'end_of_month', // 末日締め（20日締め・25日締め等も選択可能）
};

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'emp-01', code: 'EMP001', name: '佐藤 健一', kana: 'サトウ ケンイチ', department: '営業部', role: '部長', isActive: true, avatarColor: 'bg-blue-600', employmentType: 'full_time', monthlySalary: 380000, hourlyWage: 2375 },
  { id: 'emp-02', code: 'EMP002', name: '鈴木 美咲', kana: 'スズキ ミサキ', department: '営業部', role: 'リーダー', isActive: true, avatarColor: 'bg-indigo-600', employmentType: 'full_time', monthlySalary: 320000, hourlyWage: 2000 },
  { id: 'emp-03', code: 'EMP003', name: '高橋 大樹', kana: 'タカハシ ダイキ', department: '営業部', role: 'メンバー', isActive: true, avatarColor: 'bg-sky-600', employmentType: 'full_time', monthlySalary: 270000, hourlyWage: 1680 },
  { id: 'emp-04', code: 'EMP004', name: '田中 陽菜', kana: 'タナカ ヒナ', department: '営業部', role: 'メンバー', isActive: true, avatarColor: 'bg-cyan-600', employmentType: 'part_time', hourlyWage: 1300 },
  { id: 'emp-05', code: 'EMP005', name: '渡辺 翔太', kana: 'ワタナベ ショウタ', department: '営業部', role: 'メンバー', isActive: true, avatarColor: 'bg-teal-600', employmentType: 'part_time', hourlyWage: 1250 },
  
  { id: 'emp-06', code: 'EMP006', name: '伊藤 雅人', kana: 'イトウ マサト', department: '開発部', role: 'テックリード', isActive: true, avatarColor: 'bg-emerald-600', employmentType: 'full_time', monthlySalary: 420000, hourlyWage: 2625 },
  { id: 'emp-07', code: 'EMP007', name: '山本 結衣', kana: 'ヤマモト ユイ', department: '開発部', role: 'エンジニア', isActive: true, avatarColor: 'bg-green-600', employmentType: 'full_time', monthlySalary: 350000, hourlyWage: 2180 },
  { id: 'emp-08', code: 'EMP008', name: '中村 蓮', kana: 'ナカムラ レン', department: '開発部', role: 'エンジニア', isActive: true, avatarColor: 'bg-lime-600', employmentType: 'full_time', monthlySalary: 300000, hourlyWage: 1875 },
  { id: 'emp-09', code: 'EMP009', name: '小林 さくら', kana: 'コバヤシ サクラ', department: '開発部', role: 'デザイナー', isActive: true, avatarColor: 'bg-amber-600', employmentType: 'part_time', hourlyWage: 1450 },
  { id: 'emp-10', code: 'EMP010', name: '加藤 拓海', kana: 'カトウ タクミ', department: '開発部', role: 'エンジニア', isActive: true, avatarColor: 'bg-orange-600', employmentType: 'full_time', monthlySalary: 280000, hourlyWage: 1750 },

  { id: 'emp-11', code: 'EMP011', name: '吉田 直樹', kana: 'ヨシダ ナオキ', department: '総務・経理部', role: '課長', isActive: true, avatarColor: 'bg-violet-600', employmentType: 'full_time', monthlySalary: 360000, hourlyWage: 2250 },
  { id: 'emp-12', code: 'EMP012', name: '山田 葵', kana: 'ヤマダ アオイ', department: '総務・経理部', role: '経理担当', isActive: true, avatarColor: 'bg-purple-600', employmentType: 'full_time', monthlySalary: 280000, hourlyWage: 1750 },
  { id: 'emp-13', code: 'EMP013', name: '佐々木 翼', kana: 'ササキ ツバサ', department: '総務・経理部', role: '労務担当', isActive: true, avatarColor: 'bg-fuchsia-600', employmentType: 'part_time', hourlyWage: 1350 },
  { id: 'emp-14', code: 'EMP014', name: '山口 萌', kana: 'ヤマグチ モエ', department: '総務・経理部', role: '総務担当', isActive: true, avatarColor: 'bg-pink-600', employmentType: 'part_time', hourlyWage: 1200 },

  { id: 'emp-15', code: 'EMP015', name: '松本 勇気', kana: 'マツモト ユウキ', department: 'CS・サポート部', role: 'マネージャー', isActive: true, avatarColor: 'bg-rose-600', employmentType: 'full_time', monthlySalary: 310000, hourlyWage: 1930 },
  { id: 'emp-16', code: 'EMP016', name: '井上 真由', kana: 'イノウエ マユ', department: 'CS・サポート部', role: 'サポート', isActive: true, avatarColor: 'bg-red-600', employmentType: 'part_time', hourlyWage: 1200 },
  { id: 'emp-17', code: 'EMP017', name: '木村 涼太', kana: 'キムラ リョウタ', department: 'CS・サポート部', role: 'サポート', isActive: true, avatarColor: 'bg-blue-700', employmentType: 'part_time', hourlyWage: 1200 },
  { id: 'emp-18', code: 'EMP018', name: '林 彩花', kana: 'ハヤシ アヤカ', department: 'CS・サポート部', role: 'サポート', isActive: true, avatarColor: 'bg-teal-700', employmentType: 'part_time', hourlyWage: 1200 },
  { id: 'emp-19', code: 'EMP019', name: '斎藤 航平', kana: 'サイトウ コウヘイ', department: '企画・広報部', role: 'プランナー', isActive: true, avatarColor: 'bg-emerald-700', employmentType: 'full_time', monthlySalary: 290000, hourlyWage: 1810 },
  { id: 'emp-20', code: 'EMP020', name: '清水 遥', kana: 'シミズ ハルカ', department: '企画・広報部', role: '広報スペシャリスト', isActive: true, avatarColor: 'bg-purple-700', employmentType: 'part_time', hourlyWage: 1400 },
];

/**
 * Generate initial past attendance for the month of 2026-10 so summary and export work out-of-the-box
 */
export function generateSeedAttendanceRecords(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const today = '2026-10-26';

  // Seed weekdays for October 2026 up to Oct 26
  // October 2026: 1st is Thursday.
  const octWorkdays = [
    '2026-10-01', '2026-10-02',
    '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09',
    '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16',
    '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23',
    '2026-10-26'
  ];

  INITIAL_EMPLOYEES.forEach((emp, empIdx) => {
    octWorkdays.forEach((dayStr, dayIdx) => {
      // Simulate varied times
      const isToday = dayStr === today;
      
      if (isToday) {
        // Today's status:
        // emp 0..11 are currently clocked in at ~08:45-09:10
        // emp 12..14 are on break
        // emp 15..17 haven't clocked in yet today
        // emp 18..19 already finished early shift
        if (empIdx < 14) {
          const min = (empIdx * 3) % 25;
          const clockInTime = `08:${min < 10 ? '0' + min : min}`;
          records.push({
            id: `rec-${emp.id}-${dayStr}`,
            employeeId: emp.id,
            date: dayStr,
            clockIn: clockInTime,
            breakMinutes: 0,
            createdVia: 'kiosk',
          });
        } else if (empIdx >= 18) {
          records.push({
            id: `rec-${emp.id}-${dayStr}`,
            employeeId: emp.id,
            date: dayStr,
            clockIn: '07:00',
            clockOut: '15:30',
            breakMinutes: 60,
            createdVia: 'kiosk',
          });
        }
        return;
      }

      // Past days
      // occasional leave or overtime
      const isAbsent = (empIdx + dayIdx) % 19 === 0;
      if (isAbsent) return;

      const baseInMins = 8 * 60 + 45 + ((empIdx * 7 + dayIdx * 3) % 25); // around 08:45 ~ 09:10
      const inH = Math.floor(baseInMins / 60);
      const inM = baseInMins % 60;
      const clockIn = `${inH < 10 ? '0' + inH : inH}:${inM < 10 ? '0' + inM : inM}`;

      // Overtime variations: some days finish 18:00, some 19:30, some 20:45
      const overtimeExtra = ((empIdx * 11 + dayIdx * 13) % 5 === 0) ? 90 : (((empIdx + dayIdx) % 3 === 0) ? 45 : 10);
      const baseOutMins = 18 * 60 + overtimeExtra;
      const outH = Math.floor(baseOutMins / 60);
      const outM = baseOutMins % 60;
      const clockOut = `${outH < 10 ? '0' + outH : outH}:${outM < 10 ? '0' + outM : outM}`;

      // One employee had a manual modification with reason
      const isMod = empIdx === 1 && dayIdx === 3;

      records.push({
        id: `rec-${emp.id}-${dayStr}`,
        employeeId: emp.id,
        date: dayStr,
        clockIn,
        clockOut,
        breakMinutes: 60,
        isModified: isMod,
        modificationReason: isMod ? '押し間違い修正（出勤時刻の修正）' : undefined,
        modifiedAt: isMod ? '2026-10-06T18:10:00.000Z' : undefined,
        createdVia: 'kiosk',
      });
    });
  });

  return records;
}
