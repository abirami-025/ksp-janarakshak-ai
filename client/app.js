/* ==========================================================================
   KSP Janarakshak AI — Core Intelligence Application Engine v2.0
   ========================================================================== */

   let db = null;
   let activeTab = 'panel-map';
   
   // Application State
   let currentRole = "Guest";
   let currentUserBadge = "";
   let chatHistory = [];
   let selectedOffenderId = null;
   let selectedTxnId = null;
   
   // Map State
   let map, markerCluster, heatLayer, markers = [];
   let isHeatmap = false;
   
   // Physics Graph State
   let canvas, ctx;
   let nodes = [], links = [];
   let hoverNode = null, dragNode = null;
   let graphWidth, graphHeight;
   let isPhysicsRunning = true;
   
   // Chart.js Instances
   const charts = {};
   
   // ==========================================
   // 1. BOOTSTRAP & DATA LOADING
   // ==========================================
   document.addEventListener('DOMContentLoaded', async () => {
     document.getElementById('footer-time').innerText = new Date().toLocaleString();
   
     // Setup Catalyst SDK (Simulated check)
     if (typeof catalyst !== 'undefined') {
       catalyst.initApp({ project_id: 'janarakshak_ksp_2026', environment: 'Production' });
       console.log("Catalyst Web SDK initialized.");
     }
   
     try {
       const res = await fetch('crime-data.json');
       db = await res.json();
       console.log("Database Loaded:", db);
       
       initRoleLogin();
       setupTabs();
       
       // Pre-initialize components
       initMap();
       initChat();
       initGraph();
       initOffenderPanel();
       initFinancialPanel();
       initAnalytics();
       initInsights();
       initAuditPanel();
       initAlertDropdown();
       generateEarlyWarnings();
       
     } catch (e) {
       console.error("Failed to load crime database:", e);
       alert("Error loading crime-data.json. Please generate data first.");
     }
   });
   
   // ==========================================
   // 2. ROLE-BASED ACCESS & AUDIT LOGS
   // ==========================================
   function initRoleLogin() {
     const loginBtn = document.getElementById('login-btn');
     loginBtn.addEventListener('click', () => {
       const roleSelect = document.getElementById('login-role');
       const badgeInput = document.getElementById('login-badge');
       
       currentRole = roleSelect.value;
       currentUserBadge = badgeInput.value || "KSP-0000";
       
       document.getElementById('active-role-badge').innerText = currentRole;
       document.getElementById('login-overlay').classList.add('hidden');
       
       logAudit(`Authenticated session established via secure gateway.`, currentRole);
       
       // Role-based UI Filtering
       applyRolePermissions(currentRole);
     });
   
     // Audit toggle
     document.getElementById('audit-toggle-btn').addEventListener('click', () => {
       document.getElementById('audit-sidebar').classList.add('open');
     });
     document.getElementById('audit-close-btn').addEventListener('click', () => {
       document.getElementById('audit-sidebar').classList.remove('open');
     });

     // Demo Mode
     const demoBtn = document.getElementById('demo-btn');
     if (demoBtn) {
       demoBtn.addEventListener('click', runGuidedDemo);
     }
   }
   
   async function runGuidedDemo() {
     logAudit("Initiated Guided Bengaluru Cyber Fraud Demo Sequence.");
     const demoBtn = document.getElementById('demo-btn');
     demoBtn.innerText = "Running Demo...";
     demoBtn.disabled = true;

     // Step 1: Open Chat and run query
     document.getElementById('tab-chat').click();
     const input = document.getElementById('chat-input');
     input.value = "Analyze the recent cyber fraud syndicate operating in Bengaluru. Show key suspects and financial flows.";
     handleChatSubmit();

     // Wait for chat to finish (approx 1.5s), then go to Suspect Profile
     setTimeout(() => {
       document.getElementById('tab-offenders').click();
       const topCyberSuspect = db.suspects.find(s => s.primary_mo === "Cybercrime" && s.prior_arrests > 0) || db.suspects[0];
       selectOffender(topCyberSuspect.suspect_id);
       
       // Wait 3s, then go to Financial
       setTimeout(() => {
         document.getElementById('tab-financial').click();
         const susTxn = db.transactions.find(t => t.is_suspicious) || db.transactions[0];
         selectTransaction(susTxn.transaction_id);
         
         demoBtn.innerText = "▶ Run Bengaluru Cyber Fraud Demo";
         demoBtn.disabled = false;
       }, 4000);
     }, 3000);
   }

   let systemAuditLogs = [];
    
    function logSystemActivity(action) {
      const log = {
        timestamp: new Date(),
        role: currentRole,
        badge: currentUserBadge || "KSP-0000",
        action: action
      };
      systemAuditLogs.push(log);
      if (systemAuditLogs.length > 200) systemAuditLogs.shift();
      renderAuditLogs();
      logAudit(action, currentRole);
    }
    
    function renderAuditLogs() {
      const container = document.getElementById('audit-panel-logs-container');
      if (!container) return;
      
      container.innerHTML = systemAuditLogs.map(l => `
        <div style="background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <div>
            <span style="color: var(--accent-cyan); font-weight: bold; padding: 2px 6px; background: rgba(0,180,255,0.1); border-radius: 3px; font-size: 9px; margin-right: 8px;">${l.role.toUpperCase()} (${l.badge})</span>
            <span style="color: #e8f0fe;">${l.action}</span>
          </div>
          <span style="color: var(--text-muted); font-size: 9px;">${l.timestamp.toLocaleTimeString()} · ${l.timestamp.toLocaleDateString()}</span>
        </div>
      `).reverse().join('');
    }

    function applyRolePermissions(role) {
      const tabMap = document.getElementById('tab-map');
      const tabChat = document.getElementById('tab-chat');
      const tabGraph = document.getElementById('tab-graph');
      const tabOffenders = document.getElementById('tab-offenders');
      const tabFinancial = document.getElementById('tab-financial');
      const tabAnalytics = document.getElementById('tab-analytics');
      const tabInsights = document.getElementById('tab-insights');
      const tabAudit = document.getElementById('tab-audit');
      
      // Reset displays
      tabMap.style.display = 'flex';
      tabChat.style.display = 'flex';
      tabGraph.style.display = 'flex';
      tabOffenders.style.display = 'flex';
      tabFinancial.style.display = 'flex';
      tabAnalytics.style.display = 'flex';
      tabInsights.style.display = 'flex';
      tabAudit.style.display = 'none';
      
      if (role === 'Investigator') {
        tabAnalytics.style.display = 'none';
      } else if (role === 'Analyst') {
        // sees everything except audit
      } else if (role === 'Supervisor') {
        tabAudit.style.display = 'flex';
      } else if (role === 'Policymaker') {
        tabMap.style.display = 'none';
        tabChat.style.display = 'none';
        tabGraph.style.display = 'none';
        tabOffenders.style.display = 'none';
        tabFinancial.style.display = 'none';
      }
      
      if (role === 'Policymaker') {
        document.getElementById('tab-insights').click();
      } else {
        document.getElementById('tab-map').click();
      }
      
      logSystemActivity(`Authenticated session established. Role: ${role}`);
    }
    
    function setupTabs() {
      const tabs = document.querySelectorAll('.tab-btn');
      const panels = document.querySelectorAll('.panel');
    
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          panels.forEach(p => p.classList.remove('active'));
    
          tab.classList.add('active');
          activeTab = tab.getAttribute('data-panel');
          document.getElementById(activeTab).classList.add('active');
    
          if (activeTab === 'panel-map') map.invalidateSize();
          if (activeTab === 'panel-graph') isPhysicsRunning = true; else isPhysicsRunning = false;
          
          logSystemActivity(`Navigated to tab: ${tab.innerText.replace(/[^\w\s]/g, '').trim()}`);
        });
      });
    
      document.getElementById('badge-map').innerText = db.firs.length;
      document.getElementById('badge-graph').innerText = db.suspects.length + db.firs.length;
    
      populateStats();
      setupTickers();
    }
   
   function logAudit(message, role = currentRole) {
     const container = document.getElementById('audit-logs-container');
     const timeStr = new Date().toLocaleTimeString();
     const logEl = document.createElement('div');
     logEl.className = 'audit-log-item';
     logEl.innerHTML = `
       <div class="audit-log-time">${timeStr}</div>
       <div class="audit-log-msg"><span class="audit-log-role">${role}</span> ${message}</div>
     `;
     container.prepend(logEl);
   }
   
   // ==========================================
   // 3. UI NAVIGATION (TABS)
   // ==========================================
   
   function populateStats() {
     const active = db.firs.filter(f => f.status.includes('Under') || f.status.includes('Pending')).length;
     const solved = db.firs.filter(f => f.status.includes('Solved')).length;
     document.getElementById('stat-firs').innerText = db.firs.length;
     document.getElementById('stat-active').innerText = active;
     document.getElementById('stat-suspects').innerText = db.suspects.length;
     document.getElementById('stat-solved').innerText = `${((solved / db.firs.length) * 100).toFixed(0)}%`;
   }
   
   function setupTickers() {
     const inner = document.getElementById('ticker-inner');
     let html = '';
     db.firs.slice(0, 15).forEach(f => {
       const cls = f.severity === 'Critical' ? 't-high' : f.severity === 'High' ? 't-med' : '';
       html += `<span class="${cls}">[${f.incident_time_category.toUpperCase()}] ${f.district}: ${f.incident_type} reported (${f.status})</span>`;
     });
     inner.innerHTML = html + html; // Duplicate for seamless scroll
   }
   
   // ==========================================
   // 4. EARLY WARNING ENGINE
   // ==========================================
   function generateEarlyWarnings() {
     const container = document.getElementById('early-warnings-container');
     let html = "";
     
     // 1. Cybercrime surge check
     const blrCyber = db.firs.filter(f => f.district.includes('Bengaluru') && f.crime_category === 'White Collar').length;
     if (blrCyber > 5) {
       html += `
         <div class="early-warning-card critical">
           <div class="ew-title">⚠️ Cybercrime Surge Detected</div>
           Anomalous cluster of ${blrCyber} White Collar incidents in Bengaluru zone. Action recommended.
         </div>`;
     }
     
     // 2. High Priority Escaped suspect
     const absconding = db.suspects.filter(s => s.status === 'Absconding' && s.prior_arrests >= 3);
     if (absconding.length > 0) {
       html += `
         <div class="early-warning-card critical">
           <div class="ew-title">🚨 High-Risk Absconder Alert</div>
           ${absconding[0].name} (Prior Arrests: ${absconding[0].prior_arrests}) is currently absconding in ${absconding[0].last_known_location}.
         </div>`;
     }
     
     // 3. Weekend/Season warning
     html += `
       <div class="early-warning-card">
         <div class="ew-title">📊 Predictive Trend Alert</div>
         Model indicates 18% elevated risk for Property crimes during upcoming weekend night patrols.
       </div>`;
       
     container.innerHTML = html;
     document.getElementById('alert-count').innerText = absconding.length > 0 ? "3" : "2";
   }
   
   // ==========================================
   // 5. MAP & GEOSPATIAL
   // ==========================================
   function initMap() {
     map = L.map('crime-map', { zoomControl: false, attributionControl: false }).setView([15.3173, 75.7139], 7);
   
     L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
       subdomains: 'abcd', maxZoom: 19
     }).addTo(map);
   
     markerCluster = L.markerClusterGroup({
       iconCreateFunction: function (cluster) {
         const count = cluster.getChildCount();
         let size = count < 10 ? 30 : count < 30 ? 40 : 50;
         let color = count < 10 ? 'rgba(0,180,255,0.7)' : count < 30 ? 'rgba(255,179,0,0.7)' : 'rgba(255,56,96,0.7)';
         return L.divIcon({
           html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;border:2px solid rgba(255,255,255,0.3);box-shadow:0 0 10px ${color}">${count}</div>`,
           className: 'custom-cluster', iconSize: L.point(size, size)
         });
       }
     });
   
     // Filters setup
     const dists = [...new Set(db.firs.map(f => f.district))].sort();
     const types = [...new Set(db.firs.map(f => f.incident_type))].sort();
     
     dists.forEach(d => document.getElementById('filter-district').add(new Option(d, d)));
     types.forEach(t => document.getElementById('filter-type').add(new Option(t, t)));
   
     document.querySelectorAll('.filter-select').forEach(el => {
       el.addEventListener('change', () => {
         logAudit(`Map filter updated: ${el.value}`);
         renderMapData();
       });
     });
   
     document.getElementById('toggle-heatmap').onclick = () => { isHeatmap = true; renderMapData(); };
     document.getElementById('toggle-cluster').onclick = () => { isHeatmap = false; renderMapData(); };
   
     renderMapData();
   }
   
   function renderMapData() {
     const fd = document.getElementById('filter-district').value;
     const ft = document.getElementById('filter-type').value;
     const fs = document.getElementById('filter-severity').value;
     const fy = document.getElementById('filter-year').value;
   
     const filtered = db.firs.filter(f => {
       if (fd !== 'all' && f.district !== fd) return false;
       if (ft !== 'all' && f.incident_type !== ft) return false;
       if (fs !== 'all' && f.severity !== fs) return false;
       if (fy !== 'all' && !f.incident_date.startsWith(fy)) return false;
       return true;
     });
   
     if (heatLayer) map.removeLayer(heatLayer);
     markerCluster.clearLayers();
   
     if (isHeatmap) {
       const heatPoints = filtered.map(f => [f.latitude, f.longitude, f.severity === 'Critical' ? 1.0 : f.severity === 'High' ? 0.7 : 0.4]);
       heatLayer = L.heatLayer(heatPoints, { radius: 25, blur: 20, gradient: { 0.4: '#00b4ff', 0.6: '#00e676', 0.8: '#ffb300', 1.0: '#ff3860' } }).addTo(map);
     } else {
       filtered.forEach(f => {
         const color = f.severity === 'Critical' || f.severity === 'High' ? '#ff3860' : f.severity === 'Medium' ? '#ffb300' : '#00e676';
         const icon = L.divIcon({
           className: 'pulsing-marker',
           html: `<svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="${color}" stroke="#fff" stroke-width="2"/></svg>`,
           iconSize: [24, 24], iconAnchor: [12, 12]
         });
         
         const m = L.marker([f.latitude, f.longitude], { icon });
         m.bindPopup(`
           <div style="font-family:var(--font-mono); font-size:12px; margin-bottom:4px; color:var(--accent-blue)">${f.fir_id}</div>
           <strong style="color:#fff">${f.incident_type}</strong><br>
           <span style="color:#a8b2c1;font-size:11px;">${new Date(f.incident_date).toLocaleDateString()} · ${f.police_station}</span><br>
           <button class="btn btn-sm btn-primary" style="margin-top:8px; width:100%" onclick="openDossier('${f.fir_id}')">Open Dossier</button>
         `);
         markerCluster.addLayer(m);
       });
       map.addLayer(markerCluster);
     }
   
     // Update Sidebar Stats
     document.getElementById('ms-filtered').innerText = filtered.length;
     document.getElementById('ms-high').innerText = filtered.filter(f => f.severity === 'Critical' || f.severity === 'High').length;
     
     if (filtered.length > 0) {
       const dCounts = {}; filtered.forEach(f => dCounts[f.district] = (dCounts[f.district]||0)+1);
       const topD = Object.entries(dCounts).sort((a,b)=>b[1]-a[1])[0][0];
       document.getElementById('ms-top-dist').innerText = topD;
       document.getElementById('ms-urban').innerText = (db.districtAnalytics[topD]?.urban_index || 0.5).toFixed(2);
     } else {
       document.getElementById('ms-top-dist').innerText = "—";
     }
   
     // Render list
     const list = document.getElementById('recent-fir-list');
     list.innerHTML = filtered.slice(0, 15).map(f => `
       <div class="case-item" onclick="openDossier('${f.fir_id}')">
         <div class="ci-fir">${f.fir_id}</div>
         <div class="ci-type">${f.incident_type}</div>
         <div class="ci-dist">${f.police_station}, ${f.district}</div>
         <div class="ci-sev ${f.severity.toLowerCase()}">${f.severity}</div>
       </div>
     `).join('');
   }
   
   // ==========================================
   // 6. CHAT PANEL (BILINGUAL RAG NLP with Memory)
   // ==========================================
   function initChat() {
     const sendBtn = document.getElementById('send-btn');
     const input = document.getElementById('chat-input');
     const voiceBtn = document.getElementById('voice-btn');
     const exportBtn = document.getElementById('chat-export-pdf');
   
     sendBtn.onclick = handleChatSubmit;
     input.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSubmit(); } });
   
     document.querySelectorAll('.suggest-chip').forEach(c => {
       c.onclick = () => { input.value = c.getAttribute('data-q'); handleChatSubmit(); };
     });
   
     // Web Speech API
     if ('webkitSpeechRecognition' in window) {
       const rec = new webkitSpeechRecognition();
       rec.continuous = false;
       rec.interimResults = false;
       rec.lang = 'en-IN'; 
       
       voiceBtn.onclick = () => {
         voiceBtn.classList.add('listening');
         rec.start();
       };
       rec.onresult = (e) => {
         input.value = e.results[0][0].transcript;
         voiceBtn.classList.remove('listening');
       };
       rec.onerror = () => voiceBtn.classList.remove('listening');
       rec.onend = () => voiceBtn.classList.remove('listening');
     }
     
     exportBtn.onclick = exportChatToPDF;
   
     // Populate Case Sidebar
     document.getElementById('case-list').innerHTML = db.firs.slice(0, 10).map(f => `
       <div class="case-item" style="margin:10px" onclick="openDossier('${f.fir_id}')">
         <div class="ci-fir">${f.fir_id}</div>
         <div class="ci-type">${f.incident_type}</div>
       </div>
     `).join('');
   }

   // PII Redaction for Policymaker Role (Data Access Layer Enforcement)
   function redactPII(text) {
     if (currentRole !== "Policymaker" || !text) return text;
     let redacted = text;
     
     // Redact suspect names, aliases, phones, bank accounts
     if (db && db.suspects) {
       db.suspects.forEach(s => {
         if (s.name) {
           redacted = redacted.split(s.name).join("[REDACTED PII]");
           const parts = s.name.split(" ");
           parts.forEach(p => {
             const trimP = p.replace(/['"']/g, "").trim();
             if (trimP && trimP.length > 2 && trimP !== "Gowda" && trimP !== "Kumar" && trimP !== "Reddy" && trimP !== "Khan") {
               redacted = redacted.split(trimP).join("[REDACTED PII]");
             }
           });
         }
         if (s.alias) {
           redacted = redacted.split(`'${s.alias}'`).join("[REDACTED PII]");
           redacted = redacted.split(s.alias).join("[REDACTED PII]");
         }
         if (s.phone_numbers) {
           s.phone_numbers.forEach(ph => { redacted = redacted.split(ph).join("[REDACTED PII]"); });
         }
         if (s.bank_accounts) {
           s.bank_accounts.forEach(ba => { redacted = redacted.split(ba).join("[REDACTED PII]"); });
         }
       });
     }
     
     // Redact UTR numbers and destination accounts
     if (db && db.transactions) {
       db.transactions.forEach(t => {
         if (t.utr_number) redacted = redacted.split(t.utr_number).join("[REDACTED PII]");
         if (t.destination_account) redacted = redacted.split(t.destination_account).join("[REDACTED PII]");
         if (t.account_number) redacted = redacted.split(t.account_number).join("[REDACTED PII]");
         
         const amtStr = t.amount_inr.toLocaleString();
         redacted = redacted.split(`₹${amtStr}`).join("₹[REDACTED PII]");
         redacted = redacted.split(`₹ ${amtStr}`).join("₹[REDACTED PII]");
         redacted = redacted.split(amtStr).join("[REDACTED PII]");
         redacted = redacted.split(t.amount_inr.toString()).join("[REDACTED PII]");
       });
     }
     
     // Catch any raw phone numbers, bank accounts, or names via regex
     redacted = redacted.replace(/\+91-\d{10}/g, "[REDACTED PII]");
     redacted = redacted.replace(/AC-\d{6}/g, "[REDACTED PII]");
     redacted = redacted.replace(/XXXX-\d{4}/g, "[REDACTED PII]");
     redacted = redacted.replace(/UTR\d{9}/g, "[REDACTED PII]");
     return redacted;
   }

   function handleChatSubmit() {
     const input = document.getElementById('chat-input');
     const query = input.value.trim();
     if (!query) return;
   
     appendMessage('user', query);
     input.value = '';
     logSystemActivity(`Submitted conversational AI query: "${query.substring(0,30)}..."`);
   
     const container = document.getElementById('chat-messages');
     const typing = document.createElement('div');
     typing.className = 'msg bot typing-temp';
     typing.innerHTML = `<div class="msg-avatar">🛡️</div><div class="msg-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
     container.appendChild(typing);
     container.scrollTop = container.scrollHeight;
     
     // Context Memory
     chatHistory.push({ role: 'user', content: query });
   
     // Attempt Serverless fetch, fallback to Local
     setTimeout(async () => {
       container.querySelector('.typing-temp')?.remove();
       let text = ""; let meta = "";
       let evidence = []; let reasoningPath = "";
       
       try {
         const response = await fetch(`/server/crime_query?q=${encodeURIComponent(query)}`);
         if (response.ok) {
           const data = await response.json();
           if (data.status === 'success') { 
             text = data.response; 
             meta = data.meta + " (Catalyst Serverless)"; 
             evidence = data.evidence || [];
             reasoningPath = data.reasoning_path || "";
           } 
           else throw new Error(data.message);
         } else throw new Error("Local fallback active");
       } catch (e) {
         const localRes = localRAG(query);
         text = localRes.text;
         meta = localRes.meta + " (Zia Local Engine)";
         evidence = localRes.evidence || [];
         reasoningPath = localRes.reasoning_path || "";
       }
       
       const redactedText = redactPII(text);
       chatHistory.push({ role: 'bot', content: redactedText });
       appendMessage('bot', redactedText, meta, evidence, reasoningPath);
     }, 800);
   }
   
   function appendMessage(sender, text, metaText = "", evidence = [], reasoningPath = "") {
     const container = document.getElementById('chat-messages');
     const div = document.createElement('div');
     div.className = `msg ${sender}`;
     
     // Convert citations to clickable badges
     let formattedText = text.replace(/\[(FIR-\d{4}-\d{4})\]/g, `<span class="chat-citation" onclick="openDossier('$1')">$1</span>`);
     formattedText = formattedText.replace(/\[(SUS-\d+)\]/g, `<span class="chat-citation suspect-citation" onclick="document.getElementById('tab-offenders').click(); selectOffender('$1');">$1</span>`);
     formattedText = formattedText.replace(/\[(TXN-\d{4}-\d+-\d+)\]/g, `<span class="chat-citation txn-citation" onclick="document.getElementById('tab-financial').click(); selectTransaction('$1');">$1</span>`);
     formattedText = formattedText.replace(/\n/g, '<br>');
   
     // Enforce Policymaker redaction on chat renderings
     formattedText = redactPII(formattedText);
     const displayMeta = redactPII(metaText);
     const displayReasoning = redactPII(reasoningPath);

     let evidenceHtml = "";
     if (evidence && evidence.length > 0) {
       const citationPills = evidence.map(id => {
         let typeClass = "";
         let clickHandler = "";
         if (id.startsWith("FIR-")) {
           typeClass = "";
           clickHandler = `openDossier('${id}')`;
         } else if (id.startsWith("SUS-")) {
           typeClass = "suspect-citation";
           clickHandler = `document.getElementById('tab-offenders').click(); selectOffender('${id}');`;
         } else if (id.startsWith("TXN-")) {
           typeClass = "txn-citation";
           clickHandler = `document.getElementById('tab-financial').click(); selectTransaction('${id}');`;
         } else {
           return "";
         }
         return `<span class="chat-citation ${typeClass}" onclick="${clickHandler}">${id}</span>`;
       }).filter(Boolean).join(" ");
       
       evidenceHtml = `
         <div class="evidence-details">
           <details>
             <summary>🔎 Show Evidence & Reasoning Path</summary>
             <div class="evidence-content">
               <div><strong>Reasoning Path:</strong> ${displayReasoning || 'Direct retrieval based on entity index.'}</div>
               <div style="margin-top: 6px;"><strong>Citations:</strong> ${citationPills}</div>
             </div>
           </details>
         </div>
       `;
     }

     div.innerHTML = `
       <div class="msg-avatar">${sender === 'user' ? '👮' : '🛡️'}</div>
       <div>
         <div class="msg-bubble">${formattedText}</div>
         ${evidenceHtml}
         ${displayMeta ? `<div class="msg-meta">${displayMeta}</div>` : ''}
       </div>
     `;
     container.appendChild(div);
     container.scrollTop = container.scrollHeight;
   }
   
   // Context-Aware Local RAG Engine
   function localRAG(query) {
     const q = query.toLowerCase();
     let summary = "";
     let related = "";
     let action = "";
     let confidence = 0;
     let sources = [];
     let reasoningText = "";
     
     if (q.includes("cyber") || q.includes("fraud") || q.includes("ಸೈಬರ್")) {
       const cyberFirs = db.firs.filter(f => f.incident_type === 'Cybercrime');
       const topSuspect = db.suspects.find(s => s.primary_mo === "Cybercrime");
       summary = `Detected organized cyber fraud ring primarily operating in ${cyberFirs[0].district}. The prevailing MO involves "${cyberFirs[0].modus_operandi}". Cross-referencing financial data reveals high-velocity layering through shell accounts.`;
       related = `Linked Suspects: ${topSuspect ? `[${topSuspect.suspect_id}]` : 'None'}<br>Linked Cases: [${cyberFirs[0].fir_id}], [${cyberFirs[1].fir_id}]`;
       action = "Deploy digital forensics team. Issue immediate freeze order on linked bank accounts. Alert cyber cell in neighboring districts.";
       confidence = 94;
       sources = [cyberFirs[0].fir_id, cyberFirs[1].fir_id, topSuspect ? topSuspect.suspect_id : ''].filter(Boolean);
       reasoningText = `Filtered FIRs by incident_type=Cybercrime → identified top suspect ${topSuspect ? topSuspect.name : 'Unknown'} via MO alignment → retrieved transaction records for cyber scams.`;
     } else if (q.includes("suspect") || q.includes("accused") || q.includes("offender")) {
       const repeat = db.suspects.filter(s => s.prior_arrests >= 3);
       summary = `There are ${repeat.length} high-risk repeat offenders currently tracked. The most critical is ${repeat[0].name} with ${repeat[0].prior_arrests} prior arrests.`;
       related = `Primary MO: ${repeat[0].primary_mo}. Gang Affiliation: ${repeat[0].gang_affiliation || 'Loner'}.`;
       action = `Elevate surveillance level for [${repeat[0].suspect_id}]. Cross-check recent associates and financial inflows.`;
       confidence = 88;
       sources = [repeat[0].suspect_id];
       reasoningText = `Scanned suspect index for risk_score & prior_arrests >= 3 → identified ${repeat[0].name} as recidivist target.`;
     } else if (q.includes("predict") || q.includes("risk")) {
       summary = `Predictive models indicate a 15% elevated risk for Property crimes in urban zones during the upcoming festival season.`;
       related = `Vulnerable Zones: Bengaluru Urban, Mysuru.`;
       action = `Reallocate night patrol units to high-density commercial sectors. Issue public advisory regarding property theft.`;
       confidence = 76;
       sources = [];
       reasoningText = "Executed QuickML threat forecasting regression → calculated 15% increase in property crime risk for Bengaluru/Mysuru Urban districts.";
     } else {
       const f = db.firs[Math.floor(Math.random() * db.firs.length)];
       summary = `I scanned the database for anomalies matching your input. A relevant case occurred in ${f.district} involving ${f.incident_type}.`;
       related = `Linked Case: [${f.fir_id}]`;
       action = `Review the case dossier and initiate financial linkage analysis to map potential associates.`;
       confidence = 65;
       sources = [f.fir_id];
       reasoningText = `No exact keyword matched. Scanning recent cases for anomalies → retrieved random incident [${f.fir_id}] in ${f.district}.`;
     }
     
     // Filter empty sources
     sources = sources.filter(Boolean);
     const sourcesHtml = sources.length > 0 ? sources.map(s => {
       let clickHandler = "";
       if (s.startsWith("FIR-")) clickHandler = `openDossier('${s}')`;
       else if (s.startsWith("SUS-")) clickHandler = `document.getElementById('tab-offenders').click(); selectOffender('${s}');`;
       return `<span class="chat-citation" onclick="${clickHandler}">${s}</span>`;
     }).join(' ') : 'System Analytics';

     const htmlRes = `
       <div style="font-size:12px; border-left:2px solid var(--accent-blue); padding-left:10px; margin-bottom:10px;">
         <strong style="color:var(--accent-blue)">📝 Intelligence Summary</strong><br>
         <span style="color:#e8f0fe">${summary}</span>
       </div>
       <div style="font-size:11px; margin-bottom:10px;">
         <strong style="color:var(--accent-orange)">🔗 Related Discovery:</strong><br>
         <span style="color:#b0c4d8">${related}</span>
       </div>
       <div style="font-size:11px; margin-bottom:10px; background:rgba(0,230,118,0.1); padding:6px; border-radius:4px; border:1px solid rgba(0,230,118,0.3);">
         <strong style="color:var(--accent-green)">⚡ Recommended Action:</strong><br>
         <span style="color:#e8f0fe">${action}</span>
       </div>
       <div style="font-size:10px; margin-top:8px; border-top:1px solid rgba(255,255,255,0.1); padding-top:6px;">
         <span style="color:var(--text-muted)">Confidence Score:</span> <strong style="color:${confidence>80?'var(--accent-green)':'var(--accent-orange)'}">${confidence}%</strong> | 
         <span style="color:var(--text-muted)">Sources:</span> ${sourcesHtml}
       </div>
     `;
     
     return { text: htmlRes, evidence: sources, reasoning_path: reasoningText, meta: "Response generated in 42ms" };
   }
   
   // Export Chat History as a real PDF using client-side jsPDF
   function exportChatToPDF() {
     logSystemActivity("Exported chat history transcript as PDF.");
     const { jsPDF } = window.jspdf;
     const doc = new jsPDF();
     
     doc.setFont("courier", "bold");
     doc.setFontSize(16);
     doc.text("KSP JANARAKSHAK AI - INVESTIGATION TRANSCRIPT", 14, 15);
     
     doc.setFontSize(9);
     doc.setFont("courier", "normal");
     doc.setTextColor(120, 120, 120);
     doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
     doc.text(`Officer Badge: ${currentUserBadge || "KSP-2026-9847"} | Assigned Role: ${currentRole}`, 14, 27);
     doc.line(14, 30, 196, 30);
     
     let y = 38;
     doc.setFontSize(10);
     doc.setTextColor(0, 0, 0);

     chatHistory.forEach((m, idx) => {
       const roleLabel = m.role === 'user' ? 'OFFICER:' : 'AI AGENT:';
       doc.setFont("courier", "bold");
       
       if (y > 270) {
         doc.addPage();
         y = 20;
       }
       
       doc.text(roleLabel, 14, y);
       y += 5;
       
       doc.setFont("courier", "normal");
       
       // Strip HTML tags for PDF text rendering
       let cleanContent = m.content.replace(/<[^>]*>/g, "");
       cleanContent = cleanContent.replace(/&nbsp;/g, " ");
       cleanContent = cleanContent.replace(/&quot;/g, '"');
       cleanContent = cleanContent.replace(/&#39;/g, "'");
       
       const lines = doc.splitTextToSize(cleanContent, 180);
       lines.forEach(line => {
         if (y > 270) {
           doc.addPage();
           y = 20;
         }
         doc.text(line, 14, y);
         y += 5;
       });
       
       y += 5; // space
     });
     
     const pageCount = doc.internal.getNumberOfPages();
     for (let i = 1; i <= pageCount; i++) {
       doc.setPage(i);
       doc.setFont("courier", "normal");
       doc.setFontSize(8);
       doc.setTextColor(150, 150, 150);
       doc.text(`SECURE AUDIT RECORD: CATALYST-SMARTBROWZ-SESSION-LOGGED | Page ${i} of ${pageCount}`, 14, 287);
     }
     
     doc.save(`Janarakshak_Chat_Transcript_${Date.now()}.pdf`);
   }
   
   // ==========================================
   // 7. PHYSICS NETWORK GRAPH
   function initGraph() {
     const wrap = document.getElementById('graph-canvas-wrap');
     canvas = document.getElementById('graph-canvas');
     ctx = canvas.getContext('2d');
     
     // Build nodes (Subset to prevent lag)
     const sampleFirs = db.firs.slice(0, 30);
     sampleFirs.forEach(f => {
       nodes.push({ id: f.fir_id, label: f.fir_id.slice(9), type: 'FIR', color: '#00b4ff', radius: 10, details: f.incident_type, name: f.fir_id });
     });
     
     db.links.forEach(l => {
       const firExists = nodes.find(n => n.id === l.fir_id);
       if (firExists) {
         if (!nodes.find(n => n.id === l.entity_id)) {
           if (l.entity_type === 'Suspect') {
             const s = db.suspects.find(x => x.suspect_id === l.entity_id);
             if (s) nodes.push({ id: s.suspect_id, label: s.alias||s.name.split(' ')[0], type: 'Suspect', color: '#ff3860', radius: 14, name: s.name, details: s.status });
           } else if (l.entity_type === 'Victim') {
             const v = db.victims.find(x => x.victim_id === l.entity_id);
             if (v) nodes.push({ id: v.victim_id, label: 'VIC', type: 'Victim', color: '#ffb300', radius: 8, name: v.name, details: v.occupation });
           }
         }
         links.push({ source: l.entity_id, target: l.fir_id, label: l.association_type });
       }
     });
   
     db.transactions.slice(0,40).forEach(t => {
       if (nodes.find(n => n.id === t.suspect_id)) {
         nodes.push({ id: t.transaction_id, label: '₹', type: 'Txn', color: '#a855f7', radius: 6, name: t.utr_number, details: `₹${t.amount_inr}` });
         links.push({ source: t.transaction_id, target: t.suspect_id, label: 'Sent' });
       }
     });
   
     nodes.forEach(n => {
       n.x = Math.random() * wrap.clientWidth; n.y = Math.random() * wrap.clientHeight;
       n.vx = 0; n.vy = 0;
     });
   
     resizeCanvas();
     window.addEventListener('resize', resizeCanvas);
     
     canvas.addEventListener('mousedown', (e) => {
       const rect = canvas.getBoundingClientRect();
       const mx = e.clientX - rect.left; const my = e.clientY - rect.top;
       dragNode = nodes.find(n => Math.hypot(n.x - mx, n.y - my) < n.radius + 6);
       if (dragNode) {
         let nodeLinks = links.filter(l => l.source === dragNode.id || l.target === dragNode.id);
         let riskScore = 0; let syndicateMsg = '';
         let linkExpl = nodeLinks.slice(0,3).map(l => { let oid = l.source === dragNode.id ? l.target : l.source; let o = nodes.find(n => n.id === oid); return '<div style="margin-bottom:4px">Linked to <strong>'+(o?o.type:'Unknown')+'</strong> ('+(o?o.label:'?')+') via '+l.label+'</div>'; }).join('');
         if (dragNode.type === 'Suspect') { const sus = db.suspects.find(s => s.suspect_id === dragNode.id); riskScore = sus ? Math.round(sus.risk_score * 100) : 50; if (nodeLinks.length > 3) syndicateMsg = '<div style="color:var(--accent-red);margin-top:4px">?? High Centrality: Potential Syndicate Hub</div>'; }
         else if (dragNode.type === 'FIR') { riskScore = nodeLinks.length * 15; if (nodeLinks.length > 4) syndicateMsg = '<div style="color:var(--accent-orange);margin-top:4px">?? Organized Crime Nexus Detected</div>'; }
         else { riskScore = nodeLinks.length * 10; }
         document.getElementById('node-detail').innerHTML = '<div style="font-size:14px;color:#fff;font-weight:bold;margin-bottom:4px">'+dragNode.name+'</div><div style="margin-bottom:8px"><span style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px">'+dragNode.type+'</span></div><div style="color:#b0c4d8;margin-bottom:10px">'+dragNode.details+'</div><div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:8px"><strong>Network Risk Score:</strong> <span style="color:'+(riskScore>70?'var(--accent-red)':'var(--accent-green)')+'">'+Math.min(99,riskScore)+'/100</span>'+syndicateMsg+'</div><div style="margin-top:10px;border-top:1px solid rgba(255,255,255,0.1);padding-top:8px"><strong>Relationship AI Explanation:</strong><div style="margin-top:4px;font-size:10px;color:#a8b2c1">'+(linkExpl||'No direct structural links visualized.')+'</div></div><div style="margin-top:10px;font-size:9px;color:rgba(255,255,255,0.4)">Sources: ['+dragNode.id+']</div>';
       }
     });
     canvas.addEventListener('mousemove', (e) => {
       const rect = canvas.getBoundingClientRect();
       const mx = e.clientX - rect.left; const my = e.clientY - rect.top;
       if (dragNode) { dragNode.x = mx; dragNode.y = my; dragNode.vx = 0; dragNode.vy = 0; }
       else {
         hoverNode = nodes.find(n => Math.hypot(n.x - mx, n.y - my) < n.radius + 6);
         const tt = document.getElementById('graph-tooltip');
         if (hoverNode) {
           tt.style.display = 'block'; tt.style.left = (mx + 15) + 'px'; tt.style.top = (my + 15) + 'px';
           document.getElementById('gt-name').innerText = hoverNode.name;
           document.getElementById('gt-detail').innerText = hoverNode.details;
         } else tt.style.display = 'none';
       }
     });
     canvas.addEventListener('mouseup', () => dragNode = null);
     
     document.getElementById('graph-reset').onclick = () => { nodes.forEach(n => { n.vx = 0; n.vy = 0; }); };
     
     requestAnimationFrame(animateGraph);
   }
   
   function resizeCanvas() {
     const wrap = document.getElementById('graph-canvas-wrap');
     if (!wrap) return;
     graphWidth = wrap.clientWidth; graphHeight = wrap.clientHeight;
     canvas.width = graphWidth; canvas.height = graphHeight;
   }
   
   function updatePhysics() {
     const K = 0.05, REP = 800, DAMP = 0.85;
     
     for(let i=0; i<nodes.length; i++) {
       for(let j=i+1; j<nodes.length; j++) {
         let dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
         let distSq = dx*dx + dy*dy;
         if (distSq === 0) distSq = 1;
         if (distSq < 40000) {
           let f = REP / distSq;
           let fx = dx * f, fy = dy * f;
           nodes[i].vx += fx; nodes[i].vy += fy;
           nodes[j].vx -= fx; nodes[j].vy -= fy;
         }
       }
     }
     
     links.forEach(l => {
       let n1 = nodes.find(n => n.id === l.source), n2 = nodes.find(n => n.id === l.target);
       if (n1 && n2) {
         let dx = n2.x - n1.x, dy = n2.y - n1.y;
         let dist = Math.hypot(dx, dy) || 1;
         let f = (dist - 100) * K;
         let fx = (dx/dist)*f, fy = (dy/dist)*f;
         n1.vx += fx; n1.vy += fy;
         n2.vx -= fx; n2.vy -= fy;
       }
     });
     
     nodes.forEach(n => {
       if (n === dragNode) return;
       let cx = graphWidth/2, cy = graphHeight/2;
       n.vx += (cx - n.x) * 0.005; n.vy += (cy - n.y) * 0.005;
       n.vx *= DAMP; n.vy *= DAMP;
       n.x += n.vx; n.y += n.vy;
       n.x = Math.max(10, Math.min(graphWidth-10, n.x));
       n.y = Math.max(10, Math.min(graphHeight-10, n.y));
     });
   }
   
   function animateGraph() {
     if (activeTab === 'panel-graph' && isPhysicsRunning && ctx) {
       updatePhysics();
       ctx.clearRect(0,0,graphWidth,graphHeight);
       
       // Draw Links
       links.forEach(l => {
         let n1 = nodes.find(n => n.id === l.source), n2 = nodes.find(n => n.id === l.target);
         if (!n1 || !n2) return;
         ctx.strokeStyle = (hoverNode && (hoverNode===n1||hoverNode===n2)) ? 'rgba(0,180,255,0.6)' : 'rgba(255,255,255,0.1)';
         ctx.lineWidth = 1;
         ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.lineTo(n2.x, n2.y); ctx.stroke();
       });
       
       // Draw Nodes
       nodes.forEach(n => {
         ctx.fillStyle = n.color;
         ctx.beginPath(); ctx.arc(n.x, n.y, n.radius, 0, Math.PI*2); ctx.fill();
         if (hoverNode === n || dragNode === n) {
           ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
         }
       });
     }
     requestAnimationFrame(animateGraph);
   }

   // ==========================================
   // 8. OFFENDER PROFILING PANEL
   // ==========================================
   function initOffenderPanel() {
     const list = document.getElementById('habitual-offenders-list');
     const offenders = db.suspects.filter(s => s.prior_arrests > 0).sort((a,b) => b.risk_score - a.risk_score);
     
     function renderList(filteredArr) {
       list.innerHTML = filteredArr.map(s => `
         <div class="case-item" onclick="selectOffender('${s.suspect_id}')">
           <div style="font-weight:bold; color:var(--accent-red); margin-bottom:2px;">${s.name}</div>
           <div style="font-size:10px; color:var(--text-muted)">Risk: ${(s.risk_score*100).toFixed(0)}% | Prior: ${s.prior_arrests}</div>
         </div>
       `).join('');
     }
     renderList(offenders);
     
     document.getElementById('offender-search-input').addEventListener('input', (e) => {
       const val = e.target.value.toLowerCase();
       renderList(offenders.filter(s => s.name.toLowerCase().includes(val) || s.primary_mo.toLowerCase().includes(val)));
     });
   }
   
   function selectOffender(id) {
     const s = db.suspects.find(x => x.suspect_id === id);
     if (!s) return;
     selectedOffenderId = id;
     
     document.getElementById('offender-no-select').style.display = 'none';
     document.getElementById('offender-card').style.display = 'block';
     
     document.getElementById('prof-name').innerText = s.name;
     document.getElementById('prof-alias').innerText = s.alias;
     document.getElementById('prof-status').innerText = s.status;
     document.getElementById('prof-risk-score').innerText = (s.risk_score*100).toFixed(0) + '%';
     
     document.getElementById('prof-age-gender').innerText = `${s.age} / ${s.gender}`;
     document.getElementById('prof-edu').innerText = s.education;
     document.getElementById('prof-occ').innerText = s.occupation;
     document.getElementById('prof-income').innerText = s.income_group;
     document.getElementById('prof-native').innerText = s.native_place;
     document.getElementById('prof-marital').innerText = s.marital_status;
     
     document.getElementById('prof-mo-primary').innerText = s.primary_mo;
     document.getElementById('prof-mo-history').innerHTML = s.mo_history.map(m => `<li>${m}</li>`).join('');
     
     document.getElementById('prof-behavior-tags').innerHTML = s.behavioral_tags.map(t => `<span class="profile-tag ${t.includes('Habitual')||t.includes('Violence')?'danger':''}">${t}</span>`).join('');
     
     // Connections
     const cLinks = db.links.filter(l => l.entity_id === id && l.entity_type === 'Suspect');
     document.getElementById('prof-linked-cases').innerHTML = cLinks.map(l => `<div class="chat-citation" onclick="openDossier('${l.fir_id}')">${l.fir_id}</div>`).join('') || "None";
     
     document.getElementById('prof-linked-banks').innerHTML = s.bank_accounts.map(b => `<span style="font-family:monospace;background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;">${b}</span>`).join('');
     document.getElementById('prof-gang').innerText = s.gang_affiliation || "Unaffiliated Loner";
     document.getElementById('prof-contacts').innerText = s.phone_numbers.join(', ');
     
     // Risk Evolution & Escalation
     if (s.risk_evolution) {
       const reEl = document.getElementById('prof-risk-evolution');
       reEl.innerHTML = s.risk_evolution.map(r => {
         const h = Math.round(r.score * 30);
         const clr = r.score > 0.7 ? 'var(--accent-red)' : r.score > 0.4 ? 'var(--accent-orange)' : 'var(--accent-green)';
         return `<div style="display:flex;flex-direction:column;align-items:center;flex:1;height:100%;justify-content:flex-end;">
           <div style="width:100%;height:${h}px;background:${clr};border-radius:2px;" title="${r.month}: ${Math.round(r.score*100)}%"></div>
           <div style="font-size:8px;color:var(--text-muted);margin-top:2px;">${r.month.replace('Month ', '')}</div>
         </div>`;
       }).join('');

       const escEl = document.getElementById('prof-escalation-indicator');
       if (s.risk_evolution.length > 2) {
         const first = s.risk_evolution[0].score;
         const last = s.risk_evolution[s.risk_evolution.length - 1].score;
         if (last > first + 0.15) {
           escEl.innerHTML = `⚠️ ESCALATING: Risk has risen by ${Math.round((last - first) * 100)}% over monitored period. Crime severity/frequency likely increasing.`;
           escEl.style.color = 'var(--accent-red)';
         } else if (last < first - 0.1) {
           escEl.innerHTML = `✅ DE-ESCALATING: Risk has decreased by ${Math.round((first - last) * 100)}%. Suspect showing signs of inactivity.`;
           escEl.style.color = 'var(--accent-green)';
         } else {
           escEl.innerHTML = `📊 STABLE: Risk trajectory is flat. Continue routine surveillance.`;
           escEl.style.color = 'var(--text-muted)';
         }
       }
     }

     // Known Associates Analysis
     const assocEl = document.getElementById('prof-associates');
     const myFirs = db.links.filter(l => l.entity_id === id && l.entity_type === 'Suspect').map(l => l.fir_id);
     const coSuspects = db.links.filter(l => l.entity_type === 'Suspect' && l.entity_id !== id && myFirs.includes(l.fir_id));
     const uniqueAssoc = [...new Set(coSuspects.map(c => c.entity_id))];
     if (uniqueAssoc.length > 0) {
       assocEl.innerHTML = uniqueAssoc.map(aId => {
         const as = db.suspects.find(x => x.suspect_id === aId);
         return `<span class="chat-citation" onclick="selectOffender('${aId}')">${as ? as.name : aId}</span>`;
       }).join(' ');
     } else {
       assocEl.innerHTML = "No co-accused suspects associated via common FIRs in current database.";
     }
     
     logAudit(`Viewed behavioral profile for ${s.name} (${id})`);
     logSystemActivity(`Viewed offender dossier for ${s.name} [${id}]`);
   }

   // ==========================================
   // 9. FINANCIAL INTELLIGENCE PANEL
   // ==========================================
   function initFinancialPanel() {
     const susTxns = db.transactions.filter(t => t.is_suspicious).sort((a,b) => b.amount_inr - a.amount_inr);
     
     document.getElementById('fin-total-mapped').innerText = `₹${(db.transactions.reduce((sum,t)=>sum+t.amount_inr,0)/100000).toFixed(1)}L`;
     document.getElementById('fin-suspicious-count').innerText = susTxns.length;
     document.getElementById('fin-bank-count').innerText = [...new Set(db.transactions.map(t=>t.bank))].length;
     
     const list = document.getElementById('suspicious-txns-container');
     list.innerHTML = susTxns.map(t => `
       <div class="alert-item" onclick="selectTransaction('${t.transaction_id}')">
         <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
           <span style="font-size:10px;color:var(--text-muted)">${t.transaction_id}</span>
           <span class="ai-amount">₹${t.amount_inr.toLocaleString()}</span>
         </div>
         <div class="ai-utr">Bank: ${t.bank}</div>
         <div class="ai-reason">⚠️ ${t.risk_flag}</div>
       </div>
     `).join('');
   }
   
   function selectTransaction(id) {
     const t = db.transactions.find(x => x.transaction_id === id);
     if (!t) return;
     selectedTxnId = id;
     
     document.getElementById('fin-no-select').style.display = 'none';
     document.getElementById('fin-details-content').style.display = 'block';
     
     document.getElementById('fin-txn-id').innerText = t.transaction_id;
     document.getElementById('fin-txn-type').innerText = t.transaction_type;
     document.getElementById('fin-txn-amount').innerText = `₹${t.amount_inr.toLocaleString()}`;
     
     const suspect = db.suspects.find(s => s.suspect_id === t.suspect_id);
     document.getElementById('fin-suspect').innerHTML = `<span style="color:var(--accent-red);font-weight:bold;cursor:pointer" onclick="document.getElementById('tab-offenders').click(); selectOffender('${t.suspect_id}')">${suspect?.name || t.suspect_id}</span>`;
     document.getElementById('fin-src-bank').innerText = t.bank;
     document.getElementById('fin-utr').innerText = t.utr_number;
     document.getElementById('fin-dest-account').innerText = t.destination_account;
     document.getElementById('fin-date').innerText = new Date(t.transaction_date).toLocaleString();
     document.getElementById('fin-flag').innerText = t.risk_flag;
     
     // Populate AI Insight block
     document.getElementById('fin-ai-insight').innerText = t.ai_insight || "AI Insight: No anomalous layering or structuring pattern detected. Transaction aligns with standard retail client profile.";
     
     logAudit(`Audited suspicious transaction ${id}.`);
     logSystemActivity(`Audited suspicious transaction ${id}.`);
   }

   // ==========================================
   // 10. ANALYTICS & SOCIO-DEMOGRAPHIC CHARTS
   // ==========================================
   function initAnalytics() {
     const getCounts = (key) => { const c = {}; db.firs.forEach(f => c[f[key]] = (c[f[key]]||0)+1); return c; };
     
     Chart.defaults.color = '#7a8fa6';
     Chart.defaults.font.family = 'Inter';

     // Chart 1: Crime Types
     const tc = getCounts('incident_type');
     charts.type = new Chart(document.getElementById('chart-crime-type'), {
       type: 'doughnut', data: { labels: Object.keys(tc), datasets: [{ data: Object.values(tc), backgroundColor: ['#00b4ff','#ff3860','#ffb300','#00e676','#a855f7'], borderWidth: 0 }] },
       options: { plugins: { legend: { position: 'right' } } }
     });

     // Chart 2: Monthly Trends
     const mCounts = Array(12).fill(0); db.firs.forEach(f => mCounts[new Date(f.incident_date).getMonth()]++);
     charts.monthly = new Chart(document.getElementById('chart-monthly'), {
       type: 'line', data: { labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], datasets: [{ label: 'Cases', data: mCounts, borderColor: '#00ffe7', backgroundColor: 'rgba(0,255,231,0.1)', fill: true, tension: 0.3 }] },
       options: { scales: { x:{grid:{color:'rgba(255,255,255,0.05)'}}, y:{grid:{color:'rgba(255,255,255,0.05)'}} } }
     });

     // Chart 3: Districts Bar
     const dCounts = Object.entries(getCounts('district')).sort((a,b)=>b[1]-a[1]).slice(0,5);
     charts.dist = new Chart(document.getElementById('chart-districts'), {
       type: 'bar', data: { labels: dCounts.map(d=>d[0].split(' ')[0]), datasets: [{ data: dCounts.map(d=>d[1]), backgroundColor: '#00b4ff' }] },
       options: { plugins:{legend:{display:false}}, scales:{x:{grid:{display:false}},y:{grid:{color:'rgba(255,255,255,0.05)'}}} }
     });

     // Chart 4: Severity Polar
     const sc = getCounts('severity');
     charts.sev = new Chart(document.getElementById('chart-severity'), {
       type: 'polarArea', data: { labels: Object.keys(sc), datasets: [{ data: Object.values(sc), backgroundColor: ['rgba(255,56,96,0.7)','rgba(255,179,0,0.7)','rgba(0,230,118,0.7)','rgba(0,180,255,0.7)'], borderWidth: 0 }] },
       options: { scales:{r:{grid:{color:'rgba(255,255,255,0.1)'}}} }
     });
     
     // Chart 5: Hour
     const hCounts = Array(24).fill(0); db.firs.forEach(f => hCounts[f.incident_hour]++);
     charts.hr = new Chart(document.getElementById('chart-hour'), {
       type: 'bar', data: { labels: Array(24).fill(0).map((_,i)=>`${i}:00`), datasets: [{ data: hCounts, backgroundColor: '#ffb300' }] },
       options: { plugins:{legend:{display:false}} }
     });

     // Chart 6: QuickML Prediction Radar
     const dPred = ["Bengaluru Urban", "Mysuru", "Mangaluru", "Hubballi-Dharwad"];
     charts.pred = new Chart(document.getElementById('chart-prediction'), {
       type: 'radar', data: { labels: dPred.map(d=>d.split(' ')[0]), datasets: [{ label: 'Risk Score', data: [85, 62, 55, 48], borderColor: '#ff3860', backgroundColor: 'rgba(255,56,96,0.2)' }] },
       options: { scales:{r:{grid:{color:'rgba(255,255,255,0.1)'}, angleLines:{color:'rgba(255,255,255,0.1)'}}} }
     });

     // Chart 7: Victim Age Demographics
     const aCounts = {"<25":0, "26-40":0, "41-60":0, ">60":0};
     db.victims.forEach(v => { if(v.age<25)aCounts["<25"]++; else if(v.age<=40)aCounts["26-40"]++; else if(v.age<=60)aCounts["41-60"]++; else aCounts[">60"]++; });
     charts.age = new Chart(document.getElementById('chart-demographics'), {
       type: 'bar', data: { labels: Object.keys(aCounts), datasets: [{ data: Object.values(aCounts), backgroundColor: '#00e676' }] }
     });

     // Chart 8: Victim Education (Socio-Demographic)
     const eduCounts = {}; db.victims.forEach(v => eduCounts[v.education] = (eduCounts[v.education]||0)+1);
     charts.edu = new Chart(document.getElementById('chart-education'), {
       type: 'pie', data: { labels: Object.keys(eduCounts), datasets: [{ data: Object.values(eduCounts), backgroundColor: ['#00b4ff','#ff3860','#ffb300','#00e676','#a855f7','#4dd0e1','#f06292'], borderWidth: 1, borderColor:'#000' }] },
       options: { plugins: { legend: { position: 'right' } } }
     });
     
     // Chart 9: Occupation
     const occCounts = {}; db.victims.forEach(v => occCounts[v.occupation] = (occCounts[v.occupation]||0)+1);
     const topOcc = Object.entries(occCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
     charts.occ = new Chart(document.getElementById('chart-occupation'), {
       type: 'bar', data: { labels: topOcc.map(o=>o[0]), datasets: [{ data: topOcc.map(o=>o[1]), backgroundColor: '#a855f7' }] },
       options: { indexAxis: 'y', plugins:{legend:{display:false}} }
     });

     // Chart 10: Urbanization Correlation (Scatter)
     const scatterData = Object.keys(db.districtAnalytics).map(d => ({ x: db.districtAnalytics[d].urban_index * 100, y: db.districtAnalytics[d].crime_rate_per_lakh }));
     charts.urban = new Chart(document.getElementById('chart-urban-correlation'), {
       type: 'scatter', data: { datasets: [{ label: 'Districts', data: scatterData, backgroundColor: '#00ffe7', pointRadius: 6 }] },
       options: { scales: { x: { title: {display:true, text:'Urbanization Index (%)'} }, y: { title: {display:true, text:'Crimes per Lakh'} } } }
     });

     // Chart 11: Seasonal Patterns
     const sCounts = {"Summer":0, "Monsoon":0, "Post-Monsoon":0, "Winter":0};
     db.firs.forEach(f => sCounts[f.season]++);
     charts.season = new Chart(document.getElementById('chart-season-cycles'), {
       type: 'line', data: { labels: Object.keys(sCounts), datasets: [{ label: 'Incidents', data: Object.values(sCounts), borderColor: '#ff3860', tension: 0.4 }] }
     });
     
     // Chart 12: Suspect Correlation
     const cData = db.suspects.slice(0, 10).map(s => s.risk_score * 100);
     charts.corr = new Chart(document.getElementById('chart-suspect-correlation'), {
       type: 'radar', data: { labels: db.suspects.slice(0,10).map(s => s.name), datasets: [{ data: cData, backgroundColor: 'rgba(0,180,255,0.2)', borderColor: '#00b4ff' }] }
     });

     generateSociologicalInsights();
   }

   function generateSociologicalInsights() {
     const insightEl = document.getElementById('sociological-insights-text');
     if (!insightEl) return;
     const moCounts = {};
     db.suspects.forEach(s => { if (s.primary_mo) moCounts[s.primary_mo] = (moCounts[s.primary_mo] || 0) + 1; });
     const topMO = Object.entries(moCounts).sort((a, b) => b[1] - a[1])[0];
     const highRisk = db.suspects.filter(s => s.risk_score >= 0.7);
     const incomeGroups = {};
     highRisk.forEach(s => { if (s.income_group) incomeGroups[s.income_group] = (incomeGroups[s.income_group] || 0) + 1; });
     const topIncome = Object.entries(incomeGroups).sort((a, b) => b[1] - a[1])[0];
     const blrAnalytics = db.districtAnalytics?.['Bengaluru Urban'];
     const blrCrimes = db.firs.filter(f => f.district === 'Bengaluru Urban').length;
     const narrativeText = `<strong>AI Sociological Analysis:</strong> The predominant Modus Operandi in the active suspect database is <span style="color: var(--accent-orange)">${topMO ? topMO[0] : 'Unknown'}</span> (${topMO ? topMO[1] : 0} suspects). Among high-risk individuals (risk score ≥ 70%), the most overrepresented income group is <span style="color: var(--accent-red)">${topIncome ? topIncome[0] : 'Unknown'}</span>, suggesting a socioeconomic correlation with organized crime entry. ${blrAnalytics ? `Bengaluru Urban shows the highest urbanization-crime density nexus (Urban Index: ${blrAnalytics.urban_index}, Crime Rate/Lakh: ${blrAnalytics.crime_rate_per_lakh}) with ${blrCrimes} active FIRs — consistent with national metro-crime trends.` : ''} Targeted interventions in vocational training and economic inclusion programs for this demographic cluster may reduce recidivism rates.`;
     insightEl.innerHTML = narrativeText;
   }
   
   // ==========================================
   // 11. DOSSIER & INVESTIGATION TIMELINES
   // ==========================================
   function openDossier(firId) {
     const fir = db.firs.find(f => f.fir_id === firId);
     if (!fir) return;
     
     logAudit(`Generated complete dossier view for ${firId}`);
     logSystemActivity(`Opened case dossier: ${firId} (${fir.incident_type}, ${fir.district})`);
   
     const vLinks = db.links.filter(l => l.fir_id === firId && l.entity_type === 'Victim');
     const sLinks = db.links.filter(l => l.fir_id === firId && l.entity_type === 'Suspect');
     const txns = db.transactions.filter(t => t.fir_id === firId);
     
     const confidence = Math.min(98, 70 + (sLinks.length * 8) + (txns.length * 5));
     const aiBriefingHtml = `
       <div style="background:rgba(255,179,0,0.08); border-left:4px solid var(--accent-orange); padding:15px; margin-bottom:20px; border-radius:4px;">
         <h4 style="color:var(--accent-orange); margin-top:0; margin-bottom:8px; font-size:13px; display:flex; align-items:center; gap:6px;">
           🤖 AI Investigator Decision Support Brief
         </h4>
         <div style="font-size:12px; line-height:1.5; color:#e8f0fe; margin-bottom:10px;">
           <strong>Executive Summary:</strong> Case ${fir.fir_id} presents patterns matching ${fir.incident_type} crime topology.
           AI clustering has successfully linked ${sLinks.length} suspect(s) (${sLinks.map(l => l.entity_id).join(', ') || 'none'}) 
           and ${txns.length} financial transaction(s) to this file. Risk engines suggest a ${confidence}% syndicate probability.
         </div>
         <div style="font-size:11px; line-height:1.4; color:#b0c4d8; margin-bottom:10px; background:rgba(0,0,0,0.2); padding:8px; border-radius:4px;">
           <strong>⚡ AI Next-Step Recommendations:</strong><br>
           1. Dispatch immediate summons/warrant queries for mapped suspects. <br>
           2. ${txns.length > 0 ? "Flag and freeze all linked money-mule accounts to prevent Hawala/layering outflow." : "Audit suspect bank history to identify potential structuring or shell accounts."} <br>
           3. Coordinate evidence sharing across the ${fir.police_station} station network.
         </div>
         <div style="font-size:10px; color:var(--text-muted); display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.05); padding-top:8px;">
           <span>Confidence Score: <strong style="color:var(--accent-green)">${confidence}%</strong></span>
           <span>Based on sources: <strong style="color:var(--accent-blue)">[${fir.fir_id}]${sLinks.length > 0 ? ', [' + sLinks.map(l => l.entity_id).join('], [') + ']' : ''}</strong></span>
         </div>
       </div>
     `;
   
     document.getElementById('dossier-body').innerHTML = `
       ${aiBriefingHtml}
       
       <div class="dossier-row">
         <div class="dossier-field"><div class="df-label">FIR Reference</div><div class="df-val">${fir.fir_id}</div></div>
         <div class="dossier-field"><div class="df-label">Incident Class</div><div class="df-val">${fir.incident_type}</div></div>
         <div class="dossier-field"><div class="df-label">Priority Level</div><div class="df-val" style="color:${fir.severity==='Critical'||fir.severity==='High'?'var(--accent-red)':'#fff'}">${fir.severity}</div></div>
       </div>
       <div class="dossier-row">
         <div class="dossier-field"><div class="df-label">Jurisdiction</div><div class="df-val">${fir.police_station}, ${fir.district}</div></div>
         <div class="dossier-field"><div class="df-label">IPC Sections</div><div class="df-val">${fir.ipc_sections}</div></div>
       </div>
       
       <div style="margin-bottom:20px; background:rgba(0,0,0,0.2); padding:15px; border-radius:6px; border:1px solid rgba(255,255,255,0.05);">
         <div class="df-label">Incident Narrative Description</div>
         <div style="font-size:13px; color:#b0c4d8; line-height:1.5; margin-top:5px;">${fir.description}</div>
       </div>
       
       <div style="display:flex; gap:20px;">
         <div style="flex:1;">
           <h4 style="color:var(--accent-blue); text-transform:uppercase; font-size:12px; margin-bottom:10px;">📋 Mapped Suspects</h4>
           ${sLinks.map(l => {
             const s = db.suspects.find(x=>x.suspect_id===l.entity_id);
             return `<div style="background:rgba(255,56,96,0.1); border:1px solid rgba(255,56,96,0.3); padding:8px; border-radius:4px; margin-bottom:6px;">
               <strong style="color:var(--accent-red)">${s?.name || l.entity_id}</strong> (${l.association_type})<br>
               <span style="font-size:10px; color:#c0d0e0">Risk: ${(s?.risk_score*100).toFixed(0)}% | Status: ${s?.status}</span>
             </div>`;
           }).join('') || '<div style="font-size:11px; color:#777">No suspects linked yet.</div>'}
         </div>
         
         <div style="flex:1;">
           <h4 style="color:var(--accent-blue); text-transform:uppercase; font-size:12px; margin-bottom:10px;">⏳ Investigation Timeline</h4>
           <div class="investigation-timeline">
             ${fir.investigation_timeline.map(t => `
               <div class="timeline-event">
                 <div class="timeline-date">${new Date(t.date).toLocaleDateString()}</div>
                 <div class="timeline-desc">${t.stage}</div>
                 <div class="timeline-officer">Assigned: ${t.officer}</div>
               </div>
             `).join('')}
           </div>
         </div>
       </div>
     `;
   
     document.getElementById('dossier-modal').classList.add('open');
     
     document.getElementById('dossier-investigate').onclick = () => {
       document.getElementById('dossier-modal').classList.remove('open');
       document.getElementById('tab-chat').click();
       const input = document.getElementById('chat-input');
       input.value = `Analyze suspect links and timelines for ${fir.fir_id}. Are there similar cases?`;
       handleChatSubmit();
     };
   }
   
   document.getElementById('dossier-close').onclick = () => document.getElementById('dossier-modal').classList.remove('open');
   
   // ------------------------------------------
   // PDF EXPORT (SmartBrowz Simulation)
   // ------------------------------------------
   document.getElementById('dossier-print').onclick = () => {
     const firId = document.querySelector('#dossier-body .df-val')?.innerText;
     if (!firId) return;
     const fir = db.firs.find(f => f.fir_id === firId);
     if (!fir) return;

     logAudit(`Exported Case Dossier as PDF via SmartBrowz for ${firId}`);

     const sLinks = db.links.filter(l => l.fir_id === firId && l.entity_type === 'Suspect');
     const txns = db.transactions.filter(t => t.fir_id === firId);
     const confidence = Math.min(98, 70 + (sLinks.length * 8) + (txns.length * 5));

     const printWin = window.open('', '_blank');
     printWin.document.write(`
       <html>
       <head>
         <title>Case Dossier - ${firId}</title>
         <style>
           body { font-family: 'Courier New', Courier, monospace; color: #111; padding: 40px; line-height: 1.4; }
           .header { text-align: center; border-bottom: 3px double #111; padding-bottom: 15px; margin-bottom: 20px; }
           .title { font-size: 24px; font-weight: bold; text-transform: uppercase; }
           .subtitle { font-size: 14px; margin-top: 5px; color: #555; }
           .section { margin-top: 25px; border-bottom: 1px solid #333; padding-bottom: 8px; font-size: 16px; font-weight: bold; text-transform: uppercase; }
           .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
           .field { font-size: 12px; }
           .label { font-weight: bold; text-transform: uppercase; color: #444; }
           .value { margin-top: 3px; font-size: 13px; }
           .ai-brief { background: #f4f4f4; border-left: 5px solid #111; padding: 15px; margin-top: 20px; font-size: 12px; }
           .timeline { margin-top: 15px; }
           .timeline-item { margin-bottom: 12px; border-left: 2px solid #555; padding-left: 10px; font-size: 12px; }
           .timeline-date { font-weight: bold; }
         </style>
       </head>
       <body>
         <div class="header">
           <div class="title">Karnataka State Police Intelligence Suite</div>
           <div class="subtitle">CONFIDENTIAL INVESTIGATION DOSSIER · GENERATED VIA JANARAKSHAK AI</div>
           <div style="font-size:10px; margin-top:5px;">TIMESTAMP: ${new Date().toLocaleString()} · ASSIGNED OFFICER BADGE: ${currentUserBadge}</div>
         </div>

         <div class="grid">
           <div class="field"><div class="label">FIR Number</div><div class="value">${fir.fir_id}</div></div>
           <div class="field"><div class="label">Incident Category</div><div class="value">${fir.incident_type}</div></div>
           <div class="field"><div class="label">Station & District</div><div class="value">${fir.police_station}, ${fir.district}</div></div>
           <div class="field"><div class="label">IPC Sections</div><div class="value">${fir.ipc_sections}</div></div>
         </div>

         <div class="section">Incident Narrative</div>
         <div style="font-size: 12px; margin-top: 10px; text-align: justify;">${fir.description}</div>

         <div class="section">AI Investigator Decision Briefing</div>
         <div class="ai-brief">
           <strong>Executive Summary:</strong><br>
           Case ${fir.fir_id} matches ${fir.incident_type} crime topology. AI clustering has structurally linked ${sLinks.length} suspect(s) and ${txns.length} financial transaction(s). Syndicate activity probability is computed at ${confidence}%.<br><br>
           <strong>Recommended Next Steps:</strong><br>
           1. Dispatch immediate summons/warrant queries for mapped suspects.<br>
           2. Flag and freeze all linked money-mule accounts to prevent Hawala/layering outflow.<br>
           3. Coordinate evidence sharing across the ${fir.police_station} station network.<br><br>
           <strong>Citations & Evidence Sources:</strong><br>
           Based on: [${fir.fir_id}]${sLinks.length > 0 ? ', [' + sLinks.map(l => l.entity_id).join('], [') + ']' : ''}
         </div>

         <div class="section">Linked Suspects</div>
         <div style="margin-top: 10px; font-size: 12px;">
           ${sLinks.map(l => {
             const s = db.suspects.find(x => x.suspect_id === l.entity_id);
             return `- ${s?.name || l.entity_id} (${l.association_type}) | Risk Score: ${(s?.risk_score*100).toFixed(0)}% | Status: ${s?.status || 'Unknown'}`;
           }).join('<br>') || 'No suspect entities linked to this case record.'}
         </div>

         <div class="section">Chronological Investigation History</div>
         <div class="timeline">
           ${fir.investigation_timeline.map(t => `
             <div class="timeline-item">
               <div class="timeline-date">${new Date(t.date).toLocaleDateString()}</div>
               <div>Stage: ${t.stage}</div>
               <div>Assigned: ${t.officer}</div>
             </div>
           `).join('')}
         </div>

         <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #555; border-top: 1px solid #ccc; padding-top: 10px;">
           SECURE AUDIT RECORD: CATALYST-SMARTBROWZ-SESSION-LOGGED
         </div>
       </body>
       </html>
     `);
     printWin.document.close();
     printWin.focus();
     setTimeout(() => { printWin.print(); printWin.close(); }, 500);
   };

   // ==========================================
   // 12. CASE INSIGHTS PANEL — Investigator Decision Support
   // ==========================================
   let selectedInsightFirId = null;

   function initInsights() {
     const sel = document.getElementById('insights-case-select');
     const caseList = document.getElementById('insights-case-list');
     if (!sel || !caseList) return;

     db.firs.forEach(f => {
       const opt = new Option(`${f.fir_id} — ${f.incident_type} (${f.district})`, f.fir_id);
       sel.add(opt);
     });

     caseList.innerHTML = db.firs.slice(0, 25).map(f => `
       <div class="case-item" onclick="loadInsight('${f.fir_id}')" id="insight-item-${f.fir_id}">
         <div class="ci-fir">${f.fir_id}</div>
         <div class="ci-type">${f.incident_type}</div>
         <div class="ci-dist">${f.police_station}, ${f.district}</div>
         <div class="ci-sev ${f.severity.toLowerCase()}">${f.severity}</div>
       </div>
     `).join('');

     sel.addEventListener('change', () => { if (sel.value) loadInsight(sel.value); });
   }

   function loadInsight(firId) {
     selectedInsightFirId = firId;
     const fir = db.firs.find(f => f.fir_id === firId);
     if (!fir) return;

     logSystemActivity(`Loaded Case Insights panel for ${firId}`);

     document.getElementById('insights-no-select').style.display = 'none';
     const content = document.getElementById('insights-content');
     content.style.display = 'flex';

     document.getElementById('insights-narrative').innerHTML = generateCaseNarrative(fir);
     document.getElementById('insights-similar').innerHTML = findSimilarCases(fir);
     document.getElementById('insights-leads').innerHTML = generateInvestigativeLeads(fir);

     // Highlight active list item
     document.querySelectorAll('#insights-case-list .case-item').forEach(el => el.style.borderColor = 'transparent');
     const activeEl = document.getElementById(`insight-item-${firId}`);
     if (activeEl) activeEl.style.borderColor = 'var(--accent-cyan)';

     const sel = document.getElementById('insights-case-select');
     if (sel) sel.value = firId;
   }

   function generateCaseNarrative(fir) {
     const sLinks = db.links.filter(l => l.fir_id === fir.fir_id && l.entity_type === 'Suspect');
     const txns = db.transactions.filter(t => t.fir_id === fir.fir_id);
     const victims = db.links.filter(l => l.fir_id === fir.fir_id && l.entity_type === 'Victim');
     const totalLoss = fir.loss_amount_inr > 0
       ? `₹${(fir.loss_amount_inr / 100000).toFixed(2)} Lakh` : 'undisclosed amount';
     const recovered = fir.recovered_amount_inr > 0
       ? ` (Recovered: ₹${(fir.recovered_amount_inr / 100000).toFixed(2)} Lakh)` : '';
     const confidence = Math.min(98, 70 + (sLinks.length * 8) + (txns.length * 5));
     const lastStage = fir.investigation_timeline?.[fir.investigation_timeline.length - 1]?.stage || 'Initial Filing';

     const suspectSummary = sLinks.length > 0
       ? `${sLinks.length} suspect(s) linked: ` + sLinks.map(l => {
           const s = db.suspects.find(x => x.suspect_id === l.entity_id);
           if (!s) return l.entity_id;
           const displayName = currentRole === 'Policymaker' ? '[REDACTED PII]' : s.name;
           return `<span class="chat-citation" onclick="document.getElementById('tab-offenders').click(); selectOffender('${s.suspect_id}')">${displayName}</span> (Risk: ${(s.risk_score*100).toFixed(0)}%)`;
         }).join(', ')
       : 'No suspects formally linked yet. Investigation ongoing.';

     const narrative = `
       On <strong>${new Date(fir.incident_date).toLocaleDateString('en-IN', {day:'numeric', month:'long', year:'numeric'})}</strong>,
       a <strong style="color: var(--accent-orange)">${fir.incident_type}</strong> incident was registered at
       <strong>${fir.police_station}, ${fir.district}</strong> under IPC Section(s) ${fir.ipc_sections}.
       The incident occurred during the <em>${fir.incident_time_category}</em> hours and is classified as
       <span style="color: ${fir.severity === 'Critical' || fir.severity === 'High' ? 'var(--accent-red)' : 'var(--accent-green)'}">${fir.severity} Severity</span>.
       <br><br>
       <strong>Victimology:</strong> ${victims.length} victim(s) identified. Financial loss estimated at
       <strong>${totalLoss}${recovered}</strong>.
       <br><br>
       <strong>Suspect Profile:</strong> ${suspectSummary}
       <br><br>
       <strong>Financial Intelligence:</strong> ${txns.length > 0
         ? `${txns.length} suspicious transaction(s) tracked. AI confidence score: <strong style="color: var(--accent-green)">${confidence}%</strong>.`
         : 'No financial transactions directly linked to this case.'}
       <br><br>
       <strong>Current Status:</strong> ${fir.status}. Latest investigation stage: <em>${lastStage}</em>.
     `;
     return redactPII(narrative);
   }

   function findSimilarCases(fir) {
     const similar = db.firs.filter(f => {
       if (f.fir_id === fir.fir_id) return false;
       let score = 0;
       if (f.incident_type === fir.incident_type) score += 3;
       if (f.crime_category === fir.crime_category) score += 2;
       if (f.district === fir.district) score += 1;
       if (f.ipc_sections === fir.ipc_sections) score += 2;
       if (f.severity === fir.severity) score += 1;
       f._simScore = score;
       return score >= 4;
     }).sort((a, b) => b._simScore - a._simScore).slice(0, 5);

     if (similar.length === 0) {
       return `<div style="color: var(--text-muted); font-size: 12px; font-style: italic; padding: 10px 0;">No structurally similar cases found in current database.</div>`;
     }

     return similar.map(f => `
       <div style="background: rgba(0,180,255,0.05); border: 1px solid rgba(0,180,255,0.2); border-radius: 6px; padding: 10px; cursor: pointer; transition: border-color 0.2s;" onmouseover="this.style.borderColor='rgba(0,180,255,0.5)'" onmouseout="this.style.borderColor='rgba(0,180,255,0.2)'" onclick="openDossier('${f.fir_id}')">
         <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
           <span style="font-family: var(--font-mono); color: var(--accent-cyan); font-size: 11px;">${f.fir_id}</span>
           <span style="font-size: 10px; background: rgba(0,180,255,0.15); padding: 2px 6px; border-radius: 10px; color: var(--accent-blue);">Similarity: ${Math.min(100, f._simScore * 12)}%</span>
         </div>
         <div style="font-size: 12px; color: #e8f0fe; font-weight: 600;">${f.incident_type}</div>
         <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">${f.police_station}, ${f.district} · ${f.status}</div>
       </div>
     `).join('');
   }

   function generateInvestigativeLeads(fir) {
     const leads = [];
     const sLinks = db.links.filter(l => l.fir_id === fir.fir_id && l.entity_type === 'Suspect');
     const txns = db.transactions.filter(t => t.fir_id === fir.fir_id);

     // Lead Type 1: Absconding suspects linked to this FIR
     sLinks.forEach(l => {
       const s = db.suspects.find(x => x.suspect_id === l.entity_id);
       if (!s) return;
       const name = currentRole === 'Policymaker' ? '[REDACTED PII]' : s.name;
       if (s.status === 'Absconding') {
         leads.push({ priority: 'CRITICAL', icon: '🚨', color: 'var(--accent-red)',
           title: 'Locate Absconding Suspect',
           body: `${name} is Absconding. Last known: ${s.last_known_location || 'Unknown'}. Issue Red Corner Notice & Lookout Circular immediately.`
         });
       } else if (s.risk_score >= 0.75 && s.status !== 'Arrested') {
         leads.push({ priority: 'HIGH', icon: '⚠️', color: 'var(--accent-orange)',
           title: 'Escalate Surveillance on High-Risk Suspect',
           body: `${name} has Risk Score ${(s.risk_score*100).toFixed(0)}% with ${s.prior_arrests} prior arrests. Recommend continuous surveillance and phone-tap application.`
         });
       }
     });

     // Lead Type 2: Suspicious transactions
     const susTxns = txns.filter(t => t.is_suspicious);
     if (susTxns.length > 0) {
       const total = susTxns.reduce((sum, t) => sum + t.amount_inr, 0);
       leads.push({ priority: 'HIGH', icon: '💰', color: 'var(--accent-orange)',
         title: `Freeze ${susTxns.length} Suspicious Account(s)`,
         body: `${susTxns.length} suspicious transaction(s) totaling ₹${(total / 100000).toFixed(2)}L linked to this FIR. Issue SFIO freeze order. Risk flags: ${susTxns[0].risk_flag}.`
       });
     }

     // Lead Type 3: MO recurrence across other FIRs (global syndicate signal)
     const linkedSuspects = sLinks.map(l => db.suspects.find(x => x.suspect_id === l.entity_id)).filter(Boolean);
     const moList = [...new Set(linkedSuspects.map(s => s.primary_mo))];
     moList.forEach(mo => {
       const recurrenceFirs = db.firs.filter(f2 => {
         if (f2.fir_id === fir.fir_id) return false;
         return db.links.some(l => l.fir_id === f2.fir_id && l.entity_type === 'Suspect' &&
           db.suspects.some(s => s.suspect_id === l.entity_id && s.primary_mo === mo));
       });
       if (recurrenceFirs.length >= 2) {
         leads.push({ priority: 'MEDIUM', icon: '🔁', color: 'var(--accent-cyan)',
           title: `MO Recurrence: ${mo} (${recurrenceFirs.length} cases)`,
           body: `The "${mo}" MO appears across ${recurrenceFirs.length} other active FIRs. This signals a potential serial/syndicate pattern. Cross-district coordination is recommended.`
         });
       }
     });

     // Lead Type 4: Digital forensics for cyber cases
     if (fir.incident_type === 'Cybercrime' || fir.crime_category === 'White Collar') {
       leads.push({ priority: 'HIGH', icon: '💻', color: 'var(--accent-blue)',
         title: 'Deploy Digital Forensics Unit',
         body: 'Case classification indicates digital evidence exists. Request IMEI/IP trace, coordinate with CERT-In for network trail. Preserve device images immediately.'
       });
     }

     // Lead Type 5: Global unseen high-risk suspects (when no suspects linked)
     if (sLinks.length === 0) {
       const globalHR = db.suspects.filter(s => s.risk_score >= 0.8 && s.primary_mo && s.status !== 'Arrested');
       if (globalHR.length > 0) {
         leads.push({ priority: 'MEDIUM', icon: '🌐', color: '#a855f7',
           title: `${globalHR.length} High-Risk Suspects Unlinked`,
           body: `No suspects are currently tied to this FIR, but ${globalHR.length} high-risk individuals (score ≥80%) operate in similar crime categories. Perform cross-reference analysis.`
         });
       }
     }

     // Fallback lead
     if (leads.length === 0) {
       leads.push({ priority: 'LOW', icon: '📋', color: 'var(--accent-green)',
         title: 'Standard Investigation Protocol',
         body: 'No elevated AI flags detected for this case. Continue routine evidence collection, victim interviews, and station diary review.'
       });
     }

     const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
     leads.sort((a, b) => order[a.priority] - order[b.priority]);

     return leads.map((lead, i) => `
       <div style="background: rgba(255,255,255,0.02); border: 1px solid ${lead.color}44; border-left: 4px solid ${lead.color}; border-radius: 6px; padding: 12px; animation: fadeIn 0.3s ease ${i * 0.07}s both;">
         <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
           <span style="font-size: 12px; font-weight: 700; color: ${lead.color};">${lead.icon} ${lead.title}</span>
           <span style="font-size: 9px; font-weight: bold; padding: 2px 7px; border-radius: 10px; background: ${lead.color}22; color: ${lead.color}; letter-spacing: 0.5px;">${lead.priority}</span>
         </div>
         <div style="font-size: 11px; color: #b0c4d8; line-height: 1.5;">${lead.body}</div>
       </div>
     `).join('');
   }

   // ==========================================
   // 13. AUDIT PANEL — Supervisor Dashboard
   // ==========================================
   function initAuditPanel() {
     const clearBtn = document.getElementById('clear-audit-btn');
     if (!clearBtn) return;
     clearBtn.onclick = () => {
       if (currentRole !== 'Supervisor') {
         alert('Access denied. Only Supervisors can clear the audit record.');
         logSystemActivity('UNAUTHORIZED: Attempted audit log wipe — insufficient role.');
         return;
       }
       if (confirm('⚠️ WARNING: This will permanently clear all session audit logs. This action is itself logged. Proceed?')) {
         systemAuditLogs = [{ timestamp: new Date(), role: currentRole, badge: currentUserBadge, action: '⚠️ All previous logs cleared by Supervisor action.' }];
         renderAuditLogs();
         logAudit('⚠️ Audit logs cleared by Supervisor.', currentRole);
       }
     };
   }

   // ==========================================
   // 14. EARLY WARNING ALERT DROPDOWN
   // ==========================================
   function initAlertDropdown() {
     const alertBtn = document.getElementById('alert-btn');
     const dropdownMenu = document.getElementById('alert-dropdown-menu');
     const dropdownList = document.getElementById('alert-dropdown-list');
     if (!alertBtn || !dropdownMenu) return;

     alertBtn.onclick = (e) => {
       e.stopPropagation();
       dropdownMenu.classList.toggle('hidden');
     };

     document.addEventListener('click', (e) => {
       if (!alertBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
         dropdownMenu.classList.add('hidden');
       }
     });

     const alertItems = [];

     // Critical absconding suspects
     db.suspects.filter(s => s.status === 'Absconding' && s.risk_score >= 0.7).slice(0, 3).forEach(s => {
       const name = redactPII(s.name);
       alertItems.push({
         level: 'critical', icon: '🚨', title: 'High-Risk Absconder',
         body: `${name} — Last known: ${s.last_known_location || 'Unknown'}. Risk: ${(s.risk_score*100).toFixed(0)}%`
       });
     });

     // Cyber fraud surge
     const cyberActive = db.firs.filter(f => f.crime_category === 'White Collar' && f.status.includes('Under')).length;
     if (cyberActive > 3) {
       alertItems.push({
         level: 'high', icon: '⚠️', title: 'Cyber Fraud Cluster Alert',
         body: `${cyberActive} active White Collar cases under investigation. Suspected multi-district syndicate coordination pattern.`
       });
     }

     // Large-value unsolved
     const bigUnsolved = db.firs.filter(f => f.loss_amount_inr > 1000000 && f.status.includes('Under')).length;
     if (bigUnsolved > 0) {
       alertItems.push({
         level: 'high', icon: '💰', title: `${bigUnsolved} High-Value Unsolved Case(s)`,
         body: `${bigUnsolved} case(s) with losses >₹10L remain unresolved. Financial intelligence escalation required.`
       });
     }

     // Predictive seasonal alert (always shown)
     alertItems.push({
       level: 'info', icon: '📊', title: 'Predictive Risk Alert',
       body: 'AI model: 18% elevated property crime risk in upcoming weekend night windows. Recommend patrol redeployment to commercial zones.'
     });

     if (dropdownList) {
       const colorMap = { critical: 'var(--accent-red)', high: 'var(--accent-orange)', info: 'var(--accent-blue)' };
       const bgMap = { critical: 'rgba(255,56,96,0.08)', high: 'rgba(255,179,0,0.08)', info: 'rgba(0,180,255,0.06)' };

       dropdownList.innerHTML = alertItems.map(a => `
         <div style="background: ${bgMap[a.level]}; border: 1px solid ${colorMap[a.level]}44; border-left: 3px solid ${colorMap[a.level]}; border-radius: 5px; padding: 8px 10px; font-size: 11px;">
           <div style="font-weight: bold; color: ${colorMap[a.level]}; margin-bottom: 3px;">${a.icon} ${a.title}</div>
           <div style="color: #b0c4d8; line-height: 1.4;">${a.body}</div>
         </div>
       `).join('');
     }

     // Update alert badge counts
     const critHighCount = alertItems.filter(a => a.level === 'critical' || a.level === 'high').length;
     const badge = document.getElementById('alert-count');
     if (badge) badge.innerText = critHighCount;
     const ewBadge = document.getElementById('early-warning-badge');
     if (ewBadge) ewBadge.innerText = critHighCount;
   }
