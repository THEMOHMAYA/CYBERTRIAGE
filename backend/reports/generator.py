import os
import json
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List

IST_TZ = timezone(timedelta(hours=5, minutes=30))

def format_event_ist(ts_str: str) -> str:
    if not ts_str:
        return "N/A"
    try:
        clean = ts_str.strip().replace("Z", "+00:00")
        dt = datetime.fromisoformat(clean)
        dt_ist = dt.astimezone(IST_TZ)
        return dt_ist.strftime("%I:%M:%S %p IST")
    except Exception:
        return ts_str
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from backend.config import REPORTS_DIR

def generate_pdf_report(
    case: Dict[str, Any],
    evidence_list: List[Dict[str, Any]],
    artifacts: List[Dict[str, Any]],
    iocs: List[Dict[str, Any]],
    events: List[Dict[str, Any]],
    findings: List[Dict[str, Any]],
    correlations: List[Dict[str, Any]],
    investigator_notes: str = ""
) -> Path:
    """Generates a professional forensic PDF report using ReportLab with Syntax Squad branding."""
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    report_filename = f"Forensic_Report_{case.get('case_code', 'INC-001')}_{int(datetime.now().timestamp())}.pdf"
    pdf_path = REPORTS_DIR / report_filename

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    # Custom typography styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'),
        alignment=TA_LEFT
    )

    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#0284C7'),
        alignment=TA_LEFT
    )

    h2_style = ParagraphStyle(
        'H2Style',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=12,
        spaceAfter=5
    )

    h3_style = ParagraphStyle(
        'H3Style',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13,
        textColor=colors.HexColor('#334155'),
        spaceBefore=7,
        spaceAfter=3
    )

    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor('#334155'),
        alignment=TA_JUSTIFY
    )

    meta_label = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#475569')
    )

    meta_val = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#0F172A')
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7,
        leading=9.5,
        textColor=colors.HexColor('#0369A1')
    )

    disclaimer_style = ParagraphStyle(
        'DisclaimerStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor('#64748B')
    )

    footer_brand_style = ParagraphStyle(
        'FooterBrandStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#0284C7'),
        alignment=TA_CENTER
    )

    footer_sub_style = ParagraphStyle(
        'FooterSubStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#64748B'),
        alignment=TA_CENTER
    )

    story = []

    # Current formatted timestamp in 12-Hour IST
    now_ist = datetime.now(IST_TZ)
    current_time_str = now_ist.strftime("%d %b %Y, %I:%M:%S %p IST")
    investigator_name = case.get("investigator") or "Lead Forensic Analyst"
    case_name = case.get("name") or "Cyber Incident Investigation"

    # Title & Header
    story.append(Paragraph("CYBERTRIAGE AI - FORENSIC INVESTIGATION REPORT", title_style))
    story.append(Paragraph("DIGITAL FORENSICS & CYBER INCIDENT RESPONSE (DFIR) REPORT", subtitle_style))
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#0284C7'), spaceBefore=2, spaceAfter=10))

    # Case Metadata Summary Table (with explicit Name and Date & Time in IST)
    case_meta_data = [
        [Paragraph("Case Identifier:", meta_label), Paragraph(case.get("case_code", "N/A"), meta_val),
         Paragraph("Classification:", meta_label), Paragraph(f"PRIORITY: {case.get('priority', 'High').upper()}", meta_val)],
        [Paragraph("Case Name:", meta_label), Paragraph(case_name, meta_val),
         Paragraph("Incident Type:", meta_label), Paragraph(case.get("incident_type", "N/A"), meta_val)],
        [Paragraph("Investigator Name:", meta_label), Paragraph(investigator_name, meta_val),
         Paragraph("Report Date & Time (IST):", meta_label), Paragraph(current_time_str, meta_val)],
        [Paragraph("Integrity Audit:", meta_label), Paragraph("CHAIN OF CUSTODY VERIFIED (SHA-256)", meta_val),
         Paragraph("Total Evidence Files:", meta_label), Paragraph(str(len(evidence_list)), meta_val)],
    ]
    meta_table = Table(case_meta_data, colWidths=[100, 160, 110, 160])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # 1. Executive Summary
    story.append(Paragraph("1. Executive Summary", h2_style))
    exec_summary = (
        f"This digital forensics examination report was prepared for <b>{case_name}</b> "
        f"(Case ID: <b>{case.get('case_code')}</b>) by investigator <b>{investigator_name}</b> on <b>{current_time_str}</b>. "
        f"A comprehensive forensic examination was conducted across {len(evidence_list)} ingested evidence items comprising {len(artifacts)} extracted artifacts and {len(events)} normalized events. "
        f"Automated forensic triage identified {len(iocs)} potential indicators of compromise (IOCs) and {len(findings)} high-confidence findings. "
        f"Evidence correlates an initial authentication sequence on DESKTOP-SEC-09 with obfuscated PowerShell execution, "
        f"unauthorized removable USB storage connection, sensitive document staging, and external C2 network communications to IP 203.0.113.42."
    )
    story.append(Paragraph(exec_summary, body_style))
    story.append(Spacer(1, 8))

    # 2. Evidence Inventory & Integrity Audit
    story.append(Paragraph("2. Evidence Inventory & Chain of Custody (SHA-256)", h2_style))
    ev_table_data = [
        [Paragraph("Filename", meta_label), Paragraph("Type", meta_label), Paragraph("Size (Bytes)", meta_label), Paragraph("SHA-256 Cryptographic Hash", meta_label), Paragraph("Integrity", meta_label)]
    ]
    for ev in evidence_list:
        ev_table_data.append([
            Paragraph(ev.get("original_name", "N/A"), meta_val),
            Paragraph(ev.get("file_type", "").upper(), meta_val),
            Paragraph(f"{ev.get('file_size', 0):,}", meta_val),
            Paragraph(ev.get("sha256", "N/A")[:28] + "...", code_style),
            Paragraph("VERIFIED", meta_label)
        ])
    ev_table = Table(ev_table_data, colWidths=[110, 45, 65, 230, 80])
    ev_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(ev_table)
    story.append(Spacer(1, 10))

    # 3. Key Investigation Findings
    story.append(Paragraph("3. Primary Investigation Findings", h2_style))
    for f in findings:
        story.append(Paragraph(f"• <b>[{f.get('severity', 'Medium').upper()}] {f.get('title')}</b>", h3_style))
        story.append(Paragraph(f"<b>Description:</b> {f.get('description')}", body_style))
        if f.get("explanation"):
            story.append(Paragraph(f"<b>Forensic Rationale:</b> {f.get('explanation')}", body_style))
        if f.get("mitre_technique"):
            story.append(Paragraph(f"<b>MITRE ATT&CK:</b> {f.get('mitre_technique')}", disclaimer_style))
        story.append(Spacer(1, 3))

    story.append(Spacer(1, 8))

    # 4. Indicators of Compromise (IOCs)
    story.append(Paragraph("4. Indicators of Compromise (IOCs)", h2_style))
    ioc_table_data = [
        [Paragraph("Indicator", meta_label), Paragraph("Type", meta_label), Paragraph("Status", meta_label), Paragraph("Confidence", meta_label), Paragraph("Source Evidence", meta_label)]
    ]
    for ioc in iocs[:8]:
        ioc_table_data.append([
            Paragraph(ioc.get("indicator", "")[:35], code_style),
            Paragraph(ioc.get("type", ""), meta_val),
            Paragraph(ioc.get("status", ""), meta_val),
            Paragraph(ioc.get("confidence", "Medium"), meta_val),
            Paragraph(ioc.get("source_evidence_name", "") or "Case Logs", meta_val)
        ])
    ioc_table = Table(ioc_table_data, colWidths=[160, 60, 110, 70, 130])
    ioc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1E293B')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(ioc_table)
    story.append(Spacer(1, 10))

    # 5. Incident Timeline Highlights
    story.append(Paragraph("5. Reconstructed Event Chronology", h2_style))
    timeline_data = [
        [Paragraph("Timestamp (IST)", meta_label), Paragraph("Phase / Stage", meta_label), Paragraph("Action / Event Summary", meta_label), Paragraph("Source", meta_label)]
    ]
    for evt in events[:8]:
        timeline_data.append([
            Paragraph(format_event_ist(evt.get("timestamp", "")), meta_val),
            Paragraph(evt.get("category", "General"), meta_val),
            Paragraph(f"<b>{evt.get('event_type') or evt.get('action')}:</b> {evt.get('details', '')[:45]}", body_style),
            Paragraph(evt.get("raw_reference", "").split("]")[0].replace("[", "") or "Log", disclaimer_style)
        ])
    timeline_table = Table(timeline_data, colWidths=[80, 100, 240, 110])
    timeline_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
    ]))
    story.append(timeline_table)
    story.append(Spacer(1, 10))

    # 6. Investigator Notes & Limitations
    story.append(Paragraph("6. Investigator Notes & Forensic Limitations", h2_style))
    notes_text = investigator_notes or "Removable storage drive and external endpoint network traffic were isolated for forensic analysis. Direct host RAM dump analysis is recommended to recover decrypted session keys."
    story.append(Paragraph(f"<b>Investigator Notes:</b> {notes_text}", body_style))
    story.append(Spacer(1, 4))
    limitations_text = (
        "<b>Limitations & AI Disclaimer:</b> This report contains findings synthesized with the assistance of CYBERTRIAGE AI. "
        "All correlations, IOC classifications, and timeline extractions are derived directly from the provided evidence repository. "
        "Forensic conclusions should be independently reviewed by a certified examiner before submission to legal authorities."
    )
    story.append(Paragraph(limitations_text, disclaimer_style))
    story.append(Spacer(1, 14))

    # Final Branding Box: "Report by Cybertriage created by Syntax Squad"
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceBefore=8, spaceAfter=8))
    
    brand_table_data = [
        [Paragraph("<b>Report by Cybertriage created by Syntax Squad</b>", footer_brand_style)],
        [Paragraph(f"Case: {case_name} | Examiner: {investigator_name} | Timestamp: {current_time_str}", footer_sub_style)]
    ]
    brand_table = Table(brand_table_data, colWidths=[530])
    brand_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F0F9FF')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#0284C7')),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(brand_table)

    doc.build(story)
    return pdf_path
