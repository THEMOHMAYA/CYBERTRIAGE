// Cases Management and Case Creation View
import { API, formatISTDateTime } from '../api.js';

export async function renderCases(container, activeCase, onSelectCase, navigateTo) {
  container.innerHTML = `<div style="text-align:center; padding:3rem;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--accent-cyan);"></i></div>`;
  
  const cases = await API.listCases();
  let currentFilter = 'All';

  function renderView() {
    const totalCases = cases.length;
    const activeCasesCount = cases.filter(c => c.status !== 'Completed' && c.status !== 'Closed').length;
    const completedCasesCount = cases.filter(c => c.status === 'Completed' || c.status === 'Closed').length;
    const totalEvidenceCount = cases.reduce((acc, c) => acc + (c.evidence_count || 0), 0);

    const filteredCases = cases.filter(c => {
      if (currentFilter === 'Active') return c.status !== 'Completed' && c.status !== 'Closed';
      if (currentFilter === 'Completed') return c.status === 'Completed' || c.status === 'Closed';
      return true;
    });

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <div>
          <h2 style="font-size:1.5rem; font-weight:700; color:#FFFFFF;">Case Management</h2>
          <p style="font-size:0.875rem; color:var(--text-secondary);">
            Manage active investigations, review completed case archives, and maintain cryptographic evidence vaults.
          </p>
        </div>

        <button class="btn btn-primary" id="btn-create-case-modal">
          <i class="fa-solid fa-plus"></i> Create New Case
        </button>
      </div>

      <!-- Quick Metrics Overview -->
      <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:1rem; margin-bottom:1.5rem;">
        <div class="dfir-card" style="padding:1rem;">
          <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Total Cases</span>
          <div style="font-size:1.6rem; font-weight:800; color:#FFF; margin-top:0.25rem;">${totalCases}</div>
        </div>

        <div class="dfir-card" style="padding:1rem; border-left: 3px solid var(--accent-cyan);">
          <span style="font-size:0.75rem; color:var(--accent-cyan); font-weight:600; text-transform:uppercase;">Active Investigations</span>
          <div style="font-size:1.6rem; font-weight:800; color:var(--accent-cyan); margin-top:0.25rem;">${activeCasesCount}</div>
        </div>

        <div class="dfir-card" style="padding:1rem; border-left: 3px solid var(--sev-low);">
          <span style="font-size:0.75rem; color:var(--sev-low); font-weight:600; text-transform:uppercase;">Completed & Closed</span>
          <div style="font-size:1.6rem; font-weight:800; color:var(--sev-low); margin-top:0.25rem;">${completedCasesCount}</div>
        </div>

        <div class="dfir-card" style="padding:1rem;">
          <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600; text-transform:uppercase;">Evidence Preserved</span>
          <div style="font-size:1.6rem; font-weight:800; color:#FFF; margin-top:0.25rem;">${totalEvidenceCount} files</div>
        </div>
      </div>

      <!-- Filter Tabs & Case Table -->
      <div class="dfir-card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
          <div class="card-title">
            <i class="fa-solid fa-folder-tree" style="color:var(--accent-cyan);"></i>
            Investigation Cases Repository (<span id="cases-count-label">${filteredCases.length}</span>)
          </div>

          <!-- Status Filter Tabs -->
          <div style="display:flex; gap:0.35rem; background:var(--bg-tertiary); padding:0.25rem; border-radius:6px; border:1px solid var(--border-color);">
            <button class="btn btn-tab ${currentFilter === 'All' ? 'active' : ''}" data-filter="All" style="padding:0.3rem 0.65rem; font-size:0.75rem; background:${currentFilter === 'All' ? 'var(--accent-cyan)' : 'transparent'}; color:${currentFilter === 'All' ? '#000' : 'var(--text-secondary)'}; font-weight:600; border:none; border-radius:4px; cursor:pointer;">
              All (${totalCases})
            </button>
            <button class="btn btn-tab ${currentFilter === 'Active' ? 'active' : ''}" data-filter="Active" style="padding:0.3rem 0.65rem; font-size:0.75rem; background:${currentFilter === 'Active' ? 'var(--accent-cyan)' : 'transparent'}; color:${currentFilter === 'Active' ? '#000' : 'var(--text-secondary)'}; font-weight:600; border:none; border-radius:4px; cursor:pointer;">
              Active (${activeCasesCount})
            </button>
            <button class="btn btn-tab ${currentFilter === 'Completed' ? 'active' : ''}" data-filter="Completed" style="padding:0.3rem 0.65rem; font-size:0.75rem; background:${currentFilter === 'Completed' ? 'var(--sev-low)' : 'transparent'}; color:${currentFilter === 'Completed' ? '#000' : 'var(--text-secondary)'}; font-weight:600; border:none; border-radius:4px; cursor:pointer;">
              Completed (${completedCasesCount})
            </button>
          </div>
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
                <th>Investigation Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filteredCases.length === 0 ? `
                <tr><td colspan="9" style="text-align:center; padding:2.5rem; color:var(--text-muted);">No cases found in this category.</td></tr>
              ` : filteredCases.map(c => {
                const isCompleted = c.status === 'Completed' || c.status === 'Closed';
                const statusBadge = isCompleted 
                  ? `<span class="badge badge-low" style="font-size:0.7rem;"><i class="fa-solid fa-circle-check"></i> COMPLETED</span>`
                  : (c.status === 'Triaged'
                    ? `<span class="badge badge-info" style="font-size:0.7rem;"><i class="fa-solid fa-wand-magic-sparkles"></i> TRIAGED</span>`
                    : `<span class="badge badge-medium" style="font-size:0.7rem;"><i class="fa-solid fa-spinner fa-spin-pulse"></i> IN PROGRESS</span>`);

                return `
                  <tr style="${c.id === activeCase.id ? 'background:rgba(2,132,199,0.1);' : ''}">
                    <td class="font-mono" style="font-weight:700; color:var(--accent-cyan);">${c.case_code}</td>
                    <td style="font-weight:600; color:#FFF;">${c.name}</td>
                    <td>${c.investigator}</td>
                    <td style="font-size:0.8rem; color:var(--text-secondary);">${c.incident_type}</td>
                    <td><span class="badge badge-${c.priority.toLowerCase()}" style="font-size:0.68rem;">${c.priority}</span></td>
                    <td class="font-mono" style="font-size:0.8rem;">${c.evidence_count || 0}</td>
                    <td class="font-mono" style="font-size:0.8rem;">${c.artifact_count || 0}</td>
                    <td>${statusBadge}</td>
                    <td>
                      <div style="display:flex; gap:0.4rem; align-items:center;">
                        <button class="btn btn-secondary btn-switch-case" data-id="${c.id}" style="padding:0.25rem 0.55rem; font-size:0.725rem;">
                          ${c.id === activeCase.id ? '<i class="fa-solid fa-check"></i> Active' : 'Select'}
                        </button>
                        
                        <button class="btn btn-secondary btn-toggle-status" data-id="${c.id}" data-current="${c.status}" style="padding:0.25rem 0.5rem; font-size:0.725rem; color:${isCompleted ? 'var(--text-muted)' : 'var(--sev-low)'};" title="${isCompleted ? 'Reopen Case' : 'Mark as Completed'}">
                          <i class="fa-solid ${isCompleted ? 'fa-arrow-rotate-left' : 'fa-check'}"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Tab clicks
    container.querySelectorAll('.btn-tab').forEach(btn => {
      btn.onclick = () => {
        currentFilter = btn.dataset.filter;
        renderView();
      };
    });

    // Create Modal
    document.getElementById('btn-create-case-modal').onclick = () => {
      showCreateCaseModal(newCase => {
        onSelectCase(newCase);
        navigateTo('evidence');
      });
    };

    // Switch Case
    container.querySelectorAll('.btn-switch-case').forEach(btn => {
      btn.onclick = () => {
        const selected = cases.find(c => c.id === btn.dataset.id);
        if (selected) {
          onSelectCase(selected);
          navigateTo('dashboard');
        }
      };
    });

    // Toggle Status
    container.querySelectorAll('.btn-toggle-status').forEach(btn => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const caseId = btn.dataset.id;
        const current = btn.dataset.current;
        const target = (current === 'Completed' || current === 'Closed') ? 'In Progress' : 'Completed';
        
        try {
          const updated = await API.updateCaseStatus(caseId, target);
          const idx = cases.findIndex(c => c.id === caseId);
          if (idx !== -1) cases[idx].status = target;
          renderView();
        } catch (err) {
          alert('Error updating case status: ' + err.message);
        }
      };
    });
  }

  renderView();
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
