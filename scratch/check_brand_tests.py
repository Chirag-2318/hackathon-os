import os
import re

FRONTEND_DIR = r"c:\Users\Admin\.antigravity\hackathon-os\frontend"

pattern = re.compile(r'(document\.title|brand-text|brand-glyph)', re.IGNORECASE)

for root, dirs, files in os.walk(FRONTEND_DIR):
    if 'node_modules' in dirs:
        dirs.remove('node_modules')
    if 'dist' in dirs:
        dirs.remove('dist')
    for f in files:
        if f.endswith(('.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx')):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8', errors='ignore') as file:
                for idx, line in enumerate(file, 1):
                    if pattern.search(line):
                        print(f"{os.path.relpath(p, FRONTEND_DIR)}:{idx}: {line.strip()}")
