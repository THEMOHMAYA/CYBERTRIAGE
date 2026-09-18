// Cases Management and Case Creation View
import { API } from '../api.js';

export async function renderCases(container, activeCase, onSelectCase, navigateTo) {
  container.innerHTML = `<div style="text-align:center; padding:3rem;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--accent-cyan);"></i></div>`;
  
  const cases = await API.listCases();

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <div>
        <h2 style="font-size:1.5rem; font-weight:700; color:#FFFFFF;">Case Management</h2>
        <p style="font-size:0.875rem; color:var(--text-secondary);">Manage forensic investigations, chain of custody logs, and evidence vaults.</p>
      </div>

      <button class="btn btn-primary" id="btn-create-case-modal">
        <i class="fa-solid fa-plus"></i> Create New Case
      </button>
    </div>

    <div class="dfir-card">
      <div class="card-header">
        <div class="card-title"><i class="fa-solid fa-folder-tree" style="color:var(--accent-cyan);"></i> Active & Archived Cases (${cases.length})</div>
      </div>

      <div class="dfir-table-container">
        <table class="dfir-table">
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Case Name</th>
              <th>Investigator</th>
              <th>Incident Type</th>
              <th>Priority</th>
              <th>Evidence</th>
              <th>Artifacts</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${cases.map(c => `
              <tr style="${c.id === activeCase.id ? 'background:rgba(2,132,199,0.1);' : ''}">
                <td class="font-mono" style="font-weight:700; color:var(--accent-cyan);">${c.case_code}</td>
                <td style="font-weight:600;">${c.name}</td>
                <td>${c.investigator}</td>
                <td>${c.incident_type}</td>
                <td><span class="badge badge-${c.priority.toLowerCase()}">${c.priority}</span></td>
                <td>${c.evidence_count || 0}</td>
                <td>${c.artifact_count || 0}</td>
                <td><span class="badge badge-info">${c.status}</span></td>
                <td>
                  <button class="btn btn-secondary btn-switch-case" data-id="${c.id}" style="padding:0.25rem 0.55rem; font-size:0.75rem;">
                    ${c.id === activeCase.id ? '<i class="fa-solid fa-check"></i> Active' : 'Select Case'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btn-create-case-modal').onclick = () => {
    showCreateCaseModal(newCase => {
      onSelectCase(newCase);
      navigateTo('evidence');
    });
  };

  container.querySelectorAll('.btn-switch-case').forEach(btn => {
    btn.onclick = () => {
      const selected = cases.find(c => c.id === btn.dataset.id);
      if (selected) {
        onSelectCase(selected);
        navigateTo('dashboard');
      }
    };
  });
}

export function showCreateCaseModal(onCreated) {
  const modalRoot = document.getElementById('modal-root');
  modalRoot.innerHTML = `
    <div class="modal-overlay" id="create-case-overlay">
      <div class="modal-box" style="max-width: 540px;">
        <div class="modal-header">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <i class="fa-solid fa-folder-plus" style="color:var(--accent-cyan); font-size:1.1rem;"></i>
            <h3 style="font-size:1.1rem; font-weight:700;">Create Investigation Case</h3>
          </div>
          <button id="btn-close-modal" style="background:none; border:none; color:var(--text-muted); cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <form id="form-create-case">
          <div class="modal-body" style="display:flex; flex-direction:column; gap:1rem;">
            <div>
              <label style="display:block; font-size:0.8rem; font-weight:600; color:var(--text-secondary); margin-bottom:0.35rem;">Case Name *</label>
              <input type="text" id="case-name" required placeholder="e.g. Suspicious Data Access Investigation" style="width:100%; padding:0.6rem; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:6px; color:#FFF; font-family:inherit;" />
            </div>

            <div>
              <label style="display:block; font-size:0.8rem; font-weight:600; color:var(--text-secondary); margin-bottom:0.35rem;">Incident Type</label>
              <select id="case-type" style="width:100%; padding:0.6rem; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:6px; color:#FFF; font-family:inherit;">
                <option value="Unauthorized Data Access">Unauthorized Data Access</option>
                <option value="Ransomware / Extortion">Ransomware / Extortion</option>
                <option value="Malware Outbreak">Malware Outbreak</option>
                <option value="Insider Threat / Data Theft">Insider Threat / Data Theft</option>
                <option value="Command & Control Beaconing">Command & Control Beaconing</option>
                <option value="Credential Stuffing">Credential Stuffing</option>
              </select>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
              <div>
                <label style="display:block; font-size:0.8rem; font-weight:600; color:var(--text-secondary); margin-bottom:0.35rem;">Priority</label>
                <select id="case-priority" style="width:100%; padding:0.6rem; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:6px; color:#FFF; font-family:inherit;">
                  <option value="Critical">Critical</option>
                  <option value="High" selected>High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label style="display:block; font-size:0.8rem; font-weight:600; color:var(--text-secondary); margin-bottom:0.35rem;">Lead Investigator</label>
                <input type="text" id="case-investigator" value="Lead Forensic Analyst" style="width:100%; padding:0.6rem; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:6px; color:#FFF; font-family:inherit;" />
              </div>
            </div>

            <div>
              <label style="display:block; font-size:0.8rem; font-weight:600; color:var(--text-secondary); margin-bottom:0.35rem;">Case Description / Hypothesis</label>
              <textarea id="case-desc" rows="3" placeholder="Brief summary of initial alert, reporting department, or scope..." style="width:100%; padding:0.6rem; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:6px; color:#FFF; font-family:inherit; resize:vertical;"></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="btn-cancel-create">Cancel</button>
            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-arrow-right"></i> Create & Ingest Evidence</button>
          </div>
        </form>
      </div>
    </div>
  `;

  function close() { modalRoot.innerHTML = ''; }
  document.getElementById('btn-close-modal').onclick = close;
  document.getElementById('btn-cancel-create').onclick = close;

  document.getElementById('form-create-case').onsubmit = (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById('case-name').value.trim(),
      incident_type: document.getElementById('case-type').value,
      priority: document.getElementById('case-priority').value,
      investigator: document.getElementById('case-investigator').value.trim(),
      description: document.getElementById('case-desc').value.trim()
    };

    API.createCase(data).then(newCase => {
      close();
      if (onCreated) onCreated(newCase);
    }).catch(err => {
      alert('Error creating case: ' + err.message);
    });
  };
}
