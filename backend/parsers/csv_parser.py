import csv
from pathlib import Path
from typing import List, Dict, Any

def parse_csv_file(file_path: Path) -> List[Dict[str, Any]]:
    """Parse any CSV evidence file into structured rows with line numbers."""
    records = []
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        sample = f.read(2048)
        f.seek(0)
        try:
            dialect = csv.Sniffer().sniff(sample)
            delimiter = dialect.delimiter
        except Exception:
            delimiter = ","

        reader = csv.DictReader(f, delimiter=delimiter)
        for idx, row in enumerate(reader, start=2):
            cleaned = {}
            for k, v in row.items():
                if k is not None:
                    cleaned[k.strip().lower().replace(" ", "_")] = (v or "").strip()
            
            raw_line = f"Line {idx}: " + ", ".join(f"{k}={v}" for k, v in row.items() if k)
            records.append({
                "row_index": idx,
                "data": cleaned,
                "raw_reference": raw_line,
                "original_dict": row
            })
    return records
