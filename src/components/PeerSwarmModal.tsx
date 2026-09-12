import React from 'react';
import {
  X,
  Users,
  Radio,
  Download,
  Upload,
  Zap,
  Globe,
  CheckCircle2,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { PeerInfo, SwarmStats } from '../types';
import { formatSpeed } from '../utils/formatters';

interface PeerSwarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  peers: PeerInfo[];
  stats: SwarmStats;
  swarmId: string;
}

export const PeerSwarmModal: React.FC<PeerSwarmModalProps> = ({
  isOpen,
  onClose,
  peers,
  stats,
  swarmId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#0e111a] border border-[#21293d] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#121622] border-b border-[#1f2638] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>P2P Swarm & Peer Monitor</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {peers.length} Nodes Connected
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Swarm ID: {swarmId.slice(0, 24)}...
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1c2233] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Swarm Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#111520] p-3 rounded-xl border border-[#1f273b] text-center">
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wide block">Seeders</span>
              <span className="text-sm font-bold font-mono text-emerald-400 mt-0.5 block">
                {stats.seedersCount} Nodes
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wide block">Leechers</span>
              <span className="text-sm font-bold font-mono text-sky-400 mt-0.5 block">
                {stats.leechersCount} Nodes
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wide block">Swarm Health</span>
              <span className="text-sm font-bold font-mono text-emerald-400 mt-0.5 block">
                {stats.healthPercent}%
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wide block">Pieces Verified</span>
              <span className="text-sm font-bold font-mono text-white mt-0.5 block">
                {stats.activePieces}/{stats.totalPieces}
              </span>
            </div>
          </div>

          {/* Connected Peers Table */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
              Live Connected Peers
            </h4>
            <div className="border border-[#1f2638] rounded-xl overflow-hidden bg-[#0c0e15]">
              <div className="divide-y divide-[#171c2b]">
                {peers.map((peer) => (
                  <div
                    key={peer.peerId}
                    className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-[#111520] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          peer.isSeeder ? 'bg-emerald-400' : 'bg-sky-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-white font-medium truncate">
                            {peer.name}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                              peer.isSeeder
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-sky-500/20 text-sky-300'
                            }`}
                          >
                            {peer.isSeeder ? 'SEEDER' : 'LEECHER'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span>{peer.connectionType === 'webrtc' ? 'WebRTC DataChannel' : 'WebSocket Relay'}</span>
                          <span>•</span>
                          <span>{peer.latencyMs || 15}ms ping</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right font-mono text-xs">
                      <div>
                        <div className="text-emerald-400 font-medium">
                          ↓ {formatSpeed(peer.downSpeed || 0)}
                        </div>
                        <div className="text-sky-400 text-[10px]">
                          ↑ {formatSpeed(peer.upSpeed || 0)}
                        </div>
                      </div>

                      <div className="w-12 text-right">
                        <span className="text-slate-200 font-semibold">{peer.progress || 100}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Swarm Bitfield Heatmap */}
          <div className="p-3 bg-[#111520] rounded-xl border border-[#1f273b]">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-300 font-semibold">Swarm Bitfield Piece Distribution</span>
              <span className="text-slate-400 font-mono text-[11px]">
                {stats.activePieces} of {stats.totalPieces} pieces replicated
              </span>
            </div>
            <div className="grid grid-cols-16 sm:grid-cols-24 gap-1 p-1 bg-[#090b10] rounded-lg">
              {Array.from({ length: Math.min(stats.totalPieces || 48, 72) }).map((_, idx) => {
                const isReplicated = idx < stats.activePieces;
                return (
                  <div
                    key={idx}
                    title={`Piece #${idx}: ${isReplicated ? 'Available from multiple seeders' : 'Queued'}`}
                    className={`h-2 rounded-xs transition-colors ${
                      isReplicated ? 'bg-emerald-400' : 'bg-[#1b2234]'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#121622] border-t border-[#1f2638] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
