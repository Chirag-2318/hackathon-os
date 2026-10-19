import json

with open(r"C:\Users\Admin\.gemini\antigravity-ide\brain\893e8671-ebae-4f8d-8218-297c36fc3c93\scratch\remaining.json", 'r', encoding='utf-8') as f:
    remaining = json.load(f)

for r in remaining:
    if r['file'].startswith('frontend'):
        print(f"{r['file']}:{r['line_no']}: {r['line']}")
