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
    """Generates the full set of realistic synthetic DFIR evidence files."""
    target_dir.mkdir(parents=True, exist_ok=True)
    files = {}

    sec_csv = target_dir / "security_events.csv"
    ensure_writable(sec_csv)
    sec_csv.write_text(
        "timestamp,event_id,event_type,user,device,src_ip,action,status,details\n"
        "2026-09-18T09:10:14Z,SEC-4625,Failed Logon,analyst01,DESKTOP-SEC-09,192.168.1.105,Logon Attempt,Failure,Bad password entered from internal subnet\n"
        "2026-09-18T09:15:22Z,SEC-4624,Successful Logon,analyst01,DESKTOP-SEC-09,192.168.1.105,User Logon,Success,Kerberos authentication accepted for analyst01\n"
        "2026-09-18T09:16:05Z,SEC-4672,Special Privileges Assigned,analyst01,DESKTOP-SEC-09,192.168.1.105,Privilege Escalation,Success,Admin privileges assigned to logon session\n"
        "2026-09-18T09:29:40Z,SEC-4634,Logoff,analyst01,DESKTOP-SEC-09,192.168.1.105,User Logoff,Success,Logon session terminated\n",
        encoding="utf-8"
    )
    files["security_events.csv"] = sec_csv

    proc_csv = target_dir / "process_events.csv"
    ensure_writable(proc_csv)
    proc_csv.write_text(
        "timestamp,event_id,process,pid,parent_pid,parent_process,user,command_line,details\n"
        "2026-09-18T09:16:10Z,PROC-0039,explorer.exe,2104,1012,userinit.exe,analyst01,explorer.exe,Windows shell initialized\n"
        "2026-09-18T09:17:45Z,PROC-0042,powershell.exe,4812,2104,explorer.exe,analyst01,powershell.exe -NoP -NonI -W Hidden -Enc JABjAGwAaQBlAG4AdA...,Obfuscated encoded command spawned from explorer\n"
        "2026-09-18T09:18:12Z,PROC-0045,whoami.exe,5120,4812,powershell.exe,analyst01,whoami.exe /priv,Reconnaissance of user privileges\n"
        "2026-09-18T09:22:30Z,PROC-0050,powershell.exe,4812,2104,explorer.exe,analyst01,powershell.exe Get-ChildItem -Path C:\\Corporate\\Financials,Directory enumeration of confidential data\n"
        "2026-09-18T09:27:15Z,PROC-0058,cmd.exe,6234,4812,powershell.exe,analyst01,cmd.exe /c xcopy /E /Y C:\\Corporate\\Financials E:\\Staging\\,Bulk file staging operation invoked\n",
        encoding="utf-8"
    )
    files["process_events.csv"] = proc_csv

    net_log = target_dir / "network.log"
    ensure_writable(net_log)
    net_log.write_text(
        "2026-09-18T09:15:25Z firewall01 ALLOW tcp 192.168.1.105:49152 -> 192.168.1.10:88 proto=Kerberos bytes=2450\n"
        "2026-09-18T09:18:02Z firewall01 ALLOW udp 192.168.1.105:53210 -> 192.168.1.2:53 proto=DNS query=c2-sync-agent.net\n"
        "2026-09-18T09:20:15Z firewall01 ALERT tcp 192.168.1.105:49321 -> 203.0.113.42:443 proto=TLS action=CONNECT status=SUSPICIOUS_OUTBOUND\n"
        "2026-09-18T09:25:12Z firewall01 ALERT tcp 192.168.1.105:49450 -> 203.0.113.42:443 proto=TLS action=DATA_TRANSFER bytes=15420310 dst_domain=c2-sync-agent.net\n",
        encoding="utf-8"
    )
    files["network.log"] = net_log

    usb_csv = target_dir / "usb_history.csv"
    ensure_writable(usb_csv)
    usb_csv.write_text(
        "timestamp,device_name,vendor,serial_number,drive_letter,user,device_id,action\n"
        "2026-09-18T09:20:04Z,DataTraveler 3.0,Kingston,KNG-8832-DF9,E:,analyst01,USBSTOR\\DiskKingstonDataTraveler_3.0\\1&0,Device Connected / Mounted\n"
        "2026-09-18T09:29:10Z,DataTraveler 3.0,Kingston,KNG-8832-DF9,E:,analyst01,USBSTOR\\DiskKingstonDataTraveler_3.0\\1&0,Device Unmounted / Removed\n",
        encoding="utf-8"
    )
    files["usb_history.csv"] = usb_csv

    file_csv = target_dir / "file_activity.csv"
    ensure_writable(file_csv)
    file_csv.write_text(
        "timestamp,event_id,action,file_path,process,user,file_size_bytes,sha256_hash\n"
        "2026-09-18T09:23:18Z,FILE-0019,File Read,C:\\Corporate\\Financials\\FINANCIAL_Q4_CONFIDENTIAL.xlsx,powershell.exe,analyst01,2419200,e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n"
        "2026-09-18T09:24:02Z,FILE-0020,File Read,C:\\Corporate\\HR\\payroll_records.db,powershell.exe,analyst01,8941000,a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0\n"
        "2026-09-18T09:28:10Z,FILE-0022,File Write,E:\\Staging\\FINANCIAL_Q4_CONFIDENTIAL.xlsx,cmd.exe,analyst01,2419200,e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n"
        "2026-09-18T09:28:35Z,FILE-0023,File Write,E:\\Staging\\payroll_archive.zip,cmd.exe,analyst01,5210900,4a5b6c7d8e9f0123456789abcdef0123456789abcdef0123456789abcdef0123\n",
        encoding="utf-8"
    )
    files["file_activity.csv"] = file_csv

    browser_csv = target_dir / "browser_history.csv"
    ensure_writable(browser_csv)
    browser_csv.write_text(
        "timestamp,browser,url,page_title,user,visit_count,typed_count\n"
        "2026-09-18T09:12:00Z,Google Chrome,https://intranet.corporate.local/login,Corporate Single Sign-On,analyst01,3,1\n"
        "2026-09-18T09:19:30Z,Google Chrome,https://file-temp-share.net/upload,Anonymous Temporary File Upload,analyst01,1,1\n"
        "2026-09-18T09:26:00Z,Google Chrome,https://c2-sync-agent.net/status,Sync Service Gateway,analyst01,2,0\n",
        encoding="utf-8"
    )
    files["browser_history.csv"] = browser_csv

    sys_json = target_dir / "system_info.json"
    ensure_writable(sys_json)
    sys_data = {
        "host_metadata": {
            "hostname": "DESKTOP-SEC-09",
            "os_name": "Microsoft Windows 11 Enterprise",
            "os_version": "10.0.22631",
            "domain": "CORP.LOCAL",
            "timezone": "UTC+00:00",
            "ip_address": "192.168.1.105",
            "mac_address": "00:50:56:C0:00:08",
            "active_user": "analyst01"
        },
        "installed_security_software": [
            {"product": "Windows Defender Antivirus", "status": "Active", "engine_version": "1.1.24010.1"},
            {"product": "Enterprise EDR Agent", "status": "Active", "version": "7.4.2"}
        ],
        "active_network_adapters": [
            {"name": "Ethernet0", "ipv4": "192.168.1.105", "gateway": "192.168.1.1", "dns": ["192.168.1.2"]}
        ]
    }
    sys_json.write_text(json.dumps(sys_data, indent=2), encoding="utf-8")
    files["system_info.json"] = sys_json

    return files
