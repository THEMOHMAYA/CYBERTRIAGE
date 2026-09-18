// Evidence Ingestion View
import { API, formatISTDateTime } from '../api.js';

export async function renderEvidence(container, activeCase, navigateTo) {
  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem;">
      <div>
        <h2 style="font-size:1.5rem; font-weight:700; color:#FFFFFF;">Evidence Ingestion & Vault</h2>
        <p style="font-size:0.875rem; color:var(--text-secondary);">
          Cryptographic evidence ingestion with automated SHA-256 integrity sealing and read-only preservation copy.
        </p>
      </div>

      <div style="display:flex; gap:0.75rem;">
        <a href="/api/demo/sample-pack.zip" download="CYBERTRIAGE_Sample_Evidence_Pack.zip" class="btn btn-secondary" id="btn-download-pack">
          <i class="fa-solid fa-file-zipper" style="color:var(--accent-cyan);"></i> Download Sample Pack (ZIP)
        </a>
        <button class="btn btn-primary" id="btn-triage-from-evidence">
          <i class="fa-solid fa-play"></i> Run Triage On Ingested Files
        </button>
      </div>
    </div>

    <!-- Quick Sample Evidence Assistant Banner -->
    <div style="background:rgba(2,132,199,0.08); border:1px solid rgba(2,132,199,0.3); border-radius:8px; padding:1rem 1.25rem; margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
      <div style="display:flex; align-items:center; gap:0.75rem;">
        <div style="width:36px; height:36px; border-radius:8px; background:rgba(2,132,199,0.2); color:var(--accent-cyan); display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
          <i class="fa-solid fa-folder-tree"></i>
        </div>
        <div>
          <strong style="color:#FFF; font-size:0.9rem;">Need Sample Evidence Files to Test?</strong>
          <p style="font-size:0.8rem; color:var(--text-secondary);">
            Download the ready-to-test ZIP package or click below to automatically ingest sample security logs, network pcap logs, and USB history.
          </p>
        </div>
      </div>
      <div style="display:flex; gap:0.5rem;">
        <button class="btn btn-secondary" id="btn-auto-load-samples" style="background:var(--bg-tertiary); border-color:var(--accent-cyan); color:var(--accent-cyan); font-size:0.825rem;">
          <i class="fa-solid fa-wand-magic-sparkles"></i> 1-Click Ingest Sample Files
        </button>
      </div>
    </div>

    <!-- Drag & Drop Upload Zone -->
    <div class="dfir-card" style="margin-bottom:1.5rem; text-align:center; padding:2rem; border:2px dashed var(--border-color); background:rgba(15,23,42,0.5); cursor:pointer;" id="drop-zone">
      <input type="file" id="file-input" multiple style="display:none;" accept=".csv,.json,.log,.txt,.pdf,.png,.jpg,.syslog" />
      <div style="width:50px; height:50px; border-radius:50%; background:var(--accent-cyan-glow); color:var(--accent-cyan); display:flex; align-items:center; justify-content:center; margin:0 auto 1rem; font-size:1.5rem;">
        <i class="fa-solid fa-cloud-arrow-up"></i>
      </div>
      <h3 style="font-size:1.1rem; font-weight:700; margin-bottom:0.35rem;">Drag & Drop Digital Evidence Files Here</h3>
      <p style="font-size:0.825rem; color:var(--text-secondary); margin-bottom:1rem;">
        Supported forensic formats: <strong>CSV, JSON, LOG, TXT, PDF, PNG/JPG, SYSLOG</strong> (Max 50MB per file)
      </p>
      <div style="display:flex; justify-content:center; gap:0.75rem;">
        <button class="btn btn-secondary" id="btn-browse-files">
          <i class="fa-solid fa-folder-open"></i> Browse Local Files
        </button>
      </div>
      <div id="upload-status-indicator" style="margin-top:1rem; font-size:0.85rem; font-weight:600; display:none;"></div>
    </div>

    <!-- Evidence Inventory Table -->
    <div class="dfir-card">
      <div class="card-header">
        <div class="card-title">
          <i class="fa-solid fa-vault" style="color:var(--accent-cyan);"></i>
          Ingested Evidence Inventory & Chain of Custody (<span id="evidence-table-count">0</span>)
        </div>
      </div>

      <div class="dfir-table-container">
        <table class="dfir-table">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Type</th>
              <th>File Size</th>
              <th>SHA-256 Hash (Chain of Custody)</th>
              <th>Acquisition Time</th>
              <th>Integrity Status</th>
              <th>Storage Mode</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="evidence-table-body">
            <tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:2rem;"><i class="fa-solid fa-spinner fa-spin"></i> Loading evidence vault...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const browseBtn = document.getElementById('btn-browse-files');
  const statusEl = document.getElementById('upload-status-indicator');
  const autoLoadBtn = document.getElementById('btn-auto-load-samples');

  browseBtn.onclick = (e) => {
    e.stopPropagation();
    fileInput.click();
  };
  dropZone.onclick = () => fileInput.click();

  dropZone.ondragover = (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--accent-cyan)';
    dropZone.style.background = 'rgba(6,182,212,0.05)';
  };

  dropZone.ondragleave = () => {
    dropZone.style.borderColor = 'var(--border-color)';
    dropZone.style.background = 'rgba(15,23,42,0.5)';
  };

  dropZone.ondrop = (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border-color)';
    dropZone.style.background = 'rgba(15,23,42,0.5)';
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  fileInput.onchange = () => {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFileUpload(fileInput.files);
    }
  };

  async function handleFileUpload(files) {
    statusEl.style.display = 'block';
    statusEl.style.color = 'var(--accent-cyan)';
    statusEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Uploading ${files.length} file(s), computing SHA-256 integrity hashes...`;

    try {
      await API.uploadEvidence(activeCase.id, files);
      statusEl.style.color = 'var(--sev-low)';
      statusEl.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${files.length} file(s) ingested & SHA-256 hashes sealed!`;
      setTimeout(() => { statusEl.style.display = 'none'; }, 4000);
      loadEvidenceTable();
    } catch (err) {
      statusEl.style.color = 'var(--sev-critical)';
      statusEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Ingestion failed: ${err.message}`;
    }
  }

  autoLoadBtn.onclick = async () => {
    autoLoadBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Ingesting sample evidence...`;
    autoLoadBtn.disabled = true;

    try {
      await API.loadSampleEvidence(activeCase.id);
      statusEl.style.display = 'block';
      statusEl.style.color = 'var(--sev-low)';
      statusEl.innerHTML = `<i class="fa-solid fa-check-circle"></i> Sample evidence files ingested & SHA-256 hashes sealed!`;
      setTimeout(() => { statusEl.style.display = 'none'; }, 4000);
      loadEvidenceTable();
    } catch (err) {
      alert('Error loading sample files: ' + err.message);
    } finally {
      autoLoadBtn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> 1-Click Ingest Sample Files`;
      autoLoadBtn.disabled = false;
    }
  };

  async function loadEvidenceTable() {
    const evidenceList = await API.listEvidence(activeCase.id);
    document.getElementById('evidence-table-count').textContent = evidenceList.length;
    const tbody = document.getElementById('evidence-table-body');

    if (!evidenceList || evidenceList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:2rem;">No evidence files uploaded yet. Use the 1-Click Ingest button above or drag & drop files.</td></tr>`;
      return;
    }

    tbody.innerHTML = evidenceList.map(ev => `
      <tr>
        <td style="font-weight:600; display:flex; align-items:center; gap:0.5rem;">
          <i class="fa-solid fa-file" style="color:var(--accent-cyan);"></i>
          ${ev.original_name}
        </td>
        <td><span class="badge badge-info" style="font-size:0.68rem;">${ev.file_type.toUpperCase()}</span></td>
        <td class="font-mono" style="font-size:0.75rem;">${(ev.file_size / 1024).toFixed(1)} KB</td>
        <td class="font-mono" style="color:var(--accent-cyan); font-size:0.725rem;" title="${ev.sha256}">
          ${ev.sha256.substring(0, 24)}...
        </td>
        <td class="font-mono" style="font-size:0.75rem; color:var(--text-muted);">${formatISTDateTime(ev.upload_time)}</td>
        <td>
          <span class="integrity-pill" style="font-size:0.7rem; padding:0.15rem 0.5rem;">
            <i class="fa-solid fa-shield-check"></i> ${ev.integrity_status}
          </span>
        </td>
        <td>
          <span class="badge badge-medium" style="font-size:0.65rem;">READ-ONLY COPY</span>
        </td>
        <td>
          <button class="btn btn-secondary btn-inspect-raw" data-id="${ev.id}" style="padding:0.25rem 0.5rem; font-size:0.725rem;">
            <i class="fa-solid fa-eye"></i> View Raw
          </button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.btn-inspect-raw').forEach(btn => {
      btn.onclick = () => {
        sessionStorage.setItem('selected_evidence_id', btn.dataset.id);
        navigateTo('evidence-explorer');
      };
    });
  }

  document.getElementById('btn-triage-from-evidence').onclick = () => {
    navigateTo('dashboard');
    setTimeout(() => {
      const startBtn = document.getElementById('btn-start-triage');
      if (startBtn) startBtn.click();
    }, 100);
  };

  loadEvidenceTable();
}
