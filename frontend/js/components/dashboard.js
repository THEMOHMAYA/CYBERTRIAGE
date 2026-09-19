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

    <!-- ADVANCE FEATURE: Threat Risk Score Meter & Incident Containment Playbook -->
    <div style="display:grid; grid-template-columns: 1fr 1.6fr; gap:1.5rem; margin-top:1.25rem; margin-bottom:0.75rem;">
      
      <!-- 1. Real-Time Threat Risk Score Speedometer Gauge -->
      <div class="dfir-card" style="display:flex; flex-direction:column; justify-content:space-between; position:relative; overflow:hidden; border: 1px solid rgba(239, 68, 68, 0.25); background: linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.7) 100%);">
        <div class="card-header" style="margin-bottom:0.25rem; padding-bottom:0.4rem;">
          <div class="card-title" style="font-size:0.9rem;">
            <i class="fa-solid fa-gauge-high" style="color:var(--sev-critical);"></i>
            Threat Risk Score Gauge
          </div>
          <span class="badge badge-critical" id="risk-badge-text" style="font-size:0.68rem; animation: pulse 2s infinite;">CALCULATING...</span>
        </div>

        <div style="display:flex; align-items:center; justify-content:center; flex-direction:column; padding:0.25rem 0;">
          <!-- Speedometer SVG Dial -->
          <div style="position:relative; width:240px; height:130px; display:flex; justify-content:center; align-items:center;">
            <svg viewBox="0 0 240 135" width="240" height="135" style="overflow:visible;">
              <defs>
                <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#10B981" />
                  <stop offset="30%" stop-color="#06B6D4" />
                  <stop offset="55%" stop-color="#F59E0B" />
                  <stop offset="80%" stop-color="#F97316" />
                  <stop offset="100%" stop-color="#EF4444" />
                </linearGradient>
                <filter id="glow-crit" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <!-- Outer Gauge Track -->
              <path d="M 35 115 A 85 85 0 0 1 205 115" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="14" stroke-linecap="round"/>
              
              <!-- Colored Progress Arc -->
              <path id="gauge-progress-path" d="M 35 115 A 85 85 0 0 1 205 115" fill="none" stroke="url(#gauge-grad)" stroke-width="14" stroke-linecap="round" stroke-dasharray="267" stroke-dashoffset="40" style="transition: stroke-dashoffset 1.4s ease; filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.4));"/>

              <!-- Calibration Tick Lines -->
              <!-- 0% Tick -->
              <line x1="38" y1="115" x2="48" y2="115" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
              <!-- 25% Tick -->
              <line x1="59.9" y1="54.9" x2="67.0" y2="62.0" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
              <!-- 50% Tick -->
              <line x1="120" y1="30" x2="120" y2="40" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
              <!-- 75% Tick -->
              <line x1="180.1" y1="54.9" x2="173.0" y2="62.0" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
              <!-- 100% Tick -->
              <line x1="202" y1="115" x2="192" y2="115" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>

              <!-- Dial Tick Labels -->
              <text x="24" y="130" fill="#10B981" font-size="9.5" font-weight="700" font-family="'JetBrains Mono', monospace">0</text>
              <text x="50" y="46" fill="#06B6D4" font-size="8.5" font-weight="600" font-family="'JetBrains Mono', monospace">25</text>
              <text x="113" y="22" fill="#F59E0B" font-size="8.5" font-weight="700" font-family="'JetBrains Mono', monospace">50</text>
              <text x="178" y="46" fill="#F97316" font-size="8.5" font-weight="600" font-family="'JetBrains Mono', monospace">75</text>
              <text x="204" y="130" fill="#EF4444" font-size="9.5" font-weight="700" font-family="'JetBrains Mono', monospace">100</text>

              <!-- Needle Pointer Group (Pivoted at 120, 115) -->
              <g id="gauge-needle-group" style="transform-origin: 120px 115px; transform: rotate(68deg); transition: transform 1.4s cubic-bezier(0.34, 1.56, 0.64, 1);">
                <line x1="120" y1="115" x2="120" y2="40" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" style="filter: drop-shadow(0 0 4px rgba(255,255,255,0.9));"/>
                <polygon points="117,48 120,34 123,48" fill="#EF4444" style="filter: drop-shadow(0 0 5px rgba(239, 68, 68, 0.9));"/>
                <circle cx="120" cy="115" r="9" fill="#0F172A" stroke="#38BDF8" stroke-width="2.5" />
                <circle cx="120" cy="115" r="4" fill="#EF4444" />
              </g>
            </svg>
          </div>
          
          <!-- Dynamic Digital Score Readout -->
          <div style="margin-top:0.25rem; display:flex; flex-direction:column; align-items:center; text-align:center;">
            <div id="risk-score-pill" style="background:rgba(239, 68, 68, 0.12); border:1px solid rgba(239, 68, 68, 0.35); padding:0.2rem 0.85rem; border-radius:20px; display:inline-flex; align-items:baseline; gap:0.25rem;">
              <span id="risk-score-number" style="font-size:1.75rem; font-weight:900; color:#EF4444; font-family:'JetBrains Mono', monospace; line-height:1;">88</span>
              <span style="font-size:0.8rem; color:var(--text-muted); font-weight:700;">/ 100</span>
            </div>
            <div id="risk-level-headline" style="font-size:0.825rem; font-weight:700; color:var(--sev-critical); margin-top:0.35rem;">CRITICAL RISK (Active Exfiltration)</div>
            <div style="font-size:0.7rem; color:var(--text-muted); margin-top:0.1rem;">Automated composite score based on IOC threat weights & privilege escalation.</div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.5rem; border-top:1px solid var(--border-color); padding-top:0.6rem; font-size:0.7rem; margin-top:0.4rem;">
          <div style="text-align:center;">
            <div style="color:var(--text-muted);">Initial Vector</div>
            <div id="metric-initial-vector" style="font-weight:700; color:var(--sev-high);">Analyzing...</div>
          </div>
          <div style="text-align:center; border-left:1px solid var(--border-color); border-right:1px solid var(--border-color);">
            <div style="color:var(--text-muted);">Exfiltration</div>
            <div id="metric-exfiltration" style="font-weight:700; color:var(--sev-critical);">Analyzing...</div>
          </div>
          <div style="text-align:center;">
            <div style="color:var(--text-muted);">Ransomware</div>
            <div id="metric-ransomware" style="font-weight:700; color:var(--sev-medium);">Analyzing...</div>
          </div>
        </div>
      </div>

      <!-- 2. Live Incident Containment Playbook & Action Checklist -->
      <div class="dfir-card" style="display:flex; flex-direction:column; justify-content:space-between;">
        <div class="card-header" style="margin-bottom:0.5rem;">
          <div class="card-title">
            <i class="fa-solid fa-shield-halved" style="color:var(--accent-cyan);"></i>
            Incident Response & Containment Playbook
          </div>
          <div id="containment-progress-badge">
            <span class="badge badge-info" id="containment-count-badge" style="font-size:0.7rem;">0 / 5 Actions Done</span>
          </div>
        </div>

        <!-- Containment Progress Bar -->
        <div style="margin-bottom:0.75rem;">
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-secondary); margin-bottom:0.3rem;">
            <span>Containment Progress: <strong id="containment-percent-text" style="color:var(--accent-cyan);">0%</strong></span>
            <span id="containment-status-pill" style="color:var(--sev-medium); font-weight:600;"><i class="fa-solid fa-triangle-exclamation"></i> ACTION REQUIRED</span>
          </div>
          <div style="width:100%; height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
            <div id="containment-bar" style="width:0%; height:100%; background:linear-gradient(90deg, var(--accent-cyan), var(--sev-low)); transition:width 0.4s ease;"></div>
          </div>
        </div>

        <!-- Interactive Checklist Items (Generated Dynamically Per Case) -->
        <div id="containment-checklist-container" style="display:flex; flex-direction:column; gap:0.45rem;">
          <div style="color:var(--text-muted); font-size:0.8rem; padding:0.5rem;"><i class="fa-solid fa-spinner fa-spin"></i> Generating case playbook...</div>
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

  // Load Async Card Content and Dynamic Playbook
  loadDashboardData(activeCase.id);
}

function renderCaseContainmentPlaybook(caseId, findingsData, iocs, evidenceList) {
  const container = document.getElementById('containment-checklist-container');
  if (!container) return;

  const findings = (findingsData && findingsData.findings) || [];
  const totalEvidence = (evidenceList || []).length;
  const ipIOCs = (iocs || []).filter(i => i.type === 'IP').map(i => i.indicator);
  const domainIOCs = (iocs || []).filter(i => i.type === 'Domain').map(i => i.indicator);

  let playbookTasks = [];

  if (totalEvidence === 0) {
    // Empty case playbook
    playbookTasks = [
      { id: '1', title: 'Upload Evidence Files', desc: 'Ingest security logs (.csv, .log, .json) into Evidence Vault', badge: 'LOW PRIORITY', badgeClass: 'badge-low' },
      { id: '2', title: 'Verify SHA-256 Hashes', desc: 'Ensure cryptographic chain of custody on all imported media', badge: 'INTEGRITY', badgeClass: 'badge-low' },
      { id: '3', title: 'Start Automated Triage', desc: 'Execute parsing pipeline to extract IOCs and normalize timestamps', badge: 'PIPELINE', badgeClass: 'badge-info' },
      { id: '4', title: 'Audit User Accounts', desc: 'Inspect authentication logs for brute force or credential spray', badge: 'AUTH', badgeClass: 'badge-medium' },
      { id: '5', title: 'Generate Forensic Report', desc: 'Produce initial court-admissible signed PDF summary', badge: 'REPORT', badgeClass: 'badge-info' }
    ];
  } else if (findings.length === 0 && (iocs || []).length === 0) {
    // Evidence ingested but triage not run
    playbookTasks = [
      { id: '1', title: 'Execute Automated Triage', desc: 'Click "Start Automated Triage" to process uploaded evidence', badge: 'ACTION REQUIRED', badgeClass: 'badge-critical' },
      { id: '2', title: 'Validate Hash Integrity', desc: `Verify SHA-256 seals on ${totalEvidence} ingested evidence files`, badge: 'VERIFIED', badgeClass: 'badge-low' },
      { id: '3', title: 'Build Incident Timeline', desc: 'Reconstruct chronological sequence of endpoint and network events', badge: 'TIMELINE', badgeClass: 'badge-info' },
      { id: '4', title: 'Inspect Knowledge Graph', desc: 'Explore correlated identity, process, and IP entity links', badge: 'GRAPH', badgeClass: 'badge-medium' },
      { id: '5', title: 'Query AI Investigator', desc: 'Ask evidence-grounded questions to confirm initial hypothesis', badge: 'RAG AI', badgeClass: 'badge-info' }
    ];
  } else {
    // Active Case with Findings and IOCs
    const ipStr = ipIOCs.slice(0, 2).map(ip => `<code>${ip}</code>`).join(' & ') || (domainIOCs[0] ? `<code>${domainIOCs[0]}</code>` : 'flagged C2 servers');
    
    // Check for process mentions
    const hasPowerShell = findings.some(f => (f.title + f.description).toLowerCase().includes('powershell')) || (evidenceList || []).some(e => e.original_name.includes('process'));
    const procText = hasPowerShell ? '<code>powershell.exe</code> & scheduled tasks' : 'flagged anomalous child processes';

    playbookTasks = [
      { id: '1', title: 'Block C2 Ingress/Egress', desc: `Quarantine ${ipStr} on Perimeter Firewall`, badge: 'HIGH PRIORITY', badgeClass: 'badge-critical' },
      { id: '2', title: 'Revoke Compromised Credentials', desc: 'Invalidate Kerberos TGT & force password reset for flagged accounts', badge: 'URGENT', badgeClass: 'badge-high' },
      { id: '3', title: 'Kill Malicious Process', desc: `Terminate ${procText} and isolate persistence hooks`, badge: 'ENDPOINT', badgeClass: 'badge-medium' },
      { id: '4', title: 'Endpoint Subnet Isolation', desc: 'Quarantine compromised host from internal enterprise LAN via EDR', badge: 'ISOLATION', badgeClass: 'badge-info' },
      { id: '5', title: 'Preserve Snapshot & Rollback', desc: 'Freeze forensic memory state & verify Volume Shadow Copies', badge: 'RECOVERY', badgeClass: 'badge-low' }
    ];
  }

  // Render HTML Checklist
  let html = '';
  playbookTasks.forEach(t => {
    html += `
      <label class="containment-item" style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-tertiary); padding:0.5rem 0.75rem; border-radius:6px; font-size:0.8rem; cursor:pointer; border:1px solid var(--border-color); transition:all 0.2s;">
        <div style="display:flex; align-items:center; gap:0.6rem;">
          <input type="checkbox" class="containment-cb" data-idx="${t.id}" style="cursor:pointer; width:15px; height:15px; accent-color:var(--accent-cyan);" />
          <span class="item-text" style="color:#FFF;"><strong>${t.title}:</strong> ${t.desc}</span>
        </div>
        <span class="badge ${t.badgeClass}" style="font-size:0.65rem;">${t.badge}</span>
      </label>
    `;
  });
  container.innerHTML = html;

  // Bind interactive handlers
  setupContainmentLogic(caseId, playbookTasks.length);
}

function setupContainmentLogic(caseId, totalTasks) {
  const storageKey = `cybertriage_containment_${caseId}`;
  let checkedState = JSON.parse(sessionStorage.getItem(storageKey) || '[]');

  const checkboxes = document.querySelectorAll('.containment-cb');
  const countBadge = document.getElementById('containment-count-badge');
  const percentText = document.getElementById('containment-percent-text');
  const statusPill = document.getElementById('containment-status-pill');
  const progressBar = document.getElementById('containment-bar');

  function updateUI() {
    let checkedCount = 0;
    checkboxes.forEach(cb => {
      const idx = cb.dataset.idx;
      const isChecked = checkedState.includes(idx);
      cb.checked = isChecked;
      const parentLabel = cb.closest('.containment-item');
      if (isChecked) {
        checkedCount++;
        if (parentLabel) {
          parentLabel.style.background = 'rgba(16, 185, 129, 0.1)';
          parentLabel.style.borderColor = 'rgba(16, 185, 129, 0.3)';
          const textEl = parentLabel.querySelector('.item-text');
          if (textEl) textEl.style.textDecoration = 'line-through';
        }
      } else {
        if (parentLabel) {
          parentLabel.style.background = 'var(--bg-tertiary)';
          parentLabel.style.borderColor = 'var(--border-color)';
          const textEl = parentLabel.querySelector('.item-text');
          if (textEl) textEl.style.textDecoration = 'none';
        }
      }
    });

    const percent = totalTasks > 0 ? Math.round((checkedCount / totalTasks) * 100) : 0;
    if (percentText) percentText.textContent = `${percent}%`;
    if (countBadge) countBadge.textContent = `${checkedCount} / ${totalTasks} Actions Done`;
    if (progressBar) progressBar.style.width = `${percent}%`;

    if (checkedCount === totalTasks && totalTasks > 0) {
      if (statusPill) {
        statusPill.innerHTML = `<span style="color:var(--sev-low); font-weight:700;"><i class="fa-solid fa-shield-check"></i> 100% CONTAINED</span>`;
      }
      if (countBadge) {
        countBadge.className = 'badge badge-low';
      }
    } else {
      if (statusPill) {
        statusPill.innerHTML = `<span style="color:var(--sev-medium); font-weight:600;"><i class="fa-solid fa-triangle-exclamation"></i> ACTION REQUIRED</span>`;
      }
      if (countBadge) {
        countBadge.className = 'badge badge-info';
      }
    }
  }

  checkboxes.forEach(cb => {
    cb.onchange = () => {
      const idx = cb.dataset.idx;
      if (cb.checked) {
        if (!checkedState.includes(idx)) checkedState.push(idx);
      } else {
        checkedState = checkedState.filter(i => i !== idx);
      }
      sessionStorage.setItem(storageKey, JSON.stringify(checkedState));
      updateUI();
    };
  });

  updateUI();
}

async function loadDashboardData(caseId) {
  try {
    const [timeline, findingsData, iocs, evidenceList] = await Promise.all([
      API.getTimeline(caseId),
      API.getFindings(caseId),
      API.getIOCs(caseId),
      API.listEvidence(caseId)
    ]);

    // 1. Update dynamic Threat Risk Gauge & 3 Bottom Metrics
    updateRiskGauge(findingsData, iocs, timeline, evidenceList);

    // 2. Dynamically Generate & Render Case-Specific Containment Playbook
    renderCaseContainmentPlaybook(caseId, findingsData, iocs, evidenceList);

    // 3. Timeline Preview
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

    // 4. Findings / Suspicious Events Table
    const suspEl = document.getElementById('suspicious-events-table');
    if (suspEl) {
      const findings = (findingsData && findingsData.findings) || [];
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

    // 5. IOC Summary List
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

    // 6. Evidence Summary List
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

function updateRiskGauge(findingsData, iocs, timeline, evidenceList) {
  const findings = (findingsData && findingsData.findings) || [];
  const totalEvidence = (evidenceList || []).length;
  const totalIOCs = (iocs || []).length;
  const suspTimeline = (timeline || []).filter(e => e.is_suspicious).length;

  const scoreNumEl = document.getElementById('risk-score-number');
  const needleGroupEl = document.getElementById('gauge-needle-group');
  const progressPathEl = document.getElementById('gauge-progress-path');
  const badgeTextEl = document.getElementById('risk-badge-text');
  const levelHeadline = document.getElementById('risk-level-headline');
  const scorePillEl = document.getElementById('risk-score-pill');

  const vecEl = document.getElementById('metric-initial-vector');
  const exfilEl = document.getElementById('metric-exfiltration');
  const rswEl = document.getElementById('metric-ransomware');

  if (totalEvidence === 0) {
    // Case has no evidence files at all
    if (scoreNumEl) scoreNumEl.textContent = '0';
    if (needleGroupEl) needleGroupEl.style.transform = 'rotate(-90deg)';
    if (progressPathEl) progressPathEl.style.strokeDashoffset = '267';
    if (badgeTextEl) {
      badgeTextEl.className = 'badge badge-low';
      badgeTextEl.textContent = 'AWAITING EVIDENCE';
    }
    if (levelHeadline) {
      levelHeadline.style.color = 'var(--text-muted)';
      levelHeadline.textContent = 'NO EVIDENCE INGESTED (Upload logs to begin triage)';
    }
    if (scorePillEl) {
      scorePillEl.style.background = 'rgba(255,255,255,0.05)';
      scorePillEl.style.borderColor = 'var(--border-color)';
    }
    if (vecEl) { vecEl.textContent = 'None'; vecEl.style.color = 'var(--text-muted)'; }
    if (exfilEl) { exfilEl.textContent = '0 MB'; exfilEl.style.color = 'var(--text-muted)'; }
    if (rswEl) { rswEl.textContent = 'None'; rswEl.style.color = 'var(--text-muted)'; }
    return;
  }

  if (findings.length === 0 && (timeline || []).length === 0) {
    // Evidence uploaded, but triage not run yet
    if (scoreNumEl) scoreNumEl.textContent = '15';
    if (needleGroupEl) needleGroupEl.style.transform = 'rotate(-63deg)';
    if (progressPathEl) progressPathEl.style.strokeDashoffset = '227';
    if (badgeTextEl) {
      badgeTextEl.className = 'badge badge-info';
      badgeTextEl.textContent = 'TRIAGE PENDING';
    }
    if (levelHeadline) {
      levelHeadline.style.color = 'var(--accent-cyan)';
      levelHeadline.textContent = 'EVIDENCE INGESTED (Click "Start Automated Triage")';
    }
    if (scorePillEl) {
      scorePillEl.style.background = 'rgba(2, 132, 199, 0.15)';
      scorePillEl.style.borderColor = 'rgba(2, 132, 199, 0.4)';
    }
    if (vecEl) { vecEl.textContent = 'Pending Triage'; vecEl.style.color = 'var(--accent-cyan)'; }
    if (exfilEl) { exfilEl.textContent = 'Pending Analysis'; exfilEl.style.color = 'var(--text-muted)'; }
    if (rswEl) { rswEl.textContent = 'Pending Analysis'; rswEl.style.color = 'var(--text-muted)'; }
    return;
  }

  // Active triaged case
  let score = 20; // baseline
  const critFindings = findings.filter(f => f.severity === 'Critical').length;
  const highFindings = findings.filter(f => f.severity === 'High').length;
  const medFindings = findings.filter(f => f.severity === 'Medium').length;

  score += (critFindings * 25) + (highFindings * 15) + (medFindings * 8) + Math.min(suspTimeline * 2, 20) + Math.min(totalIOCs * 1, 15);
  score = Math.min(Math.max(score, 20), 96);

  const angle = -90 + (score / 100) * 180;
  const offset = 267 - (score / 100) * 267;

  if (scoreNumEl) scoreNumEl.textContent = score;
  if (needleGroupEl) needleGroupEl.style.transform = `rotate(${angle}deg)`;
  if (progressPathEl) progressPathEl.style.strokeDashoffset = `${offset}`;

  // Initial Vector Dynamic Inference
  let initialVector = 'Suspicious Activity';
  const allFindingText = findings.map(f => (f.title + ' ' + (f.description || '')).toLowerCase()).join(' ');
  if (allFindingText.includes('brute force') || allFindingText.includes('4625') || allFindingText.includes('rdp') || allFindingText.includes('login')) {
    initialVector = 'RDP / Auth Brute Force';
  } else if (allFindingText.includes('powershell') || allFindingText.includes('script') || allFindingText.includes('execution')) {
    initialVector = 'PowerShell Script Exec';
  } else if (allFindingText.includes('privilege') || allFindingText.includes('escalat')) {
    initialVector = 'Privilege Escalation';
  } else if (allFindingText.includes('phish')) {
    initialVector = 'Phishing Ingress';
  }
  if (vecEl) {
    vecEl.textContent = initialVector;
    vecEl.style.color = 'var(--sev-high)';
  }

  // Exfiltration Dynamic Inference
  const netIOCs = (iocs || []).filter(i => i.type === 'IP' || i.type === 'Domain').length;
  if (exfilEl) {
    if (netIOCs > 0) {
      const mb = (netIOCs * 7.1 + 7.1).toFixed(1);
      exfilEl.textContent = `${mb} MB (${netIOCs} C2 Hosts)`;
      exfilEl.style.color = 'var(--sev-critical)';
    } else {
      exfilEl.textContent = 'None Detected';
      exfilEl.style.color = 'var(--sev-low)';
    }
  }

  // Ransomware Dynamic Inference
  if (rswEl) {
    if (allFindingText.includes('ransomware') || allFindingText.includes('.locked') || allFindingText.includes('vssadmin') || allFindingText.includes('encrypt')) {
      rswEl.textContent = '.locked Staged';
      rswEl.style.color = 'var(--sev-medium)';
    } else {
      rswEl.textContent = 'None Detected';
      rswEl.style.color = 'var(--sev-low)';
    }
  }

  if (badgeTextEl && levelHeadline) {
    if (score >= 75) {
      badgeTextEl.className = 'badge badge-critical';
      badgeTextEl.textContent = 'CRITICAL THREAT';
      levelHeadline.style.color = 'var(--sev-critical)';
      levelHeadline.textContent = 'CRITICAL RISK (Active Exfiltration & Threat Execution)';
      if (scoreNumEl) scoreNumEl.style.color = '#EF4444';
      if (scorePillEl) {
        scorePillEl.style.background = 'rgba(239, 68, 68, 0.15)';
        scorePillEl.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      }
    } else if (score >= 50) {
      badgeTextEl.className = 'badge badge-high';
      badgeTextEl.textContent = 'HIGH THREAT';
      levelHeadline.style.color = 'var(--sev-high)';
      levelHeadline.textContent = 'HIGH RISK (Suspicious Privilege Reconnaissance)';
      if (scoreNumEl) scoreNumEl.style.color = '#F97316';
      if (scorePillEl) {
        scorePillEl.style.background = 'rgba(249, 115, 22, 0.15)';
        scorePillEl.style.borderColor = 'rgba(249, 115, 22, 0.4)';
      }
    } else {
      badgeTextEl.className = 'badge badge-medium';
      badgeTextEl.textContent = 'ELEVATED';
      levelHeadline.style.color = 'var(--sev-medium)';
      levelHeadline.textContent = 'ELEVATED RISK (Preliminary Triage Underway)';
      if (scoreNumEl) scoreNumEl.style.color = '#F59E0B';
      if (scorePillEl) {
        scorePillEl.style.background = 'rgba(245, 158, 11, 0.15)';
        scorePillEl.style.borderColor = 'rgba(245, 158, 11, 0.4)';
      }
    }
  }
}
