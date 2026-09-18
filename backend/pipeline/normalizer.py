import re
from typing import List, Dict, Any, Tuple
from backend.pipeline.classifier import classify_artifact

def extract_timestamp(data: Dict[str, Any], default_time: str = "2026-09-18T09:00:00Z") -> str:
    """Extract standard ISO or readable timestamp from multiple possible keys."""
    for key in ["timestamp", "time", "event_time", "datetime", "date", "created_at", "occurred_at", "utc_time"]:
        if key in data and data[key]:
            val = str(data[key]).strip()
            if re.match(r"^\d{2}:\d{2}(?::\d{2})?$", val):
                return f"2026-09-18T{val if len(val) == 8 else val + ':00'}Z"
            return val
    return default_time

def normalize_evidence_record(row: Dict[str, Any], evidence_id: str, case_id: str, filename: str) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """Given a parsed row from an evidence file, generate normalized Event & Artifacts."""
    data = row.get("data", {})
    raw_ref = row.get("raw_reference", "")
    idx = row.get("row_index", 1)

    timestamp = extract_timestamp(data)
    
    user = data.get("user") or data.get("username") or data.get("account") or data.get("user_id") or ""
    device = data.get("device") or data.get("hostname") or data.get("computer_name") or data.get("host") or ""
    process = data.get("process") or data.get("process_name") or data.get("image") or data.get("command") or data.get("command_line") or ""
    file_path = data.get("file") or data.get("filename") or data.get("target_file") or data.get("file_path") or data.get("path") or ""
    ip = data.get("ip") or data.get("dst_ip") or data.get("dest_ip") or data.get("src_ip") or data.get("destination_ip") or ""
    domain = data.get("domain") or data.get("host") or data.get("url") or data.get("fqdn") or ""
    
    action = data.get("action") or data.get("event") or data.get("activity") or data.get("event_type") or data.get("message") or "Recorded Event"
    event_type = data.get("event_type") or data.get("type") or action
    
    category = classify_artifact(f"{event_type} {action}", f"{process} {file_path}", data)

    severity = "Info"
    is_suspicious = False
    details_str = " | ".join(f"{k}: {v}" for k, v in data.items() if v and k not in ["row_index"])

    combined_text = f"{event_type} {action} {process} {file_path} {details_str}".lower()
    if any(term in combined_text for term in ["powershell -enc", "encodedcommand", "mimikatz", "c2", "beacon", "malicious", "unauthorized", "exfiltration", "dump", "shadowcopy"]):
        severity = "Critical"
        is_suspicious = True
    elif any(term in combined_text for term in ["failed login", "failed logon", "privilege escalation", "suspicious", "usb", "confidential", "password spray", "drop tcp", "bypass"]):
        severity = "High"
        is_suspicious = True
    elif any(term in combined_text for term in ["powershell", "cmd.exe", "net.exe", "whoami", "external connection", "usb history", "staging"]):
        severity = "Medium"
        is_suspicious = True

    event_id = data.get("event_id") or data.get("id") or f"EVT-{evidence_id[:4]}-{idx:04d}"

    normalized_event = {
        "case_id": case_id,
        "evidence_id": evidence_id,
        "event_id": str(event_id),
        "timestamp": timestamp,
        "event_type": str(event_type)[:100],
        "category": category,
        "user": str(user)[:100],
        "device": str(device)[:100],
        "process": str(process)[:200],
        "file": str(file_path)[:200],
        "ip": str(ip)[:100],
        "domain": str(domain)[:200],
        "action": str(action)[:200],
        "severity": severity,
        "details": details_str[:2000],
        "raw_reference": f"[{filename}] {raw_ref}",
        "is_suspicious": is_suspicious
    }

    extracted_artifacts = []
    for k, v in data.items():
        if not v or k in ["row_index"]:
            continue
        v_str = str(v)
        if len(v_str) > 500:
            v_str = v_str[:500] + "..."
        art_cat = classify_artifact(k, v_str, data)
        extracted_artifacts.append({
            "case_id": case_id,
            "evidence_id": evidence_id,
            "category": art_cat,
            "name": k,
            "value": v_str,
            "source_location": f"Row {idx}",
            "raw_reference": f"[{filename}] Line {idx}: {k}={v_str}",
            "metadata_json": "{}"
        })

    return normalized_event, extracted_artifacts
