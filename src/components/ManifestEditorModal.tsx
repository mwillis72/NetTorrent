import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Upload,
  Save,
  CheckCircle2,
  FileBox,
  AlertCircle,
  HardDrive
} from 'lucide-react';
import { TorrentFile, SwarmMetadata } from '../types';
import { formatBytes } from '../utils/formatters';
import { parseTorrentFile } from '../lib/bencode';
import { decodedTorrentToSwarm } from '../lib/torrentResolver';

interface ManifestEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFiles: TorrentFile[];
  currentMetadata: SwarmMetadata | null;
  onApplyChanges: (updatedFiles: TorrentFile[], updatedMetadata: SwarmMetadata) => void;
}

interface EditableFileRow {
  id: string;
  name: string;
  sizeMB: number;
  type: string;
}

export const ManifestEditorModal: React.FC<ManifestEditorModalProps> = ({
  isOpen,
  onClose,
  currentFiles,
  currentMetadata,
  onApplyChanges,
}) => {
  const [bundleName, setBundleName] = useState(currentMetadata?.name || 'Torrent Package');
  const [fileRows, setFileRows] = useState<EditableFileRow[]>(() => {
    return currentFiles.map((f) => ({
      id: f.id,
      name: f.name,
      sizeMB: parseFloat((f.size / (1024 * 1024)).toFixed(2)),
      type: f.type,
    }));
  });

  const [isLoadingTorrent, setIsLoadingTorrent] = useState(false);
  const [torrentError, setTorrentError] = useState('');

  if (!isOpen) return null;

  const totalBytes = fileRows.reduce((sum, r) => sum + Math.max(0, Math.round(r.sizeMB * 1024 * 1024)), 0);

  // Handle uploading a real .torrent file
  const handleTorrentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingTorrent(true);
    setTorrentError('');
    try {
      const buffer = await file.arrayBuffer();
      const decoded = await parseTorrentFile(buffer);
      const { metadata: newMeta, files: newFiles } = decodedTorrentToSwarm(decoded, currentMetadata?.magnetUri);

      onApplyChanges(newFiles, newMeta);
      onClose();
    } catch (err: any) {
      setTorrentError(err?.message || 'Failed to parse .torrent file');
    } finally {
      setIsLoadingTorrent(false);
    }
  };

  const handleAddFile = () => {
    const newIdx = fileRows.length + 1;
    setFileRows([
      ...fileRows,
      {
        id: `file-new-${Date.now()}-${newIdx}`,
        name: `File_${newIdx}.dat`,
        sizeMB: 10,
        type: 'application/octet-stream',
      },
    ]);
  };

  const handleRemoveFile = (index: number) => {
    if (fileRows.length <= 1) return;
    setFileRows(fileRows.filter((_, i) => i !== index));
  };

  const handleUpdateRow = (index: number, field: keyof EditableFileRow, value: any) => {
    setFileRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  // Quick 1.6GB 5-File RAR Package Preset
  const handleApplyRarPreset = () => {
    setBundleName(bundleName.replace('.tar.gz', '').replace('.mp4', '') || 'Release_Archive_1.6GB');
    setFileRows([
      { id: 'f-rar-1', name: 'Archive_Package.part1.rar', sizeMB: 1450, type: 'application/x-rar-compressed' },
      { id: 'f-rar-2', name: 'Setup_Installer.exe', sizeMB: 155, type: 'application/octet-stream' },
      { id: 'f-rar-3', name: 'Release_Notes.nfo', sizeMB: 0.05, type: 'text/plain' },
      { id: 'f-rar-4', name: 'Instructions.txt', sizeMB: 0.02, type: 'text/plain' },
      { id: 'f-rar-5', name: 'Checksum_Verification.sfv', sizeMB: 0.01, type: 'text/plain' },
    ]);
  };

  const handleSave = () => {
    const pieceSize = 512 * 1024;
    const updatedFiles: TorrentFile[] = fileRows.map((row) => {
      const sizeBytes = Math.max(1024, Math.round(row.sizeMB * 1024 * 1024));
      const pieceCount = Math.max(1, Math.ceil(sizeBytes / pieceSize));
      const downloadedPieces = new Set<number>();
      for (let i = 0; i < Math.min(pieceCount, 5); i++) {
        downloadedPieces.add(i);
      }

      // Generate dummy content buffer for downloading
      const buffer = new Uint8Array(Math.min(sizeBytes, 1024 * 1024 * 2));
      for (let i = 0; i < buffer.length; i++) buffer[i] = i % 256;

      return {
        id: row.id,
        name: row.name,
        path: row.name,
        size: sizeBytes,
        type: row.type || 'application/octet-stream',
        pieceCount,
        pieceSize,
        downloadedPieces,
        contentData: buffer,
      };
    });

    const infoHash = currentMetadata?.infoHash || Math.random().toString(16).substring(2, 14);
    const updatedMeta: SwarmMetadata = {
      id: currentMetadata?.id || `swarm-${infoHash.slice(0, 8)}`,
      name: bundleName,
      infoHash,
      magnetUri:
        currentMetadata?.magnetUri ||
        `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(bundleName)}&xl=${totalBytes}`,
      totalSize: totalBytes,
      files: updatedFiles.map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.type,
        pieceCount: f.pieceCount,
        pieceSize: f.pieceSize,
      })),
      createdAt: currentMetadata?.createdAt || Date.now(),
      createdBy: 'custom-manifest',
    };

    onApplyChanges(updatedFiles, updatedMeta);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl bg-[#0f131c] border border-[#232b3e] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-[#141926] border-b border-[#212a3d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileBox className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">Customize Torrent Manifest & File List</h2>
              <p className="text-xs text-slate-400">
                Correct total payload size, add real .rar and companion files, or import exact .torrent metadata
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2638] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Quick Option: Load genuine .torrent file */}
          <div className="p-3.5 rounded-xl bg-[#131824] border border-[#1e273b] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <Upload className="w-4 h-4" />
                <span>Have the actual .torrent file?</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Load the bencoded .torrent to immediately extract 100% of all real files, exact sizes, and piece hashes.
              </p>
            </div>

            <label className="cursor-pointer shrink-0 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow">
              <span>{isLoadingTorrent ? 'Parsing Torrent...' : 'Browse .torrent'}</span>
              <input
                type="file"
                accept=".torrent"
                onChange={handleTorrentUpload}
                disabled={isLoadingTorrent}
                className="hidden"
              />
            </label>
          </div>

          {torrentError && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{torrentError}</span>
            </div>
          )}

          {/* Bundle Name & Total Calculated Size */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-medium text-slate-300">Torrent / Package Name</label>
              <input
                type="text"
                value={bundleName}
                onChange={(e) => setBundleName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#161c2b] border border-[#263148] text-xs text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Total Calculated Size</label>
              <div className="w-full px-3 py-1.5 rounded-lg bg-[#111520] border border-[#1f2638] text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5" />
                <span>{formatBytes(totalBytes)} ({fileRows.length} files)</span>
              </div>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-slate-400">Quick Presets:</span>
            <button
              type="button"
              onClick={handleApplyRarPreset}
              className="px-2.5 py-1 rounded bg-[#181f30] hover:bg-[#202940] text-slate-300 text-xs font-medium border border-[#2b3650] transition-colors cursor-pointer"
            >
              1.6 GB RAR Release (5 Files)
            </button>
          </div>

          {/* File Rows List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                Manifest Files ({fileRows.length})
              </span>
              <button
                type="button"
                onClick={handleAddFile}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add File</span>
              </button>
            </div>

            <div className="divide-y divide-[#1b2233] border border-[#1f283d] rounded-xl bg-[#111520] overflow-hidden max-h-60 overflow-y-auto">
              {fileRows.map((row, idx) => (
                <div key={row.id} className="p-2.5 flex items-center gap-2 text-xs">
                  <span className="text-[10px] font-mono text-slate-400 w-5">{idx + 1}.</span>

                  {/* File Name */}
                  <input
                    type="text"
                    value={row.name}
                    placeholder="File name (e.g. package.rar)"
                    onChange={(e) => handleUpdateRow(idx, 'name', e.target.value)}
                    className="flex-1 min-w-0 px-2 py-1 rounded bg-[#161c2b] border border-[#252f44] text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />

                  {/* Size in MB */}
                  <div className="flex items-center gap-1 shrink-0 w-28">
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      value={row.sizeMB}
                      onChange={(e) => handleUpdateRow(idx, 'sizeMB', parseFloat(e.target.value) || 0)}
                      className="w-18 px-2 py-1 rounded bg-[#161c2b] border border-[#252f44] text-xs font-mono text-white text-right focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">MB</span>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    disabled={fileRows.length <= 1}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 disabled:opacity-30 transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#141926] border-t border-[#212a3d] flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Total: <span className="font-mono text-emerald-400 font-semibold">{formatBytes(totalBytes)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-[#181f2f] hover:bg-[#222a3e] text-slate-300 text-xs font-medium border border-[#273248] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Apply Manifest ({formatBytes(totalBytes)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
