import React from 'react';
import { Volume2, VolumeX, Maximize2, Minimize2, HelpCircle, Box } from 'lucide-react';
import { CubeDimension } from '../types/rubik';
import { formatTime } from '../utils/cubeMath';

interface HeaderHUDProps {
  dimension: CubeDimension;
  onDimensionChange: (dim: CubeDimension) => void;
  moveCount: number;
  timerMs: number;
  timerState: 'idle' | 'holding' | 'ready' | 'running' | 'stopped';
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenHelp: () => void;
  onTimerAreaClick?: () => void;
  bestTimeMs?: number;
}

export const HeaderHUD: React.FC<HeaderHUDProps> = ({
  dimension,
  onDimensionChange,
  moveCount,
  timerMs,
  timerState,
  soundEnabled,
  onToggleSound,
  onOpenHelp,
  onTimerAreaClick,
  bestTimeMs,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const getTimerColor = () => {
    switch (timerState) {
      case 'holding':
        return 'text-amber-400';
      case 'ready':
        return 'text-emerald-400';
      case 'running':
        return 'text-white';
      case 'stopped':
        return 'text-cyan-400';
      default:
        return 'text-neutral-300';
    }
  };

  const getTimerSubtext = () => {
    switch (timerState) {
      case 'holding':
        return 'Tahan...';
      case 'ready':
        return 'Lepas untuk Mulai!';
      case 'running':
        return 'Berjalan (Klik layar/spasi untuk stop)';
      case 'stopped':
        return bestTimeMs && timerMs <= bestTimeMs ? 'Rekor Terbaik!' : 'Selesai';
      default:
        return 'Tahan Spasi / Klik untuk Timer';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-30 pointer-events-none p-3 sm:p-4 flex items-start justify-between">
      {/* Left: Branding & Dimension Selector */}
      <div className="pointer-events-auto flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-neutral-900/90 border border-neutral-800 px-3 py-1.5 rounded-xl shadow-lg">
          <div className="w-5 h-5 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Box className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold tracking-tight text-white uppercase">Rubik HD 3D</span>
        </div>

        {/* Dimension Pill Picker */}
        <div className="flex items-center gap-1 bg-neutral-900/90 border border-neutral-800 p-1 rounded-xl shadow-lg">
          {([2, 3, 4, 5] as CubeDimension[]).map(dim => {
            const active = dim === dimension;
            return (
              <button
                key={dim}
                onClick={() => onDimensionChange(dim)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-neutral-100 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80'
                }`}
                title={`Ganti Ukuran Kubus ${dim}x${dim}`}
              >
                {dim}x{dim}
              </button>
            );
          })}
        </div>
      </div>

      {/* Center: WCA Speedcubing Timer */}
      <div
        onClick={onTimerAreaClick}
        className="pointer-events-auto cursor-pointer select-none flex flex-col items-center bg-neutral-900/90 border border-neutral-800 px-5 py-2 rounded-2xl shadow-xl transition-all hover:border-neutral-700"
      >
        <div className={`font-mono-digits text-2xl sm:text-3xl font-extrabold tracking-tight ${getTimerColor()}`}>
          {formatTime(timerMs)}
        </div>
        <div className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400 mt-0.5">
          {getTimerSubtext()}
        </div>
      </div>

      {/* Right: Moves Counter, Sound, Fullscreen, Help */}
      <div className="pointer-events-auto flex items-center gap-1.5">
        <div className="hidden sm:flex items-center gap-1 bg-neutral-900/90 border border-neutral-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-300 shadow-lg">
          <span className="text-neutral-500 text-[11px]">Gerakan:</span>
          <span className="font-mono-digits text-white font-bold">{moveCount}</span>
        </div>

        <button
          onClick={onToggleSound}
          className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors shadow-lg cursor-pointer"
          title={soundEnabled ? 'Matikan Suara' : 'Aktifkan Suara'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
        </button>

        <button
          onClick={toggleFullscreen}
          className="hidden sm:flex p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors shadow-lg cursor-pointer"
          title="Layar Penuh"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenHelp}
          className="p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors shadow-lg cursor-pointer"
          title="Panduan Kontrol & Shortcut"
        >
          <HelpCircle className="w-4 h-4 text-cyan-400" />
        </button>
      </div>
    </header>
  );
};
