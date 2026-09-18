import json
import uuid
from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from backend.config import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Case(Base):
    __tablename__ = "cases"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_code = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    investigator = Column(String, default="Lead Forensic Analyst")
    priority = Column(String, default="High")
    incident_type = Column(String, default="Unauthorized Data Access")
    status = Column(String, default="Open")
    created_at = Column(DateTime, default=get_utc_now)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now)

    evidence_files = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="case", cascade="all, delete-orphan")
    artifacts = relationship("Artifact", back_populates="case", cascade="all, delete-orphan")
    iocs = relationship("IOC", back_populates="case", cascade="all, delete-orphan")
    relationships = relationship("Relationship", back_populates="case", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="case", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="case", cascade="all, delete-orphan")

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    filename = Column(String, nullable=False)
    original_name = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(Integer, default=0)
    sha256 = Column(String, nullable=False, index=True)
    md5 = Column(String, default="")
    upload_time = Column(DateTime, default=get_utc_now)
    status = Column(String, default="Processed")
    integrity_status = Column(String, default="Integrity Verified")
    is_readonly = Column(Boolean, default=True)
    storage_path = Column(String, nullable=False)
    error_message = Column(Text, default="")

    case = relationship("Case", back_populates="evidence_files")
    events = relationship("Event", back_populates="evidence", cascade="all, delete-orphan")
    artifacts = relationship("Artifact", back_populates="evidence", cascade="all, delete-orphan")

class Artifact(Base):
    __tablename__ = "artifacts"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    evidence_id = Column(String, ForeignKey("evidence.id", ondelete="CASCADE"), index=True)
    category = Column(String, nullable=False, index=True) 
    name = Column(String, nullable=False)
    value = Column(Text, nullable=False)
    source_location = Column(String, default="")
    extracted_at = Column(DateTime, default=get_utc_now)
    raw_reference = Column(Text, default="")
    metadata_json = Column(Text, default="{}")

    case = relationship("Case", back_populates="artifacts")
    evidence = relationship("Evidence", back_populates="artifacts")

class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    evidence_id = Column(String, ForeignKey("evidence.id", ondelete="CASCADE"), index=True)
    event_id = Column(String, index=True)
    timestamp = Column(String, nullable=False, index=True)
    event_type = Column(String, nullable=False)
    category = Column(String, default="General")
    user = Column(String, default="")
    device = Column(String, default="")
    process = Column(String, default="")
    file = Column(String, default="")
    ip = Column(String, default="")
    domain = Column(String, default="")
    action = Column(String, default="")
    severity = Column(String, default="Info")
    details = Column(Text, default="")
    raw_reference = Column(Text, default="")
    is_suspicious = Column(Boolean, default=False)

    case = relationship("Case", back_populates="events")
    evidence = relationship("Evidence", back_populates="events")

class IOC(Base):
    __tablename__ = "iocs"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    evidence_id = Column(String, ForeignKey("evidence.id", ondelete="SET NULL"), nullable=True)
    indicator = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False)
    status = Column(String, default="Potential IOC")
    confidence = Column(String, default="Medium")
    occurrences = Column(Integer, default=1)
    first_seen = Column(String, default="")
    last_seen = Column(String, default="")
    source_evidence_name = Column(String, default="")
    context = Column(Text, default="")
    tags = Column(String, default="[]")

    case = relationship("Case", back_populates="iocs")

class Relationship(Base):
    __tablename__ = "relationships"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    evidence_id = Column(String, ForeignKey("evidence.id", ondelete="SET NULL"), nullable=True)
    source_type = Column(String, nullable=False)
    source_id = Column(String, nullable=False)
    source_label = Column(String, nullable=False)
    target_type = Column(String, nullable=False)
    target_id = Column(String, nullable=False)
    target_label = Column(String, nullable=False)
    relationship_type = Column(String, nullable=False)
    details = Column(Text, default="")

    case = relationship("Case", back_populates="relationships")

class Finding(Base):
    __tablename__ = "findings"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    title = Column(String, nullable=False)
    category = Column(String, default="Suspicious Activity")
    severity = Column(String, default="Medium")
    description = Column(Text, nullable=False)
    explanation = Column(Text, default="")
    evidence_ids = Column(Text, default="[]")
    related_event_ids = Column(Text, default="[]")
    confidence = Column(String, default="High")
    uncertainty = Column(Text, default="")
    mitre_technique = Column(String, default="")
    status = Column(String, default="Needs Review")
    created_at = Column(DateTime, default=get_utc_now)

    case = relationship("Case", back_populates="findings")

class InvestigationQuery(Base):
    __tablename__ = "investigations"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    sources_json = Column(Text, default="[]")
    confidence = Column(String, default="High")
    uncertainty = Column(Text, default="")
    conflicts_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=get_utc_now)

class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=generate_uuid)
    case_id = Column(String, ForeignKey("cases.id", ondelete="CASCADE"), index=True)
    title = Column(String, nullable=False)
    executive_summary = Column(Text, default="")
    content_json = Column(Text, default="{}")
    pdf_filename = Column(String, default="")
    status = Column(String, default="Generated")
    generated_at = Column(DateTime, default=get_utc_now)

    case = relationship("Case", back_populates="reports")

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
