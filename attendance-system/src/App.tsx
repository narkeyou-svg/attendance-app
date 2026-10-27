/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MenuDrawer, AppTab } from './components/MenuDrawer';
import { KioskAttendance } from './components/KioskAttendance';
import { TimecardView } from './components/TimecardView';
import { SummaryDashboard } from './components/SummaryDashboard';
import { ExcelExportPanel } from './components/ExcelExportPanel';
import { EmployeeManager } from './components/EmployeeManager';
import { PayrollManager } from './components/PayrollManager';
import { LocalRunGuideModal } from './components/LocalRunGuideModal';
import { AttendanceRecord, Employee, PunchLogEntry, PunchType, WorkSettings } from './types/attendance';
import {
  loadEmployees,
  saveEmployees,
  loadRecords,
  saveRecords,
  loadLogs,
  saveLogs,
  loadSettings,
  saveSettings,
} from './utils/storage';

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [logs, setLogs] = useState<PunchLogEntry[]>([]);
  const [settings, setSettings] = useState<WorkSettings>(loadSettings());

  const [activeTab, setActiveTab] = useState<AppTab>('kiosk');
  const [selectedTimecardEmpId, setSelectedTimecardEmpId] = useState<string | undefined>(undefined);
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [localGuideOpen, setLocalGuideOpen] = useState(false);

  // Load data on mount
  useEffect(() => {
    reloadAllData();
  }, []);

  const reloadAllData = () => {
    setEmployees(loadEmployees());
    setRecords(loadRecords());
    setLogs(loadLogs());
    setSettings(loadSettings());
  };

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCurrentTimeStr = () => {
    const d = new Date();
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    const s = d.getSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Punch handler
  const handlePunch = (employeeId: string, punchType: PunchType, note?: string) => {
    const today = getTodayStr();
    const nowTime = getCurrentTimeStr();
    const nowTimeShort = nowTime.slice(0, 5); // "HH:mm"

    const existingRecIdx = records.findIndex(r => r.employeeId === employeeId && r.date === today);
    let nextRecords = [...records];

    if (existingRecIdx >= 0) {
      const existing = { ...nextRecords[existingRecIdx] };

      if (punchType === 'clock_in') {
        existing.clockIn = nowTimeShort;
      } else if (punchType === 'clock_out') {
        existing.clockOut = nowTimeShort;
      }

      if (note) {
        existing.note = existing.note ? `${existing.note} / ${note}` : note;
      }

      nextRecords[existingRecIdx] = existing;
    } else {
      const newRec: AttendanceRecord = {
        id: `rec-${employeeId}-${today}`,
        employeeId,
        date: today,
        clockIn: punchType === 'clock_in' ? nowTimeShort : undefined,
        clockOut: punchType === 'clock_out' ? nowTimeShort : undefined,
        breakMinutes: settings.autoBreakRule === 'auto_60' ? 60 : 0,
        note: note || undefined,
        createdVia: 'kiosk',
      };
      nextRecords.push(newRec);
    }

    setRecords(nextRecords);
    saveRecords(nextRecords);

    const newLog: PunchLogEntry = {
      id: `log-${Date.now()}`,
      employeeId,
      timestamp: new Date().toISOString(),
      date: today,
      time: nowTime,
      type: punchType,
      note,
    };

    const nextLogs = [...logs, newLog];
    setLogs(nextLogs);
    saveLogs(nextLogs);
  };

  // Undo last punch
  const handleUndoLastPunch = (logEntry: PunchLogEntry) => {
    const nextLogs = logs.map(l => l.id === logEntry.id ? { ...l, cancelled: true } : l);
    setLogs(nextLogs);
    saveLogs(nextLogs);

    const existingRecIdx = records.findIndex(r => r.employeeId === logEntry.employeeId && r.date === logEntry.date);
    if (existingRecIdx >= 0) {
      const existing = { ...records[existingRecIdx] };
      if (logEntry.type === 'clock_in') {
        delete existing.clockIn;
      } else if (logEntry.type === 'clock_out') {
        delete existing.clockOut;
      }

      const nextRecords = [...records];
      if (!existing.clockIn && !existing.clockOut) {
        nextRecords.splice(existingRecIdx, 1);
      } else {
        existing.isModified = true;
        existing.modificationReason = '直前打刻の取り消し (Undo)';
        existing.modifiedAt = new Date().toISOString();
        nextRecords[existingRecIdx] = existing;
      }

      setRecords(nextRecords);
      saveRecords(nextRecords);
    }
  };

  const handleSaveRecord = (record: AttendanceRecord) => {
    const idx = records.findIndex(r => r.id === record.id || (r.employeeId === record.employeeId && r.date === record.date));
    let nextRecords = [...records];
    if (idx >= 0) {
      nextRecords[idx] = record;
    } else {
      nextRecords.push(record);
    }
    setRecords(nextRecords);
    saveRecords(nextRecords);
  };

  const handleDeleteRecord = (recordId: string) => {
    const nextRecords = records.filter(r => r.id !== recordId);
    setRecords(nextRecords);
    saveRecords(nextRecords);
  };

  const handleUpdateEmployees = (newEmployees: Employee[]) => {
    setEmployees(newEmployees);
    saveEmployees(newEmployees);
  };

  const handleUpdateSettings = (newSettings: WorkSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleOpenEmployeeTimecard = (empId: string) => {
    setSelectedTimecardEmpId(empId);
    setActiveTab('timecard');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openMenu={() => setMenuOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-3 sm:py-4">
        {activeTab === 'kiosk' && (
          <KioskAttendance
            employees={employees}
            records={records}
            logs={logs}
            settings={settings}
            onPunch={handlePunch}
            onUndoLastPunch={handleUndoLastPunch}
            onSaveRecord={handleSaveRecord}
          />
        )}

        {activeTab === 'payroll' && (
          <PayrollManager
            employees={employees}
            records={records}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onSaveRecord={handleSaveRecord}
            onDeleteRecord={handleDeleteRecord}
          />
        )}

        {activeTab === 'timecard' && (
          <TimecardView
            employees={employees}
            records={records}
            settings={settings}
            selectedEmployeeId={selectedTimecardEmpId}
            onSaveRecord={handleSaveRecord}
            onDeleteRecord={handleDeleteRecord}
          />
        )}

        {activeTab === 'summary' && (
          <SummaryDashboard
            employees={employees}
            records={records}
            settings={settings}
            onOpenEmployeeTimecard={handleOpenEmployeeTimecard}
          />
        )}

        {activeTab === 'export' && (
          <ExcelExportPanel
            employees={employees}
            records={records}
            settings={settings}
          />
        )}

        {activeTab === 'settings' && (
          <EmployeeManager
            employees={employees}
            settings={settings}
            onUpdateEmployees={handleUpdateEmployees}
            onUpdateSettings={handleUpdateSettings}
            onDataReload={reloadAllData}
          />
        )}
      </main>

      {/* Top-Right Menu Drawer */}
      <MenuDrawer
        isOpen={menuOpen}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        openLocalGuide={() => setLocalGuideOpen(true)}
        onClose={() => setMenuOpen(false)}
      />

      {/* Local Run Guide Modal */}
      <LocalRunGuideModal
        isOpen={localGuideOpen}
        onClose={() => setLocalGuideOpen(false)}
      />
    </div>
  );
}
