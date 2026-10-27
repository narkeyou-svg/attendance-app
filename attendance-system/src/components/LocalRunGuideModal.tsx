import React, { useState } from 'react';
import {
  Laptop,
  X,
  Terminal,
  Download,
  FolderArchive,
  CheckCircle,
  Copy,
  ExternalLink,
  HelpCircle,
  Database,
  Globe,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { exportAllDataAsJson } from '../utils/storage';

interface LocalRunGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocalRunGuideModal: React.FC<LocalRunGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'download' | 'render' | 'faq'>('download');
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(id);
    setTimeout(() => setCopiedStep(null), 2500);
  };

  const handleDownloadData = () => {
    const jsonStr = exportAllDataAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_data_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border-2 border-slate-200 overflow-hidden transform transition-all max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                ローカルPC起動・Render公開 ＆ よくある疑問
              </h2>
              <p className="text-xs text-slate-400">
                お使いのパソコンやRenderなどの無料クラウドで動かすガイドです
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('download')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'download'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📦 ZIPダウンロード＆PC起動
          </button>
          <button
            onClick={() => setActiveTab('render')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'render'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Renderでネット公開</span>
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'faq'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>DBは必要？データは消える？</span>
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm">
          {/* TAB 1: DOWNLOAD & PC START */}
          {activeTab === 'download' && (
            <div className="space-y-5">
              {/* Main Action: Instant ZIP Download Card */}
              <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl shadow-lg shadow-emerald-700/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderArchive className="w-6 h-6 text-emerald-200" />
                    <h3 className="text-lg font-black tracking-tight">
                      プログラム一式 (ZIP) のダウンロード
                    </h3>
                  </div>
                  <span className="text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full font-bold">
                    約92 KB
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                  プログラム一式、設定ファイル、Windows用ワンクリック起動バッチ <code className="bg-white/20 px-1 py-0.5 rounded">start.bat</code> がすべて入っています。
                </p>
                <a
                  href="/attendance-system.zip"
                  download="attendance-system.zip"
                  className="w-full py-4 px-6 bg-white hover:bg-emerald-50 active:scale-98 text-emerald-900 font-black text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2.5 text-center cursor-pointer"
                >
                  <Download className="w-5 h-5 text-emerald-700" />
                  <span>📦 attendance-system.zip を今すぐダウンロード</span>
                </a>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-800">
                  💻 ダウンロード後の起動手順（3ステップ）
                </h4>

                {/* Step 1 */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm mb-1">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <span>ダウンロードした ZIP を解凍する</span>
                  </div>
                  <p className="text-xs text-slate-500 pl-8 leading-relaxed">
                    ダウンロードした <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono">attendance-system.zip</code> を右クリックして「すべて展開」（解凍）し、お好きなフォルダ（デスクトップなど）に置きます。
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm mb-1">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <span>Node.js の準備 (初回のみ)</span>
                  </div>
                  <p className="text-xs text-slate-500 pl-8 leading-relaxed">
                    プログラムを動かす基盤となる無料の <strong>Node.js (推奨版/LTS)</strong> をインストールします。（既に入っている場合は不要です）
                  </p>
                  <div className="pl-8 mt-2">
                    <a
                      href="https://nodejs.org/"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold underline"
                    >
                      <span>Node.js 公式サイト (https://nodejs.org) から無料ダウンロード</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm mb-1">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    <span>起動する</span>
                  </div>
                  
                  <div className="pl-8 space-y-2 mt-2">
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-xs">
                      <strong className="block text-emerald-800 mb-0.5">★ Windows パソコンの場合（一番かんたん）:</strong>
                      解凍したフォルダの中にある <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300">start.bat</strong> をダブルクリックするだけで自動で起動します！
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                      <strong className="block text-slate-700">コマンドで起動する場合（Mac / Linux / Windows共通）:</strong>
                      <div className="p-2 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 select-none mr-2"># 1. 初回のみパッケージをインストール</span>
                          <span className="text-emerald-400 font-bold block mt-0.5">npm install</span>
                        </div>
                        <button
                          onClick={() => handleCopy('npm install', 'install')}
                          className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                        >
                          {copiedStep === 'install' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="p-2 bg-slate-900 text-slate-100 rounded-lg font-mono text-xs flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 select-none mr-2"># 2. 起動</span>
                          <span className="text-emerald-400 font-bold block mt-0.5">npm run dev</span>
                        </div>
                        <button
                          onClick={() => handleCopy('npm run dev', 'run')}
                          className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                        >
                          {copiedStep === 'run' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 font-bold pt-1">
                      起動後、ブラウザで <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">http://localhost:3000</span> を開くと、出退勤システムがすぐに動きます。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RENDER DEPLOYMENT */}
          {activeTab === 'render' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-3">
                <Globe className="w-5 h-5 text-indigo-700 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-indigo-950 text-sm">
                    Render (render.com) で完全無料でインターネット公開できます
                  </h4>
                  <p className="text-xs text-indigo-900 mt-1">
                    Renderの「Static Site（静的サイト）」機能を使えば、サーバー費用0円で専用のURL（例: <code className="bg-white px-1 py-0.2 rounded font-mono">https://○○○.onrender.com</code>）が手に入ります。
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">1</span>
                    <span>GitHubにリポジトリを作ってコードを置く</span>
                  </div>
                  <p className="text-xs text-slate-600 pl-7 leading-relaxed">
                    無料の GitHub アカウントで新しいリポジトリを作成し、ダウンロードしたZIPの中身をそのままアップロード（git push）します。
                  </p>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">2</span>
                    <span>Renderで「Static Site」を新規作成</span>
                  </div>
                  <div className="text-xs text-slate-600 pl-7 space-y-1.5 leading-relaxed">
                    <p><a href="https://render.com" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline">Render (https://render.com)</a> に無料登録し、画面右上の「New +」から <strong>「Static Site」</strong> を選びます。</p>
                    <p>ステップ1で作成した GitHub リポジトリを連携・選択します。</p>
                  </div>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">3</span>
                    <span>ビルド設定を入力（これだけでOK！）</span>
                  </div>
                  <div className="pl-7 space-y-2 text-xs">
                    <div className="p-3 bg-slate-100 rounded-xl font-mono text-slate-800 space-y-1">
                      <div><strong>Build Command:</strong> <code className="bg-white px-2 py-0.5 rounded border border-slate-300 font-bold text-indigo-700">npm run build</code></div>
                      <div><strong>Publish Directory:</strong> <code className="bg-white px-2 py-0.5 rounded border border-slate-300 font-bold text-indigo-700">dist</code></div>
                    </div>
                    <p className="text-slate-600">
                      「Create Static Site」ボタンを押すと、1〜2分でビルドが完了し、公開URLが自動発行されます！
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FAQ & DB EXPLANATION */}
          {activeTab === 'faq' && (
            <div className="space-y-4">
              {/* Question 1: Browser closing */}
              <div className="p-5 bg-emerald-50 border-2 border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-950 font-black text-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  <span>Q. ブラウザを閉じたらデータは消えてしまわない？</span>
                </div>
                <div className="text-xs sm:text-sm text-emerald-950 pl-7 space-y-2 leading-relaxed">
                  <p className="font-bold text-emerald-900 text-sm">
                    A. 通常の「ブラウザを閉じる」「パソコンの電源を切る」では【絶対に消えません】！
                  </p>
                  <p>
                    本システムで記録したデータは、ブラウザの一時的なメモリではなく、お使いのパソコンのハードディスク（SSD）上の専用の保管領域（LocalStorage）にファイルとして書き込まれます。
                  </p>
                  <p className="text-xs text-emerald-800">
                    そのため、夜にブラウザを閉じてパソコンをシャットダウンしても、翌朝また開けば前日までのデータがそのまま残っています。
                  </p>
                  <div className="p-2.5 bg-white/70 rounded-xl border border-emerald-200 text-xs text-slate-700">
                    <strong className="text-rose-700">※例外的にデータが消える場合：</strong>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px]">
                      <li>ブラウザ設定から「閲覧履歴・Cookie・キャッシュの全削除」を手動で行った場合</li>
                      <li>「シークレットモード（プライベートウィンドウ）」で開いている場合</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Question 2: Is DB really not needed? */}
              <div className="p-5 bg-blue-50 border-2 border-blue-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-blue-950 font-black text-sm">
                  <Database className="w-5 h-5 text-blue-700" />
                  <span>Q. データベース（DB）は本当に必要ないの？</span>
                </div>
                <div className="text-xs sm:text-sm text-blue-950 pl-7 space-y-2 leading-relaxed">
                  <p className="font-bold text-blue-900 text-sm">
                    A. 「どのように運用するか」によって変わります！
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 bg-white rounded-xl border border-blue-200">
                      <span className="font-black text-emerald-700 block mb-1">① DBが不要なケース（現在）</span>
                      <p className="text-xs text-slate-600">
                        「会社の受付や事務所にある<strong>決まった1台のPCやiPad</strong>を置き、みんながそこに来て名前を押して打刻する」（従来の紙のタイムカード機と同じ運用）。
                      </p>
                      <span className="inline-block mt-2 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        設定不要・無料・今すぐ運用可能
                      </span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-blue-200">
                      <span className="font-black text-indigo-700 block mb-1">② DBが必要になるケース</span>
                      <p className="text-xs text-slate-600">
                        「従業員が<strong>各自のスマートフォン</strong>から打刻したい」または「受付iPadで打刻したものを、<strong>管理者が自宅や別のPCからリアルタイムで見たい</strong>」。
                      </p>
                      <span className="inline-block mt-2 text-[11px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">
                        クラウドDB (Firebase等) が必要
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Current Data Migration */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h5 className="font-bold text-xs text-slate-800">
                いま画面上にあるデータをバックアップしたい場合
              </h5>
              <p className="text-[11px] text-slate-500 mt-0.5">
                現在の従業員や打刻データをJSON形式で手元に保存できます。
              </p>
            </div>
            <button
              onClick={handleDownloadData}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs flex items-center gap-1.5 transition-all flex-shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>データを手元に保存 (JSON)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-xs transition-all cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
