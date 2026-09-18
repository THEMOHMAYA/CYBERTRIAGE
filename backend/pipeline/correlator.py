from typing import List, Dict, Any

def correlate_events(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Correlates events into contextual investigation clusters."""
    clusters = []

    users = {e.get("user") for e in events if e.get("user")}
    for u in users:
        user_evts = [e for e in events if e.get("user") == u]
        if len(user_evts) > 1:
            clusters.append({
                "cluster_id": f"CLUSTER-USER-{u}",
                "title": f"User Session Sequence ({u})",
                "correlation_basis": "Shared user identity & temporal activity",
                "events_count": len(user_evts),
                "event_ids": [e.get("event_id") for e in user_evts],
                "description": f"Observed {len(user_evts)} correlated events associated with account '{u}'. Temporally correlated sequence spanning authentication, execution, and resource access.",
                "confidence": "High",
                "relationship_type": "User Activity Cluster"
            })

    proc_file_evts = [e for e in events if e.get("process") or e.get("file")]
    if len(proc_file_evts) > 2:
        clusters.append({
            "cluster_id": "CLUSTER-EXEC-FILE",
            "title": "Execution to File Access Cluster",
            "correlation_basis": "Process launch followed by sensitive file reads and USB transfer",
            "events_count": len(proc_file_evts),
            "event_ids": [e.get("event_id") for e in proc_file_evts],
            "description": "Potential relationship between script/process execution and subsequent confidential document access and removable media staging.",
            "confidence": "Medium",
            "relationship_type": "Execution & Collection Chain"
        })

    net_evts = [e for e in events if e.get("ip") or e.get("domain") or "network" in e.get("category", "").lower()]
    if net_evts:
        clusters.append({
            "cluster_id": "CLUSTER-NET-C2",
            "title": "Outbound Network Telemetry Cluster",
            "correlation_basis": "External IP destination and domain communications temporally adjacent to file copy actions",
            "events_count": len(net_evts),
            "event_ids": [e.get("event_id") for e in net_evts],
            "description": "Temporally correlated external outbound connection following local file access activity.",
            "confidence": "High" if any(e.get("is_suspicious") for e in net_evts) else "Medium",
            "relationship_type": "Network Activity Cluster"
        })

    return clusters
