import zipfile
from pathlib import Path
from backend.demo_data.synthetic_case import generate_synthetic_evidence_files
from backend.config import DATA_DIR

def create_sample_evidence_zip() -> Path:
    """Creates a downloadable ZIP bundle of all sample evidence files."""
    samples_dir = DATA_DIR / "sample_evidence"
    generate_synthetic_evidence_files(samples_dir)
    
    # Add a TXT briefing file as well
    briefing_txt = samples_dir / "00_FORENSIC_INCIDENT_BRIEFING.txt"
    briefing_txt.write_text(
        "CYBERTRIAGE DFIR OFFICIAL INCIDENT BRIEFING\n"
        "======================================================================\n"
        "Case ID: VICTIM-FINTECH-CORP-9482\n"
        "Classification: CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE\n"
        "Incident: Multi-Stage Cyber Attack & Ransomware Deployment (Cobalt Strike)\n"
        "Affected Assets: WS-FIN-091 (192.168.1.105), SRV-PROD-DB01, DC01.CORP.INTRA\n"
        "Compromised Account: analyst01 (CORP\\analyst01)\n"
        "Threat Actor Group: DarkVault Syndicate / APT Simulation\n\n"
        "INCIDENT TIMELINE SUMMARY:\n"
        "1. Web Server Exploitation: SQLMap and web shell uploads via webserver_access.log\n"
        "2. RDP Brute-Force & Initial Access: External IP 198.51.100.24 gained RDP session.\n"
        "3. Privilege Escalation: SeDebugPrivilege and SeImpersonatePrivilege granted.\n"
        "4. Staging & Execution: PowerShell encoded stager downloaded Cobalt Strike reflective DLL.\n"
        "5. Credential Dumping: Mimikatz sekurlsa::logonpasswords extracted credentials.\n"
        "6. Removable USB Staging: SanDisk Ultra Fit (E:) connected for local staging.\n"
        "7. Data Exfiltration: 28.4 MB of PII and financial records transferred to 185.220.101.5.\n"
        "8. Impact & Destruction: VSS Shadow copies wiped, files encrypted with .locked extension,\n"
        "   Security event logs cleared, and threat actor ransom note dropped.\n\n"
        "EVIDENCE INVENTORY:\n"
        "- windows_security_eventlog.csv (Windows Event Log IDs 4624, 4625, 4672, 7045, 1102)\n"
        "- sysmon_process_creation.csv (Sysmon Event ID 1 with parent-child process tree & hashes)\n"
        "- zeek_network_traffic.log (Zeek / Bro network telemetry, DNS lookups, and TLS C2)\n"
        "- auth_sshd_syslog.log (Linux authentication logs with SSH brute-force and sudo dump)\n"
        "- webserver_access.log (Nginx / Apache web server access logs)\n"
        "- usbstor_registry_mount.csv (Windows USBSTOR and volume mount records)\n"
        "- file_exfiltration_staging.csv (File access, staging, and ransomware encryption logs)\n"
        "- threat_actor_ransom_note.txt (Ransom note dropped in affected directories)\n"
        "- edr_host_telemetry.json (CrowdStrike / SentinelOne EDR alerts and host telemetry)\n"
        "======================================================================\n",
        encoding="utf-8"
    )

    zip_path = DATA_DIR / "sample_evidence_pack.zip"
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in samples_dir.glob("*"):
            if f.is_file():
                zf.write(f, arcname=f.name)
                
    return zip_path
