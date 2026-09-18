import uvicorn
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

if __name__ == "__main__":
    print("==================================================================")
    print("CYBERTRIAGE AI - Digital Forensics & Cyber Triage Platform")
    print("==================================================================")
    print("Serving on: http://127.0.0.1:8000")
    print("Press Ctrl+C to stop.")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=False)
