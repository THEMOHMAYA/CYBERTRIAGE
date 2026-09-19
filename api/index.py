import os
import sys
from pathlib import Path

# Add project root directory to python path
root_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root_dir))

from backend.main import app

# Vercel serverless entrypoint handler
