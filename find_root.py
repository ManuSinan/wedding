import re

files = ["assets/index-DV-1WFZA.js", "assets/Experience-QKEGsRXt.js"]

for fpath in files:
    print(f"=== Searching in {fpath} ===")
    with open(fpath, "r", encoding="utf-8") as f:
        code = f.read()
    
    # 1. Search for "createRoot" or "getElementById"
    for word in ["createRoot", "getElementById", "root"]:
        matches = list(re.finditer(re.escape(word), code))
        print(f"Found {len(matches)} occurrences of '{word}'")
        for m in matches[:3]:
            context = code[max(0, m.start() - 100): min(len(code), m.end() + 200)]
            print(f" - at {m.start()}:\n{context}\n")
