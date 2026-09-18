// Universal Case// OmniSearch Modal Component (Ctrl+K)
import { API, formatISTDateTime } from '../api.js';

export function showSearchModal(caseId, onSelectResult) {
  const modalRoot = document.getElementById('modal-root');

  modalRoot.innerHTML = `
    <div class="modal-overlay" id="search-modal-overlay">
      <div class="modal-box" style="max-width: 680px; height: 500px;">
        <div class="modal-header" style="padding: 0.85rem 1.25rem;">
          <div style="display:flex; align-items:center; gap:0.75rem; width:100%;">
            <i class="fa-solid fa-search" style="color:var(--accent-cyan);"></i>
            <input type="text" id="global-search-input" placeholder="Search IP, Domain, Username, Filename, Process, Event ID..." style="background:transparent; border:none; outline:none; color:#FFF; font-size:0.95rem; width:100%; font-family:inherit;" autofocus autocomplete="off" />
          </div>
          <button id="btn-close-search" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1.1rem;"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-body" id="search-results-body" style="padding: 1rem 1.25rem;">
          <div style="text-align:center; padding: 2rem 1rem; color:var(--text-muted); font-size:0.85rem;">
            Type at least 2 characters to search across all case entities and evidence records.
          </div>
        </div>

        <div class="modal-footer" style="padding:0.6rem 1.25rem; font-size:0.75rem; color:var(--text-muted); justify-content:space-between;">
          <span>Navigate with mouse or click item to inspect</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  `;

  const input = document.getElementById('global-search-input');
  const resultsBody = document.getElementById('search-results-body');
  const overlay = document.getElementById('search-modal-overlay');
  const closeBtn = document.getElementById('btn-close-search');

  function close() {
    modalRoot.innerHTML = '';
  }

  closeBtn.onclick = close;
  overlay.onclick = (e) => {
    if (e.target === overlay) close();
  };

  let debounceTimer;
  input.oninput = () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (q.length < 2) {
      resultsBody.innerHTML = `
        <div style="text-align:center; padding: 2rem 1rem; color:var(--text-muted); font-size:0.85rem;">
          Type at least 2 characters to search...
        </div>
      `;
      return;
    }

    resultsBody.innerHTML = `<div style="text-align:center; padding:1.5rem;"><i class="fa-solid fa-spinner fa-spin" style="color:var(--accent-cyan);"></i> Searching evidence...</div>`;

    debounceTimer = setTimeout(() => {
      API.search(caseId, q).then(res => {
        if (!res.results_count) {
          resultsBody.innerHTML = `<div style="text-align:center; padding: 2rem 1rem; color:var(--text-muted); font-size:0.85rem;">No matching events or IOCs found for "${q}".</div>`;
          return;
        }

        let html = `<div style="display:flex; flex-direction:column; gap:0.6rem;">`;

        if (res.iocs && res.iocs.length > 0) {
          html += `<div style="font-size:0.75rem; font-weight:700; color:var(--accent-cyan); text-transform:uppercase;">Threat Indicators (${res.iocs.length})</div>`;
          res.iocs.forEach(ioc => {
            html += `
              <div class="search-item" style="padding:0.5rem 0.75rem; background:var(--bg-tertiary); border-radius:6px; font-size:0.825rem; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" data-type="ioc" data-id="${ioc.id}">
                <div>
                  <span class="font-mono" style="color:var(--accent-cyan); font-weight:600;">${ioc.indicator}</span>
                  <span style="font-size:0.75rem; color:var(--text-muted); margin-left:0.5rem;">[${ioc.type}]</span>
                </div>
                <span class="badge badge-medium">${ioc.status}</span>
              </div>
            `;
          });
        }

        if (res.events && res.events.length > 0) {
          html += `<div style="font-size:0.75rem; font-weight:700; color:var(--accent-blue); text-transform:uppercase; margin-top:0.5rem;">Timeline Events (${res.events.length})</div>`;
          res.events.forEach(evt => {
            html += `
              <div class="search-item" style="padding:0.5rem 0.75rem; background:var(--bg-tertiary); border-radius:6px; font-size:0.825rem; display:flex; flex-direction:column; gap:0.2rem; cursor:pointer;" data-type="event" data-id="${evt.id}">
                <div style="display:flex; justify-content:space-between;">
                  <span style="font-weight:600;">${evt.event_type || 'Event'} (${evt.event_id})</span>
                  <span class="font-mono" style="color:var(--text-muted); font-size:0.75rem;">${formatISTDateTime(evt.timestamp)}</span>
                </div>
                <div style="font-size:0.75rem; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                  ${evt.raw_reference || evt.process || evt.file || evt.ip}
                </div>
              </div>
            `;
          });
        }

        html += `</div>`;
        resultsBody.innerHTML = html;

        resultsBody.querySelectorAll('.search-item').forEach(item => {
          item.onclick = () => {
            close();
            if (onSelectResult) onSelectResult(item.dataset.type, item.dataset.id);
          };
        });
      }).catch(err => {
        resultsBody.innerHTML = `<div style="color:var(--sev-critical); text-align:center;">Search error: ${err.message}</div>`;
      });
    }, 200);
  };

  input.focus();
}
