export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatSpeed(bytesPerSec: number): string {
  if (!bytesPerSec || bytesPerSec === 0) return '0 KB/s';
  return `${formatBytes(bytesPerSec)}/s`;
}

export function formatEta(seconds: number): string {
  if (!seconds || seconds <= 0 || !isFinite(seconds)) return '--:--';
  if (seconds > 3600) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function getFileIconType(filename: string, mimeType: string): 'video' | 'audio' | 'image' | 'code' | 'doc' | 'archive' | 'file' {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (mimeType.startsWith('video/') || ['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv'].includes(ext)) {
    return 'video';
  }
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a'].includes(ext)) {
    return 'audio';
  }
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return 'image';
  }
  if (['ts', 'js', 'tsx', 'jsx', 'json', 'html', 'css', 'py', 'rs', 'go', 'cpp', 'c', 'sh'].includes(ext)) {
    return 'code';
  }
  if (['txt', 'md', 'pdf', 'doc', 'docx', 'srt', 'sub'].includes(ext)) {
    return 'doc';
  }
  if (['tar', 'zip', 'gz', 'bz2', '7z', 'rar'].includes(ext)) {
    return 'archive';
  }
  return 'file';
}
