import { AttendanceRecord, Employee, PunchLogEntry, WorkSettings } from '../types/attendance';
import { INITIAL_EMPLOYEES, INITIAL_SETTINGS, generateSeedAttendanceRecords } from './initialData';

const STORAGE_KEYS = {
  EMPLOYEES: 'attendance_employees_v1',
  RECORDS: 'attendance_records_v1',
  LOGS: 'attendance_logs_v1',
  SETTINGS: 'attendance_settings_v1',
};

export function loadEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (!raw) {
      saveEmployees(INITIAL_EMPLOYEES);
      return INITIAL_EMPLOYEES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load employees from localStorage', e);
    return INITIAL_EMPLOYEES;
  }
}

export function saveEmployees(employees: Employee[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  } catch (e) {
    console.error('Failed to save employees to localStorage', e);
  }
}

export function loadRecords(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECORDS);
    if (!raw) {
      const initial = generateSeedAttendanceRecords();
      saveRecords(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load records from localStorage', e);
    return generateSeedAttendanceRecords();
  }
}

export function saveRecords(records: AttendanceRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save records to localStorage', e);
  }
}

export function loadLogs(): PunchLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveLogs(logs: PunchLogEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  } catch (e) {
    console.error('Failed to save logs to localStorage', e);
  }
}

export function loadSettings(): WorkSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      saveSettings(INITIAL_SETTINGS);
      return INITIAL_SETTINGS;
    }
    return { ...INITIAL_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return INITIAL_SETTINGS;
  }
}

export function saveSettings(settings: WorkSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
}

export function exportAllDataAsJson(): string {
  const data = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    settings: loadSettings(),
    employees: loadEmployees(),
    records: loadRecords(),
    logs: loadLogs(),
  };
  return JSON.stringify(data, null, 2);
}

export function importAllDataFromJson(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed || !Array.isArray(parsed.employees) || !Array.isArray(parsed.records)) {
      throw new Error('不正なデータ形式です。');
    }
    saveEmployees(parsed.employees);
    saveRecords(parsed.records);
    if (parsed.settings) saveSettings(parsed.settings);
    if (parsed.logs) saveLogs(parsed.logs);
    return true;
  } catch (e) {
    console.error('Failed to import JSON data', e);
    return false;
  }
}

export function resetAllDataToSeed(): void {
  saveEmployees(INITIAL_EMPLOYEES);
  saveRecords(generateSeedAttendanceRecords());
  saveLogs([]);
  saveSettings(INITIAL_SETTINGS);
}
