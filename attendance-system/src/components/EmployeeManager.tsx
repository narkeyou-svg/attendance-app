import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Settings,
  Save,
  RotateCcw,
  Download,
  Upload,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Building,
} from 'lucide-react';
import { Employee, WorkSettings } from '../types/attendance';
import { exportAllDataAsJson, importAllDataFromJson, resetAllDataToSeed } from '../utils/storage';

interface EmployeeManagerProps {
  employees: Employee[];
  settings: WorkSettings;
  onUpdateEmployees: (employees: Employee[]) => void;
  onUpdateSettings: (settings: WorkSettings) => void;
  onDataReload: () => void;
}

export const EmployeeManager: React.FC<EmployeeManagerProps> = ({
  employees,
  settings,
  onUpdateEmployees,
  onUpdateSettings,
  onDataReload,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'employees' | 'settings' | 'backup'>('employees');
  
  // Settings form
  const [formSettings, setFormSettings] = useState<WorkSettings>({ ...settings });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Employee Edit / Add state
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [empForm, setEmpForm] = useState<Partial<Employee>>({
    code: '',
    name: '',
    kana: '',
    department: '営業部',
    role: 'メンバー',
    isActive: true,
    avatarColor: 'bg-indigo-600',
  });

  const avatarColorOptions = [
    'bg-blue-600', 'bg-indigo-600', 'bg-sky-600', 'bg-cyan-600', 'bg-teal-600',
    'bg-emerald-600', 'bg-green-600', 'bg-lime-600', 'bg-amber-600', 'bg-orange-600',
    'bg-violet-600', 'bg-purple-600', 'bg-fuchsia-600', 'bg-pink-600', 'bg-rose-600',
  ];

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formSettings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  // Open Add modal
  const handleStartAdd = () => {
    const nextNum = employees.length + 1;
    const nextCode = `EMP${nextNum.toString().padStart(3, '0')}`;
    setEmpForm({
      code: nextCode,
      name: '',
      kana: '',
      department: '営業部',
      role: 'メンバー',
      isActive: true,
      avatarColor: avatarColorOptions[nextNum % avatarColorOptions.length],
    });
    setIsAddingNew(true);
    setEditingEmp(null);
  };

  // Open Edit modal
  const handleStartEdit = (emp: Employee) => {
    setEmpForm({ ...emp });
    setEditingEmp(emp);
    setIsAddingNew(false);
  };

  // Save Employee
  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empForm.name?.trim() || !empForm.code?.trim()) return;

    if (isAddingNew) {
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        code: empForm.code.trim(),
        name: empForm.name.trim(),
        kana: empForm.kana?.trim() || '',
        department: empForm.department || '営業部',
        role: empForm.role || 'メンバー',
        isActive: true,
        avatarColor: empForm.avatarColor || 'bg-indigo-600',
        employmentType: empForm.employmentType || 'full_time',
        hourlyWage: Number(empForm.hourlyWage) || 1200,
        monthlySalary: Number(empForm.monthlySalary) || 280000,
      };
      onUpdateEmployees([...employees, newEmp]);
      setIsAddingNew(false);
    } else if (editingEmp) {
      const updated = employees.map(emp => {
        if (emp.id === editingEmp.id) {
          return {
            ...emp,
            code: empForm.code!.trim(),
            name: empForm.name!.trim(),
            kana: empForm.kana?.trim() || '',
            department: empForm.department || emp.department,
            role: empForm.role || emp.role,
            isActive: empForm.isActive !== undefined ? empForm.isActive : emp.isActive,
            avatarColor: empForm.avatarColor || emp.avatarColor,
            employmentType: empForm.employmentType || emp.employmentType || 'full_time',
            hourlyWage: Number(empForm.hourlyWage) || emp.hourlyWage || 1200,
            monthlySalary: Number(empForm.monthlySalary) || emp.monthlySalary || 280000,
          };
        }
        return emp;
      });
      onUpdateEmployees(updated);
      setEditingEmp(null);
    }
  };

  // Toggle active
  const handleToggleActive = (empId: string) => {
    const updated = employees.map(emp => {
      if (emp.id === empId) {
        return { ...emp, isActive: !emp.isActive };
      }
      return emp;
    });
    onUpdateEmployees(updated);
  };

  // Delete employee
  const handleDeleteEmployee = (empId: string) => {
    if (window.confirm('この従業員を削除しますか？（過去の打刻データは保持されます）')) {
      const updated = employees.filter(e => e.id !== empId);
      onUpdateEmployees(updated);
    }
  };

  // JSON Export
  const handleDownloadBackup = () => {
    const jsonStr = exportAllDataAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // JSON Import
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (importAllDataFromJson(content)) {
        alert('データを正常に復元しました！');
        onDataReload();
      } else {
        alert('データの復元に失敗しました。正しいJSONファイルを選択してください。');
      }
    };
    reader.readAsText(file);
  };

  // Reset to seed
  const handleResetSeed = () => {
    if (window.confirm('すべての勤怠データと従業員設定を初期サンプル（20名・10月勤怠）に戻しますか？')) {
      resetAllDataToSeed();
      onDataReload();
      alert('初期データにリセットしました。');
    }
  };

  return (
    <div className="space-y-5">
      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('employees')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'employees'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>従業員管理 ({employees.length}名)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('settings')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'settings'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>勤務・残業集計ルール設定</span>
        </button>

        <button
          onClick={() => setActiveSubTab('backup')}
          className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-colors ${
            activeSubTab === 'backup'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          <span>データ移行・バックアップ</span>
        </button>
      </div>

      {/* Sub Tab 1: Employees List */}
      {activeSubTab === 'employees' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">従業員マスタ一覧</h3>
              <p className="text-xs text-slate-500">
                名前・部署・社員番号の編集や、新しい従業員の追加ができます
              </p>
            </div>
            <button
              onClick={handleStartAdd}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>新しい従業員を登録</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">社員番号</th>
                    <th className="px-4 py-3">氏名</th>
                    <th className="px-4 py-3">フリガナ</th>
                    <th className="px-4 py-3">部署</th>
                    <th className="px-3 py-3">役職</th>
                    <th className="px-3 py-3 text-center">状態</th>
                    <th className="px-4 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 font-mono font-medium text-slate-600">{emp.code}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg ${emp.avatarColor} text-white font-bold text-xs flex items-center justify-center flex-shrink-0`}>
                            {emp.name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-900">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">{emp.kana}</td>
                      <td className="px-4 py-2.5 text-slate-700">{emp.department}</td>
                      <td className="px-3 py-2.5 text-slate-600">{emp.role}</td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          onClick={() => handleToggleActive(emp.id)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                            emp.isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {emp.isActive ? '在籍中' : '休職・非表示'}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-right space-x-2">
                        <button
                          onClick={() => handleStartEdit(emp)}
                          className="px-2.5 py-1 text-indigo-600 hover:text-indigo-800 font-semibold hover:bg-indigo-50 rounded"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(emp.id)}
                          className="px-2.5 py-1 text-rose-600 hover:text-rose-800 font-semibold hover:bg-rose-50 rounded"
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub Tab 2: Settings */}
      {activeSubTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">勤務体系・残業集計ルール設定</h3>
            <p className="text-xs text-slate-500">
              労働時間、残業計算基準、36協定アラート閾値を設定できます
            </p>
          </div>

          {settingsSaved && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>設定を保存しました！</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">会社名・組織名</label>
            <input
              type="text"
              value={formSettings.companyName}
              onChange={(e) => setFormSettings({ ...formSettings, companyName: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">1日の所定労働時間 (時間)</label>
              <input
                type="number"
                min="1"
                max="12"
                step="0.5"
                value={formSettings.standardWorkHours}
                onChange={(e) => setFormSettings({ ...formSettings, standardWorkHours: parseFloat(e.target.value) || 8 })}
                className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400">標準: 8時間</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">残業判定基準 (1日あたり時間)</label>
              <input
                type="number"
                min="1"
                max="12"
                step="0.5"
                value={formSettings.overtimeThresholdHours}
                onChange={(e) => setFormSettings({ ...formSettings, overtimeThresholdHours: parseFloat(e.target.value) || 8 })}
                className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <span className="text-[11px] text-slate-400">これを超えると「残業」として集計</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">標準始業時刻</label>
              <input
                type="time"
                value={formSettings.standardStartTime}
                onChange={(e) => setFormSettings({ ...formSettings, standardStartTime: e.target.value })}
                className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">標準終業時刻</label>
              <input
                type="time"
                value={formSettings.standardEndTime}
                onChange={(e) => setFormSettings({ ...formSettings, standardEndTime: e.target.value })}
                className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">月間36協定アラート閾値 (時間)</label>
            <input
              type="number"
              min="10"
              max="100"
              value={formSettings.monthlyOvertimeWarningHours}
              onChange={(e) => setFormSettings({ ...formSettings, monthlyOvertimeWarningHours: parseInt(e.target.value, 10) || 45 })}
              className="w-48 px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <span className="text-[11px] text-slate-400 block mt-1">
              月45時間を超える従業員に対してダッシュボードとExcelで警告を表示します
            </span>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              <Save className="w-4 h-4" />
              <span>設定を保存する</span>
            </button>
          </div>
        </form>
      )}

      {/* Sub Tab 3: Backup & Local Portability */}
      {activeSubTab === 'backup' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-2xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">データバックアップ & 移行 (ローカルPC連携)</h3>
            <p className="text-xs text-slate-500 mt-1">
              打刻データ・従業員マスタをJSON形式でダウンロード・復元できます。PC間でデータを移したい時やバックアップ保存に利用できます。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-indigo-600" />
                <span>データ全エクスポート (JSON)</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                現在の全従業員、打刻履歴、設定を1つのバックアップファイルとして保存します。
              </p>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSONダウンロード</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>データの復元・インポート</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                保存したJSONファイルを読み込み、データを復元します。
              </p>
              <label className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center">
                <Upload className="w-3.5 h-3.5" />
                <span>JSONファイルを選択</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h4 className="font-bold text-xs text-rose-700 flex items-center gap-1.5 mb-1">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>テスト用データの初期化</span>
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              初期のサンプル従業員20名および今月のテスト打刻データにリセットします。
            </p>
            <button
              type="button"
              onClick={handleResetSeed}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors"
            >
              初期サンプルデータに戻す
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Employee Modal */}
      {(isAddingNew || editingEmp) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleSaveEmployee}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all"
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {isAddingNew ? '新規従業員の登録' : '従業員情報の編集'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingEmp(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">社員番号</label>
                <input
                  type="text"
                  required
                  value={empForm.code}
                  onChange={(e) => setEmpForm({ ...empForm, code: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="例: EMP021"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">氏名 (漢字)</label>
                <input
                  type="text"
                  required
                  value={empForm.name}
                  onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="例: 山田 太郎"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ふりがな</label>
                <input
                  type="text"
                  value={empForm.kana}
                  onChange={(e) => setEmpForm({ ...empForm, kana: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="例: ヤマダ タロウ"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">所属部署</label>
                  <input
                    type="text"
                    value={empForm.department}
                    onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="例: 営業部"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">役職</label>
                  <input
                    type="text"
                    value={empForm.role}
                    onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="例: リーダー"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">雇用区分</label>
                  <select
                    value={empForm.employmentType || 'full_time'}
                    onChange={(e) => setEmpForm({ ...empForm, employmentType: e.target.value as 'full_time' | 'part_time' })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="full_time">正社員 (月給制)</option>
                    <option value="part_time">パート・アルバイト (時給制)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">時給 / 基準単価 (円)</label>
                  <input
                    type="number"
                    step="50"
                    value={empForm.hourlyWage || ''}
                    onChange={(e) => setEmpForm({ ...empForm, hourlyWage: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="例: 1250"
                  />
                </div>
              </div>

              {/* Avatar color selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">アイコンカラー</label>
                <div className="flex flex-wrap gap-1.5">
                  {avatarColorOptions.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEmpForm({ ...empForm, avatarColor: c })}
                      className={`w-6 h-6 rounded-lg ${c} transition-transform ${
                        empForm.avatarColor === c ? 'ring-2 ring-indigo-500 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingEmp(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all"
              >
                保存する
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
