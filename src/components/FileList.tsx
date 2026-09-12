import React, { useState, useMemo } from 'react';
import {
  Film,
  Music,
  FileCode,
  FileText,
  HardDriveDownload,
  Eye,
  Archive,
  Cpu,
  Database,
  FileBox,
  Layers,
  ArrowDownToLine,
  Sliders,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronLeft,
  Search,
  CheckSquare,
  Square,
  Image as ImageIcon,
  File as FileIcon,
  Download,
  List,
  FolderTree
} from 'lucide-react';
import { TorrentFile, MagneticDockPosition } from '../types';
import { formatBytes } from '../utils/formatters';

interface FileListProps {
  files: TorrentFile[];
  activeFileId: string | null;
  swarmName?: string;
  infoHash?: string;
  onSelectFile: (file: TorrentFile) => void;
  onDownloadSingleFile: (file: TorrentFile) => void;
  onOpenTarPreview: () => void;
  onDownloadTar: () => void;
  onOpenManifestEditor?: () => void;
  dockPosition: MagneticDockPosition;
  isGeneratingTar: boolean;
}

interface DirectoryItem {
  name: string;
  path: string;
  totalSize: number;
  fileCount: number;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  activeFileId,
  swarmName,
  infoHash,
  onSelectFile,
  onDownloadSingleFile,
  onOpenTarPreview,
  onDownloadTar,
  onOpenManifestEditor,
  dockPosition,
  isGeneratingTar,
}) => {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'folders' | 'flat'>('folders');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  const totalSize = useMemo(() => files.reduce((acc, f) => acc + f.size, 0), [files]);

  // Check if files actually contain nested folders
  const hasNestedFolders = useMemo(() => {
    return files.some((f) => (f.path || f.name).includes('/'));
  }, [files]);

  // Normalize path segments for all files
  const filesWithSegments = useMemo(() => {
    return files.map((f) => {
      const rawPath = f.path || f.name;
      const segments = rawPath.split('/').filter(Boolean);
      return {
        file: f,
        rawPath,
        segments,
        fileName: segments[segments.length - 1] || f.name,
      };
    });
  }, [files]);

  // Directory breakdown at currentPath
  const { currentFolders, currentFiles } = useMemo(() => {
    if (viewMode === 'flat' || searchQuery.trim() !== '') {
      return { currentFolders: [], currentFiles: [] };
    }

    const currentDepth = currentPath.length;
    const foldersMap = new Map<string, { totalSize: number; fileCount: number }>();
    const immediateFiles: TorrentFile[] = [];

    filesWithSegments.forEach(({ file, segments }) => {
      // Check if file is within currentPath
      let matchesCurrentPath = true;
      for (let i = 0; i < currentDepth; i++) {
        if (segments[i] !== currentPath[i]) {
          matchesCurrentPath = false;
          break;
        }
      }

      if (!matchesCurrentPath) return;

      if (segments.length === currentDepth + 1) {
        // Immediate file in this directory
        immediateFiles.push(file);
      } else if (segments.length > currentDepth + 1) {
        // Belongs to a subfolder
        const subfolderName = segments[currentDepth];
        const existing = foldersMap.get(subfolderName) || { totalSize: 0, fileCount: 0 };
        existing.totalSize += file.size;
        existing.fileCount += 1;
        foldersMap.set(subfolderName, existing);
      }
    });

    const folderList: DirectoryItem[] = Array.from(foldersMap.entries()).map(([name, data]) => ({
      name,
      path: [...currentPath, name].join('/'),
      totalSize: data.totalSize,
      fileCount: data.fileCount,
    }));

    // Sort folders alphabetically
    folderList.sort((a, b) => a.name.localeCompare(b.name));

    return { currentFolders: folderList, currentFiles: immediateFiles };
  }, [filesWithSegments, currentPath, viewMode, searchQuery]);

  // Filtered files when searching or flat view
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return files.filter(
      (f) => f.name.toLowerCase().includes(q) || (f.path && f.path.toLowerCase().includes(q))
    );
  }, [files, searchQuery]);

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedFileIds.size === files.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(files.map((f) => f.id)));
    }
  };

  const toggleSelectFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedFileIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedFileIds(next);
  };

  const renderIcon = (file: TorrentFile) => {
    const lower = file.name.toLowerCase();
    if (lower.endsWith('.iso') || lower.endsWith('.img') || lower.endsWith('.dmg')) {
      return <Database className="w-4 h-4 text-purple-400" />;
    }
    if (
      lower.endsWith('.exe') ||
      lower.endsWith('.msi') ||
      lower.endsWith('.deb') ||
      lower.endsWith('.rpm') ||
      lower.endsWith('.apk') ||
      lower.endsWith('.dll')
    ) {
      return <Cpu className="w-4 h-4 text-emerald-400" />;
    }
    if (
      lower.endsWith('.zip') ||
      lower.endsWith('.tar') ||
      lower.endsWith('.tar.gz') ||
      lower.endsWith('.7z') ||
      lower.endsWith('.rar') ||
      lower.endsWith('.r00')
    ) {
      return <Archive className="w-4 h-4 text-amber-400" />;
    }
    if (lower.endsWith('.csv') || lower.endsWith('.json') || lower.endsWith('.sql')) {
      return <FileCode className="w-4 h-4 text-sky-400" />;
    }
    if (
      lower.endsWith('.md') ||
      lower.endsWith('.txt') ||
      lower.endsWith('.nfo') ||
      lower.endsWith('.sfv') ||
      lower === 'sha256sums'
    ) {
      return <FileText className="w-4 h-4 text-cyan-400" />;
    }
    if (lower.endsWith('.mp4') || lower.endsWith('.mkv') || lower.endsWith('.webm')) {
      return <Film className="w-4 h-4 text-rose-400" />;
    }
    if (lower.endsWith('.mp3') || lower.endsWith('.flac') || lower.endsWith('.wav')) {
      return <Music className="w-4 h-4 text-emerald-400" />;
    }
    if (
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.png') ||
      lower.endsWith('.webp') ||
      lower.endsWith('.gif')
    ) {
      return <ImageIcon className="w-4 h-4 text-pink-400" />;
    }
    return <FileIcon className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="w-full rounded-2xl bg-[#0e111a] border border-[#1e2538] overflow-hidden shadow-xl flex flex-col">
      {/* Header bar */}
      <div className="p-4 bg-[#121622] border-b border-[#1f2638] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Swarm File Explorer</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#1b2131] text-emerald-300 font-mono border border-emerald-500/20">
              {files.length} {files.length === 1 ? 'file' : 'files'} • {formatBytes(totalSize)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Browse directory hierarchy, inspect bitfields, or export as .TAR
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle if nested folders exist */}
          {hasNestedFolders && (
            <div className="flex items-center bg-[#181e2b] rounded-lg p-0.5 border border-[#273147]">
              <button
                onClick={() => {
                  setViewMode('folders');
                  setSearchQuery('');
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'folders' && !searchQuery
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Folder Tree Navigation (Webtor style)"
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Folder View</span>
              </button>
              <button
                onClick={() => setViewMode('flat')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'flat' || searchQuery
                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Flat List with all file paths"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Flat List</span>
              </button>
            </div>
          )}

          {/* Select files toggle */}
          <button
            onClick={() => setIsSelectMode(!isSelectMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              isSelectMode
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-[#181e2b] border-[#273147] text-slate-300 hover:bg-[#222a3d]'
            }`}
            title="Toggle batch selection of files"
          >
            {isSelectMode ? <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> : <Square className="w-3.5 h-3.5" />}
            <span>Select files</span>
          </button>

          {onOpenManifestEditor && (
            <button
              onClick={onOpenManifestEditor}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#181e2b] hover:bg-[#222a3d] text-cyan-300 hover:text-cyan-200 text-xs font-medium border border-[#273147] transition-colors cursor-pointer"
              title="Edit manifest or import .torrent file"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Specs</span>
            </button>
          )}

          <button
            onClick={onOpenTarPreview}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#181e2b] hover:bg-[#222a3d] text-slate-200 text-xs font-medium border border-[#273147] transition-colors cursor-pointer"
            title="Preview content inside .tar package"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Preview</span>
          </button>

          <button
            onClick={onDownloadTar}
            disabled={isGeneratingTar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium shadow transition-colors cursor-pointer"
            title="Download full package as POSIX .tar archive"
          >
            <HardDriveDownload className={`w-3.5 h-3.5 ${isGeneratingTar ? 'animate-bounce' : ''}`} />
            <span>{isGeneratingTar ? 'Packaging...' : `TAR [${formatBytes(totalSize)}]`}</span>
          </button>
        </div>
      </div>

      {/* Sub-bar: Search & Breadcrumbs */}
      <div className="px-4 py-2.5 bg-[#0f131d] border-b border-[#1b2234] flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Breadcrumb path */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 text-slate-400 font-mono min-w-0 max-w-full">
          <button
            onClick={() => {
              setCurrentPath([]);
              setSearchQuery('');
            }}
            className="hover:text-emerald-400 font-medium text-slate-200 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
            title="Return to root directory"
          >
            <Folder className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate max-w-[180px] sm:max-w-[280px]">
              {swarmName || 'Swarm Root'}
            </span>
          </button>

          {currentPath.map((seg, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <button
                onClick={() => setCurrentPath(currentPath.slice(0, idx + 1))}
                className={`hover:text-emerald-400 transition-colors shrink-0 ${
                  idx === currentPath.length - 1 ? 'text-emerald-300 font-semibold' : 'text-slate-300'
                }`}
              >
                {seg}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Real-time search filter */}
        <div className="relative w-full sm:w-56 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search all files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#151a26] border border-[#222b3e] rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Select All Bar when select mode is active */}
      {isSelectMode && (
        <div className="px-4 py-2 bg-[#121724] border-b border-[#1d2537] flex items-center justify-between text-xs text-slate-300">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer"
          >
            {selectedFileIds.size === files.length ? (
              <CheckSquare className="w-4 h-4 text-emerald-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>
              {selectedFileIds.size === files.length
                ? 'Deselect All'
                : `Select All (${files.length} files)`}
            </span>
          </button>
          <span className="font-mono text-emerald-400">
            {selectedFileIds.size} of {files.length} selected
          </span>
        </div>
      )}

      {/* Directory Browser / File List Body */}
      <div className="divide-y divide-[#171c2b] max-h-[460px] overflow-y-auto">
        {/* 1. Search Query Results View */}
        {searchQuery.trim() !== '' && (
          <>
            {searchResults.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No files found matching "{searchQuery}"
              </div>
            ) : (
              searchResults.map((file) => renderFileRow(file, true))
            )}
          </>
        )}

        {/* 2. Flat List View (when selected explicitly) */}
        {searchQuery.trim() === '' && viewMode === 'flat' && (
          <>
            {files.map((file) => renderFileRow(file, true))}
          </>
        )}

        {/* 3. Folder Tree View (Default, Webtor style) */}
        {searchQuery.trim() === '' && viewMode === 'folders' && (
          <>
            {/* Back to parent folder row */}
            {currentPath.length > 0 && (
              <div
                onClick={() => setCurrentPath(currentPath.slice(0, -1))}
                className="p-3 flex items-center gap-3 hover:bg-[#151a26] text-slate-300 hover:text-white transition-colors cursor-pointer text-xs font-mono"
              >
                <ChevronLeft className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-emerald-400 font-semibold">.. (Parent Directory)</span>
              </div>
            )}

            {/* Render Subfolders first */}
            {currentFolders.map((folder) => (
              <div
                key={folder.path}
                onClick={() => setCurrentPath([...currentPath, folder.name])}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#131722] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-[#182030] border border-[#242e44] group-hover:border-emerald-500/30 group-hover:bg-[#1a2335] transition-colors shrink-0">
                    <Folder className="w-4 h-4 text-amber-400 group-hover:text-amber-300" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors font-mono truncate block">
                      {folder.name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {folder.fileCount} {folder.fileCount === 1 ? 'file' : 'files'} • {formatBytes(folder.totalSize)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0">
                  <span className="text-xs font-mono hidden sm:inline">{formatBytes(folder.totalSize)}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}

            {/* Render Immediate Files in this directory */}
            {currentFiles.map((file) => renderFileRow(file, false))}

            {currentFolders.length === 0 && currentFiles.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-xs">
                This directory is empty.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  // Helper to render individual file rows
  function renderFileRow(file: TorrentFile, showFullPath: boolean) {
    const isActive = file.id === activeFileId;
    const isSelected = selectedFileIds.has(file.id);
    const pieceCount = file.pieceCount || 1;
    const downloaded = file.downloadedPieces.size;
    const progressPercent = Math.min(100, Math.round((downloaded / pieceCount) * 100));
    const displayName = showFullPath ? file.path || file.name : file.name;

    return (
      <div
        key={file.id}
        className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
          isActive ? 'bg-[#151a26]' : 'hover:bg-[#11141e]'
        }`}
      >
        {/* Left file detail */}
        <div
          onClick={() => onSelectFile(file)}
          className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer"
        >
          {isSelectMode && (
            <button
              onClick={(e) => toggleSelectFile(file.id, e)}
              className="mt-2 shrink-0 text-slate-400 hover:text-emerald-400"
            >
              {isSelected ? (
                <CheckSquare className="w-4 h-4 text-emerald-400" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
          )}

          <div className="p-2 rounded-lg bg-[#181e2d] border border-[#232b40] mt-0.5 shrink-0">
            {renderIcon(file)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-semibold truncate ${
                  isActive ? 'text-emerald-400' : 'text-slate-200'
                }`}
                title={file.path || file.name}
              >
                {displayName}
              </span>
              {isActive && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30 shrink-0">
                  Selected
                </span>
              )}
            </div>

            {/* Piece progress bar */}
            <div className="mt-1.5 flex items-center gap-2">
              <div className="w-28 sm:w-40 h-1.5 bg-[#1a2030] rounded-full overflow-hidden shrink-0">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-400 truncate">
                {progressPercent}% ({downloaded}/{pieceCount} pcs)
              </span>
            </div>
          </div>
        </div>

        {/* Right side stats & action buttons */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <span className="text-xs font-mono text-slate-300">
            {formatBytes(file.size)}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onSelectFile(file)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-emerald-500 text-white shadow'
                  : 'bg-[#1a2030] hover:bg-[#232b40] text-slate-300'
              }`}
              title="Inspect file details and chunk bitfield"
            >
              <Layers className="w-3 h-3" />
              <span>{isActive ? 'Inspecting' : 'Inspect'}</span>
            </button>

            <button
              onClick={() => onDownloadSingleFile(file)}
              className="p-1.5 rounded bg-[#1a2030] hover:bg-[#232b40] text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Download this file individually"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }
};
