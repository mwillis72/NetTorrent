import React, { useState, useRef, useEffect } from 'react';
import {
  Magnet,
  Maximize2,
  Minimize2,
  Lock,
  Unlock,
  Layers,
  Sparkles,
  ArrowDownToLine,
  Activity,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { TorrentFile, MagneticDockPosition, SwarmStats } from '../types';
import { formatBytes, formatSpeed, formatEta } from '../utils/formatters';

interface MagneticProgressBarProps {
  activeFile: TorrentFile | null;
  stats: SwarmStats;
  dockPosition: MagneticDockPosition;
  onDockChange: (pos: MagneticDockPosition) => void;
}

export const MagneticProgressBar: React.FC<MagneticProgressBarProps> = ({
  activeFile,
  stats,
  dockPosition,
  onDockChange,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 24, y: 100 });
  const [isNearMagneticZone, setIsNearMagneticZone] = useState(false);
  const [magneticSnapped, setMagneticSnapped] = useState(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  if (!activeFile) return null;

  const totalPieces = activeFile.pieceCount || 1;
  const downloadedCount = activeFile.downloadedPieces.size;
  const percent = Math.min(100, Math.round((downloadedCount / totalPieces) * 100));
  const isComplete = percent >= 100;

  // Handle magnetic dragging for 'floating' mode
  const handleMouseDown = (e: React.MouseEvent) => {
    if (dockPosition !== 'floating') return;
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: dragPos.x,
      startY: dragPos.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      let newX = dragStartRef.current.startX + dx;
      let newY = dragStartRef.current.startY + dy;

      // Check magnetic snap thresholds (60px from viewport bottom)
      const windowHeight = window.innerHeight;
      const distFromBottom = windowHeight - (newY + 120);

      if (distFromBottom < 75 && distFromBottom > -50) {
        setIsNearMagneticZone(true);
        // Magnetic pull effect
        if (distFromBottom < 40) {
          // Snap automatically to bottom!
          onDockChange('bottom-dock');
          setIsDragging(false);
          setMagneticSnapped(true);
          setTimeout(() => setMagneticSnapped(false), 800);
          return;
        }
      } else {
        setIsNearMagneticZone(false);
      }

      setDragPos({ x: Math.max(10, newX), y: Math.max(70, newY) });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsNearMagneticZone(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onDockChange]);

  // Generate piece blocks for bitfield visualizer (max 64 blocks for UI)
  const previewPieceCount = Math.min(totalPieces, 50);
  const pieceIndicators = Array.from({ length: previewPieceCount }).map((_, idx) => {
    const actualPieceIndex = Math.floor((idx / previewPieceCount) * totalPieces);
    const hasPiece = activeFile.downloadedPieces.has(actualPieceIndex);
    const isBuffering = !hasPiece && actualPieceIndex < downloadedCount + 3;
    return {
      index: actualPieceIndex,
      hasPiece,
      isBuffering,
    };
  });

  // Render position container classes
  const getPositionClasses = () => {
    switch (dockPosition) {
      case 'bottom-dock':
        return 'fixed bottom-0 left-0 right-0 z-30 p-3 bg-[#0c0e14]/95 backdrop-blur-md border-t border-[#202738] shadow-2xl transition-all duration-300';
      case 'top-ribbon':
        return 'w-full mb-4 bg-[#11151f] rounded-xl p-3 border border-[#21283a] shadow-lg transition-all duration-300';
      case 'card-attached':
        return 'w-full mt-2 bg-[#121622] rounded-lg p-2.5 border border-emerald-500/30 shadow transition-all duration-300';
      case 'floating':
        return `fixed z-40 w-96 rounded-xl bg-[#0f131c]/95 backdrop-blur-lg border ${
          isNearMagneticZone ? 'border-emerald-400 shadow-emerald-500/30' : 'border-[#242b3d]'
        } shadow-2xl cursor-grab ${isDragging ? 'cursor-grabbing scale-[1.02]' : ''}`;
    }
  };

  const floatingStyle: React.CSSProperties =
    dockPosition === 'floating'
      ? {
          left: `${dragPos.x}px`,
          top: `${dragPos.y}px`,
        }
      : {};

  return (
    <>
      {/* Magnetic zone indicator if dragging near bottom */}
      {isNearMagneticZone && (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-emerald-500/10 border-t-2 border-dashed border-emerald-400 z-20 flex items-center justify-center animate-pulse">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold tracking-wider uppercase">
            <Magnet className="w-4 h-4 animate-bounce" />
            Magnetic Snap Zone: Release to Dock
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        style={floatingStyle}
        className={`${getPositionClasses()} ${magneticSnapped ? 'animate-magnetic-snap' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={dockPosition === 'bottom-dock' ? 'max-w-7xl mx-auto' : ''}>
          {/* Header row: File details & Magnetic Dock Switcher */}
          <div
            className="flex items-center justify-between gap-2 mb-2 select-none"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`p-1.5 rounded-lg ${
                  isComplete
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-indigo-500/20 text-indigo-400'
                } flex items-center justify-center`}
              >
                {isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Magnet className="w-4 h-4 text-emerald-400 animate-pulse" />
                )}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                    {activeFile.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 font-mono rounded bg-[#1c2233] text-slate-300 border border-[#273147]">
                    {formatBytes(activeFile.size)}
                  </span>
                </div>
              </div>
            </div>

            {/* Speed & ETA stats */}
            <div className="flex items-center gap-3 text-xs">
              <div className="hidden sm:flex items-center gap-2 font-mono text-slate-300">
                <span className="text-emerald-400 font-medium">
                  {isComplete ? 'Seeding' : formatSpeed(stats.downloadSpeed)}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">
                  {isComplete ? 'Complete' : `ETA: ${formatEta(stats.etaSeconds)}`}
                </span>
              </div>

              {/* Magnetic Dock Controls */}
              <div className="flex items-center gap-1 bg-[#181e2b] p-0.5 rounded-lg border border-[#262f43]">
                <button
                  onClick={() => onDockChange('bottom-dock')}
                  className={`p-1 rounded text-xs transition-colors ${
                    dockPosition === 'bottom-dock'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Magnetically dock to bottom viewport"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDockChange('top-ribbon')}
                  className={`p-1 rounded text-xs transition-colors ${
                    dockPosition === 'top-ribbon'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Magnetically dock under player scrubber"
                >
                  <Layers className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDockChange('floating')}
                  className={`p-1 rounded text-xs transition-colors ${
                    dockPosition === 'floating'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Free floating magnetic HUD (Draggable)"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Magnetic Progress Bar */}
          <div className="relative w-full h-3 bg-[#171b26] rounded-full overflow-hidden border border-[#242b3d] p-0.5">
            {/* Download Progress Fill */}
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 via-emerald-400 to-emerald-300 shadow-md shadow-emerald-500/30 transition-all duration-300 relative"
              style={{ width: `${percent}%` }}
            >
              {/* Shimmer beam */}
              {!isComplete && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              )}
            </div>
          </div>

          {/* Real-time Bitfield Pieces Visualization (WebTorrent / BitTorrent pieces) */}
          <div className="mt-2 flex items-center justify-between gap-1 text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-400 font-semibold">{percent}%</span>
              <span>
                ({downloadedCount}/{totalPieces} pieces verified)
              </span>
            </div>

            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-xs bg-emerald-400" />
              <span className="text-[10px] text-slate-400">Streamed</span>
              <div className="w-2 h-2 rounded-xs bg-cyan-400 ml-2" />
              <span className="text-[10px] text-slate-400">Buffering</span>
              <div className="w-2 h-2 rounded-xs bg-[#1f2536] ml-2" />
              <span className="text-[10px] text-slate-400">Queued</span>
            </div>
          </div>

          {/* Mini interactive piece bitfield map */}
          <div className="mt-1.5 flex gap-0.5 w-full h-1.5 overflow-hidden rounded bg-[#131722] p-0.5 border border-[#1e2538]">
            {pieceIndicators.map((p) => (
              <div
                key={p.index}
                title={`Piece #${p.index}: ${p.hasPiece ? 'Downloaded & Verified' : p.isBuffering ? 'Buffering in memory' : 'Missing'}`}
                className={`flex-1 h-full rounded-xs transition-colors duration-150 ${
                  p.hasPiece
                    ? 'bg-emerald-400'
                    : p.isBuffering
                    ? 'bg-cyan-400 animate-pulse'
                    : 'bg-[#1f2638]'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
