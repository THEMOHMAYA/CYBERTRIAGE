# CYBERTRIAGE AI
> **AI-Assisted Digital Forensics & Cyber Triage Platform (SIH1744)**

**CYBERTRIAGE AI** is an enterprise-grade Digital Forensics and Incident Response (DFIR) platform designed for SOC analysts and forensic examiners. It accelerates evidence ingestion, preserves chain of custody with SHA-256 cryptographic verification, extracts and classifies forensic artifacts, correlates events into chronological timelines, constructs interactive entity-relationship graphs, provides retrieval-grounded AI investigations with strict source citations, detects multi-source discrepancies, and generates formal PDF investigation reports.

---

## 🎯 Core End-to-End Workflow

```
EVIDENCE ➔ ACQUIRE ➔ CLASSIFY ➔ EXTRACT ➔ CORRELATE ➔ INVESTIGATE ➔ REPORT
```

1. **Acquire & Preserve**: Files are uploaded to read-only forensic storage with automated SHA-256 and MD5 cryptographic integrity stamping.
2. **Classify & Extract**: Specialized parsers (CSV, JSON, LOG, TXT, PDF) extract artifacts into 9 standard categories (*User Activity, Authentication, Files, Processes, Network, Browser, Devices, System, Security Events*).
3. **IOC Engine**: Discovers potential IOCs (IPs, domains, hashes, encoded PowerShell, sensitive file handles) with confidence scoring.
4. **Timeline & Correlate**: Reconstructs unified UTC chronologies and links multi-source telemetry into investigation clusters.
5. **Investigation Graph**: Interactive node-link graph mapping relationships between Users, Endpoints, Processes, Files, IPs, and Evidence.
6. **AI Investigator**: Retrieval-grounded assistant that answers forensic queries strictly with verified source citations `[Source: file.ext, EvID: ID]`, explicitly flagging uncertainty and contradictory telemetry.
7. **Forensic Report**: Generates court-admissible PDF reports containing evidence inventories, MITRE ATT&CK mappings, and integrity audits.

---

## 🏗️ Architecture & Tech Stack

- **Backend**: Python FastAPI with Asynchronous SQLite Relational Persistence (`SQLAlchemy`)
- **Parsers & Engines**:
  - `backend/parsers/`: Native parsers for CSV, Syslog/Firewall, JSON telemetry, and PDF extraction.
  - `backend/pipeline/`: SHA-256 hasher, normalizer, artifact classifier, IOC engine, timeline engine, correlator, graph generator, and conflict detection engine.
  - `backend/ai_investigator/`: Grounded vector/keyword DFIR retriever with confidence calibration, citation enforcement, and hybrid LLM API adapter (Local / Gemini / OpenAI).
  - `backend/reports/`: Forensic PDF report compiler using ReportLab.
  - `backend/demo_data/`: Multi-source synthetic incident generator.
- **Frontend**: Dark enterprise SOC/DFIR Single-Page Application (HTML5, CSS3, ES6 Modules, Vis.js Network, FontAwesome 6, Chart.js, Google Fonts).

---

## 🚀 Quick Start & Installation

### 1. Requirements
- Python 3.10+
- Installed packages: `fastapi`, `uvicorn`, `sqlalchemy`, `pydantic`, `reportlab`, `python-multipart`

### 2. Install Dependencies
```bash
python -m pip install fastapi uvicorn sqlalchemy pydantic reportlab python-multipart
```

### 3. Run Application
```bash
python run.py
```
Open your browser and navigate to:
```
http://127.0.0.1:8000
```

---

## 🔬 Testing the Demo Investigation Flow

1. Open `http://127.0.0.1:8000`.
2. On the top right of the dashboard, click **`Start Automated Triage`** (or **`Reload Demo Case`**).
3. Watch the live 6-stage triage pipeline run:
   - *Evidence Ingestion & SHA-256 Verification*
   - *Artifact Extraction & Classification*
   - *Potential IOC Extraction*
   - *Timeline Reconstruction*
   - *Cross-Source Correlation & Graph Synthesis*
   - *Grounded AI Investigation & Conflict Detection*
4. Click **`View Investigation Results`** to explore the dashboard metrics, preview widgets, and critical findings.
5. Navigate using the persistent left sidebar:
   - **Evidence Ingestion**: Inspect uploaded files and their immutable SHA-256 hashes.
   - **Evidence Explorer**: View raw log streams with line numbers.
   - **Artifact Explorer**: Filter artifacts by categories (*Authentication, Processes, Network, Devices, etc.*).
   - **IOC / Indicators**: Review threat indicators, confidence scores, and source evidence.
   - **Timeline**: Click any event in the chronological sequence to open the forensic inspector drawer.
   - **Investigation Graph**: Drag and inspect interactive entity nodes (*User &rarr; Host &rarr; Process &rarr; File &rarr; IP &rarr; Evidence*).
   - **AI Investigator**: Click pre-canned prompts (e.g. *"What happened in this incident?"*, *"Which events are related to the USB activity?"*, *"Are there conflicting indicators?"*) to see evidence citations and conflict analysis.
   - **Findings & Conflicts**: Inspect detected MITRE ATT&CK techniques (T1059.001, T1052.001, T1005, T1071.001) and timestamp skew alerts.
   - **Reports**: Click **`Generate & Download PDF Report`** to generate and download the PDF report.
   - **Global Search**: Press `Ctrl+K` from any screen to search across all IPs, usernames, hashes, and event IDs.

---

## 🤖 AI Configuration

The platform operates in **100% offline local mode** by default using the built-in Grounded DFIR Reasoning Engine, ensuring zero external data leakage.

To enable optional external LLM models (e.g., Google Gemini or OpenAI):
1. Navigate to **Settings** in the sidebar.
2. Select your provider (`Google Gemini` or `OpenAI`).
3. Enter your API key.
4. The system will continue enforcing strict retrieval grounding and citation validation.

---

## ⚖️ Forensic Principles Implemented

- **Evidence Immutability**: All ingested files are stored in read-only mode (`0o444`) with immediate SHA-256 hash calculation.
- **Strict Evidence Lineage**: Every artifact, event, IOC, and AI finding maintains explicit back-references to the originating evidence file and line number.
- **Anti-Hallucination Grounding**: If evidence is insufficient, the AI explicitly reports `"Insufficient evidence in the current case data"`.
- **Conflict Transparency**: When evidence sources show clock skew or contradictory data, the system flags `CONFLICT DETECTED` without silently discarding either record.
- **Safe Sandboxing**: No uploaded executable binaries or scripts are executed by the system.
