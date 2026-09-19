import uvicorn
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = "0.0.0.0"
    print("==================================================================")
    print("CYBERTRIAGE AI - Digital Forensics & Cyber Triage Platform")
    print("==================================================================")
    print(f"Serving on: http://{host}:{port}")
    print("Press Ctrl+C to stop.")
    uvicorn.run("backend.main:app", host=host, port=port, reload=False)
