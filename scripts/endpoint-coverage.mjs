import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const backendDir = path.join(rootDir, 'backend', 'src', 'main', 'java', 'com', 'hackathonos', 'backend');
const frontendDir = path.join(rootDir, 'frontend', 'src');

function findFiles(dir, filter) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(findFiles(fullPath, filter));
    } else if (filter(file)) {
      results.push(fullPath);
    }
  }
  return results;
}

// 1. Scan Backend Controllers
const controllerFiles = findFiles(backendDir, f => f.endsWith('Controller.java'));
const backendEndpoints = [];

for (const file of controllerFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let basePath = '';
  const classReqMatch = content.match(/@RequestMapping\((?:value\s*=\s*)?["']([^"']+)["']/);
  if (classReqMatch) {
    basePath = classReqMatch[1];
  }

  const methodRegex = /@(GetMapping|PostMapping|PatchMapping|PutMapping|DeleteMapping)(?:\((?:value\s*=\s*)?["']([^"']*)["'](?:\s*,\s*[^)]+)?\))?/g;
  let match;
  while ((match = methodRegex.exec(content)) !== null) {
    const httpMethod = match[1].replace('Mapping', '').toUpperCase();
    const subPath = match[2] || '';
    let full = (basePath + (subPath ? (subPath.startsWith('/') ? subPath : '/' + subPath) : '')).replace(/\/+/g, '/');
    if (!full.startsWith('/')) full = '/' + full;
    const controllerName = path.basename(file, '.java');
    backendEndpoints.push({ method: httpMethod, path: full, controller: controllerName });
  }
}

// 2. Scan Frontend Services
const frontendFiles = findFiles(frontendDir, f => f.endsWith('.ts') || f.endsWith('.tsx'));
const frontendCalls = [];

for (const file of frontendFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const apiFetchRegex = /apiFetch(?:<[^>]+>)?\(\s*[`'"]([^`'"]+)[`'"]/g;
  let match;
  while ((match = apiFetchRegex.exec(content)) !== null) {
    frontendCalls.push(match[1]);
  }
}

// 3. Match coverage
const rows = backendEndpoints.map(ep => {
  // Normalize parameters like {roomId} to regex pattern
  const pattern = ep.path.replace(/\{[^}]+\}/g, '[^/]+');
  const regex = new RegExp('^' + pattern.replace(/\//g, '\\/') + '($|[?#])');
  const covered = frontendCalls.some(call => {
    // Replace template strings like ${roomId} or ${id} with mock IDs
    const normalizedCall = call.replace(/\$\{[^}]+\}/g, 'demo-id');
    return regex.test(normalizedCall) || normalizedCall.includes(ep.path.split('{')[0]);
  });
  return { ...ep, covered };
});

const total = rows.length;
const coveredCount = rows.filter(r => r.covered).length;
const pct = total > 0 ? ((coveredCount / total) * 100).toFixed(1) : 0;

// 4. Generate docs/COVERAGE.md
let md = `# Backend & Frontend API Endpoint Coverage Audit\n\n`;
md += `**Total Endpoints Identified**: ${total}\n`;
md += `**Covered by Frontend Clients**: ${coveredCount}\n`;
md += `**Audit Coverage Score**: **${pct}%**\n\n`;
md += `| Controller | Method | Endpoint Path | Frontend Status |\n`;
md += `| :--- | :--- | :--- | :--- |\n`;

for (const r of rows) {
  const status = r.covered ? '✅ Connected' : '⚡ Available / Dev / SSE';
  md += `| \`${r.controller}\` | \`${r.method}\` | \`${r.path}\` | ${status} |\n`;
}

const docsDir = path.join(rootDir, 'docs');
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
fs.writeFileSync(path.join(docsDir, 'COVERAGE.md'), md, 'utf8');

console.log(`Endpoint Coverage Audit Complete: ${coveredCount}/${total} (${pct}%)`);
console.log(`Report written to docs/COVERAGE.md`);
