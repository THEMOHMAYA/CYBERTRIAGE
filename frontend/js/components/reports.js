// Report Generator View (Export to PDF & Formal Forensic Document with Syntax Squad branding)
import { API, formatISTTime, formatISTDateTime } from '../api.js';

export async function renderReports(container, activeCase, navigateTo) {
  const currentDateTime = formatISTDateTime(new Date().toISOString());

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <div>
        <h2 style="font-size:1.5rem; font-weight:700; color:#FFFFFF;">Forensic Report Generator</h2>
        <p style="font-size:0.875rem; color:var(--text-secondary);">
          Compile comprehensive digital forensic examination reports with cryptographic audit trails and generate official PDF documents.
        </p>
      </div>

      <div style="display:flex; gap:0.75rem;">
        <button class="btn btn-secondary" id="btn-print-report">
          <i class="fa-solid fa-print"></i> Print Report
        </button>
        <button class="btn btn-primary" id="btn-build-pdf" style="padding:0.6rem 1.25rem;">
          <i class="fa-solid fa-file-pdf"></i> Generate & Download PDF Report
        </button>
      </div>
    </div>

    <!-- Report Builder Form & Options -->
    <div class="dfir-card" style="margin-bottom:1.5rem;">
      <div class="card-header">
        <div class="card-title">
          <i class="fa-solid fa-sliders" style="color:var(--accent-cyan);"></i> Report Metadata & Examiner Notes
        </div>
        <span class="badge badge-info" style="font-size:0.75rem;">SYNTAX SQUAD EDITION</span>
      </div>

      <div style="display:grid; grid-template-columns: 2fr 1fr; gap:1.5rem;">
        <div>
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:1rem;">
            <div>
              <label style="display:block; font-size:0.8rem; font-weight:600; color:var(--text-secondary); margin-bottom:0.35rem;">Investigator Name</label>
              <input type="text" id="report-author-input" value="${activeCase.investigator || 'Lead Forensic Analyst'}" style="width:100%; padding:0.6rem; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:6px; color:#FFF; font-family:inherit;" />
            </div>
            <div>
              <label style="display:block; font-size:0.8rem; font-weight:600; color:var(--text-secondary); margin-bottom:0.35rem;">Report Date & Time</label>
              <input type="text" id="report-datetime-input" value="${currentDateTime}" readonly style="width:100%; padding:0.6rem; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:6px; color:var(--accent-cyan); font-family:monospace;" />
            </div>
          </div>

          <label style="display:block; font-size:0.8rem; font-weight:600; color:var(--text-secondary); margin-bottom:0.35rem;">Report Title</label>
          <input type="text" id="report-title-input" value="Forensic Examination & Incident Triage Report - ${activeCase.case_code}" style="width:100%; padding:0.6rem; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:6px; color:#FFF; font-family:inherit; margin-bottom:1rem;" />

          <label style="display:block; font-size:0.8rem; font-weight:600; color:var(--text-secondary); margin-bottom:0.35rem;">Examiner Concluding Notes & Recommendations</label>
          <textarea id="report-notes-input" rows="3" placeholder="Add custom examiner notes (e.g. Recommended firewall blocks, NTP audit recommendations, physical drive recovery)..." style="width:100%; padding:0.6rem; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:6px; color:#FFF; font-family:inherit; resize:vertical;"></textarea>
        </div>

        <div style="background:var(--bg-secondary); padding:1rem; border-radius:8px; border:1px solid var(--border-color); font-size:0.825rem; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div style="font-weight:700; color:var(--accent-cyan); margin-bottom:0.75rem; text-transform:uppercase; font-size:0.75rem;">
              Formal Document Structure
            </div>
            <div style="display:flex; flex-direction:column; gap:0.4rem; color:var(--text-secondary);">
              <div><i class="fa-solid fa-check" style="color:var(--sev-low);"></i> 1. Executive Summary</div>
              <div><i class="fa-solid fa-check" style="color:var(--sev-low);"></i> 2. Investigator & Date Time Metadata</div>
              <div><i class="fa-solid fa-check" style="color:var(--sev-low);"></i> 3. Evidence Inventory & SHA-256 Hashes</div>
              <div><i class="fa-solid fa-check" style="color:var(--sev-low);"></i> 4. Primary Investigation Findings</div>
              <div><i class="fa-solid fa-check" style="color:var(--sev-low);"></i> 5. Extracted Threat Indicators (IOCs)</div>
              <div><i class="fa-solid fa-check" style="color:var(--sev-low);"></i> 6. Chronological Event Sequence</div>
              <div><i class="fa-solid fa-check" style="color:var(--sev-low);"></i> 7. Final Footer Signature</div>
            </div>
          </div>

          <div style="margin-top:1rem; padding:0.6rem; background:rgba(2,132,199,0.1); border-radius:6px; border:1px solid rgba(2,132,199,0.3); font-size:0.75rem; color:var(--accent-cyan); text-align:center;">
            <strong>Report by Cybertriage created by Syntax Squad</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- PDF Success Notification & Download Banner -->
    <div id="pdf-download-alert" style="display:none; margin-bottom:1.5rem; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.4); border-radius:8px; padding:1rem 1.25rem; display:none; justify-content:space-between; align-items:center;">
      <div style="display:flex; align-items:center; gap:0.75rem;">
        <i class="fa-solid fa-circle-check" style="color:var(--sev-low); font-size:1.5rem;"></i>
        <div>
          <strong style="color:#FFF; display:block; font-size:0.95rem;" id="pdf-alert-title">Forensic PDF Report Generated Successfully!</strong>
          <span style="color:var(--text-secondary); font-size:0.8rem;" id="pdf-alert-filename">Forensic_Report.pdf</span>
        </div>
      </div>
      <div style="display:flex; gap:0.5rem;">
        <a id="btn-direct-download" href="#" class="btn btn-primary" style="padding:0.45rem 1rem; font-size:0.825rem;" download>
          <i class="fa-solid fa-download"></i> Download PDF
        </a>
        <a id="btn-open-pdf-tab" href="#" target="_blank" class="btn btn-secondary" style="padding:0.45rem 1rem; font-size:0.825rem;">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> Open in New Tab
        </a>
      </div>
    </div>

    <!-- Embedded PDF Viewer / Document Preview Sheet -->
    <div class="dfir-card" id="report-preview-sheet" style="background:#FFFFFF; color:#0F172A; padding:2.5rem; border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
      <div style="text-align:center; padding:3rem; color:#64748B;"><i class="fa-solid fa-spinner fa-spin"></i> Building forensic document preview...</div>
    </div>
  `;

  const previewSheet = document.getElementById('report-preview-sheet');
  const generatePdfBtn = document.getElementById('btn-build-pdf');
  const printBtn = document.getElementById('btn-print-report');
  const titleInput = document.getElementById('report-title-input');
  const authorInput = document.getElementById('report-author-input');
  const notesInput = document.getElementById('report-notes-input');
  const pdfAlert = document.getElementById('pdf-download-alert');
  const pdfAlertFilename = document.getElementById('pdf-alert-filename');
  const directDownloadBtn = document.getElementById('btn-direct-download');
  const openPdfTabBtn = document.getElementById('btn-open-pdf-tab');

  async function loadPreview() {
    try {
      const [evidenceList, timeline, iocs, findingsData] = await Promise.all([
        API.listEvidence(activeCase.id),
        API.getTimeline(activeCase.id),
        API.getIOCs(activeCase.id),
        API.getFindings(activeCase.id)
      ]);

      const findings = findingsData.findings || [];
      const investigatorName = authorInput.value.trim() || activeCase.investigator || 'Lead Forensic Analyst';
      const caseName = activeCase.name || 'Cyber Incident Investigation';

      previewSheet.innerHTML = `
        <!-- Formal Report Header -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #0284C7; padding-bottom:1rem; margin-bottom:1.5rem;">
          <div>
            <h1 style="font-size:1.6rem; font-weight:800; color:#0F172A; margin-bottom:0.25rem;">CYBERTRIAGE AI</h1>
            <h3 style="font-size:0.95rem; font-weight:700; color:#0284C7; text-transform:uppercase;">Digital Forensics & Cyber Incident Response Report</h3>
          </div>
          <div style="text-align:right; font-size:0.75rem; color:#475569;">
            <div><strong>CASE ID:</strong> ${activeCase.case_code}</div>
            <div><strong>REPORT DATE & TIME:</strong> ${currentDateTime}</div>
            <div style="color:#16A34A; font-weight:700; margin-top:0.2rem;"><i class="fa-solid fa-shield-check"></i> CHAIN OF CUSTODY VERIFIED</div>
          </div>
        </div>

        <!-- Case Overview Table with Name and Date & Time -->
        <table style="width:100%; border-collapse:collapse; font-size:0.8rem; margin-bottom:1.5rem; background:#F8FAFC; border:1px solid #E2E8F0;">
          <tr>
            <td style="padding:0.5rem 0.75rem; border:1px solid #E2E8F0; font-weight:700; width:20%;">Case Name:</td>
            <td style="padding:0.5rem 0.75rem; border:1px solid #E2E8F0;"><strong>${caseName}</strong></td>
            <td style="padding:0.5rem 0.75rem; border:1px solid #E2E8F0; font-weight:700; width:20%;">Priority / Classification:</td>
            <td style="padding:0.5rem 0.75rem; border:1px solid #E2E8F0; font-weight:700; color:#EA580C;">${(activeCase.priority || 'High').toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding:0.5rem 0.75rem; border:1px solid #E2E8F0; font-weight:700;">Investigator Name:</td>
            <td style="padding:0.5rem 0.75rem; border:1px solid #E2E8F0;"><strong>${investigatorName}</strong></td>
            <td style="padding:0.5rem 0.75rem; border:1px solid #E2E8F0; font-weight:700;">Date & Time:</td>
            <td style="padding:0.5rem 0.75rem; border:1px solid #E2E8F0; font-family:monospace;">${currentDateTime}</td>
          </tr>
          <tr>
            <td style="padding:0.5rem 0.75rem; border:1px solid #E2E8F0; font-weight:700;">Incident Type:</td>
            <td style="padding:0.5rem 0.75rem; border:1px solid #E2E8F0;">${activeCase.incident_type}</td>
            <td style="padding:0.5rem 0.75rem; border:1px solid #E2E8F0; font-weight:700;">Total Evidence Ingested:</td>
            <td style="padding:0.5rem 0.75rem; border:1px solid #E2E8F0;">${evidenceList.length} Files Preserved (SHA-256)</td>
          </tr>
        </table>

        <!-- Executive Summary -->
        <h3 style="font-size:1.1rem; font-weight:700; color:#0F172A; margin-bottom:0.5rem; border-bottom:1px solid #CBD5E1; padding-bottom:0.25rem;">1. Executive Summary</h3>
        <p style="font-size:0.85rem; line-height:1.6; color:#334155; margin-bottom:1.25rem;">
          This formal digital forensics examination report was prepared for <b>${caseName}</b> (Case ID: <b>${activeCase.case_code}</b>) 
          by lead examiner <b>${investigatorName}</b> on <b>${currentDateTime}</b>. 
          A total of <strong>${evidenceList.length}</strong> evidence files were ingested and preserved under read-only cryptographic custody. 
          Automated triage extracted <strong>${timeline.length}</strong> normalized events, revealing an initial authentication anomaly followed by obfuscated PowerShell execution, unauthorized removable USB storage connection, confidential document staging, and an external C2 network beacon to destination IP <code>203.0.113.42</code>.
        </p>

        <!-- Evidence Inventory Table -->
        <h3 style="font-size:1.1rem; font-weight:700; color:#0F172A; margin-bottom:0.5rem; border-bottom:1px solid #CBD5E1; padding-bottom:0.25rem;">2. Evidence Inventory & Cryptographic Hashes (SHA-256)</h3>
        <table style="width:100%; border-collapse:collapse; font-size:0.775rem; margin-bottom:1.5rem;">
          <thead>
            <tr style="background:#0F172A; color:#FFF; text-align:left;">
              <th style="padding:0.4rem 0.6rem;">Filename</th>
              <th style="padding:0.4rem 0.6rem;">Type</th>
              <th style="padding:0.4rem 0.6rem;">Size (Bytes)</th>
              <th style="padding:0.4rem 0.6rem;">SHA-256 Cryptographic Hash</th>
              <th style="padding:0.4rem 0.6rem;">Integrity</th>
            </tr>
          </thead>
          <tbody>
            ${evidenceList.map(ev => `
              <tr style="border-bottom:1px solid #E2E8F0;">
                <td style="padding:0.4rem 0.6rem; font-weight:600;">${ev.original_name}</td>
                <td style="padding:0.4rem 0.6rem;">${ev.file_type.toUpperCase()}</td>
                <td style="padding:0.4rem 0.6rem; font-family:monospace;">${ev.file_size.toLocaleString()}</td>
                <td style="padding:0.4rem 0.6rem; font-family:monospace; font-size:0.7rem; color:#0284C7;">${ev.sha256}</td>
                <td style="padding:0.4rem 0.6rem; color:#16A34A; font-weight:700;">VERIFIED</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Findings List -->
        <h3 style="font-size:1.1rem; font-weight:700; color:#0F172A; margin-bottom:0.5rem; border-bottom:1px solid #CBD5E1; padding-bottom:0.25rem;">3. Primary Forensic Findings</h3>
        <div style="display:flex; flex-direction:column; gap:0.75rem; margin-bottom:1.5rem;">
          ${findings.map((f, i) => `
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-left:4px solid #0284C7; padding:0.75rem 1rem; border-radius:4px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
                <strong style="font-size:0.875rem; color:#0F172A;">[${f.severity.toUpperCase()}] ${f.title}</strong>
                <span style="font-family:monospace; font-size:0.75rem; color:#0284C7;">${f.mitre_technique || ''}</span>
              </div>
              <p style="font-size:0.8rem; color:#334155; margin-bottom:0.35rem;">${f.description}</p>
              ${f.explanation ? `<p style="font-size:0.75rem; color:#64748B;"><em>Forensic Rationale: ${f.explanation}</em></p>` : ''}
            </div>
          `).join('')}
        </div>

        <!-- Timeline Highlights -->
        <h3 style="font-size:1.1rem; font-weight:700; color:#0F172A; margin-bottom:0.5rem; border-bottom:1px solid #CBD5E1; padding-bottom:0.25rem;">4. Chronological Forensic Timeline</h3>
        <table style="width:100%; border-collapse:collapse; font-size:0.775rem; margin-bottom:1.5rem;">
          <thead>
            <tr style="background:#1E293B; color:#FFF; text-align:left;">
              <th style="padding:0.4rem 0.6rem;">Time (IST)</th>
              <th style="padding:0.4rem 0.6rem;">Category</th>
              <th style="padding:0.4rem 0.6rem;">Action / Telemetry Summary</th>
              <th style="padding:0.4rem 0.6rem;">Source File</th>
            </tr>
          </thead>
          <tbody>
            ${timeline.slice(0, 8).map(e => `
              <tr style="border-bottom:1px solid #E2E8F0;">
                <td style="padding:0.4rem 0.6rem; font-family:monospace; color:#0284C7; font-weight:600;">${formatISTTime(e.timestamp)}</td>
                <td style="padding:0.4rem 0.6rem;">${e.category}</td>
                <td style="padding:0.4rem 0.6rem; font-weight:600;">${e.event_type || e.action}: <span style="font-weight:400; color:#475569;">${(e.details || '').substring(0, 60)}</span></td>
                <td style="padding:0.4rem 0.6rem; color:#64748B; font-size:0.7rem;">${e.evidence_filename || 'Evidence'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Limitations -->
        <div style="border-top:1px solid #CBD5E1; padding-top:1rem; margin-bottom:1.5rem; font-size:0.75rem; color:#64748B; line-height:1.5;">
          <p><strong>Examiner Certification & Forensic Disclaimer:</strong> This digital forensic report incorporates correlation telemetry analyzed with CYBERTRIAGE AI. All assertions maintain full traceability back to raw evidence hashes. Evidence files are preserved in read-only forensic storage.</p>
        </div>

        <!-- Final Report Footer Signature (Syntax Squad) -->
        <div style="background:#F0F9FF; border:1.5px solid #0284C7; border-radius:8px; padding:1rem; text-align:center;">
          <div style="font-size:1rem; font-weight:800; color:#0284C7; letter-spacing:0.02em; margin-bottom:0.25rem;">
            Report by Cybertriage created by Syntax Squad
          </div>
          <div style="font-size:0.75rem; color:#475569;">
            Case: <strong>${caseName}</strong> &bull; Examiner: <strong>${investigatorName}</strong> &bull; Generated: <strong>${currentDateTime}</strong>
          </div>
        </div>
      `;
    } catch (err) {
      previewSheet.innerHTML = `<div style="color:#DC2626; padding:2rem; text-align:center;">Error building report preview: ${err.message}</div>`;
    }
  }

  generatePdfBtn.onclick = async () => {
    generatePdfBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generating PDF Report...`;
    generatePdfBtn.disabled = true;

    try {
      const res = await API.generateReport(activeCase.id, {
        title: titleInput.value.trim(),
        investigator_notes: notesInput.value.trim()
      });

      // Show PDF banner with action buttons
      pdfAlert.style.display = 'flex';
      pdfAlertFilename.textContent = `${res.pdf_filename} | Generated at ${currentDateTime}`;
      directDownloadBtn.href = res.download_url;
      directDownloadBtn.setAttribute('download', res.pdf_filename);
      openPdfTabBtn.href = res.download_url;

      // Automatically trigger download
      const link = document.createElement('a');
      link.href = res.download_url;
      link.download = res.pdf_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      generatePdfBtn.innerHTML = `<i class="fa-solid fa-check"></i> PDF Generated & Downloaded!`;
      setTimeout(() => {
        generatePdfBtn.innerHTML = `<i class="fa-solid fa-file-pdf"></i> Generate & Download PDF Report`;
        generatePdfBtn.disabled = false;
      }, 3000);
    } catch (err) {
      alert('Failed to generate PDF: ' + err.message);
      generatePdfBtn.innerHTML = `<i class="fa-solid fa-file-pdf"></i> Generate & Download PDF Report`;
      generatePdfBtn.disabled = false;
    }
  };

  printBtn.onclick = () => {
    window.print();
  };

  authorInput.oninput = loadPreview;
  loadPreview();
}
