import React from 'react';
import { X, MousePointer, Rotate3d, Keyboard, Sparkles } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-neutral-200 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Panduan Bermain Rubik HD 3D</h2>
              <p className="text-xs text-neutral-400">Kontrol responsif, halus tanpa lag</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm max-h-[70vh] overflow-y-auto pr-1">
          {/* Touch / Mouse Drag */}
          <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1.5">
              <MousePointer className="w-4 h-4" />
              <span>Memutar Layer Kubus (Direct Drag)</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Klik / sentuh dan geser langsung pada potongan (sticker) yang ingin diputar. Sistem akan mendeteksi arah geser dan memutar layer secara mulus dengan fisika snap 90°.
            </p>
          </div>

          {/* Camera Orbit */}
          <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1.5">
              <Rotate3d className="w-4 h-4" />
              <span>Mengubah Sudut Pandang Kamera</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Geser pointer di area latar belakang kosong di sekitar kubus untuk memutar sudut pandang (Orbit). Gunakan scroll mouse atau cubit (pinch) pada layar sentuh untuk Zoom.
            </p>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80">
            <div className="flex items-center gap-2 text-amber-400 font-semibold mb-2">
              <Keyboard className="w-4 h-4" />
              <span>Shortcut Keyboard</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="text-neutral-400">U, D, L, R, F, B</span>
                <span className="font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-white">Layer Putar</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="text-neutral-400">Shift + Huruf</span>
                <span className="font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-white">Lawan Arah</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="text-neutral-400">Spasi (Tahan & Lepas)</span>
                <span className="font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-emerald-400">Timer WCA</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="text-neutral-400">Z / Ctrl+Z</span>
                <span className="font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-white">Undo Gerakan</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="text-neutral-400">Tombol H</span>
                <span className="font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-white">Dock Hide/Show</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="text-neutral-400">Tombol S</span>
                <span className="font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-white">Acak (Scramble)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="text-neutral-400">Panah ⬅️ ➡️ ⬆️ ⬇️</span>
                <span className="font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-emerald-400 font-bold">Putar / Kamera</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="text-neutral-400">Shift + Panah</span>
                <span className="font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-cyan-400">Layer Bawah/Kiri</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="text-neutral-400">Alt/Ctrl + Panah</span>
                <span className="font-mono bg-neutral-800 px-1.5 py-0.5 rounded text-amber-400">Putar Kamera 3D</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Mengerti & Mulai Bermain
          </button>
        </div>
      </div>
    </div>
  );
};
