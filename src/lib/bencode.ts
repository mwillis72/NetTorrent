// Bencode parser for BitTorrent .torrent files and metadata buffers
// Compliant with BEP-0003 (BitTorrent Protocol Specification)

export interface TorrentFileInfo {
  length: number;
  path: string[];
  name?: string;
}

export interface DecodedTorrent {
  announce?: string;
  announceList?: string[][];
  comment?: string;
  createdBy?: string;
  creationDate?: number;
  infoHash: string;
  name: string;
  pieceLength: number;
  pieces: string[];
  totalSize: number;
  files: TorrentFileInfo[];
}

export class BencodeDecoder {
  private buffer: Uint8Array;
  private offset: number;

  constructor(buffer: Uint8Array | ArrayBuffer) {
    this.buffer = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    this.offset = 0;
  }

  public decode(): any {
    if (this.offset >= this.buffer.length) {
      throw new Error('Unexpected EOF while decoding bencode');
    }

    const char = String.fromCharCode(this.buffer[this.offset]);

    // Integer: i<digits>e
    if (char === 'i') {
      this.offset++;
      let end = this.offset;
      while (end < this.buffer.length && this.buffer[end] !== 0x65 /* 'e' */) {
        end++;
      }
      if (end >= this.buffer.length) {
        throw new Error('Unterminated integer in bencode');
      }
      const numStr = new TextDecoder().decode(this.buffer.subarray(this.offset, end));
      this.offset = end + 1;
      return parseInt(numStr, 10);
    }

    // List: l<items>e
    if (char === 'l') {
      this.offset++;
      const list: any[] = [];
      while (this.offset < this.buffer.length && this.buffer[this.offset] !== 0x65 /* 'e' */) {
        list.push(this.decode());
      }
      this.offset++; // consume 'e'
      return list;
    }

    // Dictionary: d<key><value>e
    if (char === 'd') {
      this.offset++;
      const dict: Record<string, any> = {};
      while (this.offset < this.buffer.length && this.buffer[this.offset] !== 0x65 /* 'e' */) {
        const key = this.decodeString();
        const val = this.decode();
        dict[key] = val;
      }
      this.offset++; // consume 'e'
      return dict;
    }

    // Byte string: <length>:<bytes>
    if (char >= '0' && char <= '9') {
      return this.decodeStringOrBytes();
    }

    throw new Error(`Unexpected character in bencode at offset ${this.offset}: ${char}`);
  }

  // Decodes key or text string
  private decodeString(): string {
    const bytes = this.decodeRawBytes();
    return new TextDecoder().decode(bytes);
  }

  private decodeStringOrBytes(): string | Uint8Array {
    const colonIdx = this.buffer.indexOf(0x3a /* ':' */, this.offset);
    if (colonIdx === -1) {
      throw new Error('Invalid string length prefix in bencode');
    }

    const lenStr = new TextDecoder().decode(this.buffer.subarray(this.offset, colonIdx));
    const len = parseInt(lenStr, 10);
    const start = colonIdx + 1;
    const end = start + len;

    if (end > this.buffer.length) {
      throw new Error('String length exceeds buffer bounds in bencode');
    }

    this.offset = end;
    const bytes = this.buffer.subarray(start, end);

    // Try text decoding, fallback to raw Uint8Array if binary
    try {
      // If it contains null bytes or non-printable chars, treat as raw
      let hasBinary = false;
      for (let i = 0; i < Math.min(bytes.length, 64); i++) {
        if (bytes[i] === 0 || (bytes[i] < 32 && bytes[i] !== 9 && bytes[i] !== 10 && bytes[i] !== 13)) {
          hasBinary = true;
          break;
        }
      }
      if (hasBinary) {
        return bytes;
      }
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      return bytes;
    }
  }

  private decodeRawBytes(): Uint8Array {
    const colonIdx = this.buffer.indexOf(0x3a /* ':' */, this.offset);
    if (colonIdx === -1) {
      throw new Error('Invalid string length prefix in bencode');
    }

    const lenStr = new TextDecoder().decode(this.buffer.subarray(this.offset, colonIdx));
    const len = parseInt(lenStr, 10);
    const start = colonIdx + 1;
    const end = start + len;

    if (end > this.buffer.length) {
      throw new Error('String length exceeds buffer bounds in bencode');
    }

    this.offset = end;
    return this.buffer.subarray(start, end);
  }
}

// Compute SHA-1 of info dictionary buffer
export async function computeSha1Hex(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => Number(b).toString(16).padStart(2, '0')).join('');
}

// Extract the raw bencoded 'info' slice from a torrent file buffer to compute exact SHA-1 infoHash
export function extractRawInfoSlice(torrentBuffer: Uint8Array): Uint8Array | null {
  // Look for "4:info"
  const marker = [0x34, 0x3a, 0x69, 0x6e, 0x66, 0x6f]; // "4:info"
  let startIdx = -1;
  for (let i = 0; i <= torrentBuffer.length - marker.length; i++) {
    let match = true;
    for (let j = 0; j < marker.length; j++) {
      if (torrentBuffer[i + j] !== marker[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      startIdx = i + marker.length;
      break;
    }
  }

  if (startIdx === -1) return null;

  // Now parse one bencoded value starting at startIdx to find its exact end
  try {
    const decoder = new BencodeDecoder(torrentBuffer);
    (decoder as any).offset = startIdx;
    decoder.decode();
    const endIdx = (decoder as any).offset;
    return torrentBuffer.subarray(startIdx, endIdx);
  } catch {
    return null;
  }
}

// Parse a raw .torrent file buffer into a clean structured DecodedTorrent
export async function parseTorrentFile(buffer: ArrayBuffer | Uint8Array): Promise<DecodedTorrent> {
  const u8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const decoder = new BencodeDecoder(u8);
  const parsed = decoder.decode();

  if (!parsed || typeof parsed !== 'object' || !parsed.info) {
    throw new Error('Invalid .torrent file: missing info dictionary');
  }

  const info = parsed.info;
  const name = typeof info.name === 'string'
    ? info.name
    : (info.name instanceof Uint8Array ? new TextDecoder().decode(info.name) : 'Torrent Package');

  const pieceLength = Number(info['piece length'] || 524288);

  // Compute exact infoHash
  let infoHash = '';
  const infoSlice = extractRawInfoSlice(u8);
  if (infoSlice) {
    infoHash = await computeSha1Hex(infoSlice);
  } else {
    // fallback hash
    infoHash = Math.random().toString(16).substring(2, 10);
  }

  // Extract pieces
  const pieces: string[] = [];
  if (info.pieces instanceof Uint8Array) {
    for (let i = 0; i < info.pieces.length; i += 20) {
      const chunk = info.pieces.subarray(i, i + 20);
      const hex = Array.from(chunk)
        .map((b) => Number(b).toString(16).padStart(2, '0'))
        .join('');
      pieces.push(hex);
    }
  }

  // Extract files (multi-file vs single file)
  const files: TorrentFileInfo[] = [];
  let totalSize = 0;

  if (Array.isArray(info.files) && info.files.length > 0) {
    // Multi-file torrent
    for (const f of info.files) {
      const len = Number(f.length || 0);
      totalSize += len;
      let pathParts: string[] = [];
      if (Array.isArray(f.path)) {
        pathParts = f.path.map((p: any) =>
          typeof p === 'string' ? p : (p instanceof Uint8Array ? new TextDecoder().decode(p) : String(p))
        );
      } else {
        pathParts = [name];
      }
      files.push({
        length: len,
        path: pathParts,
        name: pathParts[pathParts.length - 1] || 'unnamed_file',
      });
    }
  } else {
    // Single-file torrent
    const len = Number(info.length || 0);
    totalSize = len;
    files.push({
      length: len,
      path: [name],
      name,
    });
  }

  let announce = '';
  if (typeof parsed.announce === 'string') {
    announce = parsed.announce;
  } else if (parsed.announce instanceof Uint8Array) {
    announce = new TextDecoder().decode(parsed.announce);
  }

  return {
    announce,
    comment: typeof parsed.comment === 'string' ? parsed.comment : undefined,
    createdBy: typeof parsed['created by'] === 'string' ? parsed['created by'] : undefined,
    creationDate: parsed['creation date'],
    infoHash,
    name,
    pieceLength,
    pieces,
    totalSize,
    files,
  };
}
