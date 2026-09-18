// Case Dashboard View
import { API, formatISTTime } from '../api.js';
import { showTriageModal } from './triage_modal.js';

export async function renderDashboard(container, activeCase, navigateTo) {
  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
      <div>
        <h2 style="font-size:1.5rem; font-weight:700; color:#FFFFFF; margin-bottom:0.25rem;">
          Case Dashboard: <span style="color:var(--accent-cyan); font-family:monospace;">${activeCase.case_code || 'INC-2026-DEMO'}</span>
        </h2>
        <p style="font-size:0.875rem; color:var(--text-secondary);">
          ${activeCase.name || 'Digital Forensics & Incident Response Investigation'} &bull; Priority: <strong style="color:var(--sev-high);">${activeCase.priority || 'High'}</strong> &bull; Investigator: <strong>${activeCase.investigator || 'Lead Forensic Analyst'}</strong>
        </p>
      </div>

      <div style="display:flex; gap:0.75rem;">
        <button class="btn btn-secondary" id="btn-reload-demo">
          <i class="fa-solid fa-rotate"></i> Reload Demo Case
        </button>
        <button class="btn btn-primary" id="btn-start-triage" style="padding:0.6rem 1.25rem; font-size:0.9rem;">
          <i class="fa-solid fa-play"></i> Start Automated Triage
        </button>
      </div>
    </div>

    <!-- KPI Metric Cards Grid -->
    <div class="kpi-grid">
      <div class="kpi-card" style="cursor:pointer;" id="kpi-evidence">
        <div class="kpi-icon cyan"><i class="fa-solid fa-file-shield"></i></div>
        <div class="kpi-meta">
          <p>Evidence Files</p>
          <h3 id="stat-evidence-count">${activeCase.evidence_count || 0}</h3>
        </div>
      </div>

      <div class="kpi-card" style="cursor:pointer;" id="kpi-artifacts">
        <div class="kpi-icon blue"><i class="fa-solid fa-microchip"></i></div>
        <div class="kpi-meta">
          <p>Extracted Artifacts</p>
          <h3 id="stat-artifact-count">${activeCase.artifact_count || 0}</h3>
        </div>
      </div>

      <div class="kpi-card" style="cursor:pointer;" id="kpi-iocs">
        <div class="kpi-icon amber"><i class="fa-solid fa-biohazard"></i></div>
        <div class="kpi-meta">
          <p>Potential IOCs</p>
          <h3 id="stat-ioc-count">${activeCase.ioc_count || 0}</h3>
        </div>
      </div>

      <div class="kpi-card" style="cursor:pointer;" id="kpi-suspicious">
        <div class="kpi-icon red"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <div class="kpi-meta">
          <p>Suspicious Events</p>
          <h3 id="stat-susp-count">${activeCase.suspicious_event_count || 0}</h3>
        </div>
      </div>

      <div class="kpi-card" style="cursor:pointer;" id="kpi-correlated">
        <div class="kpi-icon purple"><i class="fa-solid fa-diagram-project"></i></div>
        <div class="kpi-meta">
          <p>Correlated Clusters</p>
          <h3 id="stat-corr-count">${activeCase.correlated_event_count || 0}</h3>
        </div>
      </div>
    </div>

    <!-- Main Dashboard Grid Layout -->
    <div style="display:grid; grid-template-columns: 2fr 1fr; gap:1.5rem; margin-top:0.5rem;">
      <!-- Left Column: Timeline Preview & Recent Suspicious Events -->
      <div style="display:flex; flex-direction:column; gap:1.5rem;">
        
        <!-- Incident Timeline Preview Card -->
        <div class="dfir-card">
          <div class="card-header">
            <div class="card-title">
              <i class="fa-solid fa-clock-rotate-left" style="color:var(--accent-cyan);"></i>
              Incident Timeline Preview
            </div>
            <button class="btn btn-secondary" id="btn-view-full-timeline" style="font-size:0.75rem; padding:0.35rem 0.65rem;">
              Full Timeline <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>

          <div id="timeline-preview-content" class="timeline-container" style="padding-left:1.5rem;">
            <div style="color:var(--text-muted); font-size:0.85rem;"><i class="fa-solid fa-spinner fa-spin"></i> Loading timeline...</div>
          </div>
        </div>

        <!-- Recent Suspicious Activity Card -->
        <div class="dfir-card">
          <div class="card-header">
            <div class="card-title">
              <i class="fa-solid fa-shield-virus" style="color:var(--sev-critical);"></i>
              Critical & High Severity Detections
            </div>
            <button class="btn btn-secondary" id="btn-view-all-findings" style="font-size:0.75rem; padding:0.35rem 0.65rem;">
              All Findings <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>

          <div id="suspicious-events-table">
            <div style="color:var(--text-muted); font-size:0.85rem;"><i class="fa-solid fa-spinner fa-spin"></i> Loading findings...</div>
          </div>
        </div>
      </div>

      <!-- Right Column: AI Quick Query Box, Threat Indicators & Evidence Summary -->
      <div style="display:flex; flex-direction:column; gap:1.5rem;">
        
        <!-- AI Investigator Quick Assistant -->
        <div class="dfir-card" style="border-color: rgba(2, 132, 199, 0.4); background: linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(6, 9, 17, 0.95) 100%);">
          <div class="card-header" style="border-color: rgba(2, 132, 199, 0.3);">
            <div class="card-title" style="color:var(--accent-cyan);">
              <i class="fa-solid fa-robot"></i>
              AI Investigator Assistant
            </div>
            <span class="badge badge-low" style="font-size:0.65rem;">GROUNDED RAG</span>
          </div>

          <div style="font-size:0.825rem; color:var(--text-secondary); margin-bottom:0.75rem;">
            Ask questions backed strictly by case evidence & cryptographic chain of custody:
          </div>

          <div style="display:flex; flex-direction:column; gap:0.4rem; margin-bottom:1rem;">
            <button class="btn btn-secondary quick-q" style="font-size:0.78rem; text-align:left; justify-content:flex-start; padding:0.45rem 0.75rem;" data-q="What happened in this incident?">
              &bull; "What happened in this incident?"
            </button>
            <button class="btn btn-secondary quick-q" style="font-size:0.78rem; text-align:left; justify-content:flex-start; padding:0.45rem 0.75rem;" data-q="Which events are related to the USB activity?">
              &bull; "Which events are related to the USB activity?"
            </button>
            <button class="btn btn-secondary quick-q" style="font-size:0.78rem; text-align:left; justify-content:flex-start; padding:0.45rem 0.75rem;" data-q="Are there conflicting indicators?">
              &bull; "Are there conflicting indicators?"
            </button>
          </div>

          <button class="btn btn-primary" id="btn-open-ai-chat" style="width:100%;">
            <i class="fa-solid fa-comments"></i> Open AI Investigator Console
          </button>
        </div>

        <!-- Threat Indicator Summary Card -->
        <div class="dfir-card">
          <div class="card-header">
            <div class="card-title">
              <i class="fa-solid fa-biohazard" style="color:var(--sev-medium);"></i>
              Extracted Threat Indicators
            </div>
            <button class="btn btn-secondary" id="btn-view-all-iocs" style="font-size:0.75rem; padding:0.35rem 0.65rem;">
              View All <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>

          <div id="ioc-summary-list" style="display:flex; flex-direction:column; gap:0.5rem;">
            <div style="color:var(--text-muted); font-size:0.85rem;"><i class="fa-solid fa-spinner fa-spin"></i> Loading IOCs...</div>
          </div>
        </div>

        <!-- Recent Ingested Evidence Card -->
        <div class="dfir-card">
          <div class="card-header">
            <div class="card-title">
              <i class="fa-solid fa-fingerprint" style="color:var(--accent-cyan);"></i>
              Evidence Chain of Custody
            </div>
            <button class="btn btn-secondary" id="btn-view-evidence-ingest" style="font-size:0.75rem; padding:0.35rem 0.65rem;">
              Manage <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>

          <div id="evidence-summary-list" style="display:flex; flex-direction:column; gap:0.5rem;">
            <div style="color:var(--text-muted); font-size:0.85rem;"><i class="fa-solid fa-spinner fa-spin"></i> Loading evidence...</div>
          </div>
        </div>

      </div>
    </div>
  `;

  // Attach Navigation & Action Handlers
  document.getElementById('btn-start-triage').onclick = () => {
    showTriageModal(activeCase.id, () => {
      // Reload dashboard stats
      API.getCase(activeCase.id).then(updatedCase => {
        renderDashboard(container, updatedCase, navigateTo);
      });
    });
  };

  document.getElementById('btn-reload-demo').onclick = () => {
    container.innerHTML = `<div style="text-align:center; padding:5rem;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--accent-cyan);"></i><p style="margin-top:1rem;">Reloading synthetic forensic evidence files and recalculating SHA-256 hashes...</p></div>`;
    API.loadDemo().then(res => {
      renderDashboard(container, res.case, navigateTo);
    });
  };

  document.getElementById('btn-view-full-timeline').onclick = () => navigateTo('timeline');
  document.getElementById('btn-view-all-findings').onclick = () => navigateTo('findings');
  document.getElementById('btn-view-all-iocs').onclick = () => navigateTo('iocs');
  document.getElementById('btn-view-evidence-ingest').onclick = () => navigateTo('evidence');
  document.getElementById('btn-open-ai-chat').onclick = () => navigateTo('ai-investigator');

  document.getElementById('kpi-evidence').onclick = () => navigateTo('evidence');
  document.getElementById('kpi-artifacts').onclick = () => navigateTo('artifacts');
  document.getElementById('kpi-iocs').onclick = () => navigateTo('iocs');
  document.getElementById('kpi-suspicious').onclick = () => navigateTo('findings');
  document.getElementById('kpi-correlated').onclick = () => navigateTo('graph');

  container.querySelectorAll('.quick-q').forEach(btn => {
    btn.onclick = () => {
      sessionStorage.setItem('prefill_ai_query', btn.dataset.q);
      navigateTo('ai-investigator');
    };
  });

  // Load Async Card Content
  loadDashboardData(activeCase.id);
}

async function loadDashboardData(caseId) {
  try {
    const [timeline, findingsData, iocs, evidenceList] = await Promise.all([
      API.getTimeline(caseId),
      API.getFindings(caseId),
      API.getIOCs(caseId),
      API.listEvidence(caseId)
    ]);

    // 1. Timeline Preview
    const timelineEl = document.getElementById('timeline-preview-content');
    if (timelineEl) {
      if (!timeline || timeline.length === 0) {
        timelineEl.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem;">No timeline events generated yet. Click "Start Automated Triage".</div>`;
      } else {
        const previewEvents = timeline.filter(e => e.is_suspicious || e.severity !== 'Info').slice(0, 5);
        const eventsToShow = previewEvents.length > 0 ? previewEvents : timeline.slice(0, 5);
        
        let html = '';
        eventsToShow.forEach(evt => {
          const dotClass = evt.severity === 'Critical' ? 'critical' : (evt.severity === 'High' ? 'high' : (evt.severity === 'Medium' ? 'medium' : ''));
          const timeStr = formatISTTime(evt.timestamp);
          html += `
            <div class="timeline-item">
              <div class="timeline-dot ${dotClass}"></div>
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span class="font-mono" style="font-size:0.75rem; color:var(--accent-cyan); font-weight:600;">${timeStr}</span>
                <span class="badge badge-${evt.severity.toLowerCase()}">${evt.severity}</span>
              </div>
              <div style="font-size:0.875rem; font-weight:600; color:var(--text-primary);">${evt.event_type || evt.action}</div>
              <div style="font-size:0.775rem; color:var(--text-secondary);">${evt.details || evt.raw_reference}</div>
            </div>
          `;
        });
        timelineEl.innerHTML = html;
      }
    }

    // 2. Findings / Suspicious Events Table
    const suspEl = document.getElementById('suspicious-events-table');
    if (suspEl) {
      const findings = findingsData.findings || [];
      if (findings.length === 0) {
        suspEl.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem;">No findings generated yet. Run triage to analyze evidence.</div>`;
      } else {
        let html = `
          <div class="dfir-table-container">
            <table class="dfir-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Finding Title</th>
                  <th>MITRE Technique</th>
                  <th>Confidence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
        `;
        findings.slice(0, 4).forEach(f => {
          html += `
            <tr>
              <td><span class="badge badge-${f.severity.toLowerCase()}">${f.severity}</span></td>
              <td style="font-weight:600;">${f.title}</td>
              <td style="font-size:0.75rem; color:var(--accent-cyan); font-family:monospace;">${f.mitre_technique || 'N/A'}</td>
              <td>${f.confidence}</td>
              <td><span class="badge badge-medium" style="font-size:0.68rem;">${f.status}</span></td>
            </tr>
          `;
        });
        html += `</tbody></table></div>`;
        suspEl.innerHTML = html;
      }
    }

    // 3. IOC Summary List
    const iocEl = document.getElementById('ioc-summary-list');
    if (iocEl) {
      if (!iocs || iocs.length === 0) {
        iocEl.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem;">No IOCs identified yet.</div>`;
      } else {
        let html = '';
        iocs.slice(0, 4).forEach(ioc => {
          html += `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-tertiary); padding:0.5rem 0.75rem; border-radius:6px; font-size:0.825rem;">
              <div style="display:flex; flex-direction:column;">
                <span class="font-mono" style="font-weight:600; color:var(--accent-cyan);">${ioc.indicator}</span>
                <span style="font-size:0.7rem; color:var(--text-muted);">${ioc.type} &bull; ${ioc.source_evidence_name}</span>
              </div>
              <span class="badge badge-medium">${ioc.status}</span>
            </div>
          `;
        });
        iocEl.innerHTML = html;
      }
    }

    // 4. Evidence Summary List
    const evEl = document.getElementById('evidence-summary-list');
    if (evEl) {
      if (!evidenceList || evidenceList.length === 0) {
        evEl.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem;">No evidence files ingested yet.</div>`;
      } else {
        let html = '';
        evidenceList.slice(0, 4).forEach(ev => {
          html += `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-tertiary); padding:0.5rem 0.75rem; border-radius:6px; font-size:0.825rem;">
              <div style="display:flex; flex-direction:column;">
                <span style="font-weight:600;">${ev.original_name}</span>
                <span class="font-mono" style="font-size:0.68rem; color:var(--text-muted);">${ev.sha256.substring(0, 24)}...</span>
              </div>
              <span class="badge badge-low" style="font-size:0.65rem;">VERIFIED</span>
            </div>
          `;
        });
        evEl.innerHTML = html;
      }
    }

  } catch (err) {
    console.error('Error loading dashboard data:', err);
  }
}
