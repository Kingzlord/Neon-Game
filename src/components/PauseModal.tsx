import React from 'react';
import { Play, RotateCcw, Home, Crosshair, Keyboard } from 'lucide-react';

interface PauseModalProps {
  levelName: string;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  levelName,
  onResume,
  onRestart,
  onMainMenu
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-[#0B0F19] border-2 border-sky-500/60 chamfer-box-lg max-w-md w-full p-6 shadow-[0_0_40px_rgba(56,189,248,0.3)] text-center">
        <div className="text-xs font-mono-code uppercase tracking-widest text-sky-400 mb-1">
          TACTICAL STANDBY // {levelName}
        </div>
        <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wide mb-5">
          SYSTEM PAUSED
        </h2>

        {/* Controls Reference Card */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 chamfer-box mb-5 text-left space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-sky-400" /> Move Left / Right
            </span>
            <span className="font-mono-code text-slate-200 font-bold">WASD / Arrow Keys</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-sky-400" /> Jump / Double Jump
            </span>
            <span className="font-mono-code text-slate-200 font-bold">SPACE / W / UP</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-sky-400" /> 360° Aim & Shoot
            </span>
            <span className="font-mono-code text-slate-200 font-bold">Mouse + Left Click</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-sky-400" /> Interact / Activate Switch
            </span>
            <span className="font-mono-code text-slate-200 font-bold">E or Shoot Switch</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-sky-400" /> Equip Weapon (1-10)
            </span>
            <span className="font-mono-code text-slate-200 font-bold">Keys 1 - 0</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-3 px-5 chamfer-box bg-gradient-to-r from-sky-400 to-cyan-300 hover:from-sky-300 hover:to-cyan-200 text-slate-950 font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            Resume Mission
          </button>

          <button
            onClick={onRestart}
            className="w-full py-2.5 px-5 chamfer-box bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            Restart Sector
          </button>

          <button
            onClick={onMainMenu}
            className="w-full py-2.5 px-5 chamfer-box bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-display font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4 text-rose-400" />
            Abort to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
