import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
FRONTEND_DIR = ROOT_DIR / "frontend"

# On Vercel serverless environments, only /tmp is writable
if os.environ.get("VERCEL"):
    DATA_DIR = Path("/tmp/cybertriage_data")
else:
    DATA_DIR = BASE_DIR / "data"

EVIDENCE_DIR = DATA_DIR / "evidence"
REPORTS_DIR = DATA_DIR / "reports"
DATABASE_URL = f"sqlite:///{DATA_DIR / 'cybertriage.db'}"

DATA_DIR.mkdir(parents=True, exist_ok=True)
EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
