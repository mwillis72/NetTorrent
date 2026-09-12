import { TorrentFile, SwarmMetadata } from '../types';

export interface SampleBundle {
  id: string;
  name: string;
  category: string;
  description: string;
  badge: string;
  infoHash: string;
  magnetUri: string;
  totalSize: number;
  files: TorrentFile[];
}

export const SAMPLE_TORRENTS: SampleBundle[] = [
  {
    id: "sample-cosmos",
    name: "Cosmos & Deep Space 4K Media Archive",
    category: "Video & Sound",
    description: "4K space exploration footage, atmospheric synth audio, high-res James Webb imagery, and mission flight logs.",
    badge: "Most Popular",
    infoHash: "e17a3a8904df98c39e26210fca5b1c93a904e5bf",
    magnetUri: "magnet:?xt=urn:btih:e17a3a8904df98c39e26210fca5b1c93a904e5bf&dn=Cosmos+Archive&tr=wss%3A%2F%2Ftracker.webtor.io",
    totalSize: 48259200,
    files: [
      {
        id: "cosmos-vid",
        name: "Cosmos_Nebula_Voyage_1080p.mp4",
        path: "video/Cosmos_Nebula_Voyage_1080p.mp4",
        size: 32540000,
        type: "video/mp4",
        pieceCount: 64,
        pieceSize: 508437,
        downloadedPieces: new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
        blobUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      },
      {
        id: "cosmos-audio",
        name: "Interstellar_Ambient_Synth.mp3",
        path: "audio/Interstellar_Ambient_Synth.mp3",
        size: 8940000,
        type: "audio/mp3",
        pieceCount: 32,
        pieceSize: 279375,
        downloadedPieces: new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]),
        blobUrl: "https://actions.google.com/sounds/v1/science_fiction/ambience_space_craft_hum.ogg",
      },
      {
        id: "cosmos-img",
        name: "James_Webb_Carina_Nebula_HighRes.jpg",
        path: "images/James_Webb_Carina_Nebula_HighRes.jpg",
        size: 5820000,
        type: "image/jpeg",
        pieceCount: 20,
        pieceSize: 291000,
        downloadedPieces: new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]),
        blobUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80",
      },
      {
        id: "cosmos-doc",
        name: "Mission_Log_DeepSpace_Archive.txt",
        path: "docs/Mission_Log_DeepSpace_Archive.txt",
        size: 959200,
        type: "text/plain",
        pieceCount: 8,
        pieceSize: 119900,
        downloadedPieces: new Set([0, 1, 2, 3, 4, 5, 6, 7]),
        contentData: new TextEncoder().encode(
`========================================================================
WEBTOR P2P DEEP SPACE EXPLORATION LOG & ARCHIVE METADATA
========================================================================
Archive UUID:      e17a3a89-04df-98c3-9e26-210fca5b1c93
Source Node:       DeepSpace-Station-Alpha (Peer: 192.88.99.102)
Encryption:        POSIX UStar Spec / SHA-256 Verifiable Pieces
Swarm Protocol:    WebRTC DataChannel Swarm Relay v2.4

[MISSION SUMMARY]
The Cosmos Archive is an open peer-to-peer data distribution set
containing high dynamic range video feeds, soundscapes, orbital
telemetry charts, and interstellar spectroscopy scans.

[FILES IN PACK]
1. Cosmos_Nebula_Voyage_1080p.mp4 (32.5 MB) - Full 1080p 60fps stream
2. Interstellar_Ambient_Synth.mp3 (8.9 MB)  - Binaural deep space sound
3. James_Webb_Carina_Nebula.jpg  (5.8 MB)  - Infrared composite
4. Mission_Log_DeepSpace.txt      (0.9 MB)  - Complete node telemetry

[STREAMING INSTRUCTIONS]
- Instant playback without waiting for full download.
- Forward piece-request strategy buffers 10 pieces ahead of playback.
- Magnetic progress indicator snaps to scrubber and displays real-time bitfield pieces.
- Export full package to standard POSIX .tar archive with 1 click.
========================================================================`
        ),
      },
    ],
  },
  {
    id: "sample-dev",
    name: "Open Source Fullstack TypeScript Boilerplate",
    category: "Developer Code",
    description: "Multi-file source code bundle with TypeScript types, React components, Tailwind themes, and test suites.",
    badge: "Dev Pack",
    infoHash: "b3901aef48c1d5203fa82910c2837490ab749210",
    magnetUri: "magnet:?xt=urn:btih:b3901aef48c1d5203fa82910c2837490ab749210&dn=Fullstack+Codebase&tr=wss%3A%2F%2Ftracker.webtor.io",
    totalSize: 14200000,
    files: [
      {
        id: "code-server",
        name: "server.ts",
        path: "src/server.ts",
        size: 2150000,
        type: "application/typescript",
        pieceCount: 16,
        pieceSize: 134375,
        downloadedPieces: new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
        contentData: new TextEncoder().encode(
`// P2P Swarm Engine Server Implementation
import express from 'express';
import { WebSocketServer } from 'ws';

export class P2PStreamServer {
  private swarmPeers = new Map<string, Set<any>>();

  broadcast(swarmId: string, chunk: Uint8Array) {
    const peers = this.swarmPeers.get(swarmId);
    if (!peers) return;
    for (const peer of peers) {
      peer.send(chunk);
    }
  }
}`
        ),
      },
      {
        id: "code-types",
        name: "types.d.ts",
        path: "src/types.d.ts",
        size: 980000,
        type: "application/typescript",
        pieceCount: 8,
        pieceSize: 122500,
        downloadedPieces: new Set([0, 1, 2, 3, 4, 5, 6, 7]),
        contentData: new TextEncoder().encode(
`export interface SwarmPacket {
  version: number;
  swarmId: string;
  pieceIndex: number;
  hash: string;
  data: Uint8Array;
}`
        ),
      },
      {
        id: "code-readme",
        name: "ARCHITECTURE.md",
        path: "docs/ARCHITECTURE.md",
        size: 1450000,
        type: "text/markdown",
        pieceCount: 12,
        pieceSize: 120833,
        downloadedPieces: new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
        contentData: new TextEncoder().encode(
`# Webtor Architecture Overview
Webtor provides browser-native torrent streaming, instant bitfield visualizers,
and client-side POSIX .tar archive packaging.`
        ),
      },
      {
        id: "code-demo-video",
        name: "Feature_Walkthrough_Demo.mp4",
        path: "media/Feature_Walkthrough_Demo.mp4",
        size: 9620000,
        type: "video/mp4",
        pieceCount: 32,
        pieceSize: 300625,
        downloadedPieces: new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
        blobUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      },
    ],
  },
  {
    id: "sample-cinema",
    name: "Open Movie Cinema 1080p Multi-Track",
    category: "Film & Cinema",
    description: "Full short film with surround sound track, multilingual subtitles (.srt), and high-resolution cinema production stills.",
    badge: "Film Pack",
    infoHash: "c483918230fe417281903482a871029384710293",
    magnetUri: "magnet:?xt=urn:btih:c483918230fe417281903482a871029384710293&dn=Sintel+Cinema+Bundle&tr=wss%3A%2F%2Ftracker.webtor.io",
    totalSize: 54100000,
    files: [
      {
        id: "cinema-main",
        name: "Sintel_The_Dragon_Journey.mp4",
        path: "video/Sintel_The_Dragon_Journey.mp4",
        size: 41200000,
        type: "video/mp4",
        pieceCount: 80,
        pieceSize: 515000,
        downloadedPieces: new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
        blobUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      },
      {
        id: "cinema-score",
        name: "Orchestral_Main_Score.mp3",
        path: "audio/Orchestral_Main_Score.mp3",
        size: 7800000,
        type: "audio/mp3",
        pieceCount: 24,
        pieceSize: 325000,
        downloadedPieces: new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
        blobUrl: "https://actions.google.com/sounds/v1/science_fiction/deep_whoosh.ogg",
      },
      {
        id: "cinema-subs",
        name: "Subtitles_English.srt",
        path: "subtitles/Subtitles_English.srt",
        size: 240000,
        type: "text/plain",
        pieceCount: 4,
        pieceSize: 60000,
        downloadedPieces: new Set([0, 1, 2, 3]),
        contentData: new TextEncoder().encode(
`1
00:00:01,000 --> 00:00:04,200
In a forgotten valley shrouded by winter blizzards...

2
00:00:04,500 --> 00:00:08,000
A lone tracker follows the footprints of a scaled creature.

3
00:00:09,100 --> 00:00:14,300
Streaming in real-time through Webtor P2P bitfield buffers.`
        ),
      },
      {
        id: "cinema-poster",
        name: "Original_Theatrical_Poster.jpg",
        path: "art/Original_Theatrical_Poster.jpg",
        size: 4860000,
        type: "image/jpeg",
        pieceCount: 16,
        pieceSize: 303750,
        downloadedPieces: new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
        blobUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80",
      },
    ],
  },
];

export function toSwarmMetadata(bundle: SampleBundle): SwarmMetadata {
  return {
    id: bundle.id,
    name: bundle.name,
    infoHash: bundle.infoHash,
    magnetUri: bundle.magnetUri,
    totalSize: bundle.totalSize,
    files: bundle.files.map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      type: f.type,
      pieceCount: f.pieceCount,
      pieceSize: f.pieceSize,
    })),
    createdAt: Date.now() - 1800000,
    createdBy: "seeder-node-1",
  };
}
