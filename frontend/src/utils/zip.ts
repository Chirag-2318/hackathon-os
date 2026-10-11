/**
 * zip.ts — Minimal zero-dependency ZIP archive writer using the STORE (uncompressed) method.
 * Produces valid .zip files readable by macOS Archive Utility, Windows Explorer, and standard unzip.
 */

// CRC-32 Lookup Table
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c;
}

function calculateCrc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipFileInput {
  name: string;
  content: string | Uint8Array;
}

export function createZipArchive(files: ZipFileInput[]): Blob {
  const encoder = new TextEncoder();
  const fileRecords: {
    nameBytes: Uint8Array;
    dataBytes: Uint8Array;
    crc32: number;
    offset: number;
  }[] = [];

  const chunks: Uint8Array[] = [];
  let currentOffset = 0;

  // DOS Date / Time (Fixed to 2026-10-10 12:00:00 for reproducible archives)
  const dosTime = (12 << 11) | (0 << 5) | 0;
  const dosDate = ((2026 - 1980) << 9) | (10 << 5) | 10;

  // 1. Write Local Headers and File Data
  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = typeof file.content === 'string' ? encoder.encode(file.content) : file.content;
    const crc32 = calculateCrc32(dataBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);

    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 20, true);         // Version needed: 2.0
    view.setUint16(6, 0, true);          // General purpose bit flag
    view.setUint16(8, 0, true);          // Compression method: 0 (Store)
    view.setUint16(10, dosTime, true);   // Last mod time
    view.setUint16(12, dosDate, true);   // Last mod date
    view.setUint32(14, crc32, true);     // CRC-32
    view.setUint32(18, dataBytes.length, true); // Compressed size
    view.setUint32(22, dataBytes.length, true); // Uncompressed size
    view.setUint16(26, nameBytes.length, true); // File name length
    view.setUint16(28, 0, true);         // Extra field length
    localHeader.set(nameBytes, 30);

    chunks.push(localHeader);
    chunks.push(dataBytes);

    fileRecords.push({
      nameBytes,
      dataBytes,
      crc32,
      offset: currentOffset,
    });

    currentOffset += localHeader.length + dataBytes.length;
  }

  // 2. Write Central Directory Headers
  const centralDirStartOffset = currentOffset;
  let centralDirSize = 0;

  for (const record of fileRecords) {
    const cdHeader = new Uint8Array(46 + record.nameBytes.length);
    const view = new DataView(cdHeader.buffer);

    view.setUint32(0, 0x02014b50, true); // Central directory file header signature
    view.setUint16(4, 20, true);         // Version made by: 2.0
    view.setUint16(6, 20, true);         // Version needed to extract: 2.0
    view.setUint16(8, 0, true);          // General purpose bit flag
    view.setUint16(10, 0, true);         // Compression method: 0 (Store)
    view.setUint16(12, dosTime, true);   // Last mod time
    view.setUint16(14, dosDate, true);   // Last mod date
    view.setUint32(16, record.crc32, true); // CRC-32
    view.setUint32(20, record.dataBytes.length, true); // Compressed size
    view.setUint32(24, record.dataBytes.length, true); // Uncompressed size
    view.setUint16(28, record.nameBytes.length, true); // File name length
    view.setUint16(30, 0, true);         // Extra field length
    view.setUint16(32, 0, true);         // File comment length
    view.setUint16(34, 0, true);         // Disk number start
    view.setUint16(36, 0, true);         // Internal file attributes
    view.setUint32(38, 0, true);         // External file attributes
    view.setUint32(42, record.offset, true); // Relative offset of local header
    cdHeader.set(record.nameBytes, 46);

    chunks.push(cdHeader);
    centralDirSize += cdHeader.length;
  }

  // 3. Write End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);

  eocdView.setUint32(0, 0x06054b50, true); // End of central directory signature
  eocdView.setUint16(4, 0, true);          // Number of this disk
  eocdView.setUint16(6, 0, true);          // Disk where central directory starts
  eocdView.setUint16(8, fileRecords.length, true);  // Records on this disk
  eocdView.setUint16(10, fileRecords.length, true); // Total central directory records
  eocdView.setUint32(12, centralDirSize, true);     // Size of central directory
  eocdView.setUint32(16, centralDirStartOffset, true); // Offset of start of central directory
  eocdView.setUint16(20, 0, true);         // ZIP comment length

  chunks.push(eocd);

  return new Blob(chunks as BlobPart[], { type: 'application/zip' });
}

export function downloadZip(files: ZipFileInput[], zipFilename = 'documents.zip') {
  const blob = createZipArchive(files);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
