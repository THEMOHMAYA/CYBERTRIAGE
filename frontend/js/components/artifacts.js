// Artifact Explorer View
import { API } from '../api.js';

export async function renderArtifacts(container, activeCase, navigateTo) {
  const categories = [
    'All',
    'User Activity',
    'Authentication',
    'Files',
    'Processes',
    'Network',
    'Browser',
    'Devices',
    'System',
    'Security Events'
  ];

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <div>
        <h2 style="font-size:1.5rem; font-weight:700; color:#FFFFFF;">Artifact Explorer</h2>
        <p style="font-size:0.875rem; color:var(--text-secondary);">
          Granular normalized digital artifacts extracted from forensic logs and endpoint telemetry.
        </p>
      </div>

      <div style="display:flex; align-items:center; gap:0.75rem;">
        <input type="text" id="artifact-search-input" placeholder="Filter artifacts by key/value..." style="padding:0.45rem 0.85rem; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:6px; color:#FFF; font-size:0.825rem; width:220px;" />
      </div>
    </div>

    <!-- Category Tabs Filter -->
    <div style="display:flex; gap:0.4rem; overflow-x:auto; padding-bottom:0.75rem; margin-bottom:1rem;" id="artifact-category-tabs">
      ${categories.map((cat, i) => `
        <button class="btn ${i === 0 ? 'btn-primary' : 'btn-secondary'} tab-cat-btn" data-cat="${cat}" style="padding:0.35rem 0.75rem; font-size:0.775rem; white-space:nowrap;">
          ${cat}
        </button>
      `).join('')}
    </div>

    <!-- Artifacts Table Card -->
    <div class="dfir-card">
      <div class="card-header">
        <div class="card-title">
          <i class="fa-solid fa-microchip" style="color:var(--accent-cyan);"></i>
          Extracted Artifacts (<span id="artifacts-count-label">0</span>)
        </div>
      </div>

      <div class="dfir-table-container">
        <table class="dfir-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Artifact Property</th>
              <th>Extracted Value</th>
              <th>Source Location</th>
              <th>Source Evidence</th>
              <th>Raw Line Reference</th>
            </tr>
          </thead>
          <tbody id="artifacts-table-body">
            <tr><td colspan="6" style="text-align:center; padding:3rem; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Loading artifacts...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  let currentCategory = 'All';
  let searchQuery = '';

  const tbody = document.getElementById('artifacts-table-body');
  const countLabel = document.getElementById('artifacts-count-label');
  const searchInput = document.getElementById('artifact-search-input');
  const tabBtns = container.querySelectorAll('.tab-cat-btn');

  async function loadData() {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Filtering artifacts...</td></tr>`;
    try {
      const artifacts = await API.getArtifacts(activeCase.id, currentCategory, searchQuery);
      countLabel.textContent = artifacts.length;

      if (!artifacts || artifacts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">No artifacts found for category "${currentCategory}".</td></tr>`;
        return;
      }

      tbody.innerHTML = artifacts.map(art => `
        <tr>
          <td><span class="badge badge-info" style="font-size:0.68rem;">${art.category}</span></td>
          <td class="font-mono" style="font-weight:600; color:var(--accent-cyan); font-size:0.775rem;">${art.name}</td>
          <td style="word-break:break-all; max-width:320px; font-size:0.8rem;">${art.value}</td>
          <td class="font-mono" style="font-size:0.725rem; color:var(--text-muted);">${art.source_location || 'N/A'}</td>
          <td style="font-size:0.75rem; font-weight:600;">${art.evidence_filename || 'Evidence'}</td>
          <td style="font-size:0.725rem; color:var(--text-secondary); max-width:280px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${art.raw_reference}">
            ${art.raw_reference}
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="color:var(--sev-critical); text-align:center; padding:2rem;">Error: ${err.message}</td></tr>`;
    }
  }

  tabBtns.forEach(btn => {
    btn.onclick = () => {
      tabBtns.forEach(b => { b.className = 'btn btn-secondary tab-cat-btn'; });
      btn.className = 'btn btn-primary tab-cat-btn';
      currentCategory = btn.dataset.cat;
      loadData();
    };
  });

  let debounce;
  searchInput.oninput = () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      searchQuery = searchInput.value.trim();
      loadData();
    }, 250);
  };

  loadData();
}
