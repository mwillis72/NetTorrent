import type { Response } from "express";

/**
 * Encodes a string into ASCII bytes within a Buffer at a given offset.
 */
function writeString(buf: Buffer, offset: number, length: number, str: string): void {
  const enc = Buffer.from(str, "utf8");
  const copyLen = Math.min(enc.length, length);
  enc.copy(buf, offset, 0, copyLen);
  for (let i = copyLen; i < length; i++) {
    buf[offset + i] = 0;
  }
}

/**
 * Writes an octal number representation into a Buffer.
 */
function writeOctal(buf: Buffer, offset: number, length: number, num: number): void {
  let octalStr = Math.floor(num).toString(8);
  while (octalStr.length < length - 1) {
    octalStr = "0" + octalStr;
  }
  const enc = Buffer.from(octalStr, "ascii");
  enc.copy(buf, offset, 0, length - 1);
  buf[offset + length - 1] = 0; // null-terminated
}

/**
 * Creates a standard 512-byte POSIX ustar header buffer for a file entry.
 */
export function createUstarHeader(filePath: string, size: number, mtime: number = Math.floor(Date.now() / 1000)): Buffer {
  const header = Buffer.alloc(512, 0);

  let prefix = "";
  let name = filePath;

  // If path exceeds 100 characters, use ustar prefix field (bytes 345..499)
  if (name.length > 100) {
    const slashIdx = name.lastIndexOf("/", 154);
    if (slashIdx > -1) {
      prefix = name.slice(0, slashIdx);
      name = name.slice(slashIdx + 1);
    }
  }

  // 0-99: File name (100)
  writeString(header, 0, 100, name);

  // 100-107: File mode (8) - standard 0644
  writeOctal(header, 100, 8, 0o644);

  // 108-115: Owner UID (8)
  writeOctal(header, 108, 8, 1000);

  // 116-123: Group GID (8)
  writeOctal(header, 116, 8, 1000);

  // 124-135: File size in octal (12)
  writeOctal(header, 124, 12, size);

  // 136-147: Modification time (12)
  writeOctal(header, 136, 12, mtime);

  // 148-155: Checksum placeholder (8 spaces: ASCII 32)
  for (let i = 148; i < 156; i++) {
    header[i] = 32;
  }

  // 156: Typeflag ('0' for regular file)
  header[156] = 48;

  // 257-262: Magic "ustar\0"
  writeString(header, 257, 6, "ustar\0");

  // 263-264: Version "00"
  writeString(header, 263, 2, "00");

  // 265-296: Owner user name
  writeString(header, 265, 32, "webtor");

  // 297-328: Owner group name
  writeString(header, 297, 32, "webtor");

  // 345-499: Prefix (155)
  if (prefix) {
    writeString(header, 345, 155, prefix);
  }

  // Calculate Checksum: sum of all 512 bytes
  let checksum = 0;
  for (let i = 0; i < 512; i++) {
    checksum += header[i];
  }

  let chkStr = checksum.toString(8);
  while (chkStr.length < 6) {
    chkStr = "0" + chkStr;
  }
  const chkBytes = Buffer.from(chkStr, "ascii");
  chkBytes.copy(header, 148, 0, 6);
  header[154] = 0;
  header[155] = 32;

  return header;
}

/**
 * Calculates exact total bytes for the entire TAR archive stream.
 */
export function calculateTarTotalSize(files: { size: number; path?: string; name: string }[]): number {
  let total = 0;
  for (const f of files) {
    const pad = (512 - (f.size % 512)) % 512;
    total += 512 + f.size + pad;
  }
  total += 1024; // 2 x 512-byte null EOF blocks
  return total;
}

/**
 * Writes data chunk with Node.js stream backpressure handling.
 */
function writeChunkAsync(res: Response, chunk: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    if (res.destroyed || res.writableEnded) {
      return resolve();
    }
    const canContinue = res.write(chunk);
    if (canContinue) {
      resolve();
    } else {
      res.once("drain", resolve);
      res.once("error", reject);
    }
  });
}

/**
 * Streams payload bytes for a file with authentic headers matching its type.
 */
export async function streamFilePayload(
  res: Response,
  file: { name: string; path?: string; size: number; type?: string }
): Promise<void> {
  const lowerName = file.name.toLowerCase();
  const targetSize = file.size;

  // 1. Text / NFO / Readme files
  if (lowerName.endsWith(".txt") || lowerName.endsWith(".nfo") || lowerName.endsWith(".md") || lowerName.endsWith(".sfv")) {
    let textContent = "";
    if (lowerName.includes("readme")) {
      textContent = [
        "Adobe Photoshop 2023 v24.2.0.315 (x64) Multilingual + Crack",
        "Source: TheWindowsForum.com / ThumperDC",
        "",
        "INSTRUCTIONS FOR INSTALLATION:",
        "1. Open Setup/Set-up.exe and proceed with default installation options.",
        "2. Do NOT launch Adobe Photoshop when setup completes.",
        "3. Copy all cracked binaries from the 'Crack' folder (dvaappsupport.dll, Photoshop.exe)",
        "   and replace them in your Adobe Photoshop 2023 installation directory:",
        "   Default: C:\\Program Files\\Adobe\\Adobe Photoshop 2023\\",
        "4. Block outgoing internet access in Windows Firewall.",
        "5. Enjoy your fully unlocked release!",
        "",
        "Verified clean release on TheWindowsForum.com",
      ].join("\r\n");
    } else if (lowerName.includes("thumperdc") || lowerName.includes("thewindowsforum")) {
      textContent = [
        "Official Release from TheWindowsForum.com & ThumperDC",
        "Visit: https://TheWindowsForum.com",
        "Mirror: https://ThumperDC.com",
        "Support forum and updates available online.",
      ].join("\r\n");
    } else {
      textContent = `Release file: ${file.name}\r\nPackage size: ${file.size} bytes\r\nVerified P2P distribution.\r\n`;
    }

    const textBuf = Buffer.from(textContent, "utf8");
    if (textBuf.length >= targetSize) {
      await writeChunkAsync(res, textBuf.subarray(0, targetSize));
      return;
    }

    await writeChunkAsync(res, textBuf);
    let remaining = targetSize - textBuf.length;
    const fillerChunk = Buffer.alloc(Math.min(remaining, 65536), 0x20); // space padding
    while (remaining > 0) {
      const thisWrite = Math.min(remaining, fillerChunk.length);
      await writeChunkAsync(res, fillerChunk.subarray(0, thisWrite));
      remaining -= thisWrite;
    }
    return;
  }

  // 2. JPEG Artwork files (e.g. ThumperDC.jpg)
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
    const head = Buffer.from([
      0xff, 0xd8, // SOI
      0xff, 0xe0, 0x00, 0x10, // APP0 JFIF
      0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00,
    ]);
    const tail = Buffer.from([0xff, 0xd9]); // EOI

    if (targetSize <= head.length + tail.length) {
      await writeChunkAsync(res, Buffer.concat([head, tail]).subarray(0, targetSize));
      return;
    }

    await writeChunkAsync(res, head);
    let remaining = targetSize - (head.length + tail.length);

    // Stream JPEG comment blocks (COM 0xFF 0xFE)
    const comHeader = Buffer.from([0xff, 0xfe]);
    const maxComPayload = 65530;
    const blankPattern = Buffer.alloc(maxComPayload, 0x20);

    while (remaining > 0) {
      if (remaining <= 4) {
        await writeChunkAsync(res, Buffer.alloc(remaining, 0x00));
        remaining = 0;
        break;
      }
      const thisPayloadLen = Math.min(remaining - 4, maxComPayload);
      const lenBuf = Buffer.alloc(2);
      lenBuf.writeUInt16BE(thisPayloadLen + 2, 0);

      await writeChunkAsync(res, comHeader);
      await writeChunkAsync(res, lenBuf);
      await writeChunkAsync(res, blankPattern.subarray(0, thisPayloadLen));
      remaining -= (thisPayloadLen + 4);
    }

    await writeChunkAsync(res, tail);
    return;
  }

  // 3. Executable (.exe) or Dynamic Link Library (.dll)
  if (lowerName.endsWith(".exe") || lowerName.endsWith(".dll")) {
    const peHeader = Buffer.alloc(1024, 0);
    peHeader.write("MZ", 0);
    peHeader.writeUInt32LE(0x80, 0x3c); // e_lfanew -> 0x80
    peHeader.write("PE\0\0", 0x80);
    peHeader.writeUInt16LE(0x8664, 0x84); // AMD64
    peHeader.writeUInt16LE(1, 0x86); // 1 section
    peHeader.writeUInt32LE(Math.floor(Date.now() / 1000), 0x88);
    peHeader.writeUInt16LE(240, 0x94); // SizeOfOptionalHeader
    peHeader.writeUInt16LE(lowerName.endsWith(".dll") ? 0x2022 : 0x0022, 0x96); // DLL or EXE
    peHeader.writeUInt16LE(0x020b, 0x98); // PE32+
    peHeader.writeUInt32LE(0x1000, 0xa8); // EntryPoint
    peHeader.writeBigUInt64LE(0x140000000n, 0xb0); // ImageBase
    peHeader.writeUInt32LE(0x1000, 0xb8); // SectionAlignment
    peHeader.writeUInt32LE(0x200, 0xbc); // FileAlignment
    peHeader.writeUInt16LE(2, 0xdc); // Subsystem: Windows GUI

    peHeader.write(".text\0\0\0", 0x188);
    const secSize = Math.max(0, targetSize - 1024);
    peHeader.writeUInt32LE(secSize, 0x190);
    peHeader.writeUInt32LE(0x1000, 0x194);
    peHeader.writeUInt32LE(secSize, 0x198);
    peHeader.writeUInt32LE(0x400, 0x19c);
    peHeader.writeUInt32LE(0x60000020, 0x1a4);

    if (targetSize <= 1024) {
      await writeChunkAsync(res, peHeader.subarray(0, targetSize));
      return;
    }

    await writeChunkAsync(res, peHeader);
    let remaining = targetSize - 1024;
    const bodyChunk = Buffer.alloc(Math.min(remaining, 65536), 0x90); // NOP sled for code section
    while (remaining > 0) {
      const w = Math.min(remaining, bodyChunk.length);
      await writeChunkAsync(res, bodyChunk.subarray(0, w));
      remaining -= w;
    }
    return;
  }

  // 4. ZIP Archive files (.zip)
  if (lowerName.endsWith(".zip")) {
    const internalFileName = "AdobePhotoshop_SetupPayload.dat";
    const nameBuf = Buffer.from(internalFileName, "utf8");
    const localHeaderSize = 30 + nameBuf.length;
    const centralDirSize = 46 + nameBuf.length;
    const eocdSize = 22;
    const headersTotal = localHeaderSize + centralDirSize + eocdSize;

    if (targetSize < headersTotal) {
      // Very small zip
      const buf = Buffer.alloc(targetSize, 0);
      buf.write("PK\x05\x06", 0);
      await writeChunkAsync(res, buf);
      return;
    }

    const payloadSize = targetSize - headersTotal;

    // Local File Header
    const lfh = Buffer.alloc(localHeaderSize, 0);
    lfh.write("PK\x03\x04", 0);
    lfh.writeUInt16LE(20, 4); // v2.0
    lfh.writeUInt16LE(0, 6);  // flags
    lfh.writeUInt16LE(0, 8);  // store
    lfh.writeUInt16LE(0x4000, 10);
    lfh.writeUInt16LE(0x5622, 12);
    lfh.writeUInt32LE(0x24e98bc7, 14); // crc32
    lfh.writeUInt32LE(payloadSize > 0xffffffff ? 0xffffffff : payloadSize, 18);
    lfh.writeUInt32LE(payloadSize > 0xffffffff ? 0xffffffff : payloadSize, 22);
    lfh.writeUInt16LE(nameBuf.length, 26);
    nameBuf.copy(lfh, 30);

    // Central Directory Header
    const cdh = Buffer.alloc(centralDirSize, 0);
    cdh.write("PK\x01\x02", 0);
    cdh.writeUInt16LE(20, 4);
    cdh.writeUInt16LE(20, 6);
    cdh.writeUInt16LE(0, 8);
    cdh.writeUInt16LE(0, 10);
    cdh.writeUInt16LE(0x4000, 12);
    cdh.writeUInt16LE(0x5622, 14);
    cdh.writeUInt32LE(0x24e98bc7, 16);
    cdh.writeUInt32LE(payloadSize > 0xffffffff ? 0xffffffff : payloadSize, 20);
    cdh.writeUInt32LE(payloadSize > 0xffffffff ? 0xffffffff : payloadSize, 24);
    cdh.writeUInt16LE(nameBuf.length, 28);
    cdh.writeUInt32LE(0, 42); // offset of LFH
    nameBuf.copy(cdh, 46);

    // EOCD
    const eocd = Buffer.alloc(eocdSize, 0);
    eocd.write("PK\x05\x06", 0);
    eocd.writeUInt16LE(1, 8);  // 1 file
    eocd.writeUInt16LE(1, 10); // 1 file
    eocd.writeUInt32LE(centralDirSize, 12);
    const cdhOffset = localHeaderSize + payloadSize;
    eocd.writeUInt32LE(cdhOffset > 0xffffffff ? 0xffffffff : cdhOffset, 16);

    await writeChunkAsync(res, lfh);

    // Stream the payload
    let remaining = payloadSize;
    const chunk = Buffer.alloc(Math.min(remaining, 65536), 0x41); // 'A'
    while (remaining > 0) {
      const w = Math.min(remaining, chunk.length);
      await writeChunkAsync(res, chunk.subarray(0, w));
      remaining -= w;
    }

    await writeChunkAsync(res, cdh);
    await writeChunkAsync(res, eocd);
    return;
  }

  // 5. RAR Archive files (.rar, .r00)
  if (lowerName.endsWith(".rar") || lowerName.endsWith(".r00")) {
    const rarHeader = Buffer.from([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00]); // RAR 5 signature
    if (targetSize <= rarHeader.length) {
      await writeChunkAsync(res, rarHeader.subarray(0, targetSize));
      return;
    }
    await writeChunkAsync(res, rarHeader);
    let remaining = targetSize - rarHeader.length;
    const chunk = Buffer.alloc(Math.min(remaining, 65536), 0x00);
    while (remaining > 0) {
      const w = Math.min(remaining, chunk.length);
      await writeChunkAsync(res, chunk.subarray(0, w));
      remaining -= w;
    }
    return;
  }

  // 6. Generic binary files
  let remaining = targetSize;
  const chunk = Buffer.alloc(Math.min(remaining, 65536), 0x00);
  while (remaining > 0) {
    const w = Math.min(remaining, chunk.length);
    await writeChunkAsync(res, chunk.subarray(0, w));
    remaining -= w;
  }
}

/**
 * Sequentially streams a complete POSIX .tar archive directly to the client Response.
 */
export async function streamTarToResponse(
  res: Response,
  swarmName: string,
  files: { name: string; path?: string; size: number; type?: string }[]
): Promise<void> {
  const totalTarBytes = calculateTarTotalSize(files);
  const safeArchiveName = swarmName.replace(/[^a-zA-Z0-9_\-\.]/g, "_");

  res.setHeader("Content-Type", "application/x-tar");
  res.setHeader("Content-Disposition", `attachment; filename="${safeArchiveName}.tar"`);
  res.setHeader("Content-Length", totalTarBytes.toString());
  res.setHeader("Accept-Ranges", "bytes");

  const now = Math.floor(Date.now() / 1000);

  for (const file of files) {
    if (res.destroyed || res.writableEnded) break;

    const filePath = file.path || file.name;
    const header = createUstarHeader(filePath, file.size, now);
    await writeChunkAsync(res, header);

    // Stream file content
    await streamFilePayload(res, file);

    // Stream padding up to 512-byte block
    const padSize = (512 - (file.size % 512)) % 512;
    if (padSize > 0) {
      await writeChunkAsync(res, Buffer.alloc(padSize, 0));
    }
  }

  // Final 1024 bytes (two 512-byte zero blocks)
  if (!res.destroyed && !res.writableEnded) {
    await writeChunkAsync(res, Buffer.alloc(1024, 0));
    res.end();
  }
}
