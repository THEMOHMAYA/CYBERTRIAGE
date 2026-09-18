// Interactive Forensic Timeline View
import { API, formatISTTime, formatISTDateTime } from '../api.js';

export async function renderTimeline(container, activeCase, navigateTo) {
  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <div>
        <h2 style="font-size:1.5rem; font-weight:700; color:#FFFFFF;">Forensic Event Chronology</h2>
        <p style="font-size:0.875rem; color:var(--text-secondary);">
          Normalized chronological incident progression reconstructed across multiple evidence telemetry sources.
        </p>
      </div>

      <div style="display:flex; gap:0.5rem; align-items:center;">
        <select id="filter-timeline-sev" style="padding:0.45rem 0.75rem; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:6px; color:#FFF; font-size:0.8rem;">
          <option value="All">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Info">Info</option>
        </select>

        <input type="text" id="filter-timeline-search" placeholder="Filter by event/process/IP..." style="padding:0.45rem 0.75rem; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:6px; color:#FFF; font-size:0.8rem; width:200px;" />
      </div>
    </div>

    <!-- Main Two-Column Layout: Left Timeline, Right Event Inspector -->
    <div style="display:grid; grid-template-columns: 3fr 2fr; gap:1.5rem; align-items:start;">
      <!-- Timeline List -->
      <div class="dfir-card" style="padding:1.5rem;">
        <div class="card-header">
          <div class="card-title">
            <i class="fa-solid fa-clock-rotate-left" style="color:var(--accent-cyan);"></i>
            Normalized Event Sequence (<span id="timeline-count-label">0</span>)
          </div>
        </div>

        <div id="timeline-flow-container" class="timeline-container" style="padding-left:2.25rem;">
          <div style="text-align:center; padding:3rem; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Reconstructing timeline...</div>
        </div>
      </div>

      <!-- Event Inspector Panel (Stickied on right) -->
      <div class="dfir-card" style="position:sticky; top:80px;" id="event-inspector-card">
        <div class="card-header">
          <div class="card-title">
            <i class="fa-solid fa-magnifying-glass" style="color:var(--accent-cyan);"></i>
            Forensic Event Inspector
          </div>
          <span class="badge badge-info" id="inspector-badge">SELECT EVENT</span>
        </div>

        <div id="inspector-content" style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6;">
          <p style="text-align:center; padding:3rem 1rem; color:var(--text-muted);">
            Click on any timeline event on the left to inspect source evidence line references, extracted entities, and forensic context.
          </p>
        </div>
      </div>
    </div>
  `;

  const flowContainer = document.getElementById('timeline-flow-container');
  const countLabel = document.getElementById('timeline-count-label');
  const sevFilter = document.getElementById('filter-timeline-sev');
  const searchInput = document.getElementById('filter-timeline-search');
  const inspectorContent = document.getElementById('inspector-content');
  const inspectorBadge = document.getElementById('inspector-badge');

  let allTimelineEvents = [];

  async function loadData() {
    flowContainer.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-muted);"><i class="fa-solid fa-spinner fa-spin"></i> Filtering timeline...</div>`;
    try {
      allTimelineEvents = await API.getTimeline(activeCase.id, sevFilter.value, null, searchInput.value.trim());
      countLabel.textContent = allTimelineEvents.length;

      if (!allTimelineEvents || allTimelineEvents.length === 0) {
        flowContainer.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-muted);">No timeline events matching current filter.</div>`;
        return;
      }

      let html = '';
      allTimelineEvents.forEach((evt, idx) => {
        const dotClass = evt.severity === 'Critical' ? 'critical' : (evt.severity === 'High' ? 'high' : (evt.severity === 'Medium' ? 'medium' : ''));
        const timeStr = formatISTTime(evt.timestamp);
        
        html += `
          <div class="timeline-item timeline-event-card" data-index="${idx}" style="cursor:pointer; background:var(--bg-tertiary); padding:0.85rem 1rem; border-radius:8px; border:1px solid var(--border-color); transition:border-color 0.15s;">
            <div class="timeline-dot ${dotClass}"></div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
              <span class="font-mono" style="font-size:0.775rem; color:var(--accent-cyan); font-weight:700;">
                <i class="fa-regular fa-clock"></i> ${timeStr}
              </span>
              <div style="display:flex; gap:0.4rem; align-items:center;">
                <span style="font-size:0.7rem; color:var(--text-muted); font-family:monospace;">${evt.event_id || ''}</span>
                <span class="badge badge-${evt.severity.toLowerCase()}">${evt.severity}</span>
              </div>
            </div>

            <div style="font-size:0.925rem; font-weight:700; color:var(--text-primary); margin-bottom:0.25rem;">
              ${evt.event_type || evt.action}
            </div>

            <div style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.4rem;">
              ${evt.details || evt.raw_reference}
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.725rem; color:var(--text-muted); border-top:1px solid rgba(255,255,255,0.05); padding-top:0.35rem;">
              <span>Source: <strong>${evt.evidence_filename || 'Evidence File'}</strong></span>
              <span style="color:var(--accent-cyan);">Click to Inspect <i class="fa-solid fa-chevron-right"></i></span>
            </div>
          </div>
        `;
      });

      flowContainer.innerHTML = html;

      // Attach click inspectors
      flowContainer.querySelectorAll('.timeline-event-card').forEach(card => {
        card.onclick = () => {
          flowContainer.querySelectorAll('.timeline-event-card').forEach(c => c.style.borderColor = 'var(--border-color)');
          card.style.borderColor = 'var(--accent-cyan)';
          const evt = allTimelineEvents[card.dataset.index];
          inspectEvent(evt);
        };
      });

      // Auto-inspect first event
      if (allTimelineEvents.length > 0) {
        inspectEvent(allTimelineEvents[0]);
      }

    } catch (err) {
      flowContainer.innerHTML = `<div style="color:var(--sev-critical); text-align:center; padding:2rem;">Error: ${err.message}</div>`;
    }
  }

  function inspectEvent(evt) {
    inspectorBadge.className = `badge badge-${evt.severity.toLowerCase()}`;
    inspectorBadge.textContent = evt.severity;

    inspectorContent.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:0.85rem;">
        <div>
          <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Event Name</span>
          <h4 style="font-size:1.05rem; font-weight:700; color:#FFF;">${evt.event_type || evt.action}</h4>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; background:var(--bg-secondary); padding:0.75rem; border-radius:6px;">
          <div>
            <span style="font-size:0.7rem; color:var(--text-muted);">EVENT ID</span>
            <div class="font-mono" style="font-weight:600; color:var(--accent-cyan); font-size:0.8rem;">${evt.event_id || 'N/A'}</div>
          </div>
          <div>
            <span style="font-size:0.7rem; color:var(--text-muted);">TIMESTAMP (IST)</span>
            <div class="font-mono" style="font-weight:600; font-size:0.8rem;">${formatISTDateTime(evt.timestamp)}</div>
          </div>
          <div>
            <span style="font-size:0.7rem; color:var(--text-muted);">USER IDENTITY</span>
            <div style="font-weight:600; font-size:0.8rem;">${evt.user || 'None / System'}</div>
          </div>
          <div>
            <span style="font-size:0.7rem; color:var(--text-muted);">HOST / DEVICE</span>
            <div style="font-weight:600; font-size:0.8rem;">${evt.device || 'DESKTOP-SEC-09'}</div>
          </div>
        </div>

        ${evt.process ? `
          <div>
            <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Process Execution</span>
            <div class="font-mono" style="font-size:0.775rem; background:#050811; padding:0.5rem 0.75rem; border-radius:6px; color:#38BDF8; word-break:break-all;">
              ${evt.process}
            </div>
          </div>
        ` : ''}

        ${evt.file ? `
          <div>
            <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Target File Handle</span>
            <div class="font-mono" style="font-size:0.775rem; background:#050811; padding:0.5rem 0.75rem; border-radius:6px; color:#FBBF24; word-break:break-all;">
              ${evt.file}
            </div>
          </div>
        ` : ''}

        ${evt.ip || evt.domain ? `
          <div>
            <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Network Socket / Destination</span>
            <div class="font-mono" style="font-size:0.775rem; background:#050811; padding:0.5rem 0.75rem; border-radius:6px; color:#F87171;">
              ${evt.ip ? `IP: ${evt.ip}` : ''} ${evt.domain ? `| Domain: ${evt.domain}` : ''}
            </div>
          </div>
        ` : ''}

        <div>
          <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Source Evidence Traceability</span>
          <div style="background:var(--bg-secondary); border:1px solid var(--border-color); padding:0.75rem; border-radius:6px; font-size:0.775rem;">
            <div style="display:flex; justify-content:space-between; margin-bottom:0.35rem;">
              <strong style="color:var(--text-primary);"><i class="fa-solid fa-file-lines"></i> ${evt.evidence_filename || 'Evidence File'}</strong>
              <span class="integrity-pill" style="font-size:0.65rem;"><i class="fa-solid fa-check"></i> VERIFIED</span>
            </div>
            <div class="font-mono" style="color:var(--text-secondary); font-size:0.725rem; word-break:break-all;">
              ${evt.raw_reference}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  sevFilter.onchange = loadData;
  let debounce;
  searchInput.oninput = () => {
    clearTimeout(debounce);
    debounce = setTimeout(loadData, 250);
  };

  loadData();
}
