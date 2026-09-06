import React from 'react';
import { Tv, ShieldCheck } from 'lucide-react';
import { AdSimulationState } from '../services/crazyGamesService';

interface AdSimulationOverlayProps {
  simState: AdSimulationState | null;
}

export const AdSimulationOverlay: React.FC<AdSimulationOverlayProps> = ({ simState }) => {
  if (!simState || !simState.active) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="bg-[#0B0F19] border-2 border-sky-400 chamfer-box-lg max-w-md w-full p-6 text-center shadow-[0_0_40px_rgba(56,189,248,0.4)]">
        <div className="mx-auto w-12 h-12 rounded-full bg-sky-500/20 border border-sky-400 flex items-center justify-center mb-3 animate-pulse">
          <Tv className="w-6 h-6 text-sky-400" />
        </div>

        <div className="text-[11px] font-mono-code uppercase tracking-widest text-sky-400 mb-1">
          CRAZYGAMES HTML5 SDK V3 // {simState.type.toUpperCase()} AD
        </div>
        <h3 className="font-display text-xl font-bold text-white uppercase mb-2">
          {simState.type === 'rewarded' ? 'Rewarded Video Ad Playing' : 'Midgame Break Ad Playing'}
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          {simState.reason} — Simulating SDK ad lifecycle gracefully.
        </p>

        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700 mb-2">
          <div
            className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-100"
            style={{ width: `${simState.progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono-code text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" /> SDK Callback Verified
          </span>
          <span>{simState.progress}%</span>
        </div>
      </div>
    </div>
  );
};
