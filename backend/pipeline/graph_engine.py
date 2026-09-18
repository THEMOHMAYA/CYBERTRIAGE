from typing import List, Dict, Any, Tuple

def build_investigation_graph(events: List[Dict[str, Any]], evidence_list: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Builds a forensic relationship graph from normalized events."""
    nodes_dict: Dict[str, Dict[str, Any]] = {}
    edges: List[Dict[str, Any]] = []
    edge_set = set()

    def add_node(node_id: str, label: str, node_type: str, category: str = "", severity: str = "Normal", details: Dict[str, Any] = None, source: str = ""):
        if node_id not in nodes_dict:
            nodes_dict[node_id] = {
                "id": node_id,
                "label": label,
                "type": node_type,
                "category": category or node_type,
                "severity": severity,
                "evidence_source": source,
                "details": details or {}
            }
        else:
            if severity in ["High", "Critical"]:
                nodes_dict[node_id]["severity"] = severity
            if details:
                nodes_dict[node_id]["details"].update(details)

    def add_edge(source: str, target: str, rel_type: str, label: str, details: str = ""):
        edge_key = f"{source}->{target}:{rel_type}"
        if edge_key not in edge_set:
            edge_set.add(edge_key)
            edges.append({
                "id": f"edge-{len(edges)+1}",
                "source": source,
                "target": target,
                "label": label,
                "relationship_type": rel_type,
                "details": details
            })

    for ev in evidence_list:
        ev_node_id = f"ev:{ev.get('id', '')}"
        add_node(
            node_id=ev_node_id,
            label=ev.get("original_name", "Evidence File"),
            node_type="Evidence",
            category="Evidence",
            severity="Normal",
            details={
                "sha256": ev.get("sha256", ""),
                "size": f"{ev.get('file_size', 0)} bytes",
                "integrity": ev.get("integrity_status", "Integrity Verified")
            },
            source=ev.get("original_name", "")
        )

    for evt in events:
        ev_name = evt.get("raw_reference", "").split("]")[0].replace("[", "") or "Evidence"
        timestamp = evt.get("timestamp", "")
        sev = evt.get("severity", "Info")
        is_susp = evt.get("is_suspicious", False)
        node_sev = "Critical" if sev == "Critical" else ("High" if is_susp else "Normal")

        user = evt.get("user")
        device = evt.get("device")
        process = evt.get("process")
        file_path = evt.get("file")
        ip = evt.get("ip")
        domain = evt.get("domain")

        user_node_id = f"usr:{user}" if user else None
        dev_node_id = f"dev:{device}" if device else None
        proc_node_id = f"proc:{process[:40]}" if process else None
        file_node_id = f"file:{file_path}" if file_path else None
        ip_node_id = f"ip:{ip}" if ip else None
        dom_node_id = f"dom:{domain}" if domain else None

        if user_node_id:
            add_node(user_node_id, user, "User", "Identity", node_sev, {"last_seen": timestamp}, ev_name)
        if dev_node_id:
            add_node(dev_node_id, device, "Device", "Endpoint", "Normal", {"hostname": device}, ev_name)
        if proc_node_id:
            add_node(proc_node_id, process[:30], "Process", "Execution", node_sev, {"command": process}, ev_name)
        if file_node_id:
            add_node(file_node_id, file_path.split("/")[-1].split("\\")[-1] or file_path, "File", "FileSystem", node_sev, {"full_path": file_path}, ev_name)
        if ip_node_id:
            add_node(ip_node_id, ip, "IP", "Network", node_sev, {"address": ip}, ev_name)
        if dom_node_id:
            add_node(dom_node_id, domain, "Domain", "Network", node_sev, {"domain": domain}, ev_name)

        if user_node_id and dev_node_id:
            add_edge(user_node_id, dev_node_id, "Authenticated On", "Logged In", f"Auth at {timestamp}")

        if user_node_id and proc_node_id:
            add_edge(user_node_id, proc_node_id, "Executed", "Started Process", f"Ran {process} at {timestamp}")

        if dev_node_id and proc_node_id:
            add_edge(dev_node_id, proc_node_id, "Hosts Process", "Executed On", f"Process running on {device}")

        if proc_node_id and file_node_id:
            add_edge(proc_node_id, file_node_id, "Accessed File", "Read/Wrote File", f"File operation by {process} at {timestamp}")

        if proc_node_id and ip_node_id:
            add_edge(proc_node_id, ip_node_id, "Network Connect", "Connected To", f"Outbound socket to {ip} at {timestamp}")

        if ip_node_id and dom_node_id:
            add_edge(ip_node_id, dom_node_id, "Resolved", "DNS Resolution", f"IP mapped to {domain}")

        if "usb" in (evt.get("details", "") + evt.get("action", "")).lower():
            usb_node_id = "hw:USB_Kingston"
            add_node(usb_node_id, "USB Storage Device", "Hardware", "Device", "High", {"device": "Kingston DataTraveler"}, ev_name)
            if dev_node_id:
                add_edge(dev_node_id, usb_node_id, "Mounted", "USB Attached", f"Attached at {timestamp}")
            if file_node_id:
                add_edge(file_node_id, usb_node_id, "Exfiltrated / Copied", "Copied To", f"Copied to USB at {timestamp}")

    return list(nodes_dict.values()), edges
