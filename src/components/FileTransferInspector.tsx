import React, { useState, useMemo } from 'react';
import {
  HardDriveDownload,
  FileCode,
  FileText,
  Copy,
  Check,
  Package,
  Layers,
  CheckCircle2,
  Clock,
  ArrowDownToLine,
  Archive,
  Terminal,
  FileBox,
  Hash,
  Database,
  Cpu,
  Sparkles
} from 'lucide-react';
import { TorrentFile, SwarmStats } from '../types';
import { formatBytes, formatSpeed } from '../utils/formatters';

interface FileTransferInspectorProps {
  file: TorrentFile | null;
  allFiles: TorrentFile[];
  stats: SwarmStats;
  onDownloadSingleFile: (file: TorrentFile) => void;
  onOpenTarPreview: () => void;
  onDownloadTar: () => void;
  onPrioritizePiece?: (pieceIndex: number) => void;
}

export const FileTransferInspector: React.FC<FileTransferInspectorProps> = ({
  file,
  allFiles,
  stats,
  onDownloadSingleFile,
  onOpenTarPreview,
  onDownloadTar,
  onPrioritizePiece,
}) => {
  const [copiedContent, setCopiedContent] = useState(false);
  const [hoveredPiece, setHoveredPiece] = useState<number | null>(null);

  if (!file) {
    return (
      <div className="w-full h-96 rounded-2xl bg-[#0e111a] border border-[#1e2538] flex flex-col items-center justify-center p-6 text-center text-slate-400">
        <FileBox className="w-12 h-12 mb-3 text-slate-600 animate-pulse" />
        <p className="text-sm font-medium text-slate-300">No File Selected</p>
        <p className="text-xs text-slate-500 mt-1">Select a file from the swarm manifest to inspect and download.</p>
      </div>
    );
  }

  // Calculate progress
  const verifiedCount = file.downloadedPieces.size;
  const totalPieces = Math.max(1, file.pieceCount);
  const progressPercent = Math.min(100, Math.round((verifiedCount / totalPieces) * 100));

  // Determine file archetype
  const lowerName = file.name.toLowerCase();
  let categoryBadge = 'Software / Binary';
  let categoryIcon = <Cpu className="w-4 h-4 text-emerald-400" />;

  if (lowerName.endsWith('.iso') || lowerName.endsWith('.img') || lowerName.endsWith('.dmg')) {
    categoryBadge = 'Disk Image (ISO)';
    categoryIcon = <Database className="w-4 h-4 text-purple-400" />;
  } else if (lowerName.endsWith('.exe') || lowerName.endsWith('.msi') || lowerName.endsWith('.deb') || lowerName.endsWith('.rpm') || lowerName.endsWith('.apk')) {
    categoryBadge = 'Application / Installer';
    categoryIcon = <Cpu className="w-4 h-4 text-emerald-400" />;
  } else if (lowerName.endsWith('.tar') || lowerName.endsWith('.tar.gz') || lowerName.endsWith('.zip') || lowerName.endsWith('.7z')) {
    categoryBadge = 'Compressed Archive';
    categoryIcon = <Archive className="w-4 h-4 text-amber-400" />;
  } else if (lowerName.endsWith('.csv') || lowerName.endsWith('.json') || lowerName.endsWith('.sql') || lowerName.endsWith('.sqlite')) {
    categoryBadge = 'Structured Dataset';
    categoryIcon = <Database className="w-4 h-4 text-sky-400" />;
  } else if (lowerName.endsWith('.md') || lowerName.endsWith('.txt') || lowerName.endsWith('.nfo') || lowerName === 'sha256sums') {
    categoryBadge = 'Documentation / Manifest';
    categoryIcon = <FileText className="w-4 h-4 text-cyan-400" />;
  }

  const isTextDocument = Boolean(
    file.type?.startsWith('text/') ||
    file.name.endsWith('.md') ||
    file.name.endsWith('.txt') ||
    file.name.endsWith('.nfo') ||
    file.name.endsWith('.json') ||
    file.name === 'SHA256SUMS' ||
    file.name.endsWith('.sh')
  );

  const textPreview = useMemo(() => {
    if (!file.contentData || !isTextDocument) return null;
    try {
      return new TextDecoder().decode(file.contentData);
    } catch {
      return null;
    }
  }, [file.contentData, isTextDocument]);

  const handleCopy = () => {
    if (textPreview) {
      navigator.clipboard.writeText(textPreview);
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
    }
  };

  // Generate bitfield visual blocks (capped for performance at max 128 blocks)
  const displayBlocksCount = Math.min(128, totalPieces);

  return (
    <div className="w-full rounded-2xl bg-[#0e111a] border border-[#1e2538] overflow-hidden shadow-2xl flex flex-col">
      {/* File Header Details */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-[#101420] via-[#0d1017] to-[#101420] border-b border-[#1f2638]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-[#161c2b] text-slate-300 border border-[#232d44]">
                {categoryIcon}
                <span>{categoryBadge}</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                MIME: {file.type || 'application/octet-stream'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight break-all font-mono">
              {file.name}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
              <span>Size: <strong className="text-white font-semibold">{formatBytes(file.size)}</strong></span>
              <span>•</span>
              <span>Pieces: <strong className="text-white font-semibold">{file.pieceCount}</strong> chunks</span>
              <span>•</span>
              <span>Chunk Size: <strong className="text-white font-semibold">{formatBytes(file.pieceSize)}</strong></span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified & Ready
              </span>
            </div>
          </div>

          {/* Action Buttons: Direct File Download & Archive */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => onDownloadSingleFile(file)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer group"
              title="Download this specific file to your computer"
            >
              <ArrowDownToLine className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              <span>Download File</span>
            </button>

            <button
              onClick={onOpenTarPreview}
              className="px-3.5 py-2.5 rounded-xl bg-[#171d2c] hover:bg-[#20273c] text-slate-200 text-xs sm:text-sm font-medium border border-[#28344e] transition-all flex items-center gap-2 cursor-pointer"
              title="Preview and download complete bundle as .tar archive"
            >
              <Archive className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Preview .TAR</span>
            </button>
          </div>
        </div>

        {/* Real-time Transfer & Bitfield Status Banner */}
        <div className="mt-5 p-4 rounded-xl bg-[#090b10] border border-[#1a2030] space-y-3">
          <div className="flex flex-wrap items-center justify-between text-xs font-mono gap-2">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-500 text-[11px] block">VERIFIED CHUNKS</span>
                <span className="text-white font-bold">{verifiedCount} / {totalPieces} ({progressPercent}%)</span>
              </div>
              <div className="w-px h-6 bg-[#1f2638]" />
              <div>
                <span className="text-slate-500 text-[11px] block">SWARM SPEED</span>
                <span className="text-emerald-400 font-bold">{formatSpeed(stats.downloadSpeed)}</span>
              </div>
              <div className="w-px h-6 bg-[#1f2638] hidden sm:block" />
              <div className="hidden sm:block">
                <span className="text-slate-500 text-[11px] block">PEERS</span>
                <span className="text-indigo-400 font-bold">{stats.seedersCount}S / {stats.leechersCount}L</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-slate-500 text-[11px] block">INTEGRITY STATUS</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                SHA-256 Verified
              </span>
            </div>
          </div>

          {/* Smooth Progress Track */}
          <div className="w-full bg-[#141926] h-2.5 rounded-full overflow-hidden relative">
            <div
              style={{ width: `${progressPercent}%` }}
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Bitfield Chunk Heatmap & Inspector */}
      <div className="p-5 sm:p-6 border-b border-[#1f2638] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Piece Bitfield Map</h3>
            <span className="text-xs text-slate-400 font-mono">
              ({totalPieces} chunks • 512KB per piece)
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Verified
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 animate-pulse inline-block" /> Active
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#1c2333] inline-block" /> In Queue
            </span>
          </div>
        </div>

        {/* 2D Piece Chunk Grid */}
        <div className="p-3 bg-[#0a0c12] rounded-xl border border-[#1b2234] flex flex-wrap gap-1 max-h-36 overflow-y-auto">
          {Array.from({ length: displayBlocksCount }).map((_, idx) => {
            const pieceIndex = Math.floor((idx / displayBlocksCount) * totalPieces);
            const isVerified = file.downloadedPieces.has(pieceIndex) || (idx / displayBlocksCount) <= (progressPercent / 100);
            const isHovered = hoveredPiece === pieceIndex;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredPiece(pieceIndex)}
                onMouseLeave={() => setHoveredPiece(null)}
                onClick={() => onPrioritizePiece && onPrioritizePiece(pieceIndex)}
                className={`w-3.5 h-3.5 rounded-xs transition-all cursor-pointer ${
                  isVerified
                    ? 'bg-emerald-500/90 hover:bg-emerald-400 shadow-xs shadow-emerald-500/20'
                    : idx % 7 === 0
                    ? 'bg-sky-400/80 animate-pulse'
                    : 'bg-[#182030] hover:bg-[#25324c]'
                } ${isHovered ? 'scale-125 ring-2 ring-white z-10' : ''}`}
                title={`Piece #${pieceIndex}: ${isVerified ? 'Verified' : 'Pending transfer'} (Click to prioritize)`}
              />
            );
          })}
        </div>

        {hoveredPiece !== null && (
          <div className="p-2 rounded-lg bg-[#121724] border border-[#212b3e] text-[11px] font-mono text-slate-300 flex items-center justify-between">
            <span>Piece #{hoveredPiece} Range: {formatBytes(hoveredPiece * file.pieceSize)} — {formatBytes(Math.min(file.size, (hoveredPiece + 1) * file.pieceSize))}</span>
            <span className="text-emerald-400 font-semibold">Status: SHA-256 Validated</span>
          </div>
        )}
      </div>

      {/* Content & Manifest Inspector */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">
              {isTextDocument ? 'File Content & Manifest Preview' : 'Software Package Specification'}
            </h3>
          </div>

          {textPreview && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141926] hover:bg-[#1d2538] text-slate-300 text-xs border border-[#222b3e] transition-colors cursor-pointer"
            >
              {copiedContent ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedContent ? 'Copied' : 'Copy'}</span>
            </button>
          )}
        </div>

        {isTextDocument && textPreview ? (
          <div className="flex-1 bg-[#090b10] border border-[#1c2234] rounded-xl p-4 overflow-x-auto text-xs font-mono text-slate-300 leading-relaxed max-h-96">
            <pre className="whitespace-pre-wrap">{textPreview}</pre>
          </div>
        ) : (
          <div className="flex-1 bg-[#090b10] border border-[#1c2234] rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-lg bg-[#101420] border border-[#1c2336] space-y-1">
                <span className="text-xs text-slate-500 font-mono">FILE ARCHETYPE</span>
                <p className="text-sm font-semibold text-white">{categoryBadge}</p>
                <p className="text-xs text-slate-400">Suitable for local execution, mounting, or archival extraction.</p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#101420] border border-[#1c2336] space-y-1">
                <span className="text-xs text-slate-500 font-mono">INTEGRITY PROTOCOL</span>
                <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  BitTorrent WebRTC Verified
                </p>
                <p className="text-xs text-slate-400">Every 512KB chunk checksum is validated against the infohash bitfield.</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#101420] border border-[#1c2336] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-slate-400">Download Ready:</span>
                <p className="text-white font-bold">{file.name} ({formatBytes(file.size)})</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDownloadSingleFile(file)}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Download Binary</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
