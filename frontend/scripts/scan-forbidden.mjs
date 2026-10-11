import fs from 'fs';
import path from 'path';

const FORBIDDEN_STRINGS = [
  "Aarav", "Mehta", "Ishita", "Kabir", "Sanjay", "Priya", "Dev Patel",
  "Campus Build Sprint", "hackathon-os/mess-meter",
  "Hour 39", "9h 05m"
];

const FORBIDDEN_REGEXES = [
  /\bIST\b/,
  /\b(r-1|r-2)\b/,
  /\btpl-/,
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  /(['"`])room-[0-9]+\1/
];

function scanDir(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist') {
        scanDir(fullPath, results);
      }
    } else if (/\.(tsx?|jsx?|html|json)$/.test(entry.name)) {
      if (!entry.name.includes('.test.') && !entry.name.includes('.spec.')) {
        const text = fs.readFileSync(fullPath, 'utf8');
        for (const f of FORBIDDEN_STRINGS) {
          if (text.includes(f)) {
            results.push({ file: fullPath, pattern: f });
          }
        }
        for (const r of FORBIDDEN_REGEXES) {
          // Exclude clock.ts timezone dictionary
          if (!fullPath.endsWith('clock.ts') && r.test(text)) {
            results.push({ file: fullPath, pattern: r.toString() });
          }
        }
      }
    }
  }
  return results;
}

const hits = scanDir('src');
console.log('Total hits:', hits.length);
if (hits.length > 0) {
  const byFile = {};
  for (const h of hits) {
    const rel = path.relative('.', h.file);
    byFile[rel] = byFile[rel] || [];
    byFile[rel].push(h.pattern);
  }
  console.log(JSON.stringify(byFile, null, 2));
  process.exit(1);
} else {
  console.log('Zero forbidden static strings detected across frontend src.');
  process.exit(0);
}
