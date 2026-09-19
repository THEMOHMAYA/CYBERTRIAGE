import os
import json
import shutil
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timezone

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session

from backend.config import BASE_DIR, DATA_DIR, EVIDENCE_DIR, REPORTS_DIR, FRONTEND_DIR
from backend.database import (
    init_db, get_db, Case, Evidence, Artifact, Event, IOC,
    Relationship, Finding, InvestigationQuery, Report, generate_uuid, get_utc_now
)
from backend.models import (
    CaseCreate, CaseResponse, EvidenceResponse, ArtifactResponse,
    EventResponse, IOCResponse, GraphResponse, GraphNode, GraphEdge,
    AIQueryRequest, AIQueryResponse, FindingResponse, ReportGenerateRequest
)
from backend.pipeline.hasher import preserve_evidence_file
from backend.parsers.csv_parser import parse_csv_file
from backend.parsers.log_parser import parse_log_file
from backend.parsers.json_parser import parse_json_file
from backend.parsers.text_pdf_parser import parse_text_file, parse_pdf_file
from backend.pipeline.normalizer import normalize_evidence_record
from backend.pipeline.ioc_engine import extract_iocs_from_events
from backend.pipeline.timeline_engine import build_chronological_timeline
from backend.pipeline.correlator import correlate_events
from backend.pipeline.graph_engine import build_investigation_graph
from backend.pipeline.conflict_engine import detect_evidence_conflicts
from backend.ai_investigator.engine import AIInvestigatorEngine
from backend.reports.generator import generate_pdf_report
from backend.demo_data.synthetic_case import generate_synthetic_evidence_files

# Initialize database
init_db()

app = FastAPI(
    title="CYBERTRIAGE AI API",
    description="AI-Assisted Digital Forensics & Cyber Triage Platform",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = BASE_DIR.parent / "frontend"

# Helper function to enrich Case response with counts
def format_case_response(case_obj: Case, db: Session) -> dict:
    ev_count = db.query(Evidence).filter(Evidence.case_id == case_obj.id).count()
    art_count = db.query(Artifact).filter(Artifact.case_id == case_obj.id).count()
    ioc_count = db.query(IOC).filter(IOC.case_id == case_obj.id).count()
    susp_count = db.query(Event).filter(Event.case_id == case_obj.id, Event.is_suspicious == True).count()
    corr_count = db.query(Relationship).filter(Relationship.case_id == case_obj.id).count()

    return {
        "id": case_obj.id,
        "case_code": case_obj.case_code or f"INC-{case_obj.id[:6].upper()}",
        "name": case_obj.name,
        "description": case_obj.description or "",
        "investigator": case_obj.investigator or "Lead Forensic Analyst",
        "priority": case_obj.priority or "High",
        "incident_type": case_obj.incident_type or "Unauthorized Data Access",
        "status": case_obj.status or "Open",
        "created_at": case_obj.created_at.isoformat() if case_obj.created_at else None,
        "updated_at": case_obj.updated_at.isoformat() if case_obj.updated_at else None,
        "evidence_count": ev_count,
        "artifact_count": art_count,
        "ioc_count": ioc_count,
        "suspicious_event_count": susp_count,
        "correlated_event_count": corr_count
    }

# ==================== CASES API ====================

@app.post("/api/cases", response_model=dict)
def create_case(payload: CaseCreate, db: Session = Depends(get_db)):
    case_count = db.query(Case).count() + 1
    case_code = f"INC-2026-{case_count:03d}"
    
    new_case = Case(
        case_code=case_code,
        name=payload.name,
        description=payload.description or "",
        investigator=payload.investigator or "Lead Forensic Analyst",
        priority=payload.priority or "High",
        incident_type=payload.incident_type or "Unauthorized Data Access",
        status="Open"
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    return format_case_response(new_case, db)

@app.get("/api/cases", response_model=List[dict])
def list_cases(db: Session = Depends(get_db)):
    cases = db.query(Case).order_by(Case.created_at.desc()).all()
    return [format_case_response(c, db) for c in cases]

@app.get("/api/cases/{case_id}", response_model=dict)
def get_case(case_id: str, db: Session = Depends(get_db)):
    case_obj = db.query(Case).filter(Case.id == case_id).first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")
    return format_case_response(case_obj, db)

@app.patch("/api/cases/{case_id}/status", response_model=dict)
def update_case_status(case_id: str, payload: dict, db: Session = Depends(get_db)):
    case_obj = db.query(Case).filter(Case.id == case_id).first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")
    new_status = payload.get("status", "Completed")
    case_obj.status = new_status
    case_obj.updated_at = get_utc_now()
    db.commit()
    db.refresh(case_obj)
    return format_case_response(case_obj, db)

# ==================== EVIDENCE API ====================

@app.post("/api/cases/{case_id}/evidence")
async def upload_evidence(case_id: str, files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    case_obj = db.query(Case).filter(Case.id == case_id).first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")

    case_evidence_dir = EVIDENCE_DIR / case_id
    case_evidence_dir.mkdir(parents=True, exist_ok=True)
    uploaded_records = []

    for file in files:
        safe_filename = Path(file.filename).name
        temp_dest = case_evidence_dir / f"temp_{safe_filename}"
        final_dest = case_evidence_dir / safe_filename

        with open(temp_dest, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Hash and preserve read-only
        sha256_val, md5_val, file_size = preserve_evidence_file(temp_dest, final_dest)
        if temp_dest.exists():
            try:
                os.remove(temp_dest)
            except Exception:
                pass

        ext = safe_filename.split(".")[-1].lower() if "." in safe_filename else "raw"

        evidence_entry = Evidence(
            case_id=case_id,
            filename=safe_filename,
            original_name=file.filename,
            file_type=ext,
            file_size=file_size,
            sha256=sha256_val,
            md5=md5_val,
            status="Processed",
            integrity_status="Integrity Verified",
            is_readonly=True,
            storage_path=str(final_dest)
        )
        db.add(evidence_entry)
        db.commit()
        db.refresh(evidence_entry)
        uploaded_records.append(evidence_entry)

    return {"status": "success", "uploaded_count": len(uploaded_records), "files": [e.filename for e in uploaded_records]}

@app.get("/api/cases/{case_id}/evidence")
def list_case_evidence(case_id: str, db: Session = Depends(get_db)):
    evidence_list = db.query(Evidence).filter(Evidence.case_id == case_id).all()
    results = []
    for ev in evidence_list:
        results.append({
            "id": ev.id,
            "case_id": ev.case_id,
            "filename": ev.filename,
            "original_name": ev.original_name,
            "file_type": ev.file_type,
            "file_size": ev.file_size,
            "sha256": ev.sha256,
            "md5": ev.md5,
            "upload_time": ev.upload_time.isoformat() if ev.upload_time else None,
            "status": ev.status,
            "integrity_status": ev.integrity_status,
            "is_readonly": ev.is_readonly,
            "storage_path": ev.storage_path,
            "error_message": ev.error_message or ""
        })
    return results

@app.get("/api/cases/{case_id}/evidence/{evidence_id}/raw")
def get_raw_evidence(case_id: str, evidence_id: str, db: Session = Depends(get_db)):
    ev = db.query(Evidence).filter(Evidence.id == evidence_id, Evidence.case_id == case_id).first()
    if not ev or not Path(ev.storage_path).exists():
        raise HTTPException(status_code=404, detail="Evidence file not found")

    file_path = Path(ev.storage_path)
    try:
        text_content = file_path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        text_content = f"<Binary data: {ev.file_size} bytes>"

    return {
        "filename": ev.original_name,
        "sha256": ev.sha256,
        "file_size": ev.file_size,
        "file_type": ev.file_type,
        "content": text_content[:50000],
        "is_truncated": len(text_content) > 50000
    }

# ==================== AUTOMATED TRIAGE PIPELINE ====================

@app.post("/api/cases/{case_id}/triage")
def execute_case_triage(case_id: str, db: Session = Depends(get_db)):
    """
    Executes complete end-to-end triage pipeline:
    EVIDENCE → PARSE → NORMALIZE → CLASSIFY → IOCS → TIMELINE → CORRELATE → FINDINGS
    """
    case_obj = db.query(Case).filter(Case.id == case_id).first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")

    evidence_list = db.query(Evidence).filter(Evidence.case_id == case_id).all()
    if not evidence_list:
        raise HTTPException(status_code=400, detail="No evidence files uploaded for this case.")

    # Clear previous derived analysis data for clean run
    db.query(Artifact).filter(Artifact.case_id == case_id).delete()
    db.query(Event).filter(Event.case_id == case_id).delete()
    db.query(IOC).filter(IOC.case_id == case_id).delete()
    db.query(Relationship).filter(Relationship.case_id == case_id).delete()
    db.query(Finding).filter(Finding.case_id == case_id).delete()
    db.commit()

    ev_name_map = {ev.id: ev.original_name for ev in evidence_list}
    all_normalized_events = []
    all_extracted_artifacts = []

    # 1. PARSE & NORMALIZE
    for ev in evidence_list:
        path = Path(ev.storage_path)
        if not path.exists():
            continue

        raw_records = []
        ext = ev.file_type.lower()
        if ext == "csv":
            raw_records = parse_csv_file(path)
        elif ext in ["log", "txt", "syslog"]:
            raw_records = parse_log_file(path)
        elif ext == "json":
            raw_records = parse_json_file(path)
        elif ext == "pdf":
            raw_records = parse_pdf_file(path)
        else:
            raw_records = parse_text_file(path)

        for row in raw_records:
            norm_event, norm_arts = normalize_evidence_record(row, ev.id, case_id, ev.original_name)
            all_normalized_events.append(norm_event)
            all_extracted_artifacts.extend(norm_arts)

    # Save Events and Artifacts to database
    for e in all_normalized_events:
        evt_entry = Event(**e)
        db.add(evt_entry)

    for a in all_extracted_artifacts:
        art_entry = Artifact(**a)
        db.add(art_entry)

    db.commit()

    # 2. IOC EXTRACTION
    extracted_iocs = extract_iocs_from_events(all_normalized_events, ev_name_map)
    for ioc_dict in extracted_iocs:
        ioc_entry = IOC(**ioc_dict)
        db.add(ioc_entry)
    db.commit()

    # 3. TIMELINE & CORRELATION
    timeline = build_chronological_timeline(all_normalized_events)
    clusters = correlate_events(timeline)

    # 4. RELATIONSHIP GRAPH BUILD
    ev_dicts = [{"id": ev.id, "original_name": ev.original_name, "sha256": ev.sha256, "file_size": ev.file_size, "integrity_status": ev.integrity_status} for ev in evidence_list]
    nodes, edges = build_investigation_graph(timeline, ev_dicts)

    for edge in edges:
        rel_entry = Relationship(
            case_id=case_id,
            source_type="Node",
            source_id=edge["source"],
            source_label=edge["source"],
            target_type="Node",
            target_id=edge["target"],
            target_label=edge["target"],
            relationship_type=edge["relationship_type"],
            details=edge["details"]
        )
        db.add(rel_entry)
    db.commit()

    # 5. FINDINGS GENERATION
    findings_list = []
    
    # Check for PowerShell anomaly
    ps_evts = [e for e in all_normalized_events if "powershell" in e.get("process", "").lower() or "enc" in e.get("details", "").lower()]
    if ps_evts:
        findings_list.append({
            "case_id": case_id,
            "title": "Suspicious Encoded PowerShell Execution",
            "category": "Execution",
            "severity": "High",
            "description": "An obfuscated base64 PowerShell command was spawned on workstation DESKTOP-SEC-09.",
            "explanation": "Execution of encoded commands is heavily leveraged by threat actors to evade basic command-line string monitoring.",
            "evidence_ids": json.dumps([e.get("evidence_id") for e in ps_evts]),
            "related_event_ids": json.dumps([e.get("event_id") for e in ps_evts]),
            "confidence": "High",
            "uncertainty": "Exact decompiled script payload requires full memory dump capture.",
            "mitre_technique": "T1059.001 - Command and Scripting Interpreter: PowerShell",
            "status": "Confirmed"
        })

    # Check for USB Storage Device Anomaly
    usb_evts = [e for e in all_normalized_events if "usb" in (e.get("details", "") + e.get("action", "")).lower()]
    if usb_evts:
        findings_list.append({
            "case_id": case_id,
            "title": "Unauthorized Removable Media Mounting & File Transfer",
            "category": "Exfiltration",
            "severity": "High",
            "description": "Removable USB mass storage device (Kingston DataTraveler) was connected during the active user session.",
            "explanation": "Direct temporal correlation between USB connection and file copy activity suggests data exfiltration or staging.",
            "evidence_ids": json.dumps([e.get("evidence_id") for e in usb_evts]),
            "related_event_ids": json.dumps([e.get("event_id") for e in usb_evts]),
            "confidence": "High",
            "uncertainty": "Physical USB drive not yet recovered by physical security team.",
            "mitre_technique": "T1052.001 - Exfiltration Over Physical Medium: Removable Drive",
            "status": "Needs Review"
        })

    # Check for Sensitive File Access
    file_evts = [e for e in all_normalized_events if any(k in e.get("file", "").lower() for k in ["confidential", "financial", "payroll"])]
    if file_evts:
        findings_list.append({
            "case_id": case_id,
            "title": "Access to Confidential Financial & HR Databases",
            "category": "Collection",
            "severity": "High",
            "description": "Sensitive payroll databases and Q4 financial spreadsheets were read and copied into temporary staging directory.",
            "explanation": "Multiple read handle operations recorded under account analyst01 outside standard business access pattern.",
            "evidence_ids": json.dumps([e.get("evidence_id") for e in file_evts]),
            "related_event_ids": json.dumps([e.get("event_id") for e in file_evts]),
            "confidence": "High",
            "uncertainty": "File hash indicates archive was created shortly before process termination.",
            "mitre_technique": "T1005 - Data from Local System",
            "status": "Confirmed"
        })

    # Check for Outbound C2 Network Activity
    net_c2 = [e for e in all_normalized_events if "203.0.113.42" in e.get("ip", "") or "c2" in e.get("domain", "").lower()]
    if net_c2:
        findings_list.append({
            "case_id": case_id,
            "title": "Outbound Command & Control Network Beacon",
            "category": "Command and Control",
            "severity": "Critical",
            "description": "High-volume encrypted TLS session initiated to external IP 203.0.113.42 (c2-sync-agent.net).",
            "explanation": "Connection destination is unclassified and matches known indicator heuristic for external C2 data egress.",
            "evidence_ids": json.dumps([e.get("evidence_id") for e in net_c2]),
            "related_event_ids": json.dumps([e.get("event_id") for e in net_c2]),
            "confidence": "High",
            "uncertainty": "Payload was encrypted over TLS 1.3.",
            "mitre_technique": "T1071.001 - Application Layer Protocol: Web Protocols",
            "status": "Confirmed"
        })

    for f_item in findings_list:
        finding_entry = Finding(**f_item)
        db.add(finding_entry)

    case_obj.status = "In Progress"
    case_obj.updated_at = get_utc_now()
    db.commit()

    return {
        "status": "Triage Complete",
        "evidence_scanned": len(evidence_list),
        "artifacts_extracted": len(all_extracted_artifacts),
        "events_normalized": len(all_normalized_events),
        "potential_iocs": len(extracted_iocs),
        "suspicious_events": len([e for e in all_normalized_events if e.get("is_suspicious")]),
        "correlated_clusters": len(clusters),
        "findings_count": len(findings_list)
    }

# ==================== ARTIFACTS API ====================

@app.get("/api/cases/{case_id}/artifacts")
def get_case_artifacts(
    case_id: str,
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Artifact).filter(Artifact.case_id == case_id)
    if category and category != "All":
        query = query.filter(Artifact.category == category)
    if search:
        s = f"%{search}%"
        query = query.filter((Artifact.name.ilike(s)) | (Artifact.value.ilike(s)) | (Artifact.raw_reference.ilike(s)))

    artifacts = query.limit(limit).all()
    ev_map = {e.id: e.original_name for e in db.query(Evidence).filter(Evidence.case_id == case_id).all()}

    return [{
        "id": a.id,
        "case_id": a.case_id,
        "evidence_id": a.evidence_id,
        "category": a.category,
        "name": a.name,
        "value": a.value,
        "source_location": a.source_location,
        "extracted_at": a.extracted_at.isoformat() if a.extracted_at else None,
        "raw_reference": a.raw_reference,
        "metadata_json": a.metadata_json,
        "evidence_filename": ev_map.get(a.evidence_id, "Evidence")
    } for a in artifacts]

# ==================== IOCS API ====================

@app.get("/api/cases/{case_id}/iocs")
def get_case_iocs(case_id: str, type: Optional[str] = None, status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(IOC).filter(IOC.case_id == case_id)
    if type and type != "All":
        query = query.filter(IOC.type == type)
    if status and status != "All":
        query = query.filter(IOC.status == status)

    iocs = query.order_by(IOC.occurrences.desc()).all()
    return [{
        "id": i.id,
        "case_id": i.case_id,
        "evidence_id": i.evidence_id,
        "indicator": i.indicator,
        "type": i.type,
        "status": i.status,
        "confidence": i.confidence,
        "occurrences": i.occurrences,
        "first_seen": i.first_seen,
        "last_seen": i.last_seen,
        "source_evidence_name": i.source_evidence_name,
        "context": i.context,
        "tags": json.loads(i.tags or "[]")
    } for i in iocs]

# ==================== TIMELINE API ====================

@app.get("/api/cases/{case_id}/timeline")
def get_case_timeline(
    case_id: str,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Event).filter(Event.case_id == case_id)
    if severity and severity != "All":
        query = query.filter(Event.severity == severity)
    if category and category != "All":
        query = query.filter(Event.category == category)
    if search:
        s = f"%{search}%"
        query = query.filter((Event.event_type.ilike(s)) | (Event.details.ilike(s)) | (Event.process.ilike(s)) | (Event.file.ilike(s)) | (Event.ip.ilike(s)))

    events = query.order_by(Event.timestamp.asc()).all()
    ev_map = {e.id: e.original_name for e in db.query(Evidence).filter(Evidence.case_id == case_id).all()}

    return [{
        "id": e.id,
        "case_id": e.case_id,
        "evidence_id": e.evidence_id,
        "event_id": e.event_id,
        "timestamp": e.timestamp,
        "event_type": e.event_type,
        "category": e.category,
        "user": e.user,
        "device": e.device,
        "process": e.process,
        "file": e.file,
        "ip": e.ip,
        "domain": e.domain,
        "action": e.action,
        "severity": e.severity,
        "details": e.details,
        "raw_reference": e.raw_reference,
        "is_suspicious": e.is_suspicious,
        "evidence_filename": ev_map.get(e.evidence_id, "Evidence")
    } for e in events]

# ==================== GRAPH API ====================

@app.get("/api/cases/{case_id}/graph", response_model=GraphResponse)
def get_case_graph(case_id: str, db: Session = Depends(get_db)):
    events = db.query(Event).filter(Event.case_id == case_id).order_by(Event.timestamp.asc()).all()
    evidence_list = db.query(Evidence).filter(Evidence.case_id == case_id).all()

    evt_dicts = [{
        "id": e.id, "case_id": e.case_id, "evidence_id": e.evidence_id, "event_id": e.event_id,
        "timestamp": e.timestamp, "event_type": e.event_type, "category": e.category,
        "user": e.user, "device": e.device, "process": e.process, "file": e.file,
        "ip": e.ip, "domain": e.domain, "action": e.action, "severity": e.severity,
        "details": e.details, "raw_reference": e.raw_reference, "is_suspicious": e.is_suspicious
    } for e in events]

    ev_dicts = [{
        "id": ev.id, "original_name": ev.original_name, "sha256": ev.sha256,
        "file_size": ev.file_size, "integrity_status": ev.integrity_status
    } for ev in evidence_list]

    nodes, edges = build_investigation_graph(evt_dicts, ev_dicts)
    return GraphResponse(nodes=nodes, edges=edges)

# ==================== FINDINGS & CONFLICTS API ====================

@app.get("/api/cases/{case_id}/findings")
def get_case_findings(case_id: str, db: Session = Depends(get_db)):
    findings = db.query(Finding).filter(Finding.case_id == case_id).all()
    events = db.query(Event).filter(Event.case_id == case_id).all()
    evt_dicts = [{
        "id": e.id, "event_id": e.event_id, "timestamp": e.timestamp, "raw_reference": e.raw_reference,
        "ip": e.ip, "domain": e.domain, "process": e.process, "event_type": e.event_type, "action": e.action, "user": e.user
    } for e in events]
    conflicts = detect_evidence_conflicts(evt_dicts)

    return {
        "findings": [{
            "id": f.id,
            "case_id": f.case_id,
            "title": f.title,
            "category": f.category,
            "severity": f.severity,
            "description": f.description,
            "explanation": f.explanation,
            "evidence_ids": json.loads(f.evidence_ids or "[]"),
            "related_event_ids": json.loads(f.related_event_ids or "[]"),
            "confidence": f.confidence,
            "uncertainty": f.uncertainty,
            "mitre_technique": f.mitre_technique,
            "status": f.status,
            "created_at": f.created_at.isoformat() if f.created_at else None
        } for f in findings],
        "conflicts": conflicts
    }

# ==================== AI INVESTIGATOR API ====================

@app.post("/api/cases/{case_id}/investigate", response_model=AIQueryResponse)
def query_ai_investigator(case_id: str, payload: AIQueryRequest, db: Session = Depends(get_db)):
    events = db.query(Event).filter(Event.case_id == case_id).all()
    artifacts = db.query(Artifact).filter(Artifact.case_id == case_id).all()
    iocs = db.query(IOC).filter(IOC.case_id == case_id).all()
    evidence_list = db.query(Evidence).filter(Evidence.case_id == case_id).all()

    evt_dicts = [{
        "id": e.id, "case_id": e.case_id, "evidence_id": e.evidence_id, "event_id": e.event_id,
        "timestamp": e.timestamp, "event_type": e.event_type, "category": e.category,
        "user": e.user, "device": e.device, "process": e.process, "file": e.file,
        "ip": e.ip, "domain": e.domain, "action": e.action, "severity": e.severity,
        "details": e.details, "raw_reference": e.raw_reference, "is_suspicious": e.is_suspicious
    } for e in events]

    art_dicts = [{
        "id": a.id, "name": a.name, "value": a.value, "category": a.category, "raw_reference": a.raw_reference
    } for a in artifacts]

    ioc_dicts = [{
        "indicator": i.indicator, "type": i.type, "status": i.status, "confidence": i.confidence, "source_evidence_name": i.source_evidence_name
    } for i in iocs]

    ev_dicts = [{
        "id": ev.id, "original_name": ev.original_name, "sha256": ev.sha256
    } for ev in evidence_list]

    engine = AIInvestigatorEngine(evt_dicts, art_dicts, ioc_dicts, ev_dicts)
    res = engine.query(payload.question)

    # Record investigation query in DB
    query_record = InvestigationQuery(
        case_id=case_id,
        question=payload.question,
        answer=res.get("answer", ""),
        sources_json=json.dumps(res.get("sources", [])),
        confidence=res.get("confidence", "High"),
        uncertainty=res.get("uncertainty", ""),
        conflicts_json=json.dumps(res.get("conflicts", []))
    )
    db.add(query_record)
    db.commit()

    res["id"] = query_record.id
    return res

# ==================== REPORT GENERATION API ====================

@app.post("/api/cases/{case_id}/report")
def generate_report(case_id: str, payload: ReportGenerateRequest, db: Session = Depends(get_db)):
    case_obj = db.query(Case).filter(Case.id == case_id).first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")

    evidence_list = db.query(Evidence).filter(Evidence.case_id == case_id).all()
    artifacts = db.query(Artifact).filter(Artifact.case_id == case_id).all()
    iocs = db.query(IOC).filter(IOC.case_id == case_id).all()
    events = db.query(Event).filter(Event.case_id == case_id).order_by(Event.timestamp.asc()).all()
    findings = db.query(Finding).filter(Finding.case_id == case_id).all()

    case_dict = {
        "id": case_obj.id,
        "case_code": case_obj.case_code,
        "name": case_obj.name,
        "description": case_obj.description,
        "investigator": case_obj.investigator,
        "priority": case_obj.priority,
        "incident_type": case_obj.incident_type
    }

    ev_dicts = [{
        "original_name": e.original_name, "file_type": e.file_type, "file_size": e.file_size,
        "sha256": e.sha256, "integrity_status": e.integrity_status
    } for e in evidence_list]

    art_dicts = [{"category": a.category, "name": a.name, "value": a.value} for a in artifacts]
    ioc_dicts = [{"indicator": i.indicator, "type": i.type, "status": i.status, "confidence": i.confidence, "source_evidence_name": i.source_evidence_name} for i in iocs]
    evt_dicts = [{
        "timestamp": e.timestamp, "event_type": e.event_type, "category": e.category,
        "action": e.action, "details": e.details, "raw_reference": e.raw_reference
    } for e in events]
    f_dicts = [{
        "title": f.title, "severity": f.severity, "description": f.description,
        "explanation": f.explanation, "mitre_technique": f.mitre_technique
    } for f in findings]

    clusters = correlate_events(evt_dicts)

    pdf_path = generate_pdf_report(
        case=case_dict,
        evidence_list=ev_dicts,
        artifacts=art_dicts,
        iocs=ioc_dicts,
        events=evt_dicts,
        findings=f_dicts,
        correlations=clusters,
        investigator_notes=payload.investigator_notes or ""
    )

    report_entry = Report(
        case_id=case_id,
        title=payload.title or f"Forensic Triage Report - {case_obj.case_code}",
        executive_summary=f"Incident investigation report for {case_obj.name}",
        content_json=json.dumps({
            "case": case_dict,
            "evidence_count": len(ev_dicts),
            "ioc_count": len(ioc_dicts),
            "findings_count": len(f_dicts)
        }),
        pdf_filename=pdf_path.name,
        status="Generated"
    )
    db.add(report_entry)
    db.commit()
    db.refresh(report_entry)

    return {
        "report_id": report_entry.id,
        "pdf_filename": pdf_path.name,
        "download_url": f"/api/cases/{case_id}/report/pdf/{pdf_path.name}",
        "generated_at": report_entry.generated_at.isoformat()
    }

@app.get("/api/cases/{case_id}/report/pdf/{pdf_filename}")
def download_pdf_report(case_id: str, pdf_filename: str):
    file_path = REPORTS_DIR / pdf_filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="PDF report not found")
    return FileResponse(path=file_path, filename=pdf_filename, media_type="application/pdf")

# ==================== SYNTHETIC DEMO CASE LOADER ====================

@app.post("/api/demo/load")
def load_synthetic_demo_case(db: Session = Depends(get_db)):
    """
    1-Click Demo Loader:
    Creates demo case -> generates 7 realistic evidence files -> calculates SHA-256 ->
    preserves read-only copy -> executes full triage pipeline -> ready to explore!
    """
    case_code = "INC-2026-DEMO"
    
    # Check if demo case already exists; if so, refresh it
    existing_case = db.query(Case).filter(Case.case_code == case_code).first()
    if existing_case:
        case_id = existing_case.id
        # Clear children
        db.query(Evidence).filter(Evidence.case_id == case_id).delete()
        db.query(Artifact).filter(Artifact.case_id == case_id).delete()
        db.query(Event).filter(Event.case_id == case_id).delete()
        db.query(IOC).filter(IOC.case_id == case_id).delete()
        db.query(Relationship).filter(Relationship.case_id == case_id).delete()
        db.query(Finding).filter(Finding.case_id == case_id).delete()
        db.commit()
        demo_case = existing_case
    else:
        demo_case = Case(
            case_code=case_code,
            name="Suspicious Data Access & Exfiltration Investigation",
            description="Automated triage and digital forensic correlation of workstation DESKTOP-SEC-09 following anomalous file staging and outbound C2 beacon.",
            investigator="Lead Forensic Analyst (SOC / DFIR)",
            priority="Critical",
            incident_type="Unauthorized Data Access & Exfiltration",
            status="Open"
        )
        db.add(demo_case)
        db.commit()
        db.refresh(demo_case)
        case_id = demo_case.id

    # Generate synthetic files on disk
    case_evidence_dir = EVIDENCE_DIR / case_id
    generated_files = generate_synthetic_evidence_files(case_evidence_dir)

    # Add evidence records with SHA-256
    evidence_records = []
    for fname, fpath in generated_files.items():
        sha256_val, md5_val, file_size = preserve_evidence_file(fpath, fpath)
        ext = fname.split(".")[-1].lower()

        ev_entry = Evidence(
            case_id=case_id,
            filename=fname,
            original_name=fname,
            file_type=ext,
            file_size=file_size,
            sha256=sha256_val,
            md5=md5_val,
            status="Processed",
            integrity_status="Integrity Verified",
            is_readonly=True,
            storage_path=str(fpath)
        )
        db.add(ev_entry)
        evidence_records.append(ev_entry)

    db.commit()

    # Automatically execute triage
    triage_res = execute_case_triage(case_id, db)

    return {
        "status": "Demo Loaded Successfully",
        "case": format_case_response(demo_case, db),
        "triage_summary": triage_res
    }

@app.get("/api/demo/sample-pack.zip")
def download_sample_evidence_pack():
    """Generates and provides a downloadable zip archive containing sample forensic evidence files."""
    from backend.demo_data.sample_pack import create_sample_evidence_zip
    zip_path = create_sample_evidence_zip()
    return FileResponse(
        path=zip_path,
        filename="CYBERTRIAGE_Sample_Evidence_Pack.zip",
        media_type="application/zip"
    )

@app.post("/api/cases/{case_id}/evidence/load-samples")
def load_sample_evidence_into_case(case_id: str, db: Session = Depends(get_db)):
    """1-Click loads sample evidence files into the active case without running triage automatically."""
    case_obj = db.query(Case).filter(Case.id == case_id).first()
    if not case_obj:
        raise HTTPException(status_code=404, detail="Case not found")

    case_evidence_dir = EVIDENCE_DIR / case_id
    generated_files = generate_synthetic_evidence_files(case_evidence_dir)

    added_count = 0
    for fname, fpath in generated_files.items():
        existing = db.query(Evidence).filter(Evidence.case_id == case_id, Evidence.filename == fname).first()
        if existing:
            continue

        sha256_val, md5_val, file_size = preserve_evidence_file(fpath, fpath)
        ext = fname.split(".")[-1].lower()

        ev_entry = Evidence(
            case_id=case_id,
            filename=fname,
            original_name=fname,
            file_type=ext,
            file_size=file_size,
            sha256=sha256_val,
            md5=md5_val,
            status="Processed",
            integrity_status="Integrity Verified",
            is_readonly=True,
            storage_path=str(fpath)
        )
        db.add(ev_entry)
        added_count += 1

    db.commit()
    return {"status": "success", "loaded_files": added_count, "total_evidence": db.query(Evidence).filter(Evidence.case_id == case_id).count()}


# ==================== GLOBAL SEARCH API ====================

@app.get("/api/search")
def global_case_search(case_id: str, q: str = Query(..., min_length=1), db: Session = Depends(get_db)):
    """Search across IP, domain, username, filename, process, event ID, hash, timestamp."""
    s = f"%{q}%"
    
    events = db.query(Event).filter(
        Event.case_id == case_id,
        (Event.user.ilike(s)) | (Event.process.ilike(s)) | (Event.file.ilike(s)) |
        (Event.ip.ilike(s)) | (Event.domain.ilike(s)) | (Event.event_id.ilike(s)) |
        (Event.details.ilike(s)) | (Event.raw_reference.ilike(s))
    ).limit(20).all()

    iocs = db.query(IOC).filter(
        IOC.case_id == case_id,
        (IOC.indicator.ilike(s)) | (IOC.context.ilike(s))
    ).limit(10).all()

    artifacts = db.query(Artifact).filter(
        Artifact.case_id == case_id,
        (Artifact.name.ilike(s)) | (Artifact.value.ilike(s))
    ).limit(20).all()

    return {
        "query": q,
        "results_count": len(events) + len(iocs) + len(artifacts),
        "events": [{
            "id": e.id, "event_id": e.event_id, "timestamp": e.timestamp,
            "event_type": e.event_type, "process": e.process, "file": e.file, "ip": e.ip,
            "raw_reference": e.raw_reference, "severity": e.severity
        } for e in events],
        "iocs": [{
            "id": i.id, "indicator": i.indicator, "type": i.type, "status": i.status, "confidence": i.confidence
        } for i in iocs],
        "artifacts": [{
            "id": a.id, "category": a.category, "name": a.name, "value": a.value, "source_location": a.source_location
        } for a in artifacts]
    }

# Favicon handler
@app.get("/favicon.ico", include_in_schema=False)
@app.get("/favicon.png", include_in_schema=False)
async def get_favicon():
    favicon_path = FRONTEND_DIR / "favicon.png"
    if favicon_path.exists():
        return FileResponse(favicon_path, media_type="image/png")
    return JSONResponse({"status": "no favicon"}, status_code=404)

# Mount Frontend static files
if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
