import re
from pathlib import Path
from typing import List, Dict, Any

def parse_text_file(file_path: Path) -> List[Dict[str, Any]]:
    """Parse TXT or memory string dump files."""
    records = []
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        for idx, line in enumerate(f, start=1):
            line_str = line.strip()
            if not line_str:
                continue
            records.append({
                "row_index": idx,
                "data": {"content": line_str},
                "raw_reference": f"Line {idx}: {line_str[:200]}",
                "original_dict": {"text": line_str}
            })
    return records

def parse_pdf_file(file_path: Path) -> List[Dict[str, Any]]:
    """Parse PDF evidence document extracting page text."""
    records = []
    try:
        import PyPDF2
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page_idx, page in enumerate(reader.pages, start=1):
                text = page.extract_text() or ""
                lines = [l.strip() for l in text.split("\n") if l.strip()]
                for line_idx, line in enumerate(lines, start=1):
                    records.append({
                        "row_index": page_idx * 1000 + line_idx,
                        "data": {
                            "page": page_idx,
                            "content": line
                        },
                        "raw_reference": f"Page {page_idx}, Line {line_idx}: {line[:200]}",
                        "original_dict": {"page": page_idx, "text": line}
                    })
    except Exception as e:
        records.append({
            "row_index": 1,
            "data": {"error": f"PDF parse failure: {str(e)}"},
            "raw_reference": "Unreadable PDF format",
            "original_dict": {}
        })
    return records
