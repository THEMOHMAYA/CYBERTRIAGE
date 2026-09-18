import re
from typing import Dict, Any, Tuple

def classify_artifact(item_name: str, item_value: str, context: Dict[str, Any]) -> str:
    """Classify an artifact into one of the standard forensic categories."""
    name_lower = item_name.lower()
    val_lower = str(item_value).lower()
    ctx_str = " ".join(f"{k}={v}" for k, v in context.items()).lower()
    combined = f"{name_lower} {val_lower} {ctx_str}"

    if any(k in combined for k in ["login", "logon", "auth", "credential", "password", "kerberos", "ntlm", "failed login", "successful login"]):
        return "Authentication"

    if any(k in combined for k in ["process", "powershell", "cmd.exe", "bash", "spawn", "pid", "parent_pid", "command_line", "exec", "tasklist"]):
        return "Processes"

    if any(k in combined for k in ["ip", "domain", "url", "port", "dns", "http", "https", "tcp", "udp", "connection", "firewall", "c2", "beacon", "dst_ip", "src_ip"]):
        return "Network"

    if any(k in combined for k in ["browser", "chrome", "firefox", "edge", "safari", "cookie", "history", "download_url", "visited_url", "tab"]):
        return "Browser"

    if any(k in combined for k in ["usb", "device", "vendor_id", "serial", "mount", "drive", "hardware", "removable", "plug"]):
        return "Devices"

    if any(k in combined for k in ["file", "path", "filename", "directory", "folder", "copy", "deleted", "written", "modified", ".exe", ".pdf", ".xlsx", ".zip", ".dll", ".ps1"]):
        return "Files"

    if any(k in combined for k in ["alert", "threat", "malware", "ransom", "attack", "privilege", "exploit", "indicator", "event_id", "security_event", "audit"]):
        return "Security Events"

    if any(k in combined for k in ["os", "hostname", "uptime", "version", "kernel", "registry", "service", "bios", "memory", "cpu"]):
        return "System"

    if any(k in combined for k in ["user", "username", "account", "session", "click", "keystroke", "analyst"]):
        return "User Activity"

    return "System"
