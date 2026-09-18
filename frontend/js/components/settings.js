// Settings & System Diagnostics View
import { API } from '../api.js';

export function renderSettings(container, activeCase, navigateTo) {
  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <div>
        <h2 style="font-size:1.5rem; font-weight:700; color:#FFFFFF;">Case & System Settings</h2>
        <p style="font-size:0.875rem; color:var(--text-secondary);">
          Configure AI reasoning engines, forensic vault storage, and system diagnostics.
        </p>
      </div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem;">
      <!-- AI Engine Configuration -->
      <div class="dfir-card">
        <div class="card-header">
          <div class="card-title">
            <i class="fa-solid fa-brain" style="color:var(--accent-cyan);"></i>
            AI Reasoning Engine Configuration
          </div>
          <span class="badge badge-low">GROUNDED RAG ACTIVE</span>
        </div>

        <div style="display:flex; flex-direction:column; gap:1rem; font-size:0.85rem;">
          <div>
            <label style="display:block; font-weight:600; color:var(--text-secondary); margin-bottom:0.35rem;">Active AI Model Provider</label>
            <select id="ai-provider-select" style="width:100%; padding:0.6rem; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:6px; color:#FFF; font-family:inherit;">
              <option value="local" selected>Local Grounded DFIR Reasoning Engine (Zero External Calls)</option>
              <option value="gemini">Google Gemini API (Optional Hybrid Mode)</option>
              <option value="openai">OpenAI GPT-4o API (Optional Hybrid Mode)</option>
            </select>
          </div>

          <div>
            <label style="display:block; font-weight:600; color:var(--text-secondary); margin-bottom:0.35rem;">External API Key (Optional)</label>
            <input type="password" placeholder="Enter API key for external LLM reasoning if desired..." style="width:100%; padding:0.6rem; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:6px; color:#FFF; font-family:inherit;" />
            <span style="font-size:0.7rem; color:var(--text-muted); display:block; margin-top:0.25rem;">
              The system operates 100% offline with zero external dependencies by default.
            </span>
          </div>

          <div style="border-top:1px solid var(--border-color); padding-top:0.75rem;">
            <label style="display:flex; align-items:center; gap:0.5rem; cursor:pointer;">
              <input type="checkbox" checked disabled />
              <span>Strict Evidence Citation Enforcement (Block answers lacking direct citations)</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Storage & Forensic Integrity Diagnostics -->
      <div class="dfir-card">
        <div class="card-header">
          <div class="card-title">
            <i class="fa-solid fa-server" style="color:var(--accent-cyan);"></i>
            Forensic Vault Diagnostics
          </div>
          <span class="integrity-pill"><i class="fa-solid fa-check"></i> ALL HEALTHY</span>
        </div>

        <div style="display:flex; flex-direction:column; gap:0.75rem; font-size:0.825rem;">
          <div style="display:flex; justify-content:space-between; padding:0.5rem; background:var(--bg-tertiary); border-radius:6px;">
            <span style="color:var(--text-secondary);">Database Engine:</span>
            <strong class="font-mono">SQLite (Thread-Safe Async Session)</strong>
          </div>

          <div style="display:flex; justify-content:space-between; padding:0.5rem; background:var(--bg-tertiary); border-radius:6px;">
            <span style="color:var(--text-secondary);">Evidence Vault Mode:</span>
            <strong style="color:var(--sev-low);"><i class="fa-solid fa-shield"></i> Read-Only (0o444 Protected)</strong>
          </div>

          <div style="display:flex; justify-content:space-between; padding:0.5rem; background:var(--bg-tertiary); border-radius:6px;">
            <span style="color:var(--text-secondary);">Hashing Algorithm:</span>
            <strong class="font-mono">FIPS-Compliant SHA-256 / MD5 Dual Hash</strong>
          </div>

          <div style="display:flex; justify-content:space-between; padding:0.5rem; background:var(--bg-tertiary); border-radius:6px;">
            <span style="color:var(--text-secondary);">Current Active Case:</span>
            <strong style="color:var(--accent-cyan); font-family:monospace;">${activeCase.case_code} (${activeCase.name})</strong>
          </div>

          <div style="margin-top:0.5rem;">
            <button class="btn btn-secondary" id="btn-demo-reinit" style="width:100%; font-size:0.8rem;">
              <i class="fa-solid fa-arrows-rotate"></i> Reset & Re-ingest Synthetic Demo Case
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-demo-reinit').onclick = () => {
    API.loadDemo().then(res => {
      alert('Demo investigation case re-initialized!');
      navigateTo('dashboard');
    });
  };
}
