import re
import json
from typing import List, Dict, Any

IP_PATTERN = re.compile(r'\b(?!(?:10|127|172\.(?:1[6-9]|2[0-9]|3[01])|192\.168)\.)(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b')
INTERNAL_IP_PATTERN = re.compile(r'\b(?:10|127|172\.(?:1[6-9]|2[0-9]|3[01])|192\.168)\.(?:[0-9]{1,3}\.){1,2}[0-9]{1,3}\b')
DOMAIN_PATTERN = re.compile(r'\b(?!(?:localhost|local|internal)\b)(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\b')
URL_PATTERN = re.compile(r'https?://[^\s/$.?#].[^\s]*', re.IGNORECASE)
SHA256_PATTERN = re.compile(r'\b[a-fA-F0-9]{64}\b')
MD5_PATTERN = re.compile(r'\b[a-fA-F0-9]{32}\b')

SUSPICIOUS_PROCESS_KEYWORDS = ["powershell", "cmd.exe", "rundll32.exe", "mshta.exe", "vssadmin.exe", "certutil.exe", "whoami.exe", "psexec.exe", "mimikatz"]

def extract_iocs_from_events(events: List[Dict[str, Any]], evidence_filename_map: Dict[str, str]) -> List[Dict[str, Any]]:
    """Extracts potential IOCs and suspicious indicators from normalized events."""
    ioc_map: Dict[str, Dict[str, Any]] = {}

    for evt in events:
        text_blob = f"{evt.get('details', '')} {evt.get('process', '')} {evt.get('file', '')} {evt.get('ip', '')} {evt.get('domain', '')} {evt.get('raw_reference', '')}"
        timestamp = evt.get("timestamp", "")
        ev_id = evt.get("evidence_id", "")
        ev_name = evidence_filename_map.get(ev_id, "Evidence Store")
        case_id = evt.get("case_id", "")

        # 1. External Public IPs
        public_ips = IP_PATTERN.findall(text_blob)
        for ip in set(public_ips):
            key = f"IP:{ip}"
            status = "Potential IOC" if evt.get("is_suspicious") else "Observed"
            confidence = "High" if "203.0.113" in ip or "c2" in text_blob.lower() else "Medium"
            _record_ioc(ioc_map, key, ip, "IP", status, confidence, timestamp, ev_id, ev_name, case_id, f"External network connection observed in {ev_name}", ["Network", "External IP", "T1071"])

        # 2. Internal suspicious IPs
        if evt.get("is_suspicious"):
            internal_ips = INTERNAL_IP_PATTERN.findall(text_blob)
            for ip in set(internal_ips):
                key = f"IP:{ip}"
                _record_ioc(ioc_map, key, ip, "IP", "Needs Investigation", "Medium", timestamp, ev_id, ev_name, case_id, f"Internal host involved in suspicious activity ({evt.get('action')})", ["Internal Pivot", "Host"])

        # 3. Domains
        domains = DOMAIN_PATTERN.findall(text_blob)
        for domain in set(domains):
            if any(domain.endswith(ign) for ign in [".com.local", ".arpa", "microsoft.com", "google.com", "github.com"]):
                continue
            key = f"Domain:{domain}"
            status = "Potential IOC" if ("sync" in domain or "c2" in domain or "exfil" in domain or evt.get("is_suspicious")) else "Observed"
            confidence = "High" if "c2" in domain else "Medium"
            _record_ioc(ioc_map, key, domain, "Domain", status, confidence, timestamp, ev_id, ev_name, case_id, f"Domain query or connection destination", ["DNS", "Domain", "T1071.001"])

        # 4. URLs
        urls = URL_PATTERN.findall(text_blob)
        for url in set(urls):
            key = f"URL:{url}"
            _record_ioc(ioc_map, key, url, "URL", "Suspicious" if evt.get("is_suspicious") else "Observed", "Medium", timestamp, ev_id, ev_name, case_id, "HTTP/HTTPS request URI", ["Web Traffic", "HTTP"])

        # 5. Hashes
        sha256s = SHA256_PATTERN.findall(text_blob)
        for h in set(sha256s):
            key = f"Hash:{h}"
            _record_ioc(ioc_map, key, h, "SHA-256", "Observed", "High", timestamp, ev_id, ev_name, case_id, "Cryptographic hash artifact extracted", ["File Hash", "Forensic Artifact"])

        # 6. Suspicious Processes
        proc_val = evt.get("process", "")
        if proc_val and any(k in proc_val.lower() for k in SUSPICIOUS_PROCESS_KEYWORDS):
            key = f"Process:{proc_val[:120]}"
            status = "Suspicious" if ("-enc" in proc_val.lower() or "mimikatz" in proc_val.lower() or "bypass" in proc_val.lower()) else "Needs Investigation"
            confidence = "High" if status == "Suspicious" else "Medium"
            _record_ioc(ioc_map, key, proc_val[:120], "Process", status, confidence, timestamp, ev_id, ev_name, case_id, f"Process execution with sensitive arguments: {proc_val[:80]}", ["Execution", "CLI", "T1059.001"])

        # 7. Sensitive Files
        file_val = evt.get("file", "")
        if file_val and any(k in file_val.lower() for k in ["confidential", "financial", "payroll", "secret", "password", "backup", "database"]):
            key = f"File:{file_val[:120]}"
            _record_ioc(ioc_map, key, file_val[:120], "File Path", "Needs Investigation", "High", timestamp, ev_id, ev_name, case_id, f"Access or copy of sensitive file: {file_val}", ["Sensitive Asset", "Exfiltration Target", "T1005"])

    return list(ioc_map.values())

def _record_ioc(ioc_map: Dict[str, Any], key: str, indicator: str, ioc_type: str, status: str, confidence: str, timestamp: str, evidence_id: str, evidence_name: str, case_id: str, context: str, tags: List[str]):
    if key not in ioc_map:
        ioc_map[key] = {
            "case_id": case_id,
            "evidence_id": evidence_id,
            "indicator": indicator,
            "type": ioc_type,
            "status": status,
            "confidence": confidence,
            "occurrences": 1,
            "first_seen": timestamp,
            "last_seen": timestamp,
            "source_evidence_name": evidence_name,
            "context": context,
            "tags": json.dumps(tags)
        }
    else:
        entry = ioc_map[key]
        entry["occurrences"] += 1
        if timestamp:
            if not entry["first_seen"] or timestamp < entry["first_seen"]:
                entry["first_seen"] = timestamp
            if not entry["last_seen"] or timestamp > entry["last_seen"]:
                entry["last_seen"] = timestamp
        if status in ["Suspicious", "Potential IOC"] and entry["status"] == "Observed":
            entry["status"] = status
        if confidence == "High":
            entry["confidence"] = "High"
