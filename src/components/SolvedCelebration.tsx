import React from 'react';
import { Trophy, RefreshCw, Sparkles, Share2 } from 'lucide-react';
import { formatTime } from '../utils/cubeMath';
import { CubeDimension } from '../types/rubik';

interface SolvedCelebrationProps {
  isOpen: boolean;
  dimension: CubeDimension;
  timeMs: number;
  moveCount: number;
  isNewBest: boolean;
  onScrambleAgain: () => void;
  onClose: () => void;
}

export const SolvedCelebration: React.FC<SolvedCelebrationProps> = ({
  isOpen,
  dimension,
  timeMs,
  moveCount,
  isNewBest,
  onScrambleAgain,
  onClose,
}) => {
  if (!isOpen) return null;

  const tps = timeMs > 0 ? ((moveCount / (timeMs / 1000))).toFixed(2) : '0.00';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-700/80 rounded-2xl p-6 text-center text-neutral-100 shadow-2xl">
        {/* Glow icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
          <Trophy className="w-8 h-8" />
        </div>

        {isNewBest && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold mb-3 tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" /> Rekor Terbaik Baru (PB)!
          </div>
        )}

        <h2 className="text-2xl font-extrabold text-white tracking-tight">KUBUS TERPECAHKAN!</h2>
        <p className="text-xs text-neutral-400 mt-1">Rubik {dimension}x{dimension}x{dimension} berhasil diselesaikan dengan sukses!</p>

        {/* Stats card */}
        <div className="mt-5 grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-neutral-950 border border-neutral-800">
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">Waktu</span>
            <span className="font-mono-digits text-lg font-bold text-emerald-400">
              {timeMs > 0 ? formatTime(timeMs) : '--.--'}
            </span>
          </div>
          <div className="flex flex-col items-center border-x border-neutral-800">
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">Gerakan</span>
            <span className="font-mono-digits text-lg font-bold text-white">{moveCount}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">TPS</span>
            <span className="font-mono-digits text-lg font-bold text-cyan-400">{tps}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <button
            onClick={onScrambleAgain}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Acak Lagi
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold text-xs transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
