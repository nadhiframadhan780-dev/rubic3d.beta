import React, { useState } from 'react';
import {
  Shuffle,
  Undo2,
  Wand2,
  RotateCcw,
  Palette,
  Camera,
  Layers,
  Gauge,
  Trophy,
  ChevronDown,
  ChevronUp,
  Compass,
} from 'lucide-react';
import { CubeDimension, CubeTheme, CubeMove } from '../types/rubik';
import { CUBE_THEMES } from '../constants/themes';
import { formatTime } from '../utils/cubeMath';

interface BottomDockProps {
  dimension: CubeDimension;
  theme: CubeTheme;
  onThemeChange: (theme: CubeTheme) => void;
  onScramble: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onAutoSolve: () => void;
  onReset: () => void;
  onRotateNotation: (notation: string) => void;
  onCameraPreset: (preset: 'isometric' | 'front' | 'top' | 'right') => void;
  explodedFactor: number;
  onExplodedChange: (factor: number) => void;
  speedMs: number;
  onSpeedChange: (speed: number) => void;
  bestRecords: Record<CubeDimension, number | null>;
  onClearRecords: () => void;
  isScrambling?: boolean;
}

type TabType = 'actions' | 'notations' | 'theme' | 'records';

export const BottomDock: React.FC<BottomDockProps> = ({
  dimension,
  theme,
  onThemeChange,
  onScramble,
  onUndo,
  canUndo,
  onAutoSolve,
  onReset,
  onRotateNotation,
  onCameraPreset,
  explodedFactor,
  onExplodedChange,
  speedMs,
  onSpeedChange,
  bestRecords,
  onClearRecords,
  isScrambling = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('actions');
  const [primeMode, setPrimeMode] = useState<boolean>(false);

  // Keyboard shortcut listener for 'H' to toggle dock
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key.toLowerCase() === 'h') {
        setIsCollapsed(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNotationClick = (baseFace: string) => {
    const notation = primeMode ? `${baseFace}'` : baseFace;
    onRotateNotation(notation);
  };

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 w-full max-w-[920px] px-3 sm:px-4 pointer-events-none">
      <div className="flex flex-col items-center">
        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="pointer-events-auto mb-1.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all shadow-md cursor-pointer"
          title="Tekan H untuk sembunyikan/tampilkan panel"
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Buka Kontrol (H)</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              <span>Sembunyikan Panel (H)</span>
            </>
          )}
        </button>

        {/* Main Dock Container */}
        <div
          className={`pointer-events-auto w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-2.5 sm:p-3 shadow-2xl transition-all duration-300 transform ${
            isCollapsed ? 'translate-y-[130%] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
          }`}
        >
          {/* Tabs bar */}
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-2.5 overflow-x-auto no-scrollbar gap-1">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('actions')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'actions'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Aksi</span>
              </button>

              <button
                onClick={() => setActiveTab('notations')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'notations'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Tombol Putar</span>
              </button>

              <button
                onClick={() => setActiveTab('theme')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'theme'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>Tema & 3D</span>
              </button>

              <button
                onClick={() => setActiveTab('records')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'records'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                <span>Rekor</span>
              </button>
            </div>

            {/* Camera presets */}
            <div className="hidden md:flex items-center gap-1 border-l border-neutral-800 pl-2">
              <span className="text-[10px] text-neutral-500 uppercase font-semibold mr-1">Kamera:</span>
              <button
                onClick={() => onCameraPreset('isometric')}
                className="px-2 py-1 rounded-lg text-[11px] font-medium bg-neutral-950 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Iso
              </button>
              <button
                onClick={() => onCameraPreset('front')}
                className="px-2 py-1 rounded-lg text-[11px] font-medium bg-neutral-950 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Depan
              </button>
              <button
                onClick={() => onCameraPreset('top')}
                className="px-2 py-1 rounded-lg text-[11px] font-medium bg-neutral-950 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Atas
              </button>
              <button
                onClick={() => onCameraPreset('right')}
                className="px-2 py-1 rounded-lg text-[11px] font-medium bg-neutral-950 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Kanan
              </button>
            </div>
          </div>

          {/* TAB 1: ACTIONS */}
          {activeTab === 'actions' && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Scramble */}
                <button
                  onClick={onScramble}
                  disabled={isScrambling}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>{isScrambling ? 'Mengacak...' : 'Acak Kubus (S)'}</span>
                </button>

                {/* Undo */}
                <button
                  onClick={onUndo}
                  disabled={!canUndo || isScrambling}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 text-xs font-semibold transition-all cursor-pointer"
                  title="Batalkan Gerakan Terakhir (Z)"
                >
                  <Undo2 className="w-4 h-4 text-cyan-400" />
                  <span>Undo</span>
                </button>

                {/* Auto Solve */}
                <button
                  onClick={onAutoSolve}
                  disabled={isScrambling}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 text-xs font-semibold transition-all cursor-pointer"
                  title="Selesaikan Kubus Secara Otomatis"
                >
                  <Wand2 className="w-4 h-4 text-amber-400" />
                  <span>Selesaikan</span>
                </button>

                {/* Reset */}
                <button
                  onClick={onReset}
                  disabled={isScrambling}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-300 text-xs font-semibold transition-all cursor-pointer"
                  title="Reset Kubus ke Bentuk Awal"
                >
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Mobile camera presets fallback */}
              <div className="flex md:hidden items-center gap-1">
                <button
                  onClick={() => onCameraPreset('isometric')}
                  className="p-1.5 rounded-lg bg-neutral-950 text-neutral-400 text-xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: QUICK NOTATION BUTTONS */}
          {activeTab === 'notations' && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-neutral-400">
                  Klik tombol atau gunakan keyboard untuk memutar:
                </span>
                <button
                  onClick={() => setPrimeMode(!primeMode)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    primeMode
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {primeMode ? "Arah: Terbalik ( ' )" : 'Arah: Standar (Clockwise)'}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {['U', 'D', 'L', 'R', 'F', 'B'].map(face => (
                  <button
                    key={face}
                    onClick={() => handleNotationClick(face)}
                    className="flex-1 min-w-[42px] py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 hover:text-white hover:border-neutral-600 font-mono-digits font-bold text-xs sm:text-sm transition-all cursor-pointer"
                  >
                    {face}
                    {primeMode ? "'" : ''}
                  </button>
                ))}

                {/* Middle slices for odd cubes */}
                {dimension % 2 === 1 &&
                  ['M', 'E', 'S'].map(slice => (
                    <button
                      key={slice}
                      onClick={() => handleNotationClick(slice)}
                      className="flex-1 min-w-[42px] py-2 rounded-xl bg-neutral-950/70 border border-neutral-800 text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/40 font-mono-digits font-bold text-xs sm:text-sm transition-all cursor-pointer"
                      title={`Tengah Slice ${slice}`}
                    >
                      {slice}
                      {primeMode ? "'" : ''}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 3: THEMES & 3D SETTINGS */}
          {activeTab === 'theme' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              {/* Theme picker */}
              <div>
                <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1.5">
                  Finishing & Material Realistis:
                </label>
                <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto pr-1">
                  {CUBE_THEMES.map(t => {
                    const active = t.id === theme.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => onThemeChange(t)}
                        className={`flex items-center gap-2 p-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          active
                            ? 'bg-neutral-800 border-neutral-600 text-white'
                            : 'bg-neutral-950 border-neutral-800/80 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-neutral-700 shrink-0"
                          style={{ backgroundColor: t.colors.F }}
                        />
                        <span className="truncate">{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exploded View Slider */}
              <div className="sm:border-l sm:border-neutral-800 sm:pl-3">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-neutral-400 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3 h-3 text-cyan-400" /> Pemisah Potongan 3D
                  </span>
                  <span className="font-mono-digits text-cyan-400">
                    {Math.round(explodedFactor * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={explodedFactor}
                  onChange={e => onExplodedChange(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-neutral-950 rounded-lg appearance-none"
                />
              </div>

              {/* Animation Speed */}
              <div className="sm:border-l sm:border-neutral-800 sm:pl-3">
                <label className="text-[10px] uppercase font-bold text-neutral-400 block mb-1.5 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-emerald-400" /> Kecepatan Putaran:
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { label: 'Cepat', val: 90 },
                    { label: 'Standar', val: 180 },
                    { label: 'Halus', val: 280 },
                  ].map(sp => (
                    <button
                      key={sp.val}
                      onClick={() => onSpeedChange(sp.val)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        speedMs === sp.val
                          ? 'bg-neutral-100 text-neutral-950 shadow-sm'
                          : 'bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {sp.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RECORDS & STATS */}
          {activeTab === 'records' && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="grid grid-cols-4 gap-2 w-full sm:w-auto flex-1">
                {([2, 3, 4, 5] as CubeDimension[]).map(dim => {
                  const record = bestRecords[dim];
                  const isCurrent = dim === dimension;
                  return (
                    <div
                      key={dim}
                      className={`flex flex-col items-center p-2 rounded-xl border ${
                        isCurrent
                          ? 'bg-neutral-800/80 border-amber-500/40'
                          : 'bg-neutral-950 border-neutral-800'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-neutral-400 uppercase">
                        {dim}x{dim}
                      </span>
                      <span className="font-mono-digits text-xs font-bold text-amber-400 mt-0.5">
                        {record ? formatTime(record) : '--.--'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={onClearRecords}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-rose-400 text-xs font-semibold transition-colors cursor-pointer shrink-0"
              >
                Hapus Rekor
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
