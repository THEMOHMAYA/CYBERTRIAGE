// Triage Progress Animation Modal
import { API } from '../api.js';

export function showTriageModal(caseId, onComplete) {
  const modalRoot = document.getElementById('modal-root');
  
  modalRoot.innerHTML = `
    <div class="modal-overlay" id="triage-modal-overlay">
      <div class="modal-box" style="max-width: 580px;">
        <div class="modal-header">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <i class="fa-solid fa-microchip" style="color:var(--accent-cyan); font-size:1.2rem;"></i>
            <h3 style="font-size:1.1rem; font-weight:700;">Automated Forensic Triage Engine</h3>
          </div>
          <span class="badge badge-info" id="triage-live-status">INITIALIZING</span>
        </div>

        <div class="modal-body">
          <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:1.25rem;">
            Running end-to-end cyber triage pipeline: Ingestion → Parsing → Normalization → IOC Extraction → Timeline Reconstruction → Correlation Analysis → AI Investigation.
          </p>

          <div style="display:flex; flex-direction:column; gap:0.85rem;" id="triage-steps-list">
            <div class="triage-step" id="step-1" style="display:flex; align-items:center; justify-content:space-between; font-size:0.85rem; padding:0.6rem 0.8rem; background:var(--bg-tertiary); border-radius:6px;">
              <span style="display:flex; align-items:center; gap:0.6rem;">
                <i class="fa-solid fa-spinner fa-spin" style="color:var(--accent-cyan);"></i> Evidence Scan & SHA-256 Verification
              </span>
              <span class="step-status" style="color:var(--accent-cyan); font-family:monospace; font-size:0.75rem;">RUNNING...</span>
            </div>

            <div class="triage-step" id="step-2" style="display:flex; align-items:center; justify-content:space-between; font-size:0.85rem; padding:0.6rem 0.8rem; background:rgba(30,41,59,0.4); border-radius:6px; opacity:0.6;">
              <span style="display:flex; align-items:center; gap:0.6rem;">
                <i class="fa-regular fa-circle"></i> Artifact Extraction & Classification
              </span>
              <span class="step-status" style="color:var(--text-muted); font-family:monospace; font-size:0.75rem;">QUEUED</span>
            </div>

            <div class="triage-step" id="step-3" style="display:flex; align-items:center; justify-content:space-between; font-size:0.85rem; padding:0.6rem 0.8rem; background:rgba(30,41,59,0.4); border-radius:6px; opacity:0.6;">
              <span style="display:flex; align-items:center; gap:0.6rem;">
                <i class="fa-regular fa-circle"></i> Potential IOC & Threat Indicator Extraction
              </span>
              <span class="step-status" style="color:var(--text-muted); font-family:monospace; font-size:0.75rem;">QUEUED</span>
            </div>

            <div class="triage-step" id="step-4" style="display:flex; align-items:center; justify-content:space-between; font-size:0.85rem; padding:0.6rem 0.8rem; background:rgba(30,41,59,0.4); border-radius:6px; opacity:0.6;">
              <span style="display:flex; align-items:center; gap:0.6rem;">
                <i class="fa-regular fa-circle"></i> Timeline Reconstruction & Normalization
              </span>
              <span class="step-status" style="color:var(--text-muted); font-family:monospace; font-size:0.75rem;">QUEUED</span>
            </div>

            <div class="triage-step" id="step-5" style="display:flex; align-items:center; justify-content:space-between; font-size:0.85rem; padding:0.6rem 0.8rem; background:rgba(30,41,59,0.4); border-radius:6px; opacity:0.6;">
              <span style="display:flex; align-items:center; gap:0.6rem;">
                <i class="fa-regular fa-circle"></i> Cross-Source Correlation & Graph Synthesis
              </span>
              <span class="step-status" style="color:var(--text-muted); font-family:monospace; font-size:0.75rem;">QUEUED</span>
            </div>

            <div class="triage-step" id="step-6" style="display:flex; align-items:center; justify-content:space-between; font-size:0.85rem; padding:0.6rem 0.8rem; background:rgba(30,41,59,0.4); border-radius:6px; opacity:0.6;">
              <span style="display:flex; align-items:center; gap:0.6rem;">
                <i class="fa-regular fa-circle"></i> Grounded AI Investigation & Conflict Detection
              </span>
              <span class="step-status" style="color:var(--text-muted); font-family:monospace; font-size:0.75rem;">QUEUED</span>
            </div>
          </div>

          <div id="triage-result-summary" style="display:none; margin-top:1.25rem; padding:1rem; background:rgba(6,182,212,0.08); border:1px solid rgba(6,182,212,0.3); border-radius:8px;">
            <div style="font-weight:700; color:var(--accent-cyan); font-size:0.95rem; margin-bottom:0.5rem; display:flex; align-items:center; gap:0.4rem;">
              <i class="fa-solid fa-circle-check"></i> Triage Analysis Complete
            </div>
            <div id="triage-stats-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; font-size:0.8rem; color:var(--text-primary);">
              <!-- Filled on completion -->
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-primary" id="btn-close-triage-modal" style="display:none;">
            View Investigation Results <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  `;

  // Start animated pipeline execution
  const steps = [1, 2, 3, 4, 5, 6];
  let currentStep = 0;

  const interval = setInterval(() => {
    if (currentStep > 0 && currentStep <= 6) {
      const prevEl = document.getElementById(`step-${currentStep}`);
      if (prevEl) {
        prevEl.style.opacity = '1';
        prevEl.style.background = 'rgba(16, 185, 129, 0.1)';
        prevEl.querySelector('i').className = 'fa-solid fa-check-circle';
        prevEl.querySelector('i').style.color = 'var(--sev-low)';
        prevEl.querySelector('.step-status').textContent = 'VERIFIED ✓';
        prevEl.querySelector('.step-status').style.color = 'var(--sev-low)';
      }
    }

    currentStep++;
    if (currentStep <= 6) {
      const currEl = document.getElementById(`step-${currentStep}`);
      if (currEl) {
        currEl.style.opacity = '1';
        currEl.style.background = 'var(--bg-tertiary)';
        currEl.querySelector('i').className = 'fa-solid fa-spinner fa-spin';
        currEl.querySelector('i').style.color = 'var(--accent-cyan)';
        currEl.querySelector('.step-status').textContent = 'PROCESSING...';
        currEl.querySelector('.step-status').style.color = 'var(--accent-cyan)';
      }
    } else {
      clearInterval(interval);
    }
  }, 400);

  // Call real backend triage endpoint
  API.executeTriage(caseId).then(res => {
    setTimeout(() => {
      clearInterval(interval);
      for (let s = 1; s <= 6; s++) {
        const el = document.getElementById(`step-${s}`);
        if (el) {
          el.style.opacity = '1';
          el.style.background = 'rgba(16, 185, 129, 0.1)';
          el.querySelector('i').className = 'fa-solid fa-check-circle';
          el.querySelector('i').style.color = 'var(--sev-low)';
          el.querySelector('.step-status').textContent = 'VERIFIED ✓';
          el.querySelector('.step-status').style.color = 'var(--sev-low)';
        }
      }

      document.getElementById('triage-live-status').className = 'badge badge-low';
      document.getElementById('triage-live-status').textContent = 'COMPLETE';

      const statsGrid = document.getElementById('triage-stats-grid');
      statsGrid.innerHTML = `
        <div>• Evidence Scanned: <strong>${res.evidence_scanned || 0}</strong></div>
        <div>• Artifacts Extracted: <strong>${res.artifacts_extracted || 0}</strong></div>
        <div>• Potential IOCs: <strong>${res.potential_iocs || 0}</strong></div>
        <div>• Suspicious Events: <strong>${res.suspicious_events || 0}</strong></div>
        <div>• Correlated Clusters: <strong>${res.correlated_clusters || 0}</strong></div>
        <div>• Findings Requiring Review: <strong>${res.findings_count || 0}</strong></div>
      `;

      document.getElementById('triage-result-summary').style.display = 'block';
      const closeBtn = document.getElementById('btn-close-triage-modal');
      closeBtn.style.display = 'inline-flex';
      closeBtn.onclick = () => {
        modalRoot.innerHTML = '';
        if (onComplete) onComplete(res);
      };
    }, 2500);
  }).catch(err => {
    clearInterval(interval);
    alert('Triage error: ' + err.message);
    modalRoot.innerHTML = '';
  });
}
