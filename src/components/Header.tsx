import React from 'react';
import {
  Download,
  Upload,
  Users,
  Share2,
  PlusCircle,
  Radio,
  Magnet,
  HardDriveDownload,
  Info
} from 'lucide-react';
import { SwarmStats } from '../types';
import { formatSpeed } from '../utils/formatters';

interface HeaderProps {
  swarmName?: string;
  stats: SwarmStats;
  onOpenPeers: () => void;
  onOpenShare: () => void;
  onReset: () => void;
  onOpenTarPreview?: () => void;
  isStreaming: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  swarmName,
  stats,
  onOpenPeers,
  onOpenShare,
  onReset,
  onOpenTarPreview,
  isStreaming,
}) => {
  return (
    <header className="w-full bg-[#0d1017]/95 backdrop-blur border-b border-[#1e2433] sticky top-0 z-40 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="flex items-center gap-2 text-left group focus:outline-none"
            title="Webtor Home"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Magnet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-white font-mono">
                  WEBTOR<span className="text-emerald-400">.IO</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  P2P
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Browser Torrent & P2P Engine
              </p>
            </div>
          </button>

          {swarmName && (
            <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l border-[#1e2433] max-w-xs truncate">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-300 font-medium truncate" title={swarmName}>
                {swarmName}
              </span>
            </div>
          )}
        </div>

        {/* Real-time Swarm HUD */}
        {isStreaming && (
          <div className="hidden sm:flex items-center gap-4 bg-[#131722] px-3.5 py-1.5 rounded-full border border-[#21283b] text-xs">
            {/* Download Speed */}
            <div className="flex items-center gap-1.5" title="Swarm Download Speed">
              <Download className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
              <span className="font-mono text-emerald-400 font-medium">
                {formatSpeed(stats.downloadSpeed)}
              </span>
            </div>

            <div className="w-px h-3 bg-[#262f45]" />

            {/* Upload Speed */}
            <div className="flex items-center gap-1.5" title="Swarm Upload Speed">
              <Upload className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-mono text-sky-400 font-medium">
                {formatSpeed(stats.uploadSpeed)}
              </span>
            </div>

            <div className="w-px h-3 bg-[#262f45]" />

            {/* Peers / Seeders */}
            <button
              onClick={onOpenPeers}
              className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Click to view connected peers"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-mono">
                {stats.seedersCount}S / {stats.leechersCount}L
              </span>
            </button>

            <div className="w-px h-3 bg-[#262f45]" />

            {/* Health */}
            <div className="flex items-center gap-1.5" title="Swarm Health">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-slate-200">
                {stats.healthPercent}%
              </span>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {isStreaming && (
            <>
              {onOpenTarPreview && (
                <button
                  onClick={onOpenTarPreview}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-[#161c2b] text-slate-200 hover:bg-[#1f273d] border border-[#262f45] transition-colors"
                  title="Preview and download .tar archive"
                >
                  <HardDriveDownload className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">.TAR Preview</span>
                </button>
              )}

              <button
                onClick={onOpenShare}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                title="Share Magnet Link or Peer Room"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Share P2P</span>
              </button>
            </>
          )}

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Magnet</span>
          </button>
        </div>
      </div>
    </header>
  );
};
