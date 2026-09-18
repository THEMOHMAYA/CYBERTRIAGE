import re
from pathlib import Path
from typing import List, Dict, Any

LOG_PATTERNS = [
    re.compile(r"^(?P<timestamp>\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\s+(?P<host>[^\s]+)\s+(?P<process>[^\s:]+)?[:\s]+(?P<message>.*)$"),
    re.compile(r"^(?P<timestamp>[A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+(?P<host>[^\s]+)\s+(?P<process>[^:\[]+)(?:\[(?P<pid>\d+)\])?:\s+(?P<message>.*)$"),
    re.compile(r"^(?P<timestamp>\d{2}:\d{2}(?::\d{2})?)\s+(?:\[(?P<level>[^\]]+)\])?\s*(?P<message>.*)$"),
]

def parse_log_file(file_path: Path) -> List[Dict[str, Any]]:
    """Parse text/log evidence files into structured records with extracted fields."""
    records = []
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        for idx, line in enumerate(f, start=1):
            line_str = line.strip()
            if not line_str or line_str.startswith("#"):
                continue

            parsed_data = {}
            matched = False

            for pattern in LOG_PATTERNS:
                m = pattern.match(line_str)
                if m:
                    parsed_data = m.groupdict()
                    matched = True
                    break

            if not matched:
                parsed_data = {"message": line_str, "timestamp": ""}

            kv_pairs = re.findall(r'(\b[a-zA-Z0-9_\-\.]+)=([^\s"]+|"[^"]*")', line_str)
            for k, v in kv_pairs:
                clean_k = k.strip().lower()
                clean_v = v.strip().strip('"')
                parsed_data[clean_k] = clean_v

            ips = re.findall(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', line_str)
            if ips:
                if "src_ip" not in parsed_data and len(ips) >= 1:
                    parsed_data["src_ip"] = ips[0]
                if "dst_ip" not in parsed_data and len(ips) >= 2:
                    parsed_data["dst_ip"] = ips[1]

            records.append({
                "row_index": idx,
                "data": parsed_data,
                "raw_reference": f"Line {idx}: {line_str}",
                "original_dict": parsed_data
            })
    return records
