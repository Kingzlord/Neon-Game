import React, { useState } from 'react';
import { Users, Server, Radio, X, Cpu, Globe, CheckCircle } from 'lucide-react';
import { networkService, PhotonMultiplayerAdapter } from '../services/networkService';

interface MultiplayerModalProps {
  onClose: () => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({ onClose }) => {
  const [selectedRegion, setSelectedRegion] = useState('eu-central-1');
  const photonAdapter = new PhotonMultiplayerAdapter();
  const status = photonAdapter.getStatus();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="bg-[#0B0F19] border-2 border-purple-500/70 chamfer-box-lg max-w-lg w-full p-6 shadow-[0_0_45px_rgba(168,85,247,0.35)] relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-md bg-purple-500/15 border border-purple-500/40 flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-code uppercase tracking-widest text-purple-400">
                CO-OP RAID PROTOCOL
              </span>
              <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-400/50 text-purple-300 text-[10px] font-mono-code rounded-sm font-bold">
                COMING SOON
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold text-white uppercase tracking-wide">
              MULTIPLAYER CO-OP
            </h2>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          AETHER-FORGE features a modular network abstraction layer (<code className="text-sky-400 font-mono-code">INetworkAdapter</code>) ready for 2-Player Co-op Raid Bosses and Synchronized Laser Puzzles powered by <span className="text-purple-300 font-semibold">Photon Realtime</span>.
        </p>

        {/* Modular Network Telemetry Card */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 chamfer-box mb-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Cpu className="w-4 h-4 text-purple-400" /> Active Network Adapter
            </span>
            <span className="font-mono-code text-sky-400 font-semibold">
              {networkService.getAdapter().mode.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Server className="w-4 h-4 text-purple-400" /> Target SDK Provider
            </span>
            <span className="font-mono-code text-slate-200">{status.provider}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Globe className="w-4 h-4 text-purple-400" /> Master Server Region
            </span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 px-2 py-1 rounded text-xs font-mono-code"
            >
              <option value="eu-central-1">EU-Central (Frankfurt) — 24ms</option>
              <option value="us-east-1">US-East (Virginia) — 38ms</option>
              <option value="ap-east-1">Asia-East (Tokyo) — 52ms</option>
            </select>
          </div>
        </div>

        {/* Upcoming Co-op Features */}
        <div className="space-y-2 mb-6 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Dual-Vanguard Synchronized Pressure Plate & Conduit Puzzles</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Shared Revive Beacons & Combined Omega Array Combos</span>
          </div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Deterministic 20Hz State Delta Compression via Photon Rooms</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 px-5 chamfer-box bg-purple-600 hover:bg-purple-500 text-white font-display font-bold text-sm uppercase tracking-wider transition-all cursor-pointer"
        >
          Return to Single-Player Command
        </button>
      </div>
    </div>
  );
};
