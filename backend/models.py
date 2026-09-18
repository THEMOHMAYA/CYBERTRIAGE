from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Case Schemas
class CaseCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    investigator: Optional[str] = "Lead Forensic Analyst"
    priority: Optional[str] = "High"
    incident_type: Optional[str] = "Unauthorized Data Access"

class CaseResponse(BaseModel):
    id: str
    case_code: Optional[str] = ""
    name: str
    description: Optional[str] = ""
    investigator: Optional[str] = ""
    priority: Optional[str] = ""
    incident_type: Optional[str] = ""
    status: Optional[str] = ""
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    evidence_count: Optional[int] = 0
    artifact_count: Optional[int] = 0
    ioc_count: Optional[int] = 0
    suspicious_event_count: Optional[int] = 0
    correlated_event_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Evidence Schemas
class EvidenceResponse(BaseModel):
    id: str
    case_id: str
    filename: str
    original_name: str
    file_type: str
    file_size: int
    sha256: str
    md5: Optional[str] = ""
    upload_time: Optional[str] = None
    status: str
    integrity_status: str
    is_readonly: bool
    storage_path: str
    error_message: Optional[str] = ""

    class Config:
        from_attributes = True

# Artifact Schemas
class ArtifactResponse(BaseModel):
    id: str
    case_id: str
    evidence_id: str
    category: str
    name: str
    value: str
    source_location: Optional[str] = ""
    extracted_at: Optional[str] = None
    raw_reference: Optional[str] = ""
    metadata_json: Optional[str] = "{}"
    evidence_filename: Optional[str] = ""

    class Config:
        from_attributes = True

# Event Schemas
class EventResponse(BaseModel):
    id: str
    case_id: str
    evidence_id: str
    event_id: Optional[str] = ""
    timestamp: str
    event_type: str
    category: str
    user: Optional[str] = ""
    device: Optional[str] = ""
    process: Optional[str] = ""
    file: Optional[str] = ""
    ip: Optional[str] = ""
    domain: Optional[str] = ""
    action: Optional[str] = ""
    severity: str
    details: Optional[str] = ""
    raw_reference: Optional[str] = ""
    is_suspicious: bool
    evidence_filename: Optional[str] = ""

    class Config:
        from_attributes = True

# IOC Schemas
class IOCResponse(BaseModel):
    id: str
    case_id: str
    evidence_id: Optional[str] = None
    indicator: str
    type: str
    status: str
    confidence: str
    occurrences: int
    first_seen: Optional[str] = ""
    last_seen: Optional[str] = ""
    source_evidence_name: Optional[str] = ""
    context: Optional[str] = ""
    tags: Optional[List[str]] = []

    class Config:
        from_attributes = True

# Graph / Relationship Schemas
class GraphNode(BaseModel):
    id: str
    label: str
    type: str
    category: Optional[str] = ""
    severity: Optional[str] = "Normal"
    evidence_source: Optional[str] = ""
    details: Optional[Dict[str, Any]] = {}

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str
    relationship_type: str
    details: Optional[str] = ""

class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

# AI Investigation Schemas
class AIQueryRequest(BaseModel):
    question: str
    context_filters: Optional[Dict[str, Any]] = {}

class SourceReference(BaseModel):
    title: str
    source: str
    timestamp: Optional[str] = ""
    event_id: Optional[str] = ""
    artifact_id: Optional[str] = ""
    evidence_id: Optional[str] = ""
    raw_reference: Optional[str] = ""
    confidence: Optional[str] = "Medium"

class ConflictReference(BaseModel):
    title: str
    description: str
    source_a: str
    value_a: str
    source_b: str
    value_b: str
    significance: str

class AIQueryResponse(BaseModel):
    id: Optional[str] = ""
    question: str
    answer: str
    explanation: Optional[str] = ""
    sources: List[SourceReference] = []
    confidence: str
    uncertainty: Optional[str] = ""
    conflicts: List[ConflictReference] = []
    investigation_notes: Optional[str] = ""
    suggested_followups: List[str] = []

# Finding Schemas
class FindingResponse(BaseModel):
    id: str
    case_id: str
    title: str
    category: str
    severity: str
    description: str
    explanation: Optional[str] = ""
    evidence_ids: List[str] = []
    related_event_ids: List[str] = []
    confidence: str
    uncertainty: Optional[str] = ""
    mitre_technique: Optional[str] = ""
    status: str
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

# Report Schemas
class ReportGenerateRequest(BaseModel):
    title: Optional[str] = ""
    investigator_notes: Optional[str] = ""
    include_ai_findings: bool = True
    include_timeline: bool = True
    include_iocs: bool = True
    include_chain_of_custody: bool = True
