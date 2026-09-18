// Evidence Ingestion View
import { API } from '../api.js';

export async function renderEvidence(container, activeCase, navigateTo) {
  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
      <div>
        <h2 style="font-size:1.5rem; font-weight:700; color:#FFFFFF;">Evidence Ingestion & Vault</h2>
        <p style="font-size:0.875rem; color:var(--text-secondary);">
          Cryptographic evidence ingestion with automated SHA-256 integrity sealing and read-only preservation copy.
        </p>
      </div>

      <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
        <button class="btn btn-secondary" id="btn-load-samples" style="border-color:var(--accent-cyan); color:var(--accent-cyan);">
          <i class="fa-solid fa-bolt"></i> 1-Click: Ingest 7 Sample Files
        </button>
        <a href="/api/demo/download-sample-evidence-zip" class="btn btn-secondary" id="btn-download-zip" download="CyberTriage_Sample_Evidence_Files.zip">
          <i class="fa-solid fa-file-zipper"></i> Download Test Pack (.ZIP)
        </a>
        <button class="btn btn-primary" id="btn-triage-from-evidence">
          <i class="fa-solid fa-play"></i> Run Triage On Ingested Files
        </button>
      </div>
    </div>

    <!-- Quick Info Banner for Testing -->
    <div class="dfir-card" style="margin-bottom:1.5rem; background:rgba(6,182,212,0.06); border:1px solid rgba(6,182,212,0.3); padding:1rem 1.25rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:1rem;">
      <div style="display:flex; align-items:center; gap:0.75rem;">
        <div style="width:36px; height:36px; border-radius:50%; background:var(--accent-cyan-glow); color:var(--accent-cyan); display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0;">
          <i class="fa-solid fa-flask"></i>
        </div>
        <div>
          <div style="font-weight:700; font-size:0.9rem; color:#FFFFFF;">Need test files? 7 Pre-configured forensic evidence artifacts are ready!</div>
          <div style="font-size:0.8rem; color:var(--text-secondary);">
            Includes Windows Events (4625/4672), Mimikatz Process Logs, Zeek C2 Network PCAP/Logs, USB Mount Artifacts, File Modifications, Chrome History, and System Info.
          </div>
        </div>
      </div>
      <div style="display:flex; gap:0.5rem;">
        <button class="btn btn-secondary" id="btn-quick-ingest-samples" style="font-size:0.8rem; padding:0.4rem 0.8rem; background:rgba(6,182,212,0.15); border-color:var(--accent-cyan); color:#FFFFFF;">
          <i class="fa-solid fa-bolt" style="color:var(--accent-cyan);"></i> Ingest Sample Pack
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

  async function loadEvidenceTable() {
    const evidenceList = await API.listEvidence(activeCase.id);
    document.getElementById('evidence-table-count').textContent = evidenceList.length;
    const tbody = document.getElementById('evidence-table-body');

    if (!evidenceList || evidenceList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:2rem;">No evidence files uploaded yet. Drag and drop files above.</td></tr>`;
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
        <td class="font-mono" style="font-size:0.75rem; color:var(--text-muted);">${(ev.upload_time || '').replace('T', ' ').substring(0, 19)}</td>
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

  async function handleLoadSamplePack() {
    statusEl.style.display = 'block';
    statusEl.style.color = 'var(--accent-cyan)';
    statusEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Ingesting 7 synthetic forensic artifacts (Windows events, process logs, network PCAP, USB, file sysmon, chrome history)...`;

    try {
      const res = await API.loadSamplePack(activeCase.id);
      statusEl.style.color = 'var(--sev-low)';
      statusEl.innerHTML = `<i class="fa-solid fa-check-circle"></i> 7 Forensic Evidence files ingested & SHA-256 integrity sealed!`;
      setTimeout(() => { statusEl.style.display = 'none'; }, 4000);
      loadEvidenceTable();
    } catch (err) {
      statusEl.style.color = 'var(--sev-critical)';
      statusEl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Failed to load sample pack: ${err.message}`;
    }
  }

  const loadSamplesBtn = document.getElementById('btn-load-samples');
  if (loadSamplesBtn) loadSamplesBtn.onclick = handleLoadSamplePack;

  const quickIngestBtn = document.getElementById('btn-quick-ingest-samples');
  if (quickIngestBtn) quickIngestBtn.onclick = handleLoadSamplePack;

  document.getElementById('btn-triage-from-evidence').onclick = () => {
    navigateTo('dashboard');
    setTimeout(() => {
      const startBtn = document.getElementById('btn-start-triage');
      if (startBtn) startBtn.click();
    }, 100);
  };

  loadEvidenceTable();
}
