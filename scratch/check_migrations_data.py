import os
import re

MIGRATIONS_DIR = r"c:\Users\Admin\.antigravity\hackathon-os\backend\src\main\resources\db\migration"

pattern = re.compile(r'hackathon[\s_-]?os', re.IGNORECASE)

for f in sorted(os.listdir(MIGRATIONS_DIR)):
    if f.endswith('.sql'):
        path = os.path.join(MIGRATIONS_DIR, f)
        with open(path, 'r', encoding='utf-8') as file:
            for idx, line in enumerate(file, 1):
                if line.strip().startswith('--'):
                    continue # comment
                if pattern.search(line):
                    print(f"{f}:{idx}: {line.strip()}")
