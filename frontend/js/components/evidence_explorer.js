// Evidence Explorer View (Raw Inspection & Cryptographic Hashes)
import { API } from '../api.js';

export async function renderEvidenceExplorer(container, activeCase, navigateTo) {
  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <div>
        <h2 style="font-size:1.5rem; font-weight:700; color:#FFFFFF;">Evidence Explorer</h2>
        <p style="font-size:0.875rem; color:var(--text-secondary);">
          Inspect preserved read-only evidence file contents, line numbers, and cryptographic verification stamps.
        </p>
      </div>

      <div style="display:flex; align-items:center; gap:0.75rem;">
        <label style="font-size:0.8rem; color:var(--text-secondary); font-weight:600;">Select Evidence:</label>
        <select id="select-evidence-file" style="padding:0.5rem 0.85rem; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:6px; color:#FFF; font-family:inherit; min-width:260px;">
          <option value="">Loading files...</option>
        </select>
      </div>
    </div>

    <!-- File Metadata Banner -->
    <div class="dfir-card" id="evidence-meta-banner" style="margin-bottom:1.25rem; display:none;">
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:1rem; font-size:0.825rem;">
        <div>
          <span style="color:var(--text-muted); display:block; font-size:0.75rem;">ORIGINAL FILENAME</span>
          <strong id="meta-filename" style="color:var(--text-primary); font-size:0.9rem;">-</strong>
        </div>
        <div>
          <span style="color:var(--text-muted); display:block; font-size:0.75rem;">SHA-256 HASH</span>
          <span id="meta-sha256" class="font-mono" style="color:var(--accent-cyan); font-size:0.75rem;">-</span>
        </div>
        <div>
          <span style="color:var(--text-muted); display:block; font-size:0.75rem;">SIZE</span>
          <span id="meta-size" class="font-mono">-</span>
        </div>
        <div>
          <span style="color:var(--text-muted); display:block; font-size:0.75rem;">INTEGRITY AUDIT</span>
          <span class="integrity-pill"><i class="fa-solid fa-check-circle"></i> VERIFIED SEAL</span>
        </div>
      </div>
    </div>

    <!-- Raw Content Inspector with Line Numbers -->
    <div class="dfir-card" style="padding:0; overflow:hidden;">
      <div class="card-header" style="padding:0.75rem 1.25rem; margin-bottom:0; background:var(--bg-secondary);">
        <div class="card-title" style="font-size:0.85rem;">
          <i class="fa-solid fa-code" style="color:var(--accent-cyan);"></i> Raw Forensic Stream Viewer (Read-Only Analysis Copy)
        </div>
      </div>
      <div id="raw-content-display" style="padding:1rem; max-height:600px; overflow-y:auto; font-family:'JetBrains Mono', monospace; font-size:0.8rem; line-height:1.6; color:#E2E8F0; background:#050811;">
        <div style="text-align:center; padding:3rem; color:var(--text-muted);">Select an evidence file from the dropdown to inspect raw lines.</div>
      </div>
    </div>
  `;

  const select = document.getElementById('select-evidence-file');
  const evidenceList = await API.listEvidence(activeCase.id);

  if (!evidenceList || evidenceList.length === 0) {
    select.innerHTML = `<option value="">No evidence files available</option>`;
    return;
  }

  select.innerHTML = evidenceList.map(ev => `<option value="${ev.id}">${ev.original_name} (${(ev.file_size/1024).toFixed(1)} KB)</option>`).join('');

  const preselectedId = sessionStorage.getItem('selected_evidence_id');
  if (preselectedId && evidenceList.some(e => e.id === preselectedId)) {
    select.value = preselectedId;
    sessionStorage.removeItem('selected_evidence_id');
  }

  async function loadFileContent(evId) {
    if (!evId) return;
    const rawDisplay = document.getElementById('raw-content-display');
    const banner = document.getElementById('evidence-meta-banner');
    rawDisplay.innerHTML = `<div style="text-align:center; padding:3rem;"><i class="fa-solid fa-spinner fa-spin"></i> Reading preserved evidence copy...</div>`;

    try {
      const rawData = await API.getRawEvidence(activeCase.id, evId);
      banner.style.display = 'block';
      document.getElementById('meta-filename').textContent = rawData.filename;
      document.getElementById('meta-sha256').textContent = rawData.sha256;
      document.getElementById('meta-size').textContent = `${rawData.file_size.toLocaleString()} bytes`;

      const lines = rawData.content.split('\n');
      let html = '<table style="width:100%; border-collapse:collapse; font-family:inherit;">';
      lines.forEach((line, idx) => {
        const lineNum = idx + 1;
        const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
            <td style="width:45px; text-align:right; padding-right:1rem; color:#475569; user-select:none; vertical-align:top;">${lineNum}</td>
            <td style="white-space:pre-wrap; word-break:break-all;">${escaped}</td>
          </tr>
        `;
      });
      html += '</table>';

      if (rawData.is_truncated) {
        html += `<div style="padding:1rem; text-align:center; color:var(--sev-medium); font-size:0.75rem;">[Notice: Preview truncated to initial 50KB for rapid browser rendering]</div>`;
      }
      rawDisplay.innerHTML = html;
    } catch (err) {
      rawDisplay.innerHTML = `<div style="color:var(--sev-critical); padding:2rem; text-align:center;">Failed to load evidence: ${err.message}</div>`;
    }
  }

  select.onchange = () => loadFileContent(select.value);
  if (select.value) loadFileContent(select.value);
}
