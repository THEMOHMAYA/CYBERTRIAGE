// Findings & Conflict Detection View
import { API } from '../api.js';

export async function renderFindings(container, activeCase, navigateTo) {
  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <div>
        <h2 style="font-size:1.5rem; font-weight:700; color:#FFFFFF;">Investigation Findings & Conflict Detection</h2>
        <p style="font-size:0.875rem; color:var(--text-secondary);">
          Automated forensic hypotheses, MITRE ATT&CK tactic mappings, and cross-evidence discrepancy analysis.
        </p>
      </div>

      <button class="btn btn-primary" id="btn-generate-report-link">
        <i class="fa-solid fa-file-contract"></i> Generate Investigation Report
      </button>
    </div>

    <!-- Conflicts Section -->
    <div class="dfir-card" style="margin-bottom:1.5rem; border-color: rgba(239,68,68,0.4);">
      <div class="card-header" style="border-color: rgba(239,68,68,0.2);">
        <div class="card-title" style="color:var(--sev-critical);">
          <i class="fa-solid fa-triangle-exclamation"></i>
          Cross-Source Evidence Discrepancies & Conflict Detection (<span id="conflicts-count-label">0</span>)
        </div>
        <span class="badge badge-critical">INVESTIGATOR AUDIT REQUIRED</span>
      </div>

      <div id="conflicts-container" style="display:flex; flex-direction:column; gap:1rem;">
        <div style="color:var(--text-muted); padding:1rem; text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i> Checking for conflicting telemetry...</div>
      </div>
    </div>

    <!-- Findings Section -->
    <div class="dfir-card">
      <div class="card-header">
        <div class="card-title">
          <i class="fa-solid fa-shield-halved" style="color:var(--accent-cyan);"></i>
          Primary Investigation Findings & Hypotheses (<span id="findings-count-label">0</span>)
        </div>
      </div>

      <div id="findings-container" style="display:flex; flex-direction:column; gap:1.25rem;">
        <div style="color:var(--text-muted); padding:2rem; text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i> Loading findings...</div>
      </div>
    </div>
  `;

  document.getElementById('btn-generate-report-link').onclick = () => navigateTo('reports');

  const conflictsContainer = document.getElementById('conflicts-container');
  const findingsContainer = document.getElementById('findings-container');
  const conflictsCountLabel = document.getElementById('conflicts-count-label');
  const findingsCountLabel = document.getElementById('findings-count-label');

  try {
    const data = await API.getFindings(activeCase.id);
    const conflicts = data.conflicts || [];
    const findings = data.findings || [];

    conflictsCountLabel.textContent = conflicts.length;
    findingsCountLabel.textContent = findings.length;

    // Render Conflicts
    if (conflicts.length === 0) {
      conflictsContainer.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem; padding:1rem;">No multi-source timestamp skews or contradictory evidence detected.</div>`;
    } else {
      conflictsContainer.innerHTML = conflicts.map(c => `
        <div class="conflict-card" style="margin-top:0;">
          <div class="conflict-header">
            <i class="fa-solid fa-triangle-exclamation"></i> CONFLICT DETECTED: ${c.title}
          </div>
          <div style="font-size:0.85rem; color:var(--text-primary); margin-bottom:0.6rem;">
            ${c.description}
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; background:rgba(0,0,0,0.4); padding:0.75rem 1rem; border-radius:6px; font-family:monospace; font-size:0.775rem;">
            <div style="border-right:1px solid rgba(255,255,255,0.1); padding-right:0.5rem;">
              <span style="color:var(--accent-cyan); font-weight:700; display:block; font-size:0.7rem;">SOURCE A TELEMETRY:</span>
              <div style="color:#FFF; font-weight:600; margin:0.2rem 0;">${c.source_a}</div>
              <div style="color:var(--text-secondary);">${c.value_a}</div>
            </div>
            <div>
              <span style="color:var(--accent-blue); font-weight:700; display:block; font-size:0.7rem;">SOURCE B TELEMETRY:</span>
              <div style="color:#FFF; font-weight:600; margin:0.2rem 0;">${c.source_b}</div>
              <div style="color:var(--text-secondary);">${c.value_b}</div>
            </div>
          </div>

          <div style="margin-top:0.6rem; font-size:0.775rem; color:var(--sev-medium); display:flex; justify-content:space-between; align-items:center;">
            <span><i class="fa-solid fa-scale-balanced"></i> <strong>Forensic Rule:</strong> Neither source is discarded automatically. Verify NTP drift on host.</span>
            <span class="badge badge-medium" style="font-size:0.65rem;">${c.significance}</span>
          </div>
        </div>
      `).join('');
    }

    // Render Findings
    if (findings.length === 0) {
      findingsContainer.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem; padding:1rem;">No findings generated yet. Click "Start Automated Triage" on Dashboard.</div>`;
    } else {
      findingsContainer.innerHTML = findings.map((f, i) => `
        <div style="background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:8px; padding:1.25rem; display:flex; flex-direction:column; gap:0.65rem;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:0.5rem;">
              <span class="badge badge-${f.severity.toLowerCase()}">${f.severity}</span>
              <h4 style="font-size:1.05rem; font-weight:700; color:#FFF;">Finding #${i+1}: ${f.title}</h4>
            </div>
            <div style="display:flex; gap:0.5rem; align-items:center;">
              <span class="font-mono" style="font-size:0.75rem; color:var(--accent-cyan); background:rgba(6,182,212,0.1); padding:0.2rem 0.5rem; border-radius:4px;">
                ${f.mitre_technique || 'MITRE ATT&CK'}
              </span>
              <span class="badge badge-low" style="font-size:0.65rem;">CONFIDENCE: ${f.confidence}</span>
            </div>
          </div>

          <div style="font-size:0.875rem; color:var(--text-primary); line-height:1.6;">
            ${f.description}
          </div>

          ${f.explanation ? `
            <div style="font-size:0.8rem; color:var(--text-secondary); background:var(--bg-secondary); padding:0.6rem 0.85rem; border-radius:6px; border-left:3px solid var(--accent-cyan);">
              <strong>Forensic Explanation:</strong> ${f.explanation}
            </div>
          ` : ''}

          ${f.uncertainty ? `
            <div style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">
              <i class="fa-solid fa-circle-info" style="color:var(--sev-medium);"></i> <strong>Forensic Limitation:</strong> ${f.uncertainty}
            </div>
          ` : ''}

          <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:var(--text-muted); border-top:1px solid rgba(255,255,255,0.05); padding-top:0.5rem; margin-top:0.25rem;">
            <span>Category: <strong>${f.category}</strong></span>
            <span>Status: <strong style="color:var(--accent-cyan);">${f.status}</strong></span>
          </div>
        </div>
      `).join('');
    }

  } catch (err) {
    findingsContainer.innerHTML = `<div style="color:var(--sev-critical); padding:2rem; text-align:center;">Error: ${err.message}</div>`;
  }
}
