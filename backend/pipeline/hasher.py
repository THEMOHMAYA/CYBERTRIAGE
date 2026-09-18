import hashlib
import os
import stat
import shutil
from pathlib import Path
from typing import Tuple

def calculate_hashes(file_path: Path) -> Tuple[str, str, int]:
    """Calculate SHA-256 and MD5 hashes, and return file size in bytes."""
    sha256_hash = hashlib.sha256()
    md5_hash = hashlib.md5()
    size = 0

    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            sha256_hash.update(chunk)
            md5_hash.update(chunk)
            size += len(chunk)

    return sha256_hash.hexdigest(), md5_hash.hexdigest(), size

def preserve_evidence_file(source_path: Path, destination_path: Path) -> Tuple[str, str, int]:
    """Copy file to evidence store and mark as read-only, calculating hashes."""
    destination_path.parent.mkdir(parents=True, exist_ok=True)
    if destination_path.exists():
        try:
            os.chmod(destination_path, stat.S_IWRITE | stat.S_IREAD)
        except Exception:
            pass

    if source_path != destination_path:
        shutil.copy2(source_path, destination_path)
    
    sha256_val, md5_val, size = calculate_hashes(destination_path)
    
    try:
        os.chmod(destination_path, 0o444)
    except Exception:
        pass
        
    return sha256_val, md5_val, size
