import { describe, it, expect } from 'vitest';
import { createZipArchive } from './zip';

describe('createZipArchive utility', () => {
  it('creates a non-empty Blob representing a ZIP file', () => {
    const files = [
      { name: 'hello.txt', content: 'Hello World!' },
      { name: 'docs/guide.md', content: '# Guide\n\nTesting zip creation.' },
    ];

    const blob = createZipArchive(files);
    expect(blob).toBeDefined();
    expect(blob.type).toBe('application/zip');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('handles empty files array without throwing', () => {
    const blob = createZipArchive([]);
    expect(blob).toBeDefined();
    expect(blob.type).toBe('application/zip');
    // An empty zip file still has the 22-byte End of Central Directory record
    expect(blob.size).toBe(22);
  });
});
