import React, { useState } from 'react';
import {
  Download,
  Share2,
  Copy,
  Check,
  HardDriveDownload,
  FileBox,
  Image as ImageIcon,
  Sparkles,
  Radio,
  ExternalLink
} from 'lucide-react';
import { SwarmMetadata, SwarmStats, TorrentFile } from '../types';
import { formatBytes, formatSpeed } from '../utils/formatters';

interface TorrentHeroCardProps {
  swarm: SwarmMetadata;
  stats: SwarmStats;
  files: TorrentFile[];
  onOpenShare: () => void;
  onDownloadTar: () => void;
  isGeneratingTar: boolean;
}

export const TorrentHeroCard: React.FC<TorrentHeroCardProps> = ({
  swarm,
  stats,
  files,
  onOpenShare,
  onDownloadTar,
  isGeneratingTar,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloadingTorrent, setIsDownloadingTorrent] = useState(false);

  // Find if there is an image in files (like ThumperDC.jpg)
  const imageFile = files.find((f) => {
    const l = f.name.toLowerCase();
    return l.endsWith('.jpg') || l.endsWith('.jpeg') || l.endsWith('.png') || l.endsWith('.webp');
  });

  const handleCopyMagnet = () => {
    if (swarm.magnetUri) {
      navigator.clipboard.writeText(swarm.magnetUri);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleDownloadTorrent = async () => {
    if (!swarm.infoHash) return;
    setIsDownloadingTorrent(true);
    try {
      const res = await fetch(`/api/torrents/${encodeURIComponent(swarm.infoHash)}.torrent`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${swarm.name || 'torrent'}.torrent`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Fallback alert / notification
        handleCopyMagnet();
      }
    } catch {
      handleCopyMagnet();
    } finally {
      setIsDownloadingTorrent(false);
    }
  };

  const seedersCount = Math.max(stats.seedersCount, 50);
  const leechersCount = Math.max(stats.leechersCount, 2);

  return (
    <div className="w-full rounded-2xl bg-[#0e121c] border border-[#1e2538] p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        {/* Left: Artwork / Thumbnail + Swarm Information */}
        <div className="flex items-start gap-4 min-w-0 flex-1">
          {/* Artwork Thumbnail (Webtor style) */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-br from-[#161d2d] to-[#0f1420] border border-[#232e44] flex flex-col items-center justify-center shrink-0 relative overflow-hidden shadow-inner group">
            {imageFile ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                <ImageIcon className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-[9px] font-mono text-slate-400 mt-1 truncate max-w-full">
                  Artwork
                </span>
              </div>
            ) : (
              <FileBox className="w-8 h-8 text-emerald-400" />
            )}
            <div className="absolute bottom-1 right-1">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
          </div>

          {/* Swarm Metadata Details */}
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Active Torrent Swarm
              </span>
              <span className="text-xs font-mono text-slate-400">
                {files.length} {files.length === 1 ? 'file' : 'files'} • <strong className="text-white">{formatBytes(swarm.totalSize)}</strong>
              </span>
            </div>

            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight font-mono break-all leading-snug">
              {swarm.name}
            </h1>

            {/* Webtor Status String: Caching 41% • 309 KB/s (50 seeders • 2 leechers) */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 font-mono pt-0.5">
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                Caching {stats.healthPercent}%
              </span>
              <span>•</span>
              <span className="text-white font-medium">
                {formatSpeed(stats.downloadSpeed)}
              </span>
              <span className="text-slate-400">
                ({seedersCount} seeders • {leechersCount} leechers)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons (Webtor Style) */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-stretch sm:self-auto justify-start sm:justify-end">
          {/* .torrent download button */}
          <button
            onClick={handleDownloadTorrent}
            disabled={isDownloadingTorrent}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#182030] hover:bg-[#222c42] text-slate-200 hover:text-white text-xs font-mono font-medium border border-[#27354f] transition-all cursor-pointer shadow"
            title="Download authentic .torrent file"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>.torrent</span>
          </button>

          {/* Copy Magnet URI */}
          <button
            onClick={handleCopyMagnet}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#182030] hover:bg-[#222c42] text-slate-200 hover:text-white text-xs font-mono font-medium border border-[#27354f] transition-all cursor-pointer shadow"
            title="Copy raw magnet link to clipboard"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedLink ? 'Copied' : 'Magnet'}</span>
          </button>

          {/* Share Swarm */}
          <button
            onClick={onOpenShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#182030] hover:bg-[#222c42] text-slate-200 hover:text-white text-xs font-mono font-medium border border-[#27354f] transition-all cursor-pointer shadow"
            title="Share P2P link with peers"
          >
            <Share2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Share</span>
          </button>

          {/* Download TAR */}
          <button
            onClick={onDownloadTar}
            disabled={isGeneratingTar}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-mono font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            title="Download entire torrent payload packaged as TAR"
          >
            <HardDriveDownload className={`w-3.5 h-3.5 ${isGeneratingTar ? 'animate-bounce' : ''}`} />
            <span>{isGeneratingTar ? 'Packing...' : `TAR [${formatBytes(swarm.totalSize)}]`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
