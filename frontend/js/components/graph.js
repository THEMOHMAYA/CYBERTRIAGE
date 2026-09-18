// Interactive Investigation Graph View (Vis.js Network)
import { API } from '../api.js';

export async function renderGraph(container, activeCase, navigateTo) {
  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
      <div>
        <h2 style="font-size:1.5rem; font-weight:700; color:#FFFFFF;">Investigation Correlation Graph</h2>
        <p style="font-size:0.875rem; color:var(--text-secondary);">
          Interactive entity-relationship network visualizer mapping User, Host, Process, File, IP, and Evidence linkages.
        </p>
      </div>

      <div style="display:flex; gap:0.5rem; align-items:center;">
        <button class="btn btn-secondary" id="btn-fit-graph" style="font-size:0.775rem; padding:0.4rem 0.75rem;">
          <i class="fa-solid fa-compress"></i> Fit View
        </button>
        <button class="btn btn-secondary" id="btn-physics-toggle" style="font-size:0.775rem; padding:0.4rem 0.75rem;">
          <i class="fa-solid fa-play"></i> Stabilize Graph
        </button>
      </div>
    </div>

    <!-- Graph Container & Side Node Inspector -->
    <div style="display:grid; grid-template-columns: 3fr 1fr; gap:1.25rem;">
      <!-- Canvas Box -->
      <div class="dfir-card" style="padding:0; overflow:hidden; position:relative;">
        <div id="vis-graph-canvas" style="width:100%; height:580px; background:#040711;"></div>
        
        <!-- Legend Overlay -->
        <div style="position:absolute; bottom:12px; left:12px; background:rgba(15,23,42,0.85); backdrop-filter:blur(6px); border:1px solid var(--border-color); border-radius:6px; padding:0.5rem 0.75rem; font-size:0.7rem; display:flex; flex-wrap:wrap; gap:0.75rem; z-index:10;">
          <span style="display:flex; align-items:center; gap:0.3rem;"><span style="width:10px; height:10px; border-radius:50%; background:#38BDF8;"></span> User</span>
          <span style="display:flex; align-items:center; gap:0.3rem;"><span style="width:10px; height:10px; border-radius:50%; background:#818CF8;"></span> Device</span>
          <span style="display:flex; align-items:center; gap:0.3rem;"><span style="width:10px; height:10px; border-radius:50%; background:#F43F5E;"></span> Process</span>
          <span style="display:flex; align-items:center; gap:0.3rem;"><span style="width:10px; height:10px; border-radius:50%; background:#FBBF24;"></span> File</span>
          <span style="display:flex; align-items:center; gap:0.3rem;"><span style="width:10px; height:10px; border-radius:50%; background:#EF4444;"></span> IP / Domain</span>
          <span style="display:flex; align-items:center; gap:0.3rem;"><span style="width:10px; height:10px; border-radius:50%; background:#10B981;"></span> Evidence</span>
        </div>
      </div>

      <!-- Node Detail Inspector Drawer -->
      <div class="dfir-card" id="graph-node-inspector" style="height:580px; overflow-y:auto;">
        <div class="card-header">
          <div class="card-title" style="font-size:0.9rem;">
            <i class="fa-solid fa-circle-nodes" style="color:var(--accent-cyan);"></i> Entity Inspector
          </div>
        </div>
        <div id="node-inspector-body" style="font-size:0.825rem; color:var(--text-secondary);">
          <div style="text-align:center; padding:3rem 0.5rem; color:var(--text-muted);">
            Click on any node in the graph network to view evidence references, connections, and metadata.
          </div>
        </div>
      </div>
    </div>
  `;

  const canvasEl = document.getElementById('vis-graph-canvas');
  const inspectorBody = document.getElementById('node-inspector-body');

  try {
    const graphData = await API.getGraph(activeCase.id);

    // Color palette per node type
    const typeColorMap = {
      'User': { background: '#0284C7', border: '#38BDF8', font: '#FFFFFF' },
      'Device': { background: '#4F46E5', border: '#818CF8', font: '#FFFFFF' },
      'Process': { background: '#BE123C', border: '#F43F5E', font: '#FFFFFF' },
      'File': { background: '#D97706', border: '#FBBF24', font: '#FFFFFF' },
      'IP': { background: '#B91C1C', border: '#EF4444', font: '#FFFFFF' },
      'Domain': { background: '#9333EA', border: '#C084FC', font: '#FFFFFF' },
      'Evidence': { background: '#047857', border: '#10B981', font: '#FFFFFF' },
      'Hardware': { background: '#EA580C', border: '#FB923C', font: '#FFFFFF' }
    };

    const visNodes = graphData.nodes.map(n => {
      const colors = typeColorMap[n.type] || { background: '#334155', border: '#64748B', font: '#FFFFFF' };
      return {
        id: n.id,
        label: n.label,
        shape: n.type === 'Evidence' ? 'box' : (n.type === 'Process' ? 'diamond' : 'dot'),
        size: n.type === 'Evidence' ? 20 : (n.severity === 'Critical' ? 24 : 18),
        color: {
          background: colors.background,
          border: colors.border,
          highlight: { background: '#06B6D4', border: '#FFFFFF' }
        },
        font: { color: '#FFFFFF', size: 12, face: 'Inter' },
        borderWidth: 2,
        raw_data: n
      };
    });

    const visEdges = graphData.edges.map(e => ({
      from: e.source,
      to: e.target,
      label: e.label,
      arrows: 'to',
      color: { color: 'rgba(100, 116, 139, 0.6)', highlight: '#06B6D4' },
      font: { color: '#94A3B8', size: 9, align: 'middle', background: '#090D16' },
      length: 180
    }));

    const data = {
      nodes: new vis.DataSet(visNodes),
      edges: new vis.DataSet(visEdges)
    };

    const options = {
      physics: {
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 100,
          springConstant: 0.08
        },
        maxVelocity: 50,
        stabilization: { iterations: 120 }
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        navigationButtons: true,
        keyboard: true
      }
    };

    const network = new vis.Network(canvasEl, data, options);

    // Node click handler
    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const selectedNode = graphData.nodes.find(n => n.id === nodeId);
        if (selectedNode) {
          inspectNode(selectedNode, graphData);
        }
      }
    });

    document.getElementById('btn-fit-graph').onclick = () => network.fit({ animation: true });
    
    let physicsOn = true;
    document.getElementById('btn-physics-toggle').onclick = () => {
      physicsOn = !physicsOn;
      network.setOptions({ physics: { enabled: physicsOn } });
      document.getElementById('btn-physics-toggle').innerHTML = physicsOn ? '<i class="fa-solid fa-pause"></i> Freeze Graph' : '<i class="fa-solid fa-play"></i> Stabilize Graph';
    };

  } catch (err) {
    canvasEl.innerHTML = `<div style="color:var(--sev-critical); text-align:center; padding:3rem;">Error loading graph: ${err.message}</div>`;
  }

  function inspectNode(node, graphData) {
    const connectedEdges = graphData.edges.filter(e => e.source === node.id || e.target === node.id);
    
    let edgesHtml = '';
    connectedEdges.forEach(e => {
      const otherId = e.source === node.id ? e.target : e.source;
      const otherNode = graphData.nodes.find(n => n.id === otherId);
      edgesHtml += `
        <li style="font-size:0.75rem; margin-bottom:0.35rem;">
          <span style="color:var(--accent-cyan); font-weight:600;">${e.label}</span> &rarr; 
          <strong style="color:var(--text-primary);">${otherNode ? otherNode.label : otherId}</strong>
        </li>
      `;
    });

    inspectorBody.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:0.85rem;">
        <div>
          <span class="badge badge-info" style="font-size:0.65rem; margin-bottom:0.25rem;">${node.type} ENTITY</span>
          <h4 style="font-size:1.05rem; font-weight:700; color:#FFF; word-break:break-all;">${node.label}</h4>
        </div>

        <div style="background:var(--bg-secondary); border:1px solid var(--border-color); padding:0.75rem; border-radius:6px; font-size:0.775rem;">
          <div style="color:var(--text-muted); font-size:0.7rem; margin-bottom:0.25rem;">SOURCE EVIDENCE</div>
          <strong style="color:var(--text-primary); font-size:0.825rem;"><i class="fa-solid fa-file-shield"></i> ${node.evidence_source || 'Indexed Logs'}</strong>
        </div>

        ${node.details && Object.keys(node.details).length > 0 ? `
          <div>
            <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Entity Properties</span>
            <div style="background:#050811; border-radius:6px; padding:0.5rem 0.75rem; font-family:monospace; font-size:0.725rem; color:#38BDF8;">
              ${Object.entries(node.details).map(([k, v]) => `<div><strong>${k}:</strong> ${v}</div>`).join('')}
            </div>
          </div>
        ` : ''}

        <div>
          <span style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; font-weight:600;">Correlated Graph Linkages (${connectedEdges.length})</span>
          <ul style="list-style:none; padding-left:0; margin-top:0.35rem;">
            ${edgesHtml || '<li style="color:var(--text-muted); font-size:0.75rem;">No outgoing edges</li>'}
          </ul>
        </div>
      </div>
    `;
  }
}
