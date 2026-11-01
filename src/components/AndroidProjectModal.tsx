import React, { useState } from 'react';
import { Check, Copy, Download, FileCode, FolderTree, Terminal, X } from 'lucide-react';
import {
  ANDROID_PROJECT_FILES,
  AndroidSourceFile,
  createAndroidProjectZipBlob,
} from '../game/androidProjectFiles';

interface AndroidProjectModalProps {
  onClose: () => void;
}

export const AndroidProjectModal: React.FC<AndroidProjectModalProps> = ({
  onClose,
}) => {
  const [selectedFile, setSelectedFile] = useState<AndroidSourceFile>(
    ANDROID_PROJECT_FILES[0]
  );
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = [
    'All',
    'Kotlin UI (Compose)',
    'Domain & ViewModel',
    'Gradle & Build',
    'Android Resources',
    'Unit Tests',
  ];

  const filteredFiles =
    activeCategory === 'All'
      ? ANDROID_PROJECT_FILES
      : ANDROID_PROJECT_FILES.filter((f) => f.category === activeCategory);

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopiedPath(selectedFile.path);
      setTimeout(() => setCopiedPath(null), 1800);
    } catch {
      // Fallback ignored
    }
  };

  const handleDownloadZip = () => {
    const blob = createAndroidProjectZipBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'WaterSortPuzzleMaster-Android.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040B16]/85 p-4 md:p-6">
      <div className="flex flex-col w-full max-w-6xl h-[86vh] bg-[#0B1B32] border border-sky-400/25 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-[#081528] border-b border-sky-400/15">
          <div className="flex items-center gap-3">
            <FolderTree className="w-5 h-5 text-sky-400 shrink-0" />
            <div>
              <h2 className="text-lg font-bold text-[#F0F7FF] font-display">
                Android Studio Project Source (Kotlin &amp; Jetpack Compose)
              </h2>
              <p className="text-xs text-slate-400">
                Complete native Android project ready for{' '}
                <code className="font-mono-tabular text-sky-300">
                  gradlew.bat assembleDebug
                </code>{' '}
                · AGP 8.5.2 · Kotlin 1.9.24 · Compose BOM 2024.06.00
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadZip}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#071324] bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download Android Project (.zip)</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close source viewer"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-[#09182C] border-b border-sky-400/10 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeCategory === cat
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              {cat}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-400 whitespace-nowrap pl-4">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono-tabular">
              {ANDROID_PROJECT_FILES.length} project files included in root &amp; ZIP
            </span>
          </div>
        </div>

        {/* Split Explorer & Code Viewer */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Left File Tree */}
          <div className="w-72 md:w-80 shrink-0 bg-[#081526] border-r border-sky-400/15 overflow-y-auto p-3 space-y-1">
            {filteredFiles.map((file) => {
              const isSelected = file.path === selectedFile.path;
              const shortName = file.path.split('/').pop() || file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors cursor-pointer flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30'
                      : 'text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <FileCode
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      isSelected ? 'text-sky-400' : 'text-slate-500'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate">
                      {shortName}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate font-mono-tabular">
                      {file.path}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Code Pane */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#06101E]">
            <div className="flex items-center justify-between px-5 py-2.5 bg-[#09172A] border-b border-sky-400/10">
              <span className="text-xs font-mono-tabular text-sky-300 truncate">
                {selectedFile.path}
              </span>
              <button
                onClick={handleCopyContent}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {copiedPath === selectedFile.path ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy File</span>
                  </>
                )}
              </button>
            </div>
            <pre className="flex-1 p-5 overflow-auto text-xs leading-relaxed font-mono-tabular text-slate-200 selection:bg-sky-500/30">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
