import React, { useState } from 'react';
import {
  X,
  Archive,
  HardDriveDownload,
  FileCode,
  Film,
  Music,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  ShieldCheck,
  FolderArchive,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { TorrentFile, TarPreviewEntry } from '../types';
import { buildTarPreviewList, createTarArchive, downloadBlob } from '../lib/tarBuilder';
import { formatBytes, getFileIconType } from '../utils/formatters';

interface TarPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: TorrentFile[];
  bundleName: string;
  swarmId?: string;
}

export const TarPreviewModal: React.FC<TarPreviewModalProps> = ({
  isOpen,
  onClose,
  files,
  bundleName,
  swarmId,
}) => {
  const [isBuilding, setIsBuilding] = useState(false);
  const [packProgress, setPackProgress] = useState(0);
  const [currentPackingFile, setCurrentPackingFile] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<TarPreviewEntry | null>(null);

  if (!isOpen) return null;

  const previewEntries = buildTarPreviewList(files);
  const totalSizeBytes = files.reduce((acc, f) => acc + f.size, 0);

  // Calculate file type breakdown
  const typeBreakdown = files.reduce(
    (acc, f) => {
      const type = getFileIconType(f.name, f.type);
      acc[type] = (acc[type] || 0) + f.size;
      return acc;
    },
    {} as Record<string, number>
  );

  const handleDownloadTar = async () => {
    setIsBuilding(true);
    setPackProgress(0);
    const safeName = bundleName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'webtor_archive';

    try {
      if (swarmId) {
        // Stream the full uncorrupted multi-gigabyte archive from server
        const downloadUrl = `/api/download/tar?swarmId=${encodeURIComponent(swarmId)}`;
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${safeName}.tar`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setPackProgress(100);
        return;
      }

      const tarBlob = await createTarArchive(files, (percent, currFile) => {
        setPackProgress(percent);
        setCurrentPackingFile(currFile);
      });
      downloadBlob(tarBlob, `${safeName}.tar`);
    } catch (e) {
      console.error('Error creating tar archive:', e);
    } finally {
      setTimeout(() => setIsBuilding(false), 1200);
    }
  };

  const renderIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Film className="w-4 h-4 text-rose-400" />;
      case 'audio':
        return <Music className="w-4 h-4 text-emerald-400" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-amber-400" />;
      case 'code':
        return <FileCode className="w-4 h-4 text-cyan-400" />;
      case 'doc':
        return <FileText className="w-4 h-4 text-indigo-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl bg-[#0e111a] border border-[#21293d] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#121622] border-b border-[#1f2638] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>.TAR Archive Content Preview</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1d2334] text-slate-300">
                  POSIX ustar format
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect files, directory paths, and checksums before downloading the .tar package
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

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Summary stats card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#111520] p-3.5 rounded-xl border border-[#1f273b] text-center">
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Total Size</span>
              <span className="text-sm font-bold font-mono text-white mt-0.5 block">
                {formatBytes(totalSizeBytes)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Files Count</span>
              <span className="text-sm font-bold font-mono text-emerald-400 mt-0.5 block">
                {files.length} Entries
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Block Format</span>
              <span className="text-sm font-bold font-mono text-amber-400 mt-0.5 block">
                512B Ustar
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Archive Status</span>
              <span className="text-sm font-bold font-mono text-cyan-400 mt-0.5 block">
                Ready to Pack
              </span>
            </div>
          </div>

          {/* Type breakdown visual bar */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
              <span>Archive Composition</span>
              <span>{files.length} Items</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex bg-[#1a2030]">
              {Object.entries(typeBreakdown).map(([type, size]) => {
                const sizeNum = Number(size) || 0;
                const pct = totalSizeBytes > 0 ? (sizeNum / totalSizeBytes) * 100 : 0;
                let color = 'bg-slate-400';
                if (type === 'video') color = 'bg-rose-500';
                if (type === 'audio') color = 'bg-emerald-500';
                if (type === 'image') color = 'bg-amber-500';
                if (type === 'code') color = 'bg-cyan-500';
                if (type === 'doc') color = 'bg-indigo-500';
                return (
                  <div
                    key={type}
                    title={`${type.toUpperCase()}: ${pct.toFixed(1)}%`}
                    style={{ width: `${pct}%` }}
                    className={`${color} h-full transition-all`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-rose-500" /> Video
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-emerald-500" /> Audio
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-amber-500" /> Images
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-cyan-500" /> Code
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-indigo-500" /> Documents
              </span>
            </div>
          </div>

          {/* File Entries Table */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
              Archive File Hierarchy & POSIX Headers
            </h4>
            <div className="border border-[#1f2638] rounded-xl overflow-hidden bg-[#0c0e15]">
              <div className="divide-y divide-[#171c2b] max-h-56 overflow-y-auto">
                {previewEntries.map((entry, idx) => {
                  const type = getFileIconType(entry.name, entry.contentType);
                  const isSelected = selectedEntry?.name === entry.name;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedEntry(entry)}
                      className={`p-2.5 flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#182030]' : 'hover:bg-[#111520]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="p-1 rounded bg-[#171d2b]">
                          {renderIcon(type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-slate-200 font-medium truncate">
                            {entry.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                            <span>{entry.mode}</span>
                            <span>•</span>
                            <span className="text-slate-400">{entry.checksum}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <span className="text-slate-200 font-medium">
                          {formatBytes(entry.size)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Entry Detail Card */}
          {selectedEntry && (
            <div className="p-3 bg-[#131824] rounded-xl border border-[#232c40] text-xs space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Entry Verified in Tar Manifest
                </span>
                <span className="font-mono text-slate-400">{selectedEntry.mode}</span>
              </div>
              <p className="font-mono text-slate-200 break-all">{selectedEntry.name}</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1">
                <div>Raw Size: {selectedEntry.size.toLocaleString()} bytes</div>
                <div>Format: POSIX UStar 512B Block</div>
              </div>
            </div>
          )}

          {/* Packing Progress Bar if currently creating .tar */}
          {isBuilding && (
            <div className="p-3 bg-[#131824] rounded-xl border border-amber-500/30 space-y-2">
              <div className="flex justify-between text-xs text-amber-300 font-mono">
                <span className="flex items-center gap-1.5">
                  <Archive className="w-3.5 h-3.5 animate-spin" /> Packaging .TAR stream: {currentPackingFile}
                </span>
                <span>{packProgress}%</span>
              </div>
              <div className="w-full h-2 bg-[#1b2234] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-200"
                  style={{ width: `${packProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#121622] border-t border-[#1f2638] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Archive opens in 7-Zip, WinRAR, macOS Archive Utility, & Linux tar</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#181d2a] hover:bg-[#202738] text-slate-300 text-xs font-medium border border-[#232b3d] transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={handleDownloadTar}
              disabled={isBuilding}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <HardDriveDownload className={`w-4 h-4 ${isBuilding ? 'animate-bounce' : ''}`} />
              <span>{isBuilding ? 'Creating .TAR Stream...' : `Download .TAR (${formatBytes(totalSizeBytes)})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
