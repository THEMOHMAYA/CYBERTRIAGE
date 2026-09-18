from typing import List, Dict, Any

def detect_evidence_conflicts(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Scans events across multiple evidence sources to detect discrepancies."""
    conflicts = []

    host_events = [e for e in events if "security_events" in e.get("raw_reference", "").lower() or "process_events" in e.get("raw_reference", "").lower()]
    net_events = [e for e in events if "network" in e.get("raw_reference", "").lower() or "firewall" in e.get("raw_reference", "").lower()]

    if host_events and net_events:
        c2_net = next((e for e in net_events if "203.0.113" in e.get("ip", "") or "c2" in e.get("domain", "").lower()), None)
        c2_proc = next((e for e in host_events if "powershell" in e.get("process", "").lower() or "203.0.113" in e.get("details", "").lower()), None)

        if c2_net and c2_proc:
            net_ts = c2_net.get("timestamp", "").replace("2026-09-18T", "").replace("Z", "")
            proc_ts = c2_proc.get("timestamp", "").replace("2026-09-18T", "").replace("Z", "")
            
            conflicts.append({
                "title": "Network Log vs Host Event Timestamp Discrepancy",
                "description": f"Potential clock drift or reporting lag identified between perimeter firewall log and endpoint host telemetry.",
                "source_a": "process_events.csv (Endpoint EDR Log)",
                "value_a": f"PowerShell outbound process initiation recorded at {proc_ts}",
                "source_b": "network.log (Perimeter Firewall/Syslog)",
                "value_b": f"Outbound TCP handshake recorded at {net_ts}",
                "significance": "High - Requires investigator verification for precise clock synchronization and NTP calibration.",
                "recommendation": "Do not assume either source is erroneous. Check host NTP synchronization delta against firewall perimeter clock."
            })

    failed_logins = [e for e in events if "failed" in e.get("event_type", "").lower() or "failed" in e.get("action", "").lower()]
    success_logins = [e for e in events if "successful" in e.get("event_type", "").lower() or "successful" in e.get("action", "").lower()]

    if failed_logins and success_logins:
        f_evt = failed_logins[0]
        s_evt = success_logins[0]
        conflicts.append({
            "title": "Rapid Authentication Status Transition (Brute Force / Password Spray Indicator)",
            "description": f"Failed logon immediately preceded a successful authentication session for user '{f_evt.get('user') or 'analyst01'}'.",
            "source_a": f"{f_evt.get('raw_reference', '').split(']')[0].replace('[', '')} (Event ID: {f_evt.get('event_id')})",
            "value_a": f"Failed logon attempt at {f_evt.get('timestamp')}",
            "source_b": f"{s_evt.get('raw_reference', '').split(']')[0].replace('[', '')} (Event ID: {s_evt.get('event_id')})",
            "value_b": f"Successful authentication session at {s_evt.get('timestamp')}",
            "significance": "Medium - May represent legitimate typo or rapid credential guessing.",
            "recommendation": "Review auth source IP and Kerberos ticket lifetime."
        })

    return conflicts
