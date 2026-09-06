import React from 'react';
import { Heart, Zap, Volume2, VolumeX, Pause, Crosshair, CheckCircle2 } from 'lucide-react';
import { WeaponDef, WEAPONS } from '../data/weapons';
import { LevelDef } from '../data/levels';

interface HUDProps {
  level: LevelDef;
  hp: number;
  maxHp: number;
  currentWeapon: WeaponDef;
  unlockedWeaponIds: number[];
  onSelectWeapon: (id: number) => void;
  bossActive: boolean;
  bossHp: number;
  bossMaxHp: number;
  bossName: string;
  bossTitle: string;
  bossPhase: 1 | 2;
  activatedSwitchesCount: number;
  totalSwitchesCount: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  level,
  hp,
  maxHp,
  currentWeapon,
  unlockedWeaponIds,
  onSelectWeapon,
  bossActive,
  bossHp,
  bossMaxHp,
  bossName,
  bossTitle,
  bossPhase,
  activatedSwitchesCount,
  totalSwitchesCount,
  isMuted,
  onToggleMute,
  onPause
}) => {
  const hpPercent = Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100)));

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 z-10">
      {/* Top Bar: Player Health, Level Sector Badge, Controls & Audio */}
      <div className="flex items-start justify-between gap-4">
        {/* Left: Player Health & Shield Status */}
        <div className="pointer-events-auto bg-[#0B0F19]/85 backdrop-blur-md border border-sky-500/30 p-3 chamfer-box min-w-[260px] shadow-lg">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span className="font-display text-xs uppercase tracking-wider text-slate-300">
                Vanguard Hull Integrity
              </span>
            </div>
            <span className="font-mono-code text-xs font-bold text-sky-400">
              {hp} / {maxHp} HP
            </span>
          </div>
          <div className="w-full h-3 bg-slate-900 rounded-sm overflow-hidden border border-slate-700">
            <div
              className="h-full transition-all duration-200 bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400"
              style={{ width: `${hpPercent}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Nodes Online: {activatedSwitchesCount}/{totalSwitchesCount}
            </span>
            <span className="font-mono-code text-sky-300">LVL {level.id}/10</span>
          </div>
        </div>

        {/* Center: Level Sector Banner OR Boss Health Bar */}
        {bossActive && bossHp > 0 ? (
          <div className="bg-[#0B0F19]/90 backdrop-blur-md border-2 border-rose-500/60 px-6 py-3 chamfer-box-lg min-w-[420px] max-w-xl shadow-[0_0_25px_rgba(244,63,94,0.35)]">
            <div className="flex items-center justify-between mb-1">
              <div>
                <div className="text-[10px] font-mono-code uppercase tracking-widest text-rose-400">
                  {bossTitle} {bossPhase === 2 ? '// OVERDRIVE PHASE II' : ''}
                </div>
                <div className="font-display text-lg font-bold text-white tracking-wide">
                  {bossName}
                </div>
              </div>
              <span className="font-mono-code text-sm font-bold text-rose-400">
                {bossHp} / {bossMaxHp}
              </span>
            </div>
            <div className="w-full h-3.5 bg-slate-950 rounded-sm overflow-hidden border border-rose-500/40">
              <div
                className="h-full transition-all duration-150 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500"
                style={{ width: `${Math.max(0, (bossHp / bossMaxHp) * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="bg-[#0B0F19]/80 backdrop-blur-md border border-slate-700/80 px-5 py-2 chamfer-box text-center hidden md:block">
            <div className="text-[10px] font-mono-code text-sky-400 tracking-widest uppercase">
              {level.sectorCode}
            </div>
            <div className="font-display text-sm font-bold text-slate-100">
              {level.name}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {level.puzzleHint}
            </div>
          </div>
        )}

        {/* Right: Audio & Pause Buttons */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={onToggleMute}
            className="bg-[#0B0F19]/85 hover:bg-slate-800 border border-slate-700 hover:border-sky-400 text-slate-200 p-2.5 chamfer-box transition-colors cursor-pointer"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5 text-sky-400" />}
          </button>
          <button
            onClick={onPause}
            className="bg-[#0B0F19]/85 hover:bg-slate-800 border border-slate-700 hover:border-sky-400 text-slate-200 px-3.5 py-2 chamfer-box flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Pause className="w-4 h-4 text-sky-400" />
            Menu
          </button>
        </div>
      </div>

      {/* Bottom Bar: Weapon Armory Hotbar */}
      <div className="flex items-end justify-between gap-4">
        <div className="pointer-events-auto bg-[#0B0F19]/85 backdrop-blur-md border border-slate-700/80 p-2.5 chamfer-box flex items-center gap-2 overflow-x-auto max-w-full">
          {WEAPONS.map((weapon) => {
            const unlocked = unlockedWeaponIds.includes(weapon.id);
            const active = currentWeapon.id === weapon.id;
            return (
              <button
                key={weapon.id}
                disabled={!unlocked}
                onClick={() => unlocked && onSelectWeapon(weapon.id)}
                className={`px-2.5 py-1.5 chamfer-box text-left transition-all cursor-pointer flex flex-col min-w-[76px] ${
                  active
                    ? 'bg-sky-500/20 border-2 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                    : unlocked
                    ? 'bg-slate-900/80 border border-slate-700 hover:border-slate-500'
                    : 'bg-slate-950/50 border border-slate-800/60 opacity-40 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono-code">
                  <span className={active ? 'text-sky-300 font-bold' : 'text-slate-400'}>
                    [{weapon.id === 10 ? '0' : weapon.id}]
                  </span>
                  {unlocked && <Zap className="w-3 h-3" style={{ color: weapon.color }} />}
                </div>
                <div className="font-display text-[11px] font-bold truncate text-slate-200 mt-0.5">
                  {unlocked ? weapon.name.split(' ')[0] : 'LOCKED'}
                </div>
              </button>
            );
          })}
        </div>

        {/* Controls Quick Reference */}
        <div className="hidden lg:flex items-center gap-4 bg-[#0B0F19]/80 backdrop-blur-md border border-slate-800 px-4 py-2 chamfer-box text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded text-[10px] font-mono-code">WASD</kbd> Move
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded text-[10px] font-mono-code">SPACE</kbd> Double Jump
          </span>
          <span className="flex items-center gap-1">
            <Crosshair className="w-3.5 h-3.5 text-sky-400" /> Aim & Left-Click Shoot
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded text-[10px] font-mono-code">1-0</kbd> Switch Weapon
          </span>
        </div>
      </div>
    </div>
  );
};
