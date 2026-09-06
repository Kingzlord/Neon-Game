import React, { useState } from 'react';
import {
  Play,
  Users,
  Lock,
  Unlock,
  Zap,
  Shield,
  Crosshair,
  ChevronRight,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';
import { LEVELS, LevelDef } from '../data/levels';
import { WEAPONS } from '../data/weapons';

interface MainMenuProps {
  unlockedLevelIds: number[];
  unlockedWeaponIds: number[];
  onStartLevel: (levelId: number) => void;
  onOpenMultiplayerModal: () => void;

  isMuted: boolean;
  onToggleMute: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  unlockedLevelIds,
  unlockedWeaponIds,
  onStartLevel,
  onOpenMultiplayerModal,

  isMuted,
  onToggleMute
}) => {
  const [selectedLevel, setSelectedLevel] = useState<LevelDef>(
    LEVELS.find((l) => l.id === Math.max(...unlockedLevelIds)) || LEVELS[0]
  );
  const [activeTab, setActiveTab] = useState<'sectors' | 'armory'>('sectors');

  const isLevelUnlocked = (id: number) => unlockedLevelIds.includes(id);

  return (
    <div className="relative w-full h-screen bg-[#0B0F19] text-slate-100 overflow-y-auto flex flex-col justify-between p-4 md:p-8 scanlines">
      {/* Ambient Glowing Background Spheres */}
      <div className="pointer-events-none fixed -top-40 -left-40 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed -bottom-40 -right-40 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl" />

      {/* Header Bar */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 chamfer-box bg-gradient-to-br from-sky-400 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.4)]">
            <Shield className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono-code uppercase tracking-widest text-sky-400">
                OBSIDIAN CITADEL // VANGUARD OS v3.4
              </span>
              <span className="px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[9px] font-mono-code rounded">
                CRAZYGAMES SDK v3 READY
              </span>
            </div>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-wider text-white">
              AETHER-FORGE
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
        

          <button
            onClick={onToggleMute}
            className="p-2 chamfer-box bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="relative z-10 my-auto py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Primary Mode Selection (Single Player vs Multiplayer Coming Soon) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-5 chamfer-box-lg space-y-3">
            <div className="text-xs font-mono-code uppercase tracking-widest text-sky-400">
              PRIMARY DEPLOYMENT MODE
            </div>

            {/* SINGLE PLAYER BUTTON */}
            <button
              onClick={() => onStartLevel(selectedLevel.id)}
              className="w-full py-4 px-5 chamfer-box bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 hover:from-sky-300 hover:to-emerald-200 text-slate-950 font-display font-bold text-lg uppercase tracking-wider flex items-center justify-between shadow-[0_0_25px_rgba(56,189,248,0.4)] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <Play className="w-6 h-6 fill-slate-950" />
                <div className="text-left">
                  <div>SINGLE PLAYER</div>
                  <div className="text-[11px] font-mono-code text-slate-900 font-semibold">
                    Launch Sector {selectedLevel.id}: {selectedLevel.name}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* MULTIPLAYER (COMING SOON) BUTTON */}
            <button
              onClick={onOpenMultiplayerModal}
              className="w-full py-3.5 px-5 chamfer-box bg-slate-950/90 hover:bg-slate-900 border-2 border-purple-500/50 hover:border-purple-400 text-slate-200 font-display font-bold text-base uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-purple-400" />
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span>MULTIPLAYER</span>
                    <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-400/50 text-purple-300 text-[9px] font-mono-code rounded">
                      COMING SOON
                    </span>
                  </div>
                  <div className="text-[11px] font-mono-code text-slate-400">
                    Modular Photon Realtime Architecture
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Selected Sector Briefing Card */}
          <div className="bg-slate-900/80 border border-sky-500/30 p-5 chamfer-box-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono-code text-sky-400 uppercase">
                {selectedLevel.sectorCode}
              </span>
              <span className="text-xs font-mono-code text-emerald-400">
                BOSS: {selectedLevel.boss.name.split(':')[0]}
              </span>
            </div>
            <h2 className="font-display text-xl font-bold text-white">
              Level {selectedLevel.id}: {selectedLevel.name}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedLevel.puzzleHint}
            </p>

            {/* Level Weapon Preview */}
            {(() => {
              const lvlWeapon = WEAPONS.find((w) => w.levelUnlocked === selectedLevel.id) || WEAPONS[0];
              return (
                <div className="bg-slate-950/90 border border-slate-800 p-3 chamfer-box flex items-center gap-3">
                  <Zap className="w-5 h-5 shrink-0" style={{ color: lvlWeapon.color }} />
                  <div>
                    <div className="text-[10px] font-mono-code text-slate-400 uppercase">
                      Sector Signature Weapon
                    </div>
                    <div className="font-display text-xs font-bold text-slate-100">
                      {lvlWeapon.name} — <span className="text-slate-400 font-normal">{lvlWeapon.subtitle}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Right Column: 10-Level Sector Matrix & 10-Weapon Armory Codex */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 p-5 chamfer-box-lg">
          {/* Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('sectors')}
                className={`px-4 py-1.5 chamfer-box font-display text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  activeTab === 'sectors'
                    ? 'bg-sky-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                10 Campaign Sectors ({unlockedLevelIds.length}/10)
              </button>
              <button
                onClick={() => setActiveTab('armory')}
                className={`px-4 py-1.5 chamfer-box font-display text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                  activeTab === 'armory'
                    ? 'bg-sky-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                Armory Codex ({unlockedWeaponIds.length}/10 Weapons)
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono-code">
              <Crosshair className="w-3.5 h-3.5 text-sky-400" /> Select Sector to Deploy
            </div>
          </div>

          {activeTab === 'sectors' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[430px] overflow-y-auto pr-1">
              {LEVELS.map((lvl) => {
                const unlocked = isLevelUnlocked(lvl.id);
                const isSelected = selectedLevel.id === lvl.id;
                const weapon = WEAPONS.find((w) => w.levelUnlocked === lvl.id);

                return (
                  <div
                    key={lvl.id}
                    onClick={() => {
                      if (unlocked) {
                        setSelectedLevel(lvl);
                      }
                    }}
                    className={`p-3.5 chamfer-box border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.25)] cursor-pointer'
                        : unlocked
                        ? 'bg-slate-950/70 border-slate-800 hover:border-slate-600 cursor-pointer'
                        : 'bg-slate-950/30 border-slate-900 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 chamfer-box flex items-center justify-center font-mono-code font-bold text-sm ${
                          unlocked ? 'bg-slate-900 text-sky-400 border border-sky-500/40' : 'bg-slate-900 text-slate-600'
                        }`}
                      >
                        {unlocked ? lvl.id : <Lock className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-display text-sm font-bold text-white flex items-center gap-2">
                          <span>{lvl.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Boss: {lvl.boss.name.split(':')[0]}</span>
                          {weapon && (
                            <span className="text-sky-400 font-mono-code">• {weapon.name.split(' ')[0]}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {unlocked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartLevel(lvl.id);
                        }}
                        className="px-3 py-1.5 chamfer-box bg-sky-400 hover:bg-sky-300 text-slate-950 font-display font-bold text-xs uppercase cursor-pointer"
                      >
                        Deploy
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[430px] overflow-y-auto pr-1">
              {WEAPONS.map((w) => {
                const unlocked = unlockedWeaponIds.includes(w.id);
                return (
                  <div
                    key={w.id}
                    className={`p-3.5 chamfer-box border flex items-start gap-3 ${
                      unlocked ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-950/30 border-slate-900 opacity-45'
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded flex items-center justify-center shrink-0 border mt-0.5"
                      style={{ borderColor: w.color }}
                    >
                      {unlocked ? <Zap className="w-4 h-4" style={{ color: w.color }} /> : <Lock className="w-4 h-4 text-slate-500" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-white">{w.name}</span>
                        <span className="text-[10px] font-mono-code text-sky-400">LVL {w.levelUnlocked}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{w.description}</div>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono-code text-slate-300">
                        <span>DMG: {w.damage}</span>
                        <span>SHOTS: {w.projectileCount}</span>
                        {w.bounceCount > 0 && <span className="text-amber-400">BOUNCE x{w.bounceCount}</span>}
                        {w.pierceCount > 0 && <span className="text-rose-400">PIERCE x{w.pierceCount}</span>}
                        {w.isHoming && <span className="text-purple-400">HOMING</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer Info Bar */}
      <footer className="relative z-10 border-t border-slate-800/80 pt-3 flex flex-wrap items-center justify-between text-xs text-slate-500">
        <div>WASD: Move • SPACE: Jump & Double-Jump • MOUSE + LEFT CLICK: 360° Aim & Attack • E: Interact</div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-emerald-400">
            <Unlock className="w-3.5 h-3.5" /> Save Progress Synced
          </span>
        </div>
      </footer>
    </div>
  );
};
