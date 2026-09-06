import React, { useState } from 'react';
import { Skull, RotateCcw, Play, Sparkles, ShieldAlert } from 'lucide-react';
import { crazyGamesService } from '../services/crazyGamesService';

interface DeathModalProps {
  levelId: number;
  levelName: string;
  onReviveSuccess: () => void;
  onRestartLevel: () => void;
}

export const DeathModal: React.FC<DeathModalProps> = ({
  levelId,
  levelName,
  onReviveSuccess,
  onRestartLevel
}) => {
  const [loadingAd, setLoadingAd] = useState<'rewarded' | 'midgame' | null>(null);

  const handleReviveWithAd = () => {
    if (loadingAd) return;
    setLoadingAd('rewarded');

    crazyGamesService.requestAd('rewarded', (rewardGranted) => {
      setLoadingAd(null);
      if (rewardGranted) {
        onReviveSuccess();
      }
    });
  };

  const handleStartOver = () => {
    if (loadingAd) return;
    setLoadingAd('midgame');

    crazyGamesService.requestAd('midgame', () => {
      setLoadingAd(null);
      onRestartLevel();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="bg-[#0B0F19] border-2 border-rose-500/70 chamfer-box-lg max-w-md w-full p-6 shadow-[0_0_45px_rgba(244,63,94,0.35)] text-center relative overflow-hidden">
        {/* Decorative top glow */}
        <div className="mx-auto w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/40 flex items-center justify-center mb-3">
          <Skull className="w-8 h-8 text-rose-500" />
        </div>

        <div className="text-xs font-mono-code uppercase tracking-widest text-rose-400 mb-1">
          CRITICAL HULL FAILURE // SECTOR {levelId}
        </div>
        <h2 className="font-display text-3xl font-bold text-white uppercase tracking-wide mb-2">
          SYSTEM OFFLINE
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Your Vanguard frame was overwhelmed in <span className="text-slate-200 font-medium">{levelName}</span>.
          Choose emergency deployment protocol:
        </p>

        <div className="flex flex-col gap-3">
          {/* Option 1: REVIVE — Watch Ad (Rewarded) */}
          <button
            onClick={handleReviveWithAd}
            disabled={loadingAd !== null}
            className="w-full py-3.5 px-5 chamfer-box bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-display font-bold text-base uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            <span>
              {loadingAd === 'rewarded' ? 'REQUESTING REWARDED AD...' : 'REVIVE — Watch Ad'}
            </span>
          </button>
          <div className="text-[11px] font-mono-code text-emerald-400/90 flex items-center justify-center gap-1 -mt-1 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Respawn at Active Checkpoint with 65% Health + Invulnerability Shield
          </div>

          {/* Option 2: START OVER (Midgame Ad) */}
          <button
            onClick={handleStartOver}
            disabled={loadingAd !== null}
            className="w-full py-3 px-5 chamfer-box bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-rose-500/60 text-slate-200 font-display font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>
              {loadingAd === 'midgame' ? 'REQUESTING MIDGAME AD...' : 'START OVER'}
            </span>
          </button>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />
          CrazyGames HTML5 SDK v3 Ad Integration Active
        </div>
      </div>
    </div>
  );
};
