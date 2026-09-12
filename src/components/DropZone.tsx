import React, { useState, useMemo, useRef } from 'react';
import {
  UploadCloud,
  Magnet,
  FolderArchive,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileCode,
  FileBox,
  Sliders,
  Upload
} from 'lucide-react';
import { TorrentFile, SwarmMetadata } from '../types';
import { parseMagnetUri, detectFileCategory, extractEmbeddedSize } from '../lib/magnetParser';
import { parseTorrentFile } from '../lib/bencode';
import { decodedTorrentToSwarm } from '../lib/torrentResolver';

interface DropZoneProps {
  onFilesDropped: (files: TorrentFile[], bundleName: string) => void;
  onMagnetSubmitted: (magnetUri: string) => void;
  onParsedTorrentLoaded?: (files: TorrentFile[], metadata: SwarmMetadata) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesDropped,
  onMagnetSubmitted,
  onParsedTorrentLoaded,
}) => {
  const [magnetInput, setMagnetInput] = useState('');
  const [magnetError, setMagnetError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isParsingTorrent, setIsParsingTorrent] = useState(false);
  const torrentInputRef = useRef<HTMLInputElement>(null);

  // Live Magnet analysis preview
  const livePreview = useMemo(() => {
    const val = magnetInput.trim();
    if (!val || (!val.startsWith('magnet:?') && !val.match(/^[0-9a-fA-F]{40}$/) && !val.match(/^[2-7a-zA-Z]{32}$/))) {
      return null;
    }
    const parsed = parseMagnetUri(val);
    const categoryInfo = detectFileCategory(parsed.name);
    return {
      ...parsed,
      category: categoryInfo.category,
    };
  }, [magnetInput]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleTorrentFileInput = async (file: File) => {
    setIsParsingTorrent(true);
    setMagnetError('');
    try {
      const buffer = await file.arrayBuffer();
      const decoded = await parseTorrentFile(buffer);
      const { metadata, files } = decodedTorrentToSwarm(decoded);

      if (onParsedTorrentLoaded) {
        onParsedTorrentLoaded(files, metadata);
      } else {
        onFilesDropped(files, metadata.name);
      }
    } catch (err: any) {
      setMagnetError(err?.message || 'Failed to parse .torrent file. Check that it is a valid BitTorrent file.');
    } finally {
      setIsParsingTorrent(false);
    }
  };

  const processFileList = async (rawFiles: FileList | File[]) => {
    const list: File[] = Array.from(rawFiles);
    if (list.length === 0) return;

    // Check if any dropped file is a .torrent file!
    const torrentFile = list.find((f) => f.name.toLowerCase().endsWith('.torrent'));
    if (torrentFile) {
      await handleTorrentFileInput(torrentFile);
      return;
    }

    // Otherwise, treat as regular files to seed
    const torrentFiles: TorrentFile[] = list.map((file, idx) => {
      const pieceSize = 512 * 1024; // 512KB pieces
      const pieceCount = Math.max(1, Math.ceil(file.size / pieceSize));
      // Seeder starts with all pieces downloaded
      const downloadedPieces = new Set<number>();
      for (let i = 0; i < pieceCount; i++) {
        downloadedPieces.add(i);
      }

      return {
        id: `file-${Date.now()}-${idx}`,
        name: file.name,
        path: (file as any).webkitRelativePath || file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        pieceCount,
        pieceSize,
        downloadedPieces,
        rawFile: file,
      };
    });

    const bundleName = list.length === 1 ? list[0].name : `Seeded_Bundle_${Date.now()}`;
    onFilesDropped(torrentFiles, bundleName);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    // Check if user dropped raw text / magnet URI
    const textData = e.dataTransfer.getData('text/plain');
    if (textData && (textData.startsWith('magnet:?') || textData.match(/^[0-9a-fA-F]{40}$/))) {
      onMagnetSubmitted(textData.trim());
      return;
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFileList(e.dataTransfer.files);
    }
  };

  const handleMagnetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = magnetInput.trim();
    if (!val) {
      setMagnetError('Please enter a valid magnet URI or torrent infohash');
      return;
    }

    if (!val.startsWith('magnet:?') && !val.match(/^[0-9a-fA-F]{40}$/) && !val.match(/^[2-7a-zA-Z]{32}$/)) {
      setMagnetError('Invalid format. Must start with "magnet:?xt=urn:btih:" or be a 40-character infohash.');
      return;
    }

    setMagnetError('');
    onMagnetSubmitted(val);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      {/* Magnet URI & .torrent Input Bar */}
      <div className="w-full p-5 sm:p-7 rounded-2xl bg-[#0e111a] border border-[#1e2538] shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Magnet className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Load Magnet Link or .torrent File
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Supports software, RAR releases, disk images, archives & data bundles
          </span>
        </div>

        <form onSubmit={handleMagnetSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Paste magnet:?xt=urn:btih:... or 40-char infohash"
              value={magnetInput}
              onChange={(e) => {
                setMagnetInput(e.target.value);
                if (magnetError) setMagnetError('');
              }}
              className="w-full px-4 py-3 rounded-xl bg-[#121622] border border-[#232b40] text-sm text-slate-100 placeholder:text-slate-500 font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all pr-10"
            />
            {magnetInput && (
              <button
                type="button"
                onClick={() => setMagnetInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-lg shadow-emerald-600/20 shrink-0 cursor-pointer"
          >
            <span>Transfer & Inspect</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Or Browse .torrent File Button */}
          <button
            type="button"
            onClick={() => torrentInputRef.current?.click()}
            disabled={isParsingTorrent}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#181f2f] hover:bg-[#222a3e] text-slate-200 hover:text-white font-medium text-xs border border-[#273248] transition-colors shrink-0 cursor-pointer"
            title="Load .torrent file to extract 100% exact multi-file manifest and size"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>{isParsingTorrent ? 'Parsing...' : 'Open .torrent'}</span>
          </button>
          <input
            ref={torrentInputRef}
            type="file"
            accept=".torrent"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleTorrentFileInput(file);
            }}
            className="hidden"
          />
        </form>

        {magnetError && (
          <div className="mt-3 flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{magnetError}</span>
          </div>
        )}

        {/* Live Detected Info Preview */}
        {livePreview && (
          <div className="mt-4 p-3.5 rounded-xl bg-[#141926] border border-[#21293d] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px] uppercase border border-emerald-500/30">
                {livePreview.category}
              </span>
              <span className="font-semibold text-slate-200 truncate max-w-sm">
                {livePreview.name}
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-400 text-[11px] font-mono">
              {livePreview.exactLength && (
                <span>Size: {(livePreview.exactLength / (1024 * 1024 * 1024)).toFixed(2)} GB</span>
              )}
              <span>Hash: {livePreview.infoHash.slice(0, 8)}...</span>
              <span>{livePreview.trackers.length} Trackers</span>
            </div>
          </div>
        )}
      </div>

      {/* Drag & Drop Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer relative ${
          isDragOver
            ? 'border-emerald-400 bg-emerald-500/10 scale-[1.008]'
            : 'border-[#222b40] bg-[#0c0e16]/80 hover:border-emerald-500/50 hover:bg-[#10131e]'
        }`}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.multiple = true;
          input.onchange = (e: any) => {
            if (e.target.files) processFileList(e.target.files);
          };
          input.click();
        }}
      >
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/5">
          <UploadCloud className="w-8 h-8" />
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
          Drop .torrent file or files here to create / inspect
        </h3>
        <p className="text-xs text-slate-400 max-w-md mb-4">
          Drop any <code className="text-emerald-300 font-mono">.torrent</code> file to extract 100% of all real files and exact multi-gigabyte sizes, or drop files from your disk to seed to the WebRTC swarm.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#161c2b] text-slate-300 border border-[#252f44]">
            1.6GB+ RAR & Archive Support
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#161c2b] text-slate-300 border border-[#252f44]">
            Full Multi-File Manifests
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#161c2b] text-slate-300 border border-[#252f44]">
            POSIX .TAR Bundle Export
          </span>
        </div>
      </div>
    </div>
  );
};
