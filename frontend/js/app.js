// CYBERTRIAGE AI - Master Frontend Application Router & State Manager
import { API } from './api.js';
import { renderDashboard } from './components/dashboard.js';
import { renderCases, showCreateCaseModal } from './components/create_case.js';
import { renderEvidence } from './components/evidence.js';
import { renderEvidenceExplorer } from './components/evidence_explorer.js';
import { renderArtifacts } from './components/artifacts.js';
import { renderIOCs } from './components/iocs.js';
import { renderTimeline } from './components/timeline.js';
import { renderGraph } from './components/graph.js';
import { renderAIInvestigator } from './components/ai_investigator.js';
import { renderFindings } from './components/findings.js';
import { renderReports } from './components/reports.js';
import { renderSettings } from './components/settings.js';
import { showSearchModal } from './components/search_modal.js';

class CyberTriageApp {
  constructor() {
    this.activeCase = null;
    this.currentPage = 'dashboard';
    this.contentContainer = document.getElementById('page-content');
  }

  async init() {
    this.attachEventListeners();
    await this.loadInitialCase();
  }

  attachEventListeners() {
    // Sidebar Navigation Click Handlers
    const navItems = document.querySelectorAll('#sidebar-nav .nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        this.navigateTo(page);
      });
    });

    // Topbar Search button
    const searchBtn = document.getElementById('btn-open-search');
    if (searchBtn) {
      searchBtn.onclick = () => {
        if (this.activeCase) {
          showSearchModal(this.activeCase.id, (type, id) => {
            if (type === 'event') this.navigateTo('timeline');
            else if (type === 'ioc') this.navigateTo('iocs');
          });
        }
      };
    }

    // Topbar Quick Create Case button
    const quickCreateBtn = document.getElementById('btn-quick-create-case');
    if (quickCreateBtn) {
      quickCreateBtn.onclick = () => {
        showCreateCaseModal(newCase => {
          this.setActiveCase(newCase);
          this.navigateTo('evidence');
        });
      };
    }

    // Keyboard Shortcut (Ctrl+K or Cmd+K)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (this.activeCase) {
          showSearchModal(this.activeCase.id, (type, id) => {
            if (type === 'event') this.navigateTo('timeline');
            else if (type === 'ioc') this.navigateTo('iocs');
          });
        }
      }
    });
  }

  async loadInitialCase() {
    try {
      const cases = await API.listCases();
      if (cases && cases.length > 0) {
        this.setActiveCase(cases[0]);
      } else {
        // If no cases exist yet, auto-load synthetic demo case
        const demoRes = await API.loadDemo();
        this.setActiveCase(demoRes.case);
      }
      this.navigateTo('dashboard');
    } catch (err) {
      console.error('Error loading initial case:', err);
      // Try loading demo
      try {
        const demoRes = await API.loadDemo();
        this.setActiveCase(demoRes.case);
        this.navigateTo('dashboard');
      } catch (demoErr) {
        this.contentContainer.innerHTML = `<div style="color:var(--sev-critical); padding:3rem; text-align:center;">Failed to connect to CYBERTRIAGE backend: ${demoErr.message}</div>`;
      }
    }
  }

  setActiveCase(caseObj) {
    this.activeCase = caseObj;

    // Update Topbar
    const codeEl = document.getElementById('topbar-case-code');
    const nameEl = document.getElementById('topbar-case-name');
    const statusEl = document.getElementById('topbar-case-status');
    const investigatorEl = document.getElementById('topbar-investigator');

    if (codeEl) codeEl.textContent = caseObj.case_code || 'INC-2026-DEMO';
    if (nameEl) nameEl.textContent = caseObj.name || 'Forensic Investigation';
    if (statusEl) {
      statusEl.textContent = caseObj.status || 'In Progress';
      statusEl.className = `badge ${caseObj.status === 'Closed' ? 'badge-low' : 'badge-info'}`;
    }
    if (investigatorEl) investigatorEl.textContent = caseObj.investigator || 'Lead Examiner';
  }

  navigateTo(page) {
    this.currentPage = page;

    // Update active nav link
    const navItems = document.querySelectorAll('#sidebar-nav .nav-item');
    navItems.forEach(item => {
      if (item.dataset.page === page) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    if (!this.activeCase) {
      this.contentContainer.innerHTML = `<div style="text-align:center; padding:3rem;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>`;
      return;
    }

    // Route to appropriate page component
    switch (page) {
      case 'dashboard':
        renderDashboard(this.contentContainer, this.activeCase, this.navigateTo.bind(this));
        break;
      case 'cases':
        renderCases(this.contentContainer, this.activeCase, this.setActiveCase.bind(this), this.navigateTo.bind(this));
        break;
      case 'evidence':
        renderEvidence(this.contentContainer, this.activeCase, this.navigateTo.bind(this));
        break;
      case 'evidence-explorer':
        renderEvidenceExplorer(this.contentContainer, this.activeCase, this.navigateTo.bind(this));
        break;
      case 'artifacts':
        renderArtifacts(this.contentContainer, this.activeCase, this.navigateTo.bind(this));
        break;
      case 'iocs':
        renderIOCs(this.contentContainer, this.activeCase, this.navigateTo.bind(this));
        break;
      case 'timeline':
        renderTimeline(this.contentContainer, this.activeCase, this.navigateTo.bind(this));
        break;
      case 'graph':
        renderGraph(this.contentContainer, this.activeCase, this.navigateTo.bind(this));
        break;
      case 'ai-investigator':
        renderAIInvestigator(this.contentContainer, this.activeCase, this.navigateTo.bind(this));
        break;
      case 'findings':
        renderFindings(this.contentContainer, this.activeCase, this.navigateTo.bind(this));
        break;
      case 'reports':
        renderReports(this.contentContainer, this.activeCase, this.navigateTo.bind(this));
        break;
      case 'settings':
        renderSettings(this.contentContainer, this.activeCase, this.navigateTo.bind(this));
        break;
      default:
        renderDashboard(this.contentContainer, this.activeCase, this.navigateTo.bind(this));
    }
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new CyberTriageApp();
  app.init();
});
