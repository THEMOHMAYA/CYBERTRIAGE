# CYBERTRIAGE AI 🛡️
> **Enterprise AI-Assisted Digital Forensics & Automated Incident Response (DFIR) Platform**

[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688.svg)](https://fastapi.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Integrity: SHA-256](https://img.shields.io/badge/Integrity-SHA--256%20Chain%20of%20Custody-green.svg)]()
[![Platform: Cloud & On-Prem](https://img.shields.io/badge/Deployment-Docker%20%7C%20Cloud%20%7C%20On--Prem-purple.svg)]()

**CYBERTRIAGE AI** is an advanced, production-grade Digital Forensics and Cyber Triage platform engineered for Tier-3 SOC analysts, incident response teams, and forensic investigators. It automates end-to-end multi-source evidence acquisition, guarantees cryptographic chain of custody with SHA-256 verification, classifies complex artifacts, reconstructs chronological attack timelines, synthesizes interactive entity relationship graphs, and provides zero-hallucination, evidence-grounded AI investigations with court-admissible PDF forensic reports.

---

## 🎯 Core DFIR Lifecycle & Workflow

```
EVIDENCE INGESTION ➔ SHA-256 SEAL ➔ ARTIFACT CLASSIFICATION ➔ IOC EXTRACTION ➔ GRAPH CORRELATION ➔ AI INVESTIGATION ➔ CONTAINMENT & PDF EXPORT
```

1. **Acquire & Preserve**: Ingest security logs, auth dumps, and network PCAPs into read-only WORM (Write-Once Read-Many) storage with immediate SHA-256 cryptographic hashing.
2. **Artifact Engine**: Specialized streaming parsers extract artifacts across 9 standard DFIR categories (*Authentication, Processes, Network, User Activity, Browser History, Devices/USB, System Events, Security Logs, and File Metadata*).
3. **Automated IOC Discovery**: Extracts potential threat indicators (External C2 IPs, malicious domains, hashes, encoded PowerShell strings, sensitive registry keys) with confidence scoring.
4. **Chronological Timeline Reconstruction**: Normalizes heterogeneous timestamps into standardized time-series events with suspicious activity filters.
5. **Interactive Investigation Graph**: Interactive node-link entity visualization mapping relationships between Users, Workstations, Processes, Files, Network Sockets, and Evidence files.
6. **Real-Time Threat Risk Score Speedometer (0-100)**: Dynamic composite risk dial calculated from IOC severity weights, privilege escalation signals, and ransomware staging activity.
7. **Live Incident Containment Playbook**: Interactive action plan generating targeted firewall blocks, Kerberos token revocations, process termination commands, and endpoint isolation procedures.
8. **Grounded AI Investigator**: Retrieval-Augmented Generation (RAG) assistant that answers complex forensic queries strictly with verifiable evidence citations `[Source: file.ext, EvID: ID]`, explicitly detecting telemetry contradictions.
9. **Forensic PDF Generator**: Exports signed, court-admissible forensic investigation reports complete with executive summaries, MITRE ATT&CK technique matrices, and chain of custody logs.

---

## 🏗️ Architecture & Technology Stack

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND PRESENTATION LAYER                     │
│  Dark Glassmorphism UI • SVG Radar Gauge • Force Graph • Vanilla ES6   │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ (REST API / JSON)
┌───────────────────────────────────▼────────────────────────────────────┐
│                       FASTAPI ASGI BACKEND CORE                        │
│  ├── Ingestion & Hash Engine (SHA-256 / MD5 WORM Storage)              │
│  ├── Multi-Format Parsers (CSV, Syslog, JSON, Windows Auth, PDF)       │
│  ├── Correlation & Conflict Engine (Time-Skew & Brute Force Analysis)  │
│  ├── Grounded AI Investigator (Local / Gemini / OpenAI RAG Engine)     │
│  └── PDF Report Compiler (ReportLab Vector Engine)                     │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                      STORAGE & PERSISTENCE LAYER                       │
│  SQLAlchemy Relational ORM (SQLite / PostgreSQL) • Immutable File Store │
└────────────────────────────────────────────────────────────────────────┘
```

- **Backend**: Python 3.10+, FastAPI (Asynchronous ASGI), SQLAlchemy ORM, Pydantic v2.
- **Frontend**: Responsive Single-Page Application (HTML5, Vanilla CSS3, Modern ES6 Modules, SVG Visualizations, FontAwesome 6, JetBrains Mono).
- **Forensic PDF Engine**: Native ReportLab vector PDF generator with cryptographic hash sealing.
- **Security & Integrity**: Pure SHA-256 cryptographic hashing, parameterized SQL execution, zero third-party telemetry leakage.

---

## 🚀 Deployment & Installation

### Prerequisites
- Python 3.10 or higher
- Git

### 1. Clone Repository
```bash
git clone https://github.com/THEMOHMAYA/CYBERTRIAGE.git
cd CYBERTRIAGE
```

### 2. Install Dependencies
```bash
python -m pip install -r requirements.txt
```

### 3. Launch Platform
```bash
python run.py
```
Access the web dashboard in your browser via the configured port.

---

## 🔬 Key Features & Investigation Capabilities

| Feature | Description |
| :--- | :--- |
| **Speedometer Threat Risk Gauge** | Real-time 0 to 100 risk score dial with dynamic needle animations and threat severity classification. |
| **Incident Containment Playbook** | Step-by-step mitigation checklist to isolate compromised endpoints, block C2 IPs, and revoke kerberos tokens. |
| **Cryptographic Evidence Vault** | Immutable evidence preservation with automated SHA-256 and MD5 hash generation. |
| **Evidence Conflict Engine** | Automatically detects clock skews, log discrepancies, and authentication spray anomalies across data sources. |
| **OmniSearch Engine (`Ctrl+K`)** | Instant global search across millions of log records, IP addresses, usernames, and file hashes. |
| **Grounded AI Assistant** | Evidence-grounded DFIR assistant with zero hallucination and strict citation tracking. |
| **Executive & Technical PDF Export** | One-click publication of court-ready forensic reports with MITRE ATT&CK technique mappings. |

---

## ⚖️ Forensic Principles & Legal Admissibility

- **Evidence Immutability**: All ingested files are written with read-only permissions and verified against initial acquisition hashes.
- **Audit Logging**: Every analyst query, triage execution, and report export is timestamped and recorded in the audit trail.
- **Strict Evidence Lineage**: Every finding, IOC, and timeline event is directly traced back to its raw source evidence line number.

---

## 👥 Contributors & Team (Syntax Squad)

<div align="center">
  <table>
    <tr>
      <td align="center" width="25%">
        <a href="https://github.com/THEMOHMAYA">
          <img src="https://github.com/THEMOHMAYA.png?size=100" width="100px;" alt="Ayush Raj"/><br />
          <sub><b>Ayush Raj</b></sub>
        </a><br />
        <sub>Main Developer / Lead</sub>
      </td>
      <td align="center" width="25%">
        <a href="https://github.com/akul17">
          <img src="https://github.com/akul17.png?size=100" width="100px;" alt="Akul"/><br />
          <sub><b>Akul</b></sub>
        </a><br />
        <sub>Contributor</sub>
      </td>
      <td align="center" width="25%">
        <a href="https://github.com/Lakshay-kumar001">
          <img src="https://github.com/Lakshay-kumar001.png?size=100" width="100px;" alt="Lakshay Kumar"/><br />
          <sub><b>Lakshay Kumar</b></sub>
        </a><br />
        <sub>Contributor</sub>
      </td>
      <td align="center" width="25%">
        <a href="https://github.com/partapsinghbhanu69-gif">
          <img src="https://github.com/partapsinghbhanu69-gif.png?size=100" width="100px;" alt="Bhanu Pratap Singh"/><br />
          <sub><b>Bhanu Pratap Singh</b></sub>
        </a><br />
        <sub>Contributor</sub>
      </td>
    </tr>
  </table>
</div>

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Developed with precision by **Syntax Squad** for digital forensic analysts, incident response teams, and cyber defense operations.
