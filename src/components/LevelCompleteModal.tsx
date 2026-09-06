import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, ArrowRight, Zap, ShieldCheck, RotateCcw, Home } from 'lucide-react';
import { LevelDef } from '../data/levels';
import { WEAPONS } from '../data/weapons';
import { GameStats } from '../engine/GameEngine';
import { crazyGamesService } from '../services/crazyGamesService';

interface LevelCompleteModalProps {
  level: LevelDef;
  stats: GameStats;
  onNextLevel: () => void;
  onReplayLevel: () => void;
  onMainMenu: () => void;
}

export const LevelCompleteModal: React.FC<LevelCompleteModalProps> = ({
  level,
  stats,
  onNextLevel,
  onReplayLevel,
  onMainMenu
}) => {
  const [requestingAd, setRequestingAd] = useState(false);

  useEffect(() => {
    crazyGamesService.happytime();
    try {
      confetti({
        particleCount: 85,
        spread: 70,
        origin: { y: 0.55 }
      });
    } catch {
      // ignore if confetti fails
    }
  }, []);

  const nextWeapon = WEAPONS.find((w) => w.levelUnlocked === level.id + 1);

  const handleContinueNextLevel = () => {
    if (requestingAd) return;
    setRequestingAd(true);

    // Request CrazyGames midgame advertisement before continuing to the next level
    crazyGamesService.requestAd('midgame', () => {
      setRequestingAd(false);
      onNextLevel();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="bg-[#0B0F19] border-2 border-sky-400/80 chamfer-box-lg max-w-lg w-full p-6 shadow-[0_0_50px_rgba(56,189,248,0.35)] text-center relative">
        <div className="mx-auto w-14 h-14 rounded-full bg-sky-500/15 border border-sky-400/50 flex items-center justify-center mb-3">
          <Trophy className="w-8 h-8 text-amber-400" />
        </div>

        <div className="text-xs font-mono-code uppercase tracking-widest text-emerald-400 mb-1">
          SECTOR {level.id} CLEARED // BOSS DEFEATED
        </div>
        <h2 className="font-display text-3xl font-bold text-white uppercase tracking-wide mb-1">
          VICTORY ACHIEVED
        </h2>
        <p className="text-xs text-slate-400 mb-5">
          {level.boss.name} neutralized. Sector telemetry synchronized.
        </p>

        {/* Mission Statistics Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="bg-slate-900/90 border border-slate-800 p-2.5 chamfer-box">
            <div className="text-[10px] font-mono-code text-slate-400 uppercase">Time Elapsed</div>
            <div className="font-display text-lg font-bold text-sky-400">
              {Math.round(stats.timeElapsedSec)}s
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-2.5 chamfer-box">
            <div className="text-[10px] font-mono-code text-slate-400 uppercase">Hostiles Slain</div>
            <div className="font-display text-lg font-bold text-emerald-400">
              {stats.enemiesDefeated + 1}
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-2.5 chamfer-box">
            <div className="text-[10px] font-mono-code text-slate-400 uppercase">Damage Output</div>
            <div className="font-display text-lg font-bold text-amber-400">
              {stats.damageDealt}
            </div>
          </div>
        </div>

        {/* New Weapon Unlocked Showcase */}
        {nextWeapon ? (
          <div className="bg-gradient-to-r from-slate-900 via-sky-950/50 to-slate-900 border border-sky-500/40 p-3.5 chamfer-box mb-5 text-left flex items-center gap-3.5">
            <div
              className="w-11 h-11 rounded-md flex items-center justify-center shrink-0 border"
              style={{ borderColor: nextWeapon.color, backgroundColor: 'rgba(15,23,42,0.9)' }}
            >
              <Zap className="w-6 h-6" style={{ color: nextWeapon.color }} />
            </div>
            <div>
              <div className="text-[10px] font-mono-code uppercase tracking-wider text-sky-400">
                NEW WEAPON UNLOCKED FOR LEVEL {level.id + 1}
              </div>
              <div className="font-display text-base font-bold text-white">
                {nextWeapon.name}
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                {nextWeapon.description}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-950/30 border border-emerald-500/40 p-3 chamfer-box mb-5 text-emerald-300 text-xs font-medium">
            CONGRATULATIONS! You have conquered all 10 Sectors of the Obsidian Citadel!
          </div>
        )}

        {/* Primary Next Level Button (with CrazyGames Midgame Ad) */}
        <div className="flex flex-col gap-2.5">
          {level.id < 10 ? (
            <button
              onClick={handleContinueNextLevel}
              disabled={requestingAd}
              className="w-full py-3.5 px-5 chamfer-box bg-gradient-to-r from-sky-400 to-cyan-300 hover:from-sky-300 hover:to-cyan-200 text-slate-950 font-display font-bold text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(56,189,248,0.45)] transition-all cursor-pointer disabled:opacity-50"
            >
              <span>
                {requestingAd ? 'LOADING NEXT SECTOR...' : `CONTINUE TO LEVEL ${level.id + 1}`}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : null}

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onReplayLevel}
              disabled={requestingAd}
              className="py-2.5 px-4 chamfer-box bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-display text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Replay Sector
            </button>
            <button
              onClick={onMainMenu}
              disabled={requestingAd}
              className="py-2.5 px-4 chamfer-box bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-display text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              Main Menu
            </button>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          CrazyGames Midgame Transition Ready
        </div>
      </div>
    </div>
  );
};
