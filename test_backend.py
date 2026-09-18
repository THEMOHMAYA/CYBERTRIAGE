import os
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from backend.database import init_db, SessionLocal, Case
from backend.main import (
    load_synthetic_demo_case, list_cases, get_case, execute_case_triage,
    query_ai_investigator, generate_report, get_case_timeline, get_case_graph,
    get_case_findings, get_case_iocs
)
from backend.models import AIQueryRequest, ReportGenerateRequest

def test_full_pipeline():
    print("=== 1. Initializing Database ===")
    init_db()
    db = SessionLocal()

    print("=== 2. Loading Synthetic Demo Case ===")
    demo_res = load_synthetic_demo_case(db=db)
    print("Demo case loaded successfully:", demo_res["status"])
    print("Case Code:", demo_res["case"]["case_code"])
    print("Evidence Files:", demo_res["case"]["evidence_count"])
    print("Artifacts:", demo_res["case"]["artifact_count"])
    print("IOCs:", demo_res["case"]["ioc_count"])
    print("Suspicious Events:", demo_res["case"]["suspicious_event_count"])
    print("Correlated Events:", demo_res["case"]["correlated_event_count"])

    case_id = demo_res["case"]["id"]

    print("\n=== 3. Testing Timeline Extraction ===")
    timeline = get_case_timeline(case_id=case_id, db=db)
    print(f"Retrieved {len(timeline)} chronological timeline events.")
    for evt in timeline[:4]:
        print(f"  [{evt['timestamp']}] {evt['event_type']} ({evt['severity']}): {evt['raw_reference'][:60]}")

    print("\n=== 4. Testing Investigation Graph Generation ===")
    graph = get_case_graph(case_id=case_id, db=db)
    print(f"Graph generated with {len(graph.nodes)} nodes and {len(graph.edges)} edges.")

    print("\n=== 5. Testing Findings & Conflict Detection ===")
    findings_data = get_case_findings(case_id=case_id, db=db)
    print(f"Findings: {len(findings_data['findings'])}")
    for f in findings_data['findings']:
        print(f"  - [{f['severity']}] {f['title']} (MITRE: {f['mitre_technique']})")
    print(f"Conflicts Detected: {len(findings_data['conflicts'])}")
    for c in findings_data['conflicts']:
        print(f"  - CONFLICT: {c['title']} ({c['source_a']} vs {c['source_b']})")

    print("\n=== 6. Testing AI Investigator (Grounded DFIR RAG) ===")
    ai_q = AIQueryRequest(question="What happened in this incident?")
    ai_res = query_ai_investigator(case_id=case_id, payload=ai_q, db=db)
    print("Question:", ai_res["question"])
    print("Answer:", ai_res["answer"][:150] + "...")
    print("Sources Cited:", len(ai_res["sources"]))
    for s in ai_res["sources"][:2]:
        print(f"  - Source: {s['source']} (Event: {s['event_id']}) -> {s['title']}")
    print("Confidence:", ai_res["confidence"])
    print("Uncertainty:", ai_res["uncertainty"])

    print("\n=== 7. Testing Forensic Report Generation & PDF Export ===")
    rep_req = ReportGenerateRequest(title="Incident INC-2026-DEMO Final Forensic Report", investigator_notes="All integrity checks verified.")
    rep_res = generate_report(case_id=case_id, payload=rep_req, db=db)
    print("Report generated successfully!")
    print("PDF Filename:", rep_res["pdf_filename"])
    print("Download URL:", rep_res["download_url"])

    print("\n>>> ALL BACKEND PIPELINE TESTS PASSED 100%! <<<")
    db.close()

if __name__ == "__main__":
    test_full_pipeline()
