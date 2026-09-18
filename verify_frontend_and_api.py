import urllib.request
import urllib.parse
import json

BASE_URL = "http://127.0.0.1:8000"

def test_endpoint(path, method="GET", data=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    req_data = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            status = resp.status
            return status, json.loads(content) if "application/json" in resp.headers.get("Content-Type", "") else content
    except Exception as e:
        return 500, str(e)

def run_acceptance_suite():
    print("=== STARTING FULL ACCEPTANCE TEST SUITE ===")

    # 1. Test Static Frontend Serving
    print("\n[1] Testing Frontend Root HTML...")
    status, body = test_endpoint("/")
    assert status == 200, f"Frontend returned {status}"
    assert "CYBERTRIAGE" in body, "Frontend missing brand title"
    print("  [OK] Frontend HTML loaded successfully.")

    # 2. Test Cases Endpoint
    print("\n[2] Testing GET /api/cases...")
    status, cases = test_endpoint("/api/cases")
    assert status == 200, f"Failed: {status}"
    assert len(cases) > 0, "No cases found"
    active_case = cases[0]
    case_id = active_case["id"]
    print(f"  [OK] Found {len(cases)} cases. Active case: {active_case['case_code']} ({active_case['name']})")

    # 3. Test Evidence Ingestion & Hash Retrieval
    print("\n[3] Testing GET /api/cases/{id}/evidence...")
    status, evidence_list = test_endpoint(f"/api/cases/{case_id}/evidence")
    assert status == 200
    if len(evidence_list) < 7:
        print("  [INFO] Ingesting real-life sample evidence into test case...")
        test_endpoint(f"/api/cases/{case_id}/evidence/load-samples", method="POST")
        status, evidence_list = test_endpoint(f"/api/cases/{case_id}/evidence")
    assert len(evidence_list) >= 7, f"Expected at least 7 evidence files, got {len(evidence_list)}"
    for ev in evidence_list[:3]:
        assert len(ev["sha256"]) == 64, f"Invalid SHA256: {ev['sha256']}"
        print(f"  [OK] Evidence: {ev['original_name']} | SHA-256: {ev['sha256'][:20]}... | {ev['integrity_status']}")

    # 4. Test Automated Triage API
    print("\n[4] Testing POST /api/cases/{id}/triage...")
    status, triage_res = test_endpoint(f"/api/cases/{case_id}/triage", method="POST")
    assert status == 200
    print(f"  [OK] Triage executed: {triage_res['status']}")
    print(f"    - Potential IOCs: {triage_res['potential_iocs']}")
    print(f"    - Suspicious Events: {triage_res['suspicious_events']}")
    print(f"    - Correlated Clusters: {triage_res['correlated_clusters']}")
    print(f"    - Findings: {triage_res['findings_count']}")

    # 5. Test Artifacts Classification
    print("\n[5] Testing GET /api/cases/{id}/artifacts...")
    status, artifacts = test_endpoint(f"/api/cases/{case_id}/artifacts")
    assert status == 200
    categories = set(a["category"] for a in artifacts)
    print(f"  [OK] Extracted {len(artifacts)} artifacts across {len(categories)} categories: {categories}")

    # 6. Test IOC Detection
    print("\n[6] Testing GET /api/cases/{id}/iocs...")
    status, iocs = test_endpoint(f"/api/cases/{case_id}/iocs")
    assert status == 200
    assert len(iocs) > 0
    print(f"  [OK] Extracted {len(iocs)} threat indicators (IOCs).")

    # 7. Test Timeline
    print("\n[7] Testing GET /api/cases/{id}/timeline...")
    status, timeline = test_endpoint(f"/api/cases/{case_id}/timeline")
    assert status == 200
    assert len(timeline) > 0
    print(f"  [OK] Reconstructed {len(timeline)} timeline events.")

    # 8. Test Investigation Graph
    print("\n[8] Testing GET /api/cases/{id}/graph...")
    status, graph = test_endpoint(f"/api/cases/{case_id}/graph")
    assert status == 200
    print(f"  [OK] Graph generated with {len(graph['nodes'])} nodes and {len(graph['edges'])} edges.")

    # 9. Test Findings & Conflict Detection
    print("\n[9] Testing GET /api/cases/{id}/findings...")
    status, findings_data = test_endpoint(f"/api/cases/{case_id}/findings")
    assert status == 200
    assert len(findings_data["findings"]) > 0
    assert len(findings_data["conflicts"]) > 0
    print(f"  [OK] Found {len(findings_data['findings'])} findings and {len(findings_data['conflicts'])} conflicts.")
    for c in findings_data["conflicts"]:
        print(f"    - Conflict: {c['title']} | {c['source_a']} vs {c['source_b']}")

    # 10. Test Grounded AI Investigator
    print("\n[10] Testing POST /api/cases/{id}/investigate...")
    status, ai_res = test_endpoint(f"/api/cases/{case_id}/investigate", method="POST", data={"question": "What happened in this incident?"})
    assert status == 200
    assert len(ai_res["sources"]) > 0, "AI missing citations"
    print(f"  [OK] AI Query Answered: {ai_res['answer'][:120]}...")
    print(f"  [OK] Citations provided: {len(ai_res['sources'])} sources.")

    # 11. Test Report Generation & PDF Download
    print("\n[11] Testing POST /api/cases/{id}/report...")
    status, rep_res = test_endpoint(f"/api/cases/{case_id}/report", method="POST", data={"title": "Official Acceptance Report", "investigator_notes": "Forensic audit verified."})
    assert status == 200
    assert "pdf_filename" in rep_res
    print(f"  [OK] Report generated: {rep_res['pdf_filename']}")
    print(f"  [OK] Download URL: {rep_res['download_url']}")

    # 12. Test Global Search
    print("\n[12] Testing GET /api/search...")
    status, search_res = test_endpoint(f"/api/search?case_id={case_id}&q=powershell")
    assert status == 200
    assert search_res["results_count"] > 0
    print(f"  [OK] Global search found {search_res['results_count']} matching records for 'powershell'.")

    print("\n==================================================")
    print("SUCCESS: ALL 12 ACCEPTANCE CRITERIA VALIDATED 100%!")
    print("==================================================")

if __name__ == "__main__":
    run_acceptance_suite()
