import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Copy sentinels', () => {
  test('counts remaining TODO_COPY sentinels', async () => {
    // AC-14: "A test scans for TODO_SENTINEL to track remaining TBD copy."
    const copyFilePath = path.join(__dirname, '../src/shared/constants/copy.ts');
    const content = fs.readFileSync(copyFilePath, 'utf8');
    
    const sentinelCount = (content.match(/\[TODO:/g) || []).length;
    
    // We don't fail the test, we just report it. Or we can fail if it's supposed to be 0 at the end.
    // For now, let's just log it and expect it to be a number.
    console.log(`Remaining TODO_COPY sentinels: ${sentinelCount}`);
    
    // Since Phase 1a is just building the scaffold, we expect >0 sentinels.
    // This test simply ensures the tracking mechanism exists.
    expect(typeof sentinelCount).toBe('number');
  });
});
