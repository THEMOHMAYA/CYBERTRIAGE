// AI Investigator Console View (Grounded DFIR RAG)
import { API } from '../api.js';

export async function renderAIInvestigator(container, activeCase, navigateTo) {
  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <div>
        <h2 style="font-size:1.5rem; font-weight:700; color:#FFFFFF;">AI Forensic Investigator</h2>
        <p style="font-size:0.875rem; color:var(--text-secondary);">
          Evidence-grounded conversational DFIR intelligence. Answers are strictly verified against indexed case files with chain of custody citations.
        </p>
      </div>

      <div style="display:flex; align-items:center; gap:0.5rem;">
        <span class="integrity-pill"><i class="fa-solid fa-lock"></i> Strict Retrieval Grounding (No Hallucinations)</span>
      </div>
    </div>

    <!-- Pre-canned Investigator Prompts Bar -->
    <div style="display:flex; gap:0.5rem; overflow-x:auto; padding-bottom:0.75rem; margin-bottom:1rem;" id="preset-queries-bar">
      <button class="btn btn-secondary preset-btn" data-q="What happened in this incident?" style="font-size:0.775rem; padding:0.4rem 0.75rem; white-space:nowrap;">
        <i class="fa-solid fa-play" style="color:var(--accent-cyan); font-size:0.65rem;"></i> "What happened in this incident?"
      </button>
      <button class="btn btn-secondary preset-btn" data-q="Show me suspicious activity." style="font-size:0.775rem; padding:0.4rem 0.75rem; white-space:nowrap;">
        <i class="fa-solid fa-triangle-exclamation" style="color:var(--sev-critical); font-size:0.65rem;"></i> "Show me suspicious activity."
      </button>
      <button class="btn btn-secondary preset-btn" data-q="Which events are related to the USB activity?" style="font-size:0.775rem; padding:0.4rem 0.75rem; white-space:nowrap;">
        <i class="fa-solid fa-usb" style="color:var(--sev-high); font-size:0.65rem;"></i> "USB activity relations?"
      </button>
      <button class="btn btn-secondary preset-btn" data-q="Which evidence supports the file access finding?" style="font-size:0.775rem; padding:0.4rem 0.75rem; white-space:nowrap;">
        <i class="fa-solid fa-file-shield" style="color:var(--sev-medium); font-size:0.65rem;"></i> "Evidence for file access?"
      </button>
      <button class="btn btn-secondary preset-btn" data-q="Give me the incident timeline." style="font-size:0.775rem; padding:0.4rem 0.75rem; white-space:nowrap;">
        <i class="fa-solid fa-clock" style="color:var(--accent-cyan); font-size:0.65rem;"></i> "Incident timeline?"
      </button>
      <button class="btn btn-secondary preset-btn" data-q="Are there conflicting indicators?" style="font-size:0.775rem; padding:0.4rem 0.75rem; white-space:nowrap;">
        <i class="fa-solid fa-code-compare" style="color:var(--sev-critical); font-size:0.65rem;"></i> "Conflicting indicators?"
      </button>
    </div>

    <!-- Main Chat Window -->
    <div class="dfir-card" style="display:flex; flex-direction:column; height:620px; padding:0; overflow:hidden;">
      <div class="card-header" style="padding:0.75rem 1.25rem; margin-bottom:0; background:var(--bg-secondary);">
        <div class="card-title" style="font-size:0.875rem;">
          <i class="fa-solid fa-terminal" style="color:var(--accent-cyan);"></i> Active Investigation Session &bull; Case: <span class="font-mono">${activeCase.case_code}</span>
        </div>
        <div style="font-size:0.75rem; color:var(--text-muted);">
          Context: <strong>${activeCase.evidence_count || 7} Files Ingested</strong>
        </div>
      </div>

      <!-- Chat Stream Messages -->
      <div class="chat-thread" id="chat-messages-container" style="flex:1;">
        <!-- Initial Welcome Bubble -->
        <div class="chat-bubble ai">
          <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem; color:var(--accent-cyan); font-weight:700; font-size:0.825rem;">
            <i class="fa-solid fa-robot"></i> CYBERTRIAGE AI INVESTIGATOR
          </div>
          <p>
            Welcome, Investigator. I am initialized on Case <strong>${activeCase.case_code}</strong>. All responses are derived strictly from parsed forensic artifacts, timelines, network telemetry, and SHA-256 verified evidence.
          </p>
          <p style="margin-top:0.5rem; font-size:0.8rem; color:var(--text-secondary);">
            Click any suggested query above or type your forensic inquiry below to begin.
          </p>
        </div>
      </div>

      <!-- Input Bar -->
      <div style="padding:1rem 1.25rem; background:var(--bg-secondary); border-top:1px solid var(--border-color); display:flex; gap:0.75rem;">
        <input type="text" id="ai-chat-input" placeholder="Ask a question about the case evidence (e.g. 'What happened in this incident?')..." style="flex:1; padding:0.75rem 1rem; background:var(--bg-tertiary); border:1px solid var(--border-color); border-radius:8px; color:#FFF; font-size:0.875rem; font-family:inherit; outline:none;" autocomplete="off" />
        <button class="btn btn-primary" id="btn-send-ai-query" style="padding:0.75rem 1.5rem;">
          <i class="fa-solid fa-paper-plane"></i> Ask Assistant
        </button>
      </div>
    </div>
  `;

  const chatContainer = document.getElementById('chat-messages-container');
  const chatInput = document.getElementById('ai-chat-input');
  const sendBtn = document.getElementById('btn-send-ai-query');
  const presetBtns = container.querySelectorAll('.preset-btn');

  function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  async function handleUserQuery(question) {
    if (!question) return;

    // Append User message
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user';
    userBubble.innerHTML = `
      <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.25rem; font-weight:600;">INVESTIGATOR</div>
      <div>${escapeHtml(question)}</div>
    `;
    chatContainer.appendChild(userBubble);
    chatInput.value = '';
    scrollToBottom();

    // Append AI Typing indicator
    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-bubble ai';
    typingBubble.id = 'ai-typing-indicator';
    typingBubble.innerHTML = `
      <div style="display:flex; align-items:center; gap:0.5rem; color:var(--accent-cyan); font-weight:600; font-size:0.8rem;">
        <i class="fa-solid fa-spinner fa-spin"></i> Retrieving & correlating case evidence...
      </div>
    `;
    chatContainer.appendChild(typingBubble);
    scrollToBottom();

    try {
      const response = await API.queryAI(activeCase.id, question);
      
      const typingEl = document.getElementById('ai-typing-indicator');
      if (typingEl) typingEl.remove();

      // Build AI Response Bubble
      const aiBubble = document.createElement('div');
      aiBubble.className = 'chat-bubble ai';

      let sourcesHtml = '';
      if (response.sources && response.sources.length > 0) {
        sourcesHtml = `
          <div style="margin-top:0.85rem; padding-top:0.75rem; border-top:1px solid rgba(2,132,199,0.2);">
            <div style="font-size:0.725rem; font-weight:700; color:var(--accent-cyan); margin-bottom:0.35rem; text-transform:uppercase;">
              <i class="fa-solid fa-link"></i> Verified Source References (${response.sources.length}):
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:0.4rem;">
              ${response.sources.map(s => `
                <div class="citation-chip" title="${escapeHtml(s.raw_reference || '')}">
                  <i class="fa-solid fa-file-shield"></i> ${s.source} (${s.event_id || 'ID'}) [${s.confidence}]
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      let conflictsHtml = '';
      if (response.conflicts && response.conflicts.length > 0) {
        conflictsHtml = response.conflicts.map(c => `
          <div class="conflict-card">
            <div class="conflict-header">
              <i class="fa-solid fa-triangle-exclamation"></i> CONFLICT DETECTED: ${escapeHtml(c.title)}
            </div>
            <div style="font-size:0.775rem; margin-bottom:0.4rem; color:var(--text-primary);">${escapeHtml(c.description)}</div>
            <div style="font-size:0.725rem; color:var(--text-secondary); background:rgba(0,0,0,0.3); padding:0.4rem 0.6rem; border-radius:4px; font-family:monospace;">
              <div>&bull; Source A: <strong>${c.source_a}</strong> &rarr; ${c.value_a}</div>
              <div>&bull; Source B: <strong>${c.source_b}</strong> &rarr; ${c.value_b}</div>
            </div>
            <div style="font-size:0.7rem; color:var(--sev-medium); margin-top:0.35rem;">
              <strong>Forensic Note:</strong> ${escapeHtml(c.significance)}
            </div>
          </div>
        `).join('');
      }

      let uncertaintyHtml = '';
      if (response.uncertainty) {
        uncertaintyHtml = `
          <div style="margin-top:0.6rem; font-size:0.75rem; color:var(--text-muted); font-style:italic; background:rgba(255,255,255,0.02); padding:0.4rem 0.6rem; border-radius:4px;">
            <i class="fa-solid fa-circle-info" style="color:var(--sev-medium);"></i> <strong>Uncertainty / Forensic Limit:</strong> ${escapeHtml(response.uncertainty)}
          </div>
        `;
      }

      aiBubble.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <div style="display:flex; align-items:center; gap:0.5rem; color:var(--accent-cyan); font-weight:700; font-size:0.825rem;">
            <i class="fa-solid fa-robot"></i> CYBERTRIAGE AI INVESTIGATOR
          </div>
          <span class="badge ${response.confidence === 'High' ? 'badge-low' : 'badge-medium'}" style="font-size:0.65rem;">
            CONFIDENCE: ${response.confidence}
          </span>
        </div>

        <div style="white-space:pre-wrap; line-height:1.6; font-size:0.875rem;">${escapeHtml(response.answer)}</div>
        
        ${conflictsHtml}
        ${sourcesHtml}
        ${uncertaintyHtml}

        ${response.suggested_followups && response.suggested_followups.length > 0 ? `
          <div style="margin-top:0.75rem; padding-top:0.5rem; border-top:1px solid rgba(255,255,255,0.05); display:flex; gap:0.4rem; align-items:center; flex-wrap:wrap;">
            <span style="font-size:0.7rem; color:var(--text-muted);">Suggested Follow-ups:</span>
            ${response.suggested_followups.map(f => `<button class="btn btn-secondary followup-btn" style="font-size:0.7rem; padding:0.2rem 0.5rem;" data-q="${escapeHtml(f)}">${escapeHtml(f)}</button>`).join('')}
          </div>
        ` : ''}
      `;

      chatContainer.appendChild(aiBubble);
      scrollToBottom();

      aiBubble.querySelectorAll('.followup-btn').forEach(btn => {
        btn.onclick = () => handleUserQuery(btn.dataset.q);
      });

    } catch (err) {
      const typingEl = document.getElementById('ai-typing-indicator');
      if (typingEl) typingEl.remove();

      const errBubble = document.createElement('div');
      errBubble.className = 'chat-bubble ai';
      errBubble.innerHTML = `<div style="color:var(--sev-critical);">AI query error: ${escapeHtml(err.message)}</div>`;
      chatContainer.appendChild(errBubble);
      scrollToBottom();
    }
  }

  sendBtn.onclick = () => handleUserQuery(chatInput.value.trim());
  chatInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUserQuery(chatInput.value.trim());
    }
  };

  presetBtns.forEach(btn => {
    btn.onclick = () => handleUserQuery(btn.dataset.q);
  });

  // Check if prefilled from dashboard
  const prefill = sessionStorage.getItem('prefill_ai_query');
  if (prefill) {
    sessionStorage.removeItem('prefill_ai_query');
    setTimeout(() => handleUserQuery(prefill), 150);
  }
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
