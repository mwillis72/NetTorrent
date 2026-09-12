import { parseTorrentFile, DecodedTorrent } from './bencode';
import { TorrentFile, SwarmMetadata } from '../types';
import { detectFileCategory, parseMagnetUri } from './magnetParser';

// Convert a parsed DecodedTorrent into TorrentFile[] and SwarmMetadata
export function decodedTorrentToSwarm(
  decoded: DecodedTorrent,
  originalMagnetUri?: string
): { metadata: SwarmMetadata; files: TorrentFile[] } {
  const swarmId = `swarm-${decoded.infoHash.slice(0, 12)}`;
  const pieceSize = decoded.pieceLength || 512 * 1024;

  const files: TorrentFile[] = decoded.files.map((f, idx) => {
    const fileName = f.name || (f.path.length > 0 ? f.path[f.path.length - 1] : `file_${idx}`);
    const filePath = f.path.join('/');
    const cat = detectFileCategory(fileName);
    const pieceCount = Math.max(1, Math.ceil(f.length / pieceSize));

    // Simulate initial pieces
    const downloadedPieces = new Set<number>();
    const initialCount = Math.min(pieceCount, Math.max(2, Math.floor(pieceCount * 0.12)));
    for (let i = 0; i < initialCount; i++) {
      downloadedPieces.add(i);
    }

    // Mock binary buffer for direct download
    const mockBuffer = new Uint8Array(Math.min(f.length, 1024 * 1024 * 2));
    for (let i = 0; i < mockBuffer.length; i++) {
      mockBuffer[i] = (i ^ (decoded.infoHash.charCodeAt(i % decoded.infoHash.length))) & 0xff;
    }

    return {
      id: `file-${decoded.infoHash.slice(0, 6)}-${idx}`,
      name: fileName,
      path: filePath,
      size: f.length,
      type: cat.mimeType,
      pieceCount,
      pieceSize,
      downloadedPieces,
      contentData: mockBuffer,
    };
  });

  const totalSize = decoded.totalSize || files.reduce((sum, f) => sum + f.size, 0);

  const magnetUri =
    originalMagnetUri ||
    `magnet:?xt=urn:btih:${decoded.infoHash}&dn=${encodeURIComponent(decoded.name)}${
      decoded.announce ? `&tr=${encodeURIComponent(decoded.announce)}` : ''
    }`;

  const metadata: SwarmMetadata = {
    id: swarmId,
    name: decoded.name,
    infoHash: decoded.infoHash,
    magnetUri,
    totalSize,
    files: files.map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.type,
      pieceCount: f.pieceCount,
      pieceSize: f.pieceSize,
    })),
    createdAt: decoded.creationDate ? decoded.creationDate * 1000 : Date.now(),
    createdBy: decoded.createdBy || 'torrent-metadata',
  };

  return { metadata, files };
}

// Attempt to fetch public .torrent file by infoHash from public torrent caches
export async function fetchPublicTorrentMetadata(infoHash: string): Promise<DecodedTorrent | null> {
  const cleanHash = infoHash.toLowerCase().trim();
  if (!cleanHash.match(/^[0-9a-f]{40}$/)) return null;

  const cacheUrls = [
    `https://itorrents.org/torrent/${cleanHash.toUpperCase()}.torrent`,
    `https://btcache.me/torrent/${cleanHash.toUpperCase()}`,
  ];

  for (const url of cacheUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WebtorClient/1.0)' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const buffer = await res.arrayBuffer();
        if (buffer.byteLength > 50) {
          const decoded = await parseTorrentFile(buffer);
          if (decoded && decoded.files.length > 0) {
            return decoded;
          }
        }
      }
    } catch {
      // Continue to next cache
    }
  }

  return null;
}
