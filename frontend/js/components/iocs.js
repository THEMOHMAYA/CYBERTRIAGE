// Indicators of Compromise (IOC) View
import { API } from '../api.js';

export async function renderIOCs(container, activeCase, navigateTo) {
  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <div>
        <h2 style="font-size:1.5rem; font-weight:700; color:#FFFFFF;">Threat Indicators & Potential IOCs</h2>
        <p style="font-size:0.875rem; color:var(--text-secondary);">
          Observed external IPs, suspicious command-lines, domains, hashes, and sensitive assets.
        </p>
      </div>

      <div style="display:flex; gap:0.5rem; align-items:center;">
        <select id="filter-ioc-type" style="padding:0.45rem 0.75rem; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:6px; color:#FFF; font-size:0.8rem;">
          <option value="All">All Types</option>
          <option value="IP">IP Address</option>
          <option value="Domain">Domain</option>
          <option value="Process">Process</option>
          <option value="File Path">File Path</option>
          <option value="SHA-256">SHA-256 Hash</option>
          <option value="URL">URL</option>
        </select>

        <select id="filter-ioc-status" style="padding:0.45rem 0.75rem; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:6px; color:#FFF; font-size:0.8rem;">
          <option value="All">All Statuses</option>
          <option value="Potential IOC">Potential IOC</option>
          <option value="Suspicious">Suspicious</option>
          <option value="Needs Investigation">Needs Investigation</option>
          <option value="Observed">Observed</option>
        </select>
      </div>
    </div>

    <div class="dfir-card">
      <div class="card-header">
        <div class="card-title">
          <i class="fa-solid fa-biohazard" style="color:var(--sev-medium);"></i>
          Extracted Indicators (<span id="iocs-count-label">0</span>)
        </div>
      </div>

      <div class="dfir-table-container">
        <table class="dfir-table">
          <thead>
            <tr>
              <th>Indicator</th>
              <th>Type</th>
              <th>Triage Status</th>
              <th>Confidence</th>
              <th>Occurrences</th>
              <th>First Seen</th>
              <th>Last Seen</th>
              <th>Source Evidence</th>
              <th>Context / Notes</th>
            </tr>
          </thead>
          <tbody id="iocs-table-body">
            <tr><td colspan="9" style="text-align:center; padding:3rem; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Loading indicators...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const typeFilter = document.getElementById('filter-ioc-type');
  const statusFilter = document.getElementById('filter-ioc-status');
  const tbody = document.getElementById('iocs-table-body');
  const countLabel = document.getElementById('iocs-count-label');

  async function loadData() {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:2rem; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Filtering indicators...</td></tr>`;
    try {
      const iocs = await API.getIOCs(activeCase.id, typeFilter.value, statusFilter.value);
      countLabel.textContent = iocs.length;

      if (!iocs || iocs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:2rem; color:var(--text-muted);">No threat indicators found matching current filters.</td></tr>`;
        return;
      }

      tbody.innerHTML = iocs.map(ioc => {
        let badgeClass = 'badge-info';
        if (ioc.status === 'Potential IOC' || ioc.status === 'Suspicious') badgeClass = 'badge-high';
        else if (ioc.status === 'Needs Investigation') badgeClass = 'badge-medium';
        else if (ioc.status === 'Verified') badgeClass = 'badge-critical';

        const firstSeenStr = (ioc.first_seen || '').replace('2026-09-18T', '').replace('Z', '');
        const lastSeenStr = (ioc.last_seen || '').replace('2026-09-18T', '').replace('Z', '');

        return `
          <tr>
            <td class="font-mono" style="font-weight:700; color:var(--accent-cyan); font-size:0.775rem;">${ioc.indicator}</td>
            <td><span class="badge badge-info" style="font-size:0.65rem;">${ioc.type}</span></td>
            <td><span class="badge ${badgeClass}" style="font-size:0.68rem;">${ioc.status}</span></td>
            <td><strong style="color:${ioc.confidence === 'High' ? 'var(--sev-high)' : 'var(--text-secondary)'}; font-size:0.75rem;">${ioc.confidence}</strong></td>
            <td class="font-mono" style="text-align:center; font-weight:600;">${ioc.occurrences}</td>
            <td class="font-mono" style="font-size:0.725rem; color:var(--text-muted);">${firstSeenStr || '-'}</td>
            <td class="font-mono" style="font-size:0.725rem; color:var(--text-muted);">${lastSeenStr || '-'}</td>
            <td style="font-weight:600; font-size:0.75rem;">${ioc.source_evidence_name || 'Evidence Store'}</td>
            <td style="font-size:0.75rem; color:var(--text-secondary); max-width:240px;">${ioc.context}</td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="9" style="color:var(--sev-critical); text-align:center; padding:2rem;">Error: ${err.message}</td></tr>`;
    }
  }

  typeFilter.onchange = loadData;
  statusFilter.onchange = loadData;
  loadData();
}
