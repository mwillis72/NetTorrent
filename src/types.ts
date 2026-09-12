export interface TorrentFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: string;
  pieceCount: number;
  pieceSize: number;
  downloadedPieces: Set<number>;
  blobUrl?: string;
  rawFile?: File;
  contentData?: Uint8Array;
  downloadSpeed?: number;
  isStreaming?: boolean;
}

export interface SwarmMetadata {
  id: string;
  name: string;
  infoHash: string;
  magnetUri: string;
  totalSize: number;
  artworkUrl?: string;
  files: {
    id: string;
    name: string;
    path?: string;
    size: number;
    type: string;
    pieceCount: number;
    pieceSize: number;
  }[];
  createdAt: number;
  createdBy: string;
  peerCount?: number;
}

export interface PeerInfo {
  peerId: string;
  name: string;
  isSeeder: boolean;
  downSpeed?: number;
  upSpeed?: number;
  progress?: number;
  latencyMs?: number;
  connectionType: 'webrtc' | 'websocket-relay';
  dataChannelState?: 'open' | 'connecting' | 'closed';
}

export interface SwarmStats {
  downloadSpeed: number; // bytes/sec
  uploadSpeed: number; // bytes/sec
  totalDownloaded: number; // bytes
  totalUploaded: number; // bytes
  peersCount: number;
  seedersCount: number;
  leechersCount: number;
  healthPercent: number;
  etaSeconds: number;
  activePieces: number;
  totalPieces: number;
}

export type MagneticDockPosition = 'bottom-dock' | 'card-attached' | 'floating' | 'top-ribbon';

export interface TarPreviewEntry {
  name: string;
  size: number;
  mode: string;
  mtime: Date;
  type: 'file' | 'directory';
  checksum: string;
  contentType: string;
  fileReference?: TorrentFile;
}
