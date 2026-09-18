import json
from pathlib import Path
from typing import List, Dict, Any

def parse_json_file(file_path: Path) -> List[Dict[str, Any]]:
    """Parse JSON evidence file into flattened records."""
    records = []
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        try:
            content = json.load(f)
        except Exception as e:
            return [{
                "row_index": 1,
                "data": {"error": f"JSON parse failure: {str(e)}"},
                "raw_reference": "Malformed JSON file",
                "original_dict": {}
            }]

    if isinstance(content, list):
        for idx, item in enumerate(content, start=1):
            if isinstance(item, dict):
                cleaned = {str(k).lower().replace(" ", "_"): v for k, v in item.items()}
                records.append({
                    "row_index": idx,
                    "data": cleaned,
                    "raw_reference": f"Item {idx}: " + json.dumps(item)[:200],
                    "original_dict": item
                })
            else:
                records.append({
                    "row_index": idx,
                    "data": {"value": str(item)},
                    "raw_reference": f"Item {idx}: {str(item)}",
                    "original_dict": {"value": item}
                })
    elif isinstance(content, dict):
        for idx, (k, v) in enumerate(content.items(), start=1):
            item_data = {"section": k}
            if isinstance(v, dict):
                item_data.update({str(sub_k).lower().replace(" ", "_"): sub_v for sub_k, sub_v in v.items()})
            elif isinstance(v, list):
                item_data["items"] = v
                item_data["count"] = len(v)
            else:
                item_data["value"] = v

            records.append({
                "row_index": idx,
                "data": item_data,
                "raw_reference": f"Section '{k}': {json.dumps(v)[:200]}",
                "original_dict": {k: v}
            })
    return records
