import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Video, Box, EyeOff, Eye } from 'lucide-react';

export type ArrowKeyMode = 'layer' | 'camera';

interface ArrowPadProps {
  mode: ArrowKeyMode;
  onModeChange: (mode: ArrowKeyMode) => void;
  onArrowPress: (dir: 'left' | 'right' | 'up' | 'down') => void;
  activeArrow: 'left' | 'right' | 'up' | 'down' | null;
}

export const ArrowPad: React.FC<ArrowPadProps> = ({
  mode,
  onModeChange,
  onArrowPress,
  activeArrow,
}) => {
  const [isMinimized, setIsMinimized] = React.useState<boolean>(false);

  return (
    <div className="fixed bottom-24 right-4 z-30 pointer-events-auto flex flex-col items-end">
      {/* Mini toggle bar */}
      <div className="flex items-center gap-1.5 mb-2 bg-neutral-900/90 border border-neutral-800 p-1 rounded-xl shadow-xl">
        <button
          onClick={() => onModeChange(mode === 'layer' ? 'camera' : 'layer')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer bg-neutral-800 text-neutral-200 hover:text-white"
          title="Ganti fungsi tombol panah keyboard"
        >
          {mode === 'layer' ? (
            <>
              <Box className="w-3.5 h-3.5 text-emerald-400" />
              <span>Panah: Layer</span>
            </>
          ) : (
            <>
              <Video className="w-3.5 h-3.5 text-cyan-400" />
              <span>Panah: Kamera</span>
            </>
          )}
        </button>

        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title={isMinimized ? 'Tampilkan Tombol Panah' : 'Sembunyikan Tombol Panah'}
        >
          {isMinimized ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* D-Pad Buttons */}
      {!isMinimized && (
        <div className="bg-neutral-900/95 border border-neutral-800/90 p-2.5 rounded-2xl shadow-2xl flex flex-col items-center select-none backdrop-blur-none">
          {/* Up */}
          <button
            onPointerDown={() => onArrowPress('up')}
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs transition-all cursor-pointer mb-1 border ${
              activeArrow === 'up'
                ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-lg shadow-emerald-500/20 scale-95'
                : 'bg-neutral-950 text-neutral-200 border-neutral-800 hover:bg-neutral-800 active:scale-95'
            }`}
            title="Panah Atas (Keyboard: ArrowUp)"
          >
            <ArrowUp className="w-5 h-5" />
          </button>

          {/* Middle Row: Left, Center Mode Icon, Right */}
          <div className="flex items-center gap-1">
            {/* Left */}
            <button
              onPointerDown={() => onArrowPress('left')}
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs transition-all cursor-pointer border ${
                activeArrow === 'left'
                  ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-lg shadow-emerald-500/20 scale-95'
                : 'bg-neutral-950 text-neutral-200 border-neutral-800 hover:bg-neutral-800 active:scale-95'
              }`}
              title="Panah Kiri (Keyboard: ArrowLeft)"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Center mode badge */}
            <div
              onClick={() => onModeChange(mode === 'layer' ? 'camera' : 'layer')}
              className="w-8 h-8 rounded-lg bg-neutral-950 border border-neutral-800/80 flex items-center justify-center text-neutral-400 cursor-pointer hover:text-white"
              title="Klik untuk ganti mode (Layer / Kamera)"
            >
              {mode === 'layer' ? <Box className="w-4 h-4 text-emerald-400" /> : <Video className="w-4 h-4 text-cyan-400" />}
            </div>

            {/* Right */}
            <button
              onPointerDown={() => onArrowPress('right')}
              className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs transition-all cursor-pointer border ${
                activeArrow === 'right'
                  ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-lg shadow-emerald-500/20 scale-95'
                : 'bg-neutral-950 text-neutral-200 border-neutral-800 hover:bg-neutral-800 active:scale-95'
              }`}
              title="Panah Kanan (Keyboard: ArrowRight)"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Down */}
          <button
            onPointerDown={() => onArrowPress('down')}
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs transition-all cursor-pointer mt-1 border ${
              activeArrow === 'down'
                ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-lg shadow-emerald-500/20 scale-95'
                : 'bg-neutral-950 text-neutral-200 border-neutral-800 hover:bg-neutral-800 active:scale-95'
            }`}
            title="Panah Bawah (Keyboard: ArrowDown)"
          >
            <ArrowDown className="w-5 h-5" />
          </button>

          {/* Description subtext */}
          <div className="text-[9px] text-neutral-400 mt-1.5 font-medium tracking-tight">
            {mode === 'layer' ? 'Putar Layer Kubus' : 'Putar Sudut Kamera'}
          </div>
        </div>
      )}
    </div>
  );
};
