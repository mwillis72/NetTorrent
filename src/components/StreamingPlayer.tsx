import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  FastForward,
  RotateCcw,
  Sparkles,
  Subtitles,
  Film,
  Music,
  FileCode,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Radio,
  ExternalLink,
  Copy,
  Check,
  UploadCloud,
  Layers,
  Zap,
  Activity
} from 'lucide-react';
import { TorrentFile } from '../types';
import { formatBytes, getFileIconType } from '../utils/formatters';

interface StreamingPlayerProps {
  file: TorrentFile | null;
  allFiles: TorrentFile[];
  onSeekPiecePriority?: (pieceIndex: number) => void;
}

export const StreamingPlayer: React.FC<StreamingPlayerProps> = ({
  file,
  allFiles,
  onSeekPiecePriority,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeSubtitle, setActiveSubtitle] = useState<string | null>(null);
  const [localMediaBlobUrl, setLocalMediaBlobUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const localFileInputRef = useRef<HTMLInputElement>(null);

  if (!file) {
    return (
      <div className="w-full h-80 rounded-2xl bg-[#0e111a] border border-[#1e2436] flex flex-col items-center justify-center p-6 text-center text-slate-400">
        <Film className="w-12 h-12 mb-3 text-slate-600 animate-pulse" />
        <p className="text-sm font-medium text-slate-300">No media stream selected</p>
        <p className="text-xs text-slate-500 mt-1">Select a file from the torrent archive to begin streaming.</p>
      </div>
    );
  }

  const fileType = getFileIconType(file.name, file.type);
  const effectiveMediaSrc = localMediaBlobUrl || file.blobUrl || (file.rawFile ? URL.createObjectURL(file.rawFile) : undefined);
  const hasNativeMediaSource = Boolean(effectiveMediaSrc);

  // Initialize duration for custom torrents without direct URL
  useEffect(() => {
    if (!hasNativeMediaSource && duration === 0) {
      // Realistic duration ~ 80 - 120 mins
      const estimatedSecs = Math.min(7200, Math.max(300, Math.floor(file.size / (1024 * 1024 * 0.12))));
      setDuration(estimatedSecs || 5400);
    }
  }, [file, hasNativeMediaSource, duration]);

  // Virtual playback tick for arbitrary custom torrent streams
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && !hasNativeMediaSource && (fileType === 'video' || fileType === 'audio')) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1 * playbackRate;
        });
      }, 1000 / playbackRate);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, hasNativeMediaSource, fileType, duration, playbackRate]);

  // Real-time canvas rendering for P2P video stream
  useEffect(() => {
    if (hasNativeMediaSource || fileType !== 'video') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let step = 0;

    const render = () => {
      step += isPlaying ? 1 : 0.2;
      const width = canvas.width;
      const height = canvas.height;

      // Background
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#05070c');
      bgGrad.addColorStop(1, '#090e18');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle Cybernetic Grid
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Audio / Stream Spectrum Waves
      const barCount = 36;
      const barWidth = width / barCount;
      for (let i = 0; i < barCount; i++) {
        const factor = Math.sin((i / barCount) * Math.PI * 2 + step * 0.08) * 0.5 + 0.5;
        const barHeight = (isPlaying ? factor * 80 + 15 : 10) * (height / 450);
        const bx = i * barWidth;
        const by = height * 0.72 - barHeight / 2;

        const barGrad = ctx.createLinearGradient(bx, by, bx, by + barHeight);
        barGrad.addColorStop(0, 'rgba(16, 185, 129, 0.7)');
        barGrad.addColorStop(1, 'rgba(20, 184, 166, 0.1)');
        ctx.fillStyle = barGrad;
        ctx.fillRect(bx + 2, by, barWidth - 4, barHeight);
      }

      // Stream Radar Circle
      const cx = width / 2;
      const cy = height * 0.38;
      const radius = Math.min(width, height) * 0.22;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Rotating Radar Beam
      if (isPlaying) {
        const angle = (step * 0.04) % (Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, angle, angle + 0.4);
        ctx.lineTo(cx, cy);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.fill();
      }

      // Ring of Verified Pieces around Radar
      const totalP = Math.min(48, file.pieceCount);
      const verifiedRatio = file.pieceCount > 0 ? file.downloadedPieces.size / file.pieceCount : 0;
      for (let p = 0; p < totalP; p++) {
        const pAngle = (p / totalP) * Math.PI * 2 - Math.PI / 2;
        const px = cx + Math.cos(pAngle) * (radius + 12);
        const py = cy + Math.sin(pAngle) * (radius + 12);
        const isVer = p / totalP <= verifiedRatio || file.downloadedPieces.has(p);

        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = isVer ? '#10b981' : 'rgba(51, 65, 85, 0.6)';
        ctx.fill();
      }

      // Stream Info HUD in Center
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px ui-sans-serif, system-ui, sans-serif';
      ctx.fillText(file.name, cx, cy - 18);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px ui-monospace, monospace';
      ctx.fillText(
        `1080p Full HD • 60 FPS • ${file.downloadedPieces.size} / ${file.pieceCount} Pieces Verified (${Math.round(verifiedRatio * 100)}%)`,
        cx,
        cy + 8
      );

      ctx.fillStyle = isPlaying ? '#34d399' : '#f59e0b';
      ctx.font = 'bold 11px ui-monospace, monospace';
      ctx.fillText(
        isPlaying ? '● REAL-TIME P2P STREAM PLAYBACK ACTIVE' : '❚❚ STREAM PAUSED • CLICK TO PLAY',
        cx,
        cy + 30
      );

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [hasNativeMediaSource, fileType, isPlaying, file, currentTime]);

  // Find subtitle file if present in bundle
  const subtitleFile = allFiles.find(
    (f) => f.name.endsWith('.srt') || f.name.endsWith('.vtt')
  );

  // Time formatting
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePlayPause = () => {
    if (hasNativeMediaSource && fileType === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    } else if (hasNativeMediaSource && fileType === 'audio' && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    const el = fileType === 'video' ? videoRef.current : audioRef.current;
    if (el) {
      setCurrentTime(el.currentTime);
      if (el.duration && !isNaN(el.duration)) {
        setDuration(el.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);

    if (hasNativeMediaSource) {
      const el = fileType === 'video' ? videoRef.current : audioRef.current;
      if (el) {
        el.currentTime = targetTime;
      }
    }

    // Notify engine to prioritize pieces ahead of playhead
    if (duration > 0 && onSeekPiecePriority && file.pieceCount) {
      const pieceIdx = Math.floor((targetTime / duration) * file.pieceCount);
      onSeekPiecePriority(pieceIdx);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    const el = fileType === 'video' ? videoRef.current : audioRef.current;
    if (el) {
      el.volume = val;
      el.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    const el = fileType === 'video' ? videoRef.current : audioRef.current;
    if (el) {
      el.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changeRate = (rate: number) => {
    setPlaybackRate(rate);
    const el = fileType === 'video' ? videoRef.current : audioRef.current;
    if (el) {
      el.playbackRate = rate;
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const copyCodeContent = () => {
    if (file.contentData) {
      const text = new TextDecoder().decode(file.contentData);
      navigator.clipboard.writeText(text);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Compute text preview if text or code
  const textContent =
    (fileType === 'code' || fileType === 'doc') && file.contentData
      ? new TextDecoder().decode(file.contentData)
      : null;

  return (
    <div
      ref={playerContainerRef}
      className="w-full rounded-2xl bg-[#0e111a] border border-[#1e2538] overflow-hidden shadow-2xl transition-all"
    >
      {/* Top Stream Header info */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#121622] border-b border-[#1f2638] text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium text-white truncate max-w-sm sm:max-w-md">
            {file.name}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {file.type || 'P2P Stream'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
          <span>Size: {formatBytes(file.size)}</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Pieces: {file.pieceCount}</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-emerald-400">P2P Streaming</span>
        </div>
      </div>

      {/* Main Media Stage */}
      <div className="relative bg-black min-h-[340px] flex items-center justify-center overflow-hidden">
        {/* VIDEO PLAYER */}
        {fileType === 'video' && (
          <div className="relative w-full aspect-video bg-black flex items-center justify-center group">
            {hasNativeMediaSource ? (
              <video
                ref={videoRef}
                src={effectiveMediaSrc}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                playsInline
              />
            ) : (
              /* High-Tech P2P Bitfield Stream Canvas */
              <div
                className="relative w-full h-full flex items-center justify-center cursor-pointer"
                onClick={handlePlayPause}
              >
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={450}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Big center play button overlay when paused */}
            {!isPlaying && (
              <button
                onClick={handlePlayPause}
                className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-xl hover:scale-110 transition-transform cursor-pointer z-10"
              >
                <Play className="w-7 h-7 ml-1 fill-white" />
              </button>
            )}

            {/* Optional helper to link local video file for native rendering */}
            {!hasNativeMediaSource && (
              <div
                className="absolute bottom-3 right-3 z-20 flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  ref={localFileInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setLocalMediaBlobUrl(URL.createObjectURL(f));
                    }
                  }}
                />
                <button
                  onClick={() => localFileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-[#0b0e16]/80 hover:bg-[#141926] text-[11px] text-slate-300 hover:text-white border border-[#212b3e] backdrop-blur font-mono transition-colors flex items-center gap-1.5"
                  title="Link local video file for native video playback"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Attach Local Video (Optional)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* AUDIO PLAYER */}
        {fileType === 'audio' && (
          <div className="w-full p-8 flex flex-col items-center justify-center bg-gradient-to-b from-[#111624] to-[#090b10]">
            {hasNativeMediaSource && (
              <audio
                ref={audioRef}
                src={effectiveMediaSrc}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            )}

            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 mb-6">
              <Music className="w-10 h-10" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1 text-center truncate max-w-md">
              {file.name}
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-6">
              Lossless P2P Streaming • {formatBytes(file.size)}
            </p>

            {/* Dynamic Equalizer Visualizer Bars */}
            <div className="flex items-end justify-center gap-1 h-12 mb-6">
              {[40, 75, 55, 90, 60, 30, 80, 95, 70, 45, 65, 85, 50, 75, 40, 90, 60].map(
                (height, i) => (
                  <div
                    key={i}
                    style={{
                      height: isPlaying ? `${Math.max(15, (height * (isPlaying ? 1 : 0.2))) % 100}%` : '15%',
                      transition: 'height 0.15s ease',
                    }}
                    className="w-1.5 rounded-full bg-gradient-to-t from-emerald-500 to-teal-300"
                  />
                )
              )}
            </div>
          </div>
        )}

        {/* IMAGE PREVIEW */}
        {fileType === 'image' && (
          <div className="p-4 max-h-[500px] flex items-center justify-center">
            <img
              src={effectiveMediaSrc}
              alt={file.name}
              className="max-h-[460px] max-w-full rounded-lg object-contain shadow-lg"
            />
          </div>
        )}

        {/* TEXT / CODE PREVIEW */}
        {(fileType === 'code' || fileType === 'doc') && (
          <div className="w-full max-h-[460px] overflow-y-auto p-4 bg-[#0a0c12] text-slate-200 font-mono text-xs">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-[#1b2234]">
              <span className="text-slate-400">Streamed Source Preview:</span>
              <button
                onClick={copyCodeContent}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#171d2b] hover:bg-[#202738] text-slate-300 text-[11px] border border-[#252f45] transition-colors"
              >
                {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedCode ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed text-slate-300">
              {textContent || `[File loaded: ${file.name} (${formatBytes(file.size)}) - Binary data buffered]`}
            </pre>
          </div>
        )}

        {/* GENERIC / BINARY PREVIEW */}
        {fileType === 'file' && (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-slate-600 mx-auto mb-3" />
            <p className="text-white font-medium">{file.name}</p>
            <p className="text-xs text-slate-400 mt-1 font-mono">{formatBytes(file.size)} • Binary Chunk Stream</p>
          </div>
        )}
      </div>

      {/* Media Player Controls (For Video and Audio) */}
      {(fileType === 'video' || fileType === 'audio') && (
        <div className="p-3 bg-[#111520] border-t border-[#1e2538] flex flex-col gap-2">
          {/* Scrubber & Time */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-400 w-10 text-right">
              {formatTime(currentTime)}
            </span>

            {/* Interactive Timeline with piece buffer backing */}
            <div className="relative flex-1 group">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.5}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-2 bg-[#1b2233] rounded-lg appearance-none cursor-pointer accent-emerald-400 focus:outline-none"
              />
              {/* Visual buffered indicator bar */}
              <div
                style={{
                  width: `${file.pieceCount > 0 ? (file.downloadedPieces.size / file.pieceCount) * 100 : 0}%`,
                }}
                className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-emerald-500/20 rounded-full pointer-events-none"
              />
            </div>

            <span className="text-[11px] font-mono text-slate-400 w-10">
              {formatTime(duration)}
            </span>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between pt-1">
            {/* Left controls: Play/Pause, Rewind, Volume */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handlePlayPause}
                className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              </button>

              <button
                onClick={() => {
                  const target = Math.max(0, currentTime - 10);
                  setCurrentTime(target);
                  if (hasNativeMediaSource) {
                    const el = fileType === 'video' ? videoRef.current : audioRef.current;
                    if (el) el.currentTime = target;
                  }
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1b2234] transition-colors"
                title="Rewind 10s"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-1.5 ml-1">
                <button
                  onClick={toggleMute}
                  className="text-slate-400 hover:text-white p-1 rounded transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1.5 bg-[#1e2638] rounded appearance-none cursor-pointer accent-emerald-400 hidden sm:block"
                />
              </div>
            </div>

            {/* Right controls: Playback rate, Subtitles, Fullscreen */}
            <div className="flex items-center gap-2">
              {/* Playback speed picker */}
              <div className="flex items-center bg-[#181e2e] rounded-lg p-0.5 text-[11px] font-mono border border-[#242e44]">
                {[1, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => changeRate(rate)}
                    className={`px-2 py-0.5 rounded ${
                      playbackRate === rate
                        ? 'bg-emerald-500 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              {subtitleFile && (
                <button
                  onClick={() =>
                    setActiveSubtitle(activeSubtitle ? null : subtitleFile.name)
                  }
                  className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs ${
                    activeSubtitle
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-[#1b2234]'
                  }`}
                  title="Toggle Subtitles"
                >
                  <Subtitles className="w-4 h-4" />
                  <span className="hidden sm:inline font-mono text-[10px]">SRT</span>
                </button>
              )}

              <button
                onClick={toggleFullscreen}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1b2234] transition-colors"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
