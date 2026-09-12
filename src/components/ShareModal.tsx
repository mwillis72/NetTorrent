import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Magnet,
  Link,
  QrCode,
  Users,
  ShieldCheck
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  magnetUri: string;
  infoHash: string;
  swarmName: string;
  swarmId: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  magnetUri,
  infoHash,
  swarmName,
  swarmId,
}) => {
  const [copiedMagnet, setCopiedMagnet] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/?swarm=${encodeURIComponent(swarmId)}`;

  const copyToClipboard = (text: string, isMagnet: boolean) => {
    navigator.clipboard.writeText(text);
    if (isMagnet) {
      setCopiedMagnet(true);
      setTimeout(() => setCopiedMagnet(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-[#0e111a] border border-[#21293d] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#121622] border-b border-[#1f2638] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Share P2P Torrent Swarm</h2>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{swarmName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1c2233] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Direct Browser-to-Browser Web Link */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-emerald-400" />
              Direct Browser Stream Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 bg-[#0a0c12] border border-[#1d2538] rounded-xl text-xs font-mono text-slate-200 focus:outline-none select-all"
              />
              <button
                onClick={() => copyToClipboard(shareUrl, false)}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Open in a second browser window or share with a friend to test real WebRTC peer transfers!
            </p>
          </div>

          {/* Magnet URI */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block flex items-center gap-1.5">
              <Magnet className="w-3.5 h-3.5 text-sky-400" />
              Standard Magnet URI
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={magnetUri}
                className="flex-1 px-3 py-2 bg-[#0a0c12] border border-[#1d2538] rounded-xl text-xs font-mono text-slate-200 focus:outline-none select-all"
              />
              <button
                onClick={() => copyToClipboard(magnetUri, true)}
                className="px-3 py-2 bg-[#192030] hover:bg-[#232c42] text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 border border-[#26314a] transition-colors shrink-0"
              >
                {copiedMagnet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMagnet ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* InfoHash badge */}
          <div className="p-3 bg-[#111520] rounded-xl border border-[#1f273b] flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">InfoHash:</span>
            <span className="text-emerald-400 font-medium truncate max-w-xs">{infoHash}</span>
          </div>

          {/* Multi-peer advice */}
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-start gap-2.5">
            <Users className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Real-Time P2P Sharing Active:</strong> Other browsers opening this link will automatically connect to your swarm session, request chunks, and stream files in real-time.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#121622] border-t border-[#1f2638] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#181d2a] hover:bg-[#202738] text-slate-300 text-xs font-medium border border-[#232b3d] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
