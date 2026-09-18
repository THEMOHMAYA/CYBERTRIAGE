// CYBERTRIAGE AI - REST API Client
const API_BASE = '/api';

export const API = {
  // Cases
  async listCases() {
    const res = await fetch(`${API_BASE}/cases`);
    return await res.json();
  },

  async getCase(caseId) {
    const res = await fetch(`${API_BASE}/cases/${caseId}`);
    return await res.json();
  },

  async createCase(data) {
    const res = await fetch(`${API_BASE}/cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  // Evidence
  async uploadEvidence(caseId, files) {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    const res = await fetch(`${API_BASE}/cases/${caseId}/evidence`, {
      method: 'POST',
      body: formData
    });
    return await res.json();
  },

  async listEvidence(caseId) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/evidence`);
    return await res.json();
  },

  async getRawEvidence(caseId, evidenceId) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/evidence/${evidenceId}/raw`);
    return await res.json();
  },

  // Triage Pipeline
  async executeTriage(caseId) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/triage`, {
      method: 'POST'
    });
    return await res.json();
  },

  // Artifacts
  async getArtifacts(caseId, category = null, search = null) {
    let url = `${API_BASE}/cases/${caseId}/artifacts?limit=150`;
    if (category && category !== 'All') url += `&category=${encodeURIComponent(category)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = await fetch(url);
    return await res.json();
  },

  // IOCs
  async getIOCs(caseId, type = null, status = null) {
    let url = `${API_BASE}/cases/${caseId}/iocs?`;
    if (type && type !== 'All') url += `&type=${encodeURIComponent(type)}`;
    if (status && status !== 'All') url += `&status=${encodeURIComponent(status)}`;
    const res = await fetch(url);
    return await res.json();
  },

  // Timeline
  async getTimeline(caseId, severity = null, category = null, search = null) {
    let url = `${API_BASE}/cases/${caseId}/timeline?`;
    if (severity && severity !== 'All') url += `&severity=${encodeURIComponent(severity)}`;
    if (category && category !== 'All') url += `&category=${encodeURIComponent(category)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = await fetch(url);
    return await res.json();
  },

  // Graph
  async getGraph(caseId) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/graph`);
    return await res.json();
  },

  // Findings & Conflicts
  async getFindings(caseId) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/findings`);
    return await res.json();
  },

  // AI Investigator
  async queryAI(caseId, question) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/investigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });
    return await res.json();
  },

  // Reports
  async generateReport(caseId, data) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  // Demo Case Loader
  async loadDemo() {
    const res = await fetch(`${API_BASE}/demo/load`, {
      method: 'POST'
    });
    return await res.json();
  },

  async loadSampleEvidence(caseId) {
    const res = await fetch(`${API_BASE}/cases/${caseId}/evidence/load-samples`, {
      method: 'POST'
    });
    return await res.json();
  },

  getSamplePackUrl() {
    return `${API_BASE}/demo/sample-pack.zip`;
  },

  // Global Search
  async search(caseId, query) {
    const res = await fetch(`${API_BASE}/search?case_id=${caseId}&q=${encodeURIComponent(query)}`);
    return await res.json();
  }
};

// 12-Hour IST (India Standard Time) Formatter Utility
export function formatISTTime(timestampStr) {
  if (!timestampStr) return 'N/A';
  try {
    let clean = String(timestampStr).trim();
    if (!clean.endsWith('Z') && !clean.includes('+') && !clean.includes('-')) {
      clean += 'Z';
    }
    const d = new Date(clean);
    if (isNaN(d.getTime())) return timestampStr;
    return d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: true,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    }) + ' IST';
  } catch (e) {
    return timestampStr;
  }
}

export function formatISTDateTime(timestampStr) {
  if (!timestampStr) return 'N/A';
  try {
    let clean = String(timestampStr).trim();
    if (!clean.endsWith('Z') && !clean.includes('+') && !clean.includes('-')) {
      clean += 'Z';
    }
    const d = new Date(clean);
    if (isNaN(d.getTime())) return timestampStr;
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: true,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit'
    }) + ' IST';
  } catch (e) {
    return timestampStr;
  }
}

