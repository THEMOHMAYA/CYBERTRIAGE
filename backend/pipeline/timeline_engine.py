from typing import List, Dict, Any

def build_chronological_timeline(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Sort and enrich normalized events into a forensic chronological timeline."""
    def sort_key(evt):
        ts = evt.get("timestamp", "")
        return ts

    sorted_events = sorted(events, key=sort_key)
    
    for idx, evt in enumerate(sorted_events):
        evt["sequence_number"] = idx + 1
        
        evt_type = (evt.get("event_type", "") + " " + evt.get("action", "")).lower()
        if "login" in evt_type or "logon" in evt_type or "auth" in evt_type:
            evt["stage"] = "Initial Access / Authentication"
        elif "powershell" in evt_type or "process" in evt_type or "exec" in evt_type:
            evt["stage"] = "Execution"
        elif "usb" in evt_type or "device" in evt_type:
            evt["stage"] = "Device Connection / Staging"
        elif "file" in evt_type or "read" in evt_type or "access" in evt_type:
            evt["stage"] = "Collection / File Access"
        elif "network" in evt_type or "connection" in evt_type or "c2" in evt_type or "upload" in evt_type or "copy" in evt_type:
            evt["stage"] = "Exfiltration / Command & Control"
        else:
            evt["stage"] = "Activity"

    return sorted_events
