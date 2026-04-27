// =====================================================
// PAKISTAN ISLAMIA HSS – SAFETY MANAGEMENT SYSTEM
// Main Application Logic
// =====================================================

// ===== LOGIN SYSTEM =====
const USERS = {
  'admin':    { password: 'islamia2024', role: 'Administrator' },
  'principal':{ password: 'principal123', role: 'Principal' },
  'safetymgr':{ password: 'safety2024',  role: 'Safety Manager' }
};

function doLogin() {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';

  if (!user || !pass) {
    errEl.textContent = '⚠ Please enter username and password';
    return;
  }

  const account = USERS[user.toLowerCase()];
  if (!account || account.password !== pass) {
    errEl.textContent = '✕ Invalid username or password';
    document.getElementById('loginPass').value = '';
    return;
  }

  // Save session
  sessionStorage.setItem('pihss_user', user);
  sessionStorage.setItem('pihss_role', account.role);

  // Show app
  document.getElementById('loginPage').style.display = 'none';
  const appShell = document.getElementById('appShell');
  appShell.style.display = 'flex';

  document.getElementById('topbarUser').textContent = account.role;

  // Init app
  setTimeout(init, 200);
}

function doLogout() {
  sessionStorage.removeItem('pihss_user');
  sessionStorage.removeItem('pihss_role');
  document.getElementById('appShell').style.display = 'none';
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginError').textContent = '';
  // Destroy all charts
  Object.values(chartInstances).forEach(c => { try { c.destroy(); } catch(e){} });
  chartInstances = {};
}

function togglePw() {
  const inp = document.getElementById('loginPass');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

// Check existing session
(function checkSession() {
  const user = sessionStorage.getItem('pihss_user');
  if (user && USERS[user]) {
    document.getElementById('loginPage').style.display = 'none';
    const appShell = document.getElementById('appShell');
    appShell.style.display = 'flex';
    document.getElementById('topbarUser').textContent = USERS[user].role;
  }
})();

// ===== DATE HELPERS =====
function today() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(d) {
  if (!d) return '--';
  const dt = typeof d === 'string' ? new Date(d + 'T00:00:00') : d;
  return dt.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
}

function timeAgo(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff / 60) + ' min ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return formatDate(ts.split('T')[0]);
}

// ===== DATE DISPLAY =====
function updateDateDisplay() {
  const now = new Date();
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('topDate').textContent = now.toLocaleDateString('en-PK', opts);
  document.getElementById('sidebarDate').textContent = now.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
}

updateDateDisplay();
setInterval(updateDateDisplay, 60000);

// ===== NAVIGATION =====
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    const page = item.dataset.page;
    navigate(page);
    document.getElementById('sidebar').classList.remove('open');
  });
});

function navigate(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`[data-page="${page}"]`).classList.add('active');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');

  const titles = {
    dashboard: 'Dashboard',
    cctv: 'CCTV Records',
    firstaid: 'First Aid Records',
    transport: 'Transport Log',
    instruments: 'Instruments Condition',
    alerts: 'Flagged Alerts',
    reports: 'Reports & Analysis'
  };
  document.getElementById('pageTitle').textContent = titles[page] || page;

  // Lazy load page data
  if (page === 'cctv') loadCCTV();
  if (page === 'firstaid') loadFirstAid();
  if (page === 'transport') loadTransport();
  if (page === 'instruments') loadInstruments();
  if (page === 'alerts') loadAlerts();
  if (page === 'reports') loadReportsCharts();
}

// Menu toggle
document.getElementById('menuToggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

// ===== TOAST =====
function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast show ${type}`;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// ===== MODAL =====
let currentModal = null;

function openModal(type) {
  closeModal();
  const m = document.getElementById(`modal-${type}`);
  if (!m) return;
  m.classList.add('active');
  document.getElementById('modalOverlay').classList.add('active');
  currentModal = type;

  // Set today's date defaults
  const dateFields = m.querySelectorAll('input[type="date"]');
  dateFields.forEach(f => { if (!f.value) f.value = today(); });
}

function closeModal() {
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
  document.getElementById('modalOverlay').classList.remove('active');
  currentModal = null;
}

// ===== STATUS BADGE =====
function statusBadge(status) {
  const map = {
    'Working': 's-working', 'On Time': 's-on-time', 'Treated & Released': 's-treated',
    'Faulty': 's-faulty', 'Emergency': 's-emergency', 'Major Injury': 's-major', 'Issue Reported': 's-issue',
    'Offline': 's-offline', 'Delayed': 's-delayed', 'Needs Maintenance': 's-maintenance',
    'Minor Injury': 's-minor', 'Illness': 's-illness', 'Referred to Hospital': 's-referred',
    'Under Observation': 's-illness'
  };
  const cls = map[status] || '';
  return `<span class="status-badge ${cls}">● ${status}</span>`;
}

// ===== ACTION BUTTONS =====
function actionBtns(collection, id) {
  return `<button class="btn-icon" onclick="editRecord('${collection}','${id}')" title="Edit">✏</button>
          <button class="btn-icon del" onclick="confirmDelete('${collection}','${id}')" title="Delete">✕</button>`;
}

// ===== DELETE CONFIRM =====
function confirmDelete(collection, id) {
  const modal = document.getElementById('modal-confirm');
  modal.classList.add('active');
  document.getElementById('modalOverlay').classList.add('active');
  document.getElementById('confirmDeleteBtn').onclick = () => deleteRecord(collection, id);
}

async function deleteRecord(collection, id) {
  try {
    await getCollection(collection).doc(id).delete();
    closeModal();
    toast('Record deleted successfully', 'warning');
    refreshAll();
  } catch (e) {
    toast('Delete failed: ' + e.message, 'error');
  }
}

// ===== EDIT RECORD =====
async function editRecord(collection, id) {
  try {
    const snap = await getCollection(collection).doc(id).get();
    if (!snap.exists) return toast('Record not found', 'error');
    const d = snap.data();

    if (collection === 'cctv') {
      openModal('cctv');
      document.getElementById('cctv-edit-id').value = id;
      document.getElementById('cctv-date').value = d.date || '';
      document.getElementById('cctv-camid').value = d.cameraId || '';
      document.getElementById('cctv-location').value = d.location || '';
      document.getElementById('cctv-status').value = d.status || 'Working';
      document.getElementById('cctv-inspector').value = d.inspector || '';
      document.getElementById('cctv-notes').value = d.notes || '';
    }
    else if (collection === 'firstaid') {
      openModal('firstaid');
      document.getElementById('aid-edit-id').value = id;
      document.getElementById('aid-date').value = d.date || '';
      document.getElementById('aid-time').value = d.time || '';
      document.getElementById('aid-name').value = d.personName || '';
      document.getElementById('aid-type').value = d.type || 'Minor Injury';
      document.getElementById('aid-treatment').value = d.treatment || '';
      document.getElementById('aid-attendant').value = d.attendant || '';
      document.getElementById('aid-status').value = d.status || '';
    }
    else if (collection === 'transport') {
      openModal('transport');
      document.getElementById('trans-edit-id').value = id;
      document.getElementById('trans-date').value = d.date || '';
      document.getElementById('trans-bus').value = d.busNo || '';
      document.getElementById('trans-driver').value = d.driver || '';
      document.getElementById('trans-route').value = d.route || '';
      document.getElementById('trans-depart').value = d.departure || '';
      document.getElementById('trans-return').value = d.returnTime || '';
      document.getElementById('trans-students').value = d.students || '';
      document.getElementById('trans-status').value = d.status || 'On Time';
      document.getElementById('trans-notes').value = d.notes || '';
    }
    else if (collection === 'instruments') {
      openModal('instrument');
      document.getElementById('instr-edit-id').value = id;
      document.getElementById('instr-name').value = d.name || '';
      document.getElementById('instr-cat').value = d.category || 'CCTV';
      document.getElementById('instr-loc').value = d.location || '';
      document.getElementById('instr-checked').value = d.lastChecked || '';
      document.getElementById('instr-cond').value = d.condition || 'Working';
      document.getElementById('instr-service').value = d.nextService || '';
      document.getElementById('instr-notes').value = d.notes || '';
    }
  } catch (e) {
    toast('Could not load record: ' + e.message, 'error');
  }
}

// ===== SAVE CCTV =====
async function saveCCTV() {
  const date = document.getElementById('cctv-date').value;
  const cameraId = document.getElementById('cctv-camid').value.trim();
  const location = document.getElementById('cctv-location').value.trim();
  const status = document.getElementById('cctv-status').value;

  if (!date || !cameraId || !location) return toast('Please fill required fields', 'error');

  const data = {
    date, cameraId, location, status,
    inspector: document.getElementById('cctv-inspector').value.trim(),
    notes: document.getElementById('cctv-notes').value.trim(),
    updatedAt: new Date().toISOString()
  };

  const editId = document.getElementById('cctv-edit-id').value;

  try {
    if (editId) {
      await getCollection('cctv').doc(editId).update(data);
      toast('CCTV record updated ✓', 'success');
    } else {
      data.createdAt = new Date().toISOString();
      await getCollection('cctv').add(data);
      toast('CCTV record saved ✓', 'success');
    }
    closeModal();
    loadCCTV();
    refreshDashboard();
  } catch (e) {
    toast('Save failed: ' + e.message, 'error');
  }
}

// ===== LOAD CCTV =====
async function loadCCTV() {
  const tbody = document.getElementById('cctvBody');
  tbody.innerHTML = '<tr><td colspan="7" class="loading-td">Loading…</td></tr>';

  const dateFilter = document.getElementById('cctvFilter')?.value;
  const statusFilter = document.getElementById('cctvStatusFilter')?.value;

  try {
    let col = getCollection('cctv').orderBy('date', 'desc');
    const snap = await col.get();
    let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (dateFilter) docs = docs.filter(d => d.date === dateFilter);
    if (statusFilter) docs = docs.filter(d => d.status === statusFilter);

    if (!docs.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="loading-td">No records found</td></tr>';
      return;
    }

    tbody.innerHTML = docs.map(d => `
      <tr>
        <td><span style="font-family:var(--mono);font-size:12px">${formatDate(d.date)}</span></td>
        <td><strong>${d.cameraId || '--'}</strong></td>
        <td>${d.location || '--'}</td>
        <td>${statusBadge(d.status)}</td>
        <td>${d.inspector || '--'}</td>
        <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.notes || '--'}</td>
        <td>${actionBtns('cctv', d.id)}</td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" class="loading-td" style="color:var(--red)">Error: ${e.message}</td></tr>`;
  }
}

// ===== SAVE FIRST AID =====
async function saveFirstAid() {
  const date = document.getElementById('aid-date').value;
  const personName = document.getElementById('aid-name').value.trim();
  if (!date || !personName) return toast('Please fill required fields', 'error');

  const data = {
    date,
    time: document.getElementById('aid-time').value,
    personName,
    type: document.getElementById('aid-type').value,
    treatment: document.getElementById('aid-treatment').value.trim(),
    attendant: document.getElementById('aid-attendant').value.trim(),
    status: document.getElementById('aid-status').value,
    updatedAt: new Date().toISOString()
  };

  const editId = document.getElementById('aid-edit-id').value;

  try {
    if (editId) {
      await getCollection('firstaid').doc(editId).update(data);
      toast('First aid record updated ✓');
    } else {
      data.createdAt = new Date().toISOString();
      await getCollection('firstaid').add(data);
      toast('First aid record saved ✓');
    }
    closeModal();
    loadFirstAid();
    refreshDashboard();
  } catch (e) {
    toast('Save failed: ' + e.message, 'error');
  }
}

// ===== LOAD FIRST AID =====
async function loadFirstAid() {
  const tbody = document.getElementById('firstaidBody');
  tbody.innerHTML = '<tr><td colspan="8" class="loading-td">Loading…</td></tr>';

  const dateFilter = document.getElementById('firstaidFilter')?.value;
  const typeFilter = document.getElementById('firstaidTypeFilter')?.value;

  try {
    const snap = await getCollection('firstaid').orderBy('date', 'desc').get();
    let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (dateFilter) docs = docs.filter(d => d.date === dateFilter);
    if (typeFilter) docs = docs.filter(d => d.type === typeFilter);

    if (!docs.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="loading-td">No records found</td></tr>';
      return;
    }

    tbody.innerHTML = docs.map(d => `
      <tr>
        <td><span style="font-family:var(--mono);font-size:12px">${formatDate(d.date)}</span></td>
        <td>${d.time || '--'}</td>
        <td><strong>${d.personName || '--'}</strong></td>
        <td>${statusBadge(d.type)}</td>
        <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.treatment || '--'}</td>
        <td>${d.attendant || '--'}</td>
        <td>${statusBadge(d.status)}</td>
        <td>${actionBtns('firstaid', d.id)}</td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="8" class="loading-td" style="color:var(--red)">Error: ${e.message}</td></tr>`;
  }
}

// ===== SAVE TRANSPORT =====
async function saveTransport() {
  const date = document.getElementById('trans-date').value;
  const busNo = document.getElementById('trans-bus').value.trim();
  const driver = document.getElementById('trans-driver').value.trim();
  if (!date || !busNo || !driver) return toast('Please fill required fields', 'error');

  const data = {
    date, busNo, driver,
    route: document.getElementById('trans-route').value.trim(),
    departure: document.getElementById('trans-depart').value,
    returnTime: document.getElementById('trans-return').value,
    students: document.getElementById('trans-students').value,
    status: document.getElementById('trans-status').value,
    notes: document.getElementById('trans-notes').value.trim(),
    updatedAt: new Date().toISOString()
  };

  const editId = document.getElementById('trans-edit-id').value;

  try {
    if (editId) {
      await getCollection('transport').doc(editId).update(data);
      toast('Transport record updated ✓');
    } else {
      data.createdAt = new Date().toISOString();
      await getCollection('transport').add(data);
      toast('Transport record saved ✓');
    }
    closeModal();
    loadTransport();
    refreshDashboard();
  } catch (e) {
    toast('Save failed: ' + e.message, 'error');
  }
}

// ===== LOAD TRANSPORT =====
async function loadTransport() {
  const tbody = document.getElementById('transportBody');
  tbody.innerHTML = '<tr><td colspan="9" class="loading-td">Loading…</td></tr>';

  const dateFilter = document.getElementById('transportFilter')?.value;
  const statusFilter = document.getElementById('transportStatusFilter')?.value;

  try {
    const snap = await getCollection('transport').orderBy('date', 'desc').get();
    let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (dateFilter) docs = docs.filter(d => d.date === dateFilter);
    if (statusFilter) docs = docs.filter(d => d.status === statusFilter);

    if (!docs.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="loading-td">No records found</td></tr>';
      return;
    }

    tbody.innerHTML = docs.map(d => `
      <tr>
        <td><span style="font-family:var(--mono);font-size:12px">${formatDate(d.date)}</span></td>
        <td><strong>${d.busNo || '--'}</strong></td>
        <td>${d.driver || '--'}</td>
        <td>${d.route || '--'}</td>
        <td>${d.departure || '--'}</td>
        <td>${d.returnTime || '--'}</td>
        <td style="font-family:var(--mono)">${d.students || '--'}</td>
        <td>${statusBadge(d.status)}</td>
        <td>${actionBtns('transport', d.id)}</td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="9" class="loading-td" style="color:var(--red)">Error: ${e.message}</td></tr>`;
  }
}

// ===== SAVE INSTRUMENT =====
async function saveInstrument() {
  const name = document.getElementById('instr-name').value.trim();
  const condition = document.getElementById('instr-cond').value;
  if (!name) return toast('Please enter instrument name', 'error');

  const data = {
    name, condition,
    category: document.getElementById('instr-cat').value,
    location: document.getElementById('instr-loc').value.trim(),
    lastChecked: document.getElementById('instr-checked').value,
    nextService: document.getElementById('instr-service').value,
    notes: document.getElementById('instr-notes').value.trim(),
    flagged: condition !== 'Working',
    updatedAt: new Date().toISOString()
  };

  const editId = document.getElementById('instr-edit-id').value;

  try {
    if (editId) {
      await getCollection('instruments').doc(editId).update(data);
      toast('Instrument updated ✓');
    } else {
      data.createdAt = new Date().toISOString();
      await getCollection('instruments').add(data);
      toast('Instrument saved ✓');
    }
    closeModal();
    loadInstruments();
    refreshAlertBadge();
  } catch (e) {
    toast('Save failed: ' + e.message, 'error');
  }
}

// ===== LOAD INSTRUMENTS =====
async function loadInstruments() {
  const tbody = document.getElementById('instrumentBody');
  tbody.innerHTML = '<tr><td colspan="8" class="loading-td">Loading…</td></tr>';

  const catFilter = document.getElementById('instrumentCatFilter')?.value;
  const condFilter = document.getElementById('instrumentCondFilter')?.value;

  try {
    const snap = await getCollection('instruments').get();
    let docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (catFilter) docs = docs.filter(d => d.category === catFilter);
    if (condFilter) docs = docs.filter(d => d.condition === condFilter);

    if (!docs.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="loading-td">No instruments found</td></tr>';
      return;
    }

    tbody.innerHTML = docs.map(d => `
      <tr ${d.flagged ? 'style="background:rgba(239,68,68,0.04)"' : ''}>
        <td><strong>${d.name || '--'}</strong>${d.flagged ? ' <span class="flag-alert">⚠ ALERT</span>' : ''}</td>
        <td>${d.category || '--'}</td>
        <td>${d.location || '--'}</td>
        <td><span style="font-family:var(--mono);font-size:12px">${formatDate(d.lastChecked)}</span></td>
        <td>${statusBadge(d.condition)}</td>
        <td><span style="font-family:var(--mono);font-size:12px">${formatDate(d.nextService)}</span></td>
        <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.notes || '--'}</td>
        <td>${actionBtns('instruments', d.id)}</td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="8" class="loading-td" style="color:var(--red)">Error: ${e.message}</td></tr>`;
  }
}

// ===== LOAD ALERTS =====
async function loadAlerts() {
  const container = document.getElementById('alertsContainer');
  container.innerHTML = '<div class="loading-msg">Loading…</div>';

  try {
    const [cctvSnap, instrSnap, transSnap] = await Promise.all([
      getCollection('cctv').get(),
      getCollection('instruments').get(),
      getCollection('transport').get()
    ]);

    const alerts = [];

    // CCTV faults
    cctvSnap.docs.forEach(d => {
      const data = d.data();
      if (data.status === 'Faulty' || data.status === 'Offline') {
        alerts.push({ type: 'CCTV', name: data.cameraId, condition: data.status, location: data.location, date: data.date, notes: data.notes, id: d.id });
      }
    });

    // Faulty instruments
    instrSnap.docs.forEach(d => {
      const data = d.data();
      if (data.condition !== 'Working') {
        alerts.push({ type: data.category, name: data.name, condition: data.condition, location: data.location, date: data.lastChecked, notes: data.notes, id: d.id });
      }
    });

    // Transport issues
    transSnap.docs.forEach(d => {
      const data = d.data();
      if (data.status === 'Issue Reported') {
        alerts.push({ type: 'Transport', name: data.busNo, condition: data.status, location: data.route, date: data.date, notes: data.notes, id: d.id });
      }
    });

    // Update badge
    const badge = document.getElementById('alertBadge');
    badge.textContent = alerts.length;
    document.getElementById('stat-alerts').textContent = alerts.length;

    // Update hidden table for PDF
    const tBody = document.getElementById('alertsTableBody');
    tBody.innerHTML = alerts.map(a => `
      <tr><td>${a.type}</td><td>${a.name}</td><td>${a.condition}</td><td>${a.location || '--'}</td><td>${formatDate(a.date)}</td><td>${a.notes || '--'}</td></tr>
    `).join('');

    if (!alerts.length) {
      container.innerHTML = '<div class="no-alerts">✅ No active alerts — all systems operational!</div>';
      return;
    }

    container.innerHTML = alerts.map(a => `
      <div class="alert-card">
        <div class="alert-card-title">⚠ ${a.name || 'Unknown'}</div>
        <div class="alert-card-detail">
          <strong>Type:</strong> ${a.type}<br>
          <strong>Condition:</strong> ${a.condition}<br>
          <strong>Location:</strong> ${a.location || 'N/A'}<br>
          <strong>Date:</strong> ${formatDate(a.date)}<br>
          ${a.notes ? `<strong>Note:</strong> ${a.notes}` : ''}
        </div>
        <span class="alert-card-tag">${a.type.toUpperCase()} FAULT</span>
      </div>
    `).join('');
  } catch (e) {
    container.innerHTML = `<div class="loading-msg" style="color:var(--red)">Error: ${e.message}</div>`;
  }
}

// ===== REFRESH ALERT BADGE =====
async function refreshAlertBadge() {
  try {
    const [cctvSnap, instrSnap, transSnap] = await Promise.all([
      getCollection('cctv').get(),
      getCollection('instruments').get(),
      getCollection('transport').get()
    ]);
    let count = 0;
    cctvSnap.docs.forEach(d => { const data = d.data(); if (data.status === 'Faulty' || data.status === 'Offline') count++; });
    instrSnap.docs.forEach(d => { const data = d.data(); if (data.condition !== 'Working') count++; });
    transSnap.docs.forEach(d => { const data = d.data(); if (data.status === 'Issue Reported') count++; });
    document.getElementById('alertBadge').textContent = count;
    document.getElementById('stat-alerts').textContent = count;
  } catch (e) {}
}

// ===== DASHBOARD =====
let chartInstances = {};

async function refreshDashboard() {
  const todayStr = today();

  try {
    const [cctvSnap, aidSnap, transSnap, instrSnap] = await Promise.all([
      getCollection('cctv').get(),
      getCollection('firstaid').get(),
      getCollection('transport').get(),
      getCollection('instruments').get()
    ]);

    const cctvDocs = cctvSnap.docs.map(d => d.data());
    const aidDocs = aidSnap.docs.map(d => d.data());
    const transDocs = transSnap.docs.map(d => d.data());
    const instrDocs = instrSnap.docs.map(d => d.data());

    document.getElementById('stat-cctv').textContent = cctvDocs.filter(d => d.date === todayStr).length;
    document.getElementById('stat-aid').textContent = aidDocs.filter(d => d.date === todayStr).length;
    document.getElementById('stat-transport').textContent = transDocs.filter(d => d.date === todayStr).length;

    refreshAlertBadge();

    // Recent activity
    const allActivity = [
      ...cctvDocs.map(d => ({ label: `CCTV ${d.cameraId} – ${d.status}`, ts: d.createdAt, color: '#0ea5e9' })),
      ...aidDocs.map(d => ({ label: `First Aid: ${d.personName} (${d.type})`, ts: d.createdAt, color: '#22c55e' })),
      ...transDocs.map(d => ({ label: `Transport ${d.busNo} – ${d.status}`, ts: d.createdAt, color: '#a855f7' })),
      ...instrDocs.filter(d => d.flagged).map(d => ({ label: `⚠ ${d.name} is ${d.condition}`, ts: d.updatedAt, color: '#ef4444' }))
    ].sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 12);

    const actEl = document.getElementById('recentActivity');
    actEl.innerHTML = allActivity.length
      ? allActivity.map(a => `
          <div class="activity-item">
            <div class="activity-dot" style="background:${a.color}"></div>
            <div class="activity-body">
              <div class="activity-title">${a.label}</div>
              <div class="activity-time">${timeAgo(a.ts)}</div>
            </div>
          </div>
        `).join('')
      : '<div class="loading-msg">No activity yet. Start adding records.</div>';

    // Weekly chart (last 7 days)
    const days = [];
    const cctvCounts = [], aidCounts = [], transCounts = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      days.push(d.toLocaleDateString('en', { weekday: 'short' }));
      cctvCounts.push(cctvDocs.filter(x => x.date === ds).length);
      aidCounts.push(aidDocs.filter(x => x.date === ds).length);
      transCounts.push(transDocs.filter(x => x.date === ds).length);
    }

    renderChart('weeklyChart', {
      type: 'bar',
      data: {
        labels: days,
        datasets: [
          { label: 'CCTV', data: cctvCounts, backgroundColor: 'rgba(14,165,233,0.7)', borderRadius: 4 },
          { label: 'First Aid', data: aidCounts, backgroundColor: 'rgba(34,197,94,0.7)', borderRadius: 4 },
          { label: 'Transport', data: transCounts, backgroundColor: 'rgba(168,85,247,0.7)', borderRadius: 4 }
        ]
      },
      options: chartOptions()
    });

    // Status doughnut
    const working = instrDocs.filter(d => d.condition === 'Working').length;
    const maintenance = instrDocs.filter(d => d.condition === 'Needs Maintenance').length;
    const faulty = instrDocs.filter(d => d.condition === 'Faulty').length;

    renderChart('statusChart', {
      type: 'doughnut',
      data: {
        labels: ['Working', 'Needs Maintenance', 'Faulty'],
        datasets: [{ data: [working, maintenance, faulty], backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'], borderWidth: 0, hoverOffset: 6 }]
      },
      options: { ...chartOptions(), cutout: '65%' }
    });

  } catch (e) {
    console.error('Dashboard error:', e);
  }
}

// ===== REPORTS CHARTS =====
async function loadReportsCharts() {
  try {
    const [cctvSnap, aidSnap, transSnap, instrSnap] = await Promise.all([
      getCollection('cctv').get(),
      getCollection('firstaid').get(),
      getCollection('transport').get(),
      getCollection('instruments').get()
    ]);

    const cctvDocs = cctvSnap.docs.map(d => d.data());
    const aidDocs  = aidSnap.docs.map(d => d.data());
    const transDocs = transSnap.docs.map(d => d.data());
    const instrDocs = instrSnap.docs.map(d => d.data());

    // ---- Summary strip ----
    const faultyCount = instrDocs.filter(d => d.condition !== 'Working').length;
    const issueTrips  = transDocs.filter(d => d.status === 'Issue Reported').length;
    const summaryEl   = document.getElementById('reportsSummary');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="rs-card"><div class="rs-num" style="color:var(--cctv)">${cctvDocs.length}</div><div class="rs-label">Total CCTV Logs</div></div>
        <div class="rs-card"><div class="rs-num" style="color:var(--aid)">${aidDocs.length}</div><div class="rs-label">First Aid Cases</div></div>
        <div class="rs-card"><div class="rs-num" style="color:var(--transport)">${transDocs.length}</div><div class="rs-label">Transport Trips</div></div>
        <div class="rs-card"><div class="rs-num" style="color:var(--alert)">${faultyCount}</div><div class="rs-label">Faulty Instruments</div></div>
      `;
    }

    // ---- Monthly CCTV line chart ----
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const currentYear = new Date().getFullYear();
    const cctvMonthly = months.map((_, i) => cctvDocs.filter(d => {
      if (!d.date) return false;
      const dt = new Date(d.date + 'T00:00:00');
      return dt.getFullYear() === currentYear && dt.getMonth() === i;
    }).length);

    renderChart('cctvMonthChart', {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'CCTV Logs',
          data: cctvMonthly,
          borderColor: '#0ea5e9',
          backgroundColor: 'rgba(14,165,233,0.12)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#0ea5e9',
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: chartOptions()
    });

    // ---- First Aid pie chart ----
    const aidTypes  = ['Minor Injury','Major Injury','Illness','Emergency'];
    const aidCounts = aidTypes.map(t => aidDocs.filter(d => d.type === t).length);

    renderChart('aidPieChart', {
      type: 'doughnut',
      data: {
        labels: aidTypes,
        datasets: [{
          data: aidCounts,
          backgroundColor: ['#22c55e','#ef4444','#f59e0b','#a855f7'],
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '55%',
        plugins: {
          legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 12 }, padding: 16 } }
        }
      }
    });

    // ---- Transport horizontal bar ----
    const tStatuses = ['On Time','Delayed','Issue Reported'];
    const tCounts   = tStatuses.map(s => transDocs.filter(d => d.status === s).length);

    renderChart('transportBarChart', {
      type: 'bar',
      data: {
        labels: tStatuses,
        datasets: [{
          label: 'Trips',
          data: tCounts,
          backgroundColor: ['rgba(34,197,94,0.75)','rgba(245,158,11,0.75)','rgba(239,68,68,0.75)'],
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        ...chartOptions(),
        indexAxis: 'y',
        plugins: { legend: { display: false } }
      }
    });

    // ---- Instrument health stacked bar ----
    const cats      = ['CCTV','Fire','Medical','Transport','Communication'];
    const catHealth = cats.map(c => instrDocs.filter(d => d.category === c && d.condition === 'Working').length);
    const catFault  = cats.map(c => instrDocs.filter(d => d.category === c && d.condition !== 'Working').length);

    renderChart('instrHealthChart', {
      type: 'bar',
      data: {
        labels: cats,
        datasets: [
          { label: 'Working',      data: catHealth, backgroundColor: 'rgba(34,197,94,0.75)',  borderRadius: 4 },
          { label: 'Faulty/Maint.',data: catFault,  backgroundColor: 'rgba(239,68,68,0.75)',  borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94a3b8', font: { size: 12 } } } },
        scales: {
          x: { stacked: true, ticks: { color: '#64748b' }, grid: { color: '#1e2d4a' } },
          y: { stacked: true, ticks: { color: '#64748b' }, grid: { color: '#1e2d4a' } }
        }
      }
    });

  } catch (e) {
    console.error('Reports error:', e);
  }
}

// ===== CHART HELPERS =====
function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { size: 12 } } }
    },
    scales: {
      x: { ticks: { color: '#64748b' }, grid: { color: '#1e2d4a' } },
      y: { ticks: { color: '#64748b' }, grid: { color: '#1e2d4a' } }
    }
  };
}

function renderChart(id, config) {
  if (chartInstances[id]) {
    try { chartInstances[id].destroy(); } catch(e) {}
    delete chartInstances[id];
  }
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  chartInstances[id] = new Chart(ctx, config);
}

// ===== PDF EXPORTS =====
function downloadChartPDF(chartId, title) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const canvas = document.getElementById(chartId);
  if (!canvas) return toast('Chart not found', 'error');

  pdfHeader(doc, title);
  const imgData = canvas.toDataURL('image/png');
  doc.addImage(imgData, 'PNG', 20, 40, 250, 130);
  pdfFooter(doc);
  doc.save(`${title.replace(/\s+/g,'_')}_${today()}.pdf`);
  toast('PDF downloaded ✓');
}

function downloadTablePDF(tableId, title) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const table = document.getElementById(tableId);
  if (!table) return toast('Table not found', 'error');

  pdfHeader(doc, title);

  const headers = Array.from(table.querySelectorAll('thead th'))
    .map(th => th.textContent.trim())
    .filter(h => h !== 'Actions');

  const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr =>
    Array.from(tr.querySelectorAll('td'))
      .slice(0, headers.length)
      .map(td => td.textContent.trim().replace(/●\s*/g, ''))
  );

  doc.autoTable({
    startY: 38,
    head: [headers],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [14, 100, 180], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: [50, 50, 50] },
    alternateRowStyles: { fillColor: [240, 245, 255] },
    margin: { left: 14, right: 14 }
  });

  pdfFooter(doc);
  doc.save(`${title.replace(/\s+/g,'_')}_${today()}.pdf`);
  toast('PDF downloaded ✓');
}

function pdfHeader(doc, title) {
  doc.setFillColor(10, 30, 60);
  doc.rect(0, 0, 297, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('PAKISTAN ISLAMIA HIGHER SECONDARY SCHOOL', 148.5, 10, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`Safety Management System – ${title}`, 148.5, 18, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(180, 200, 230);
  doc.text(`Generated: ${new Date().toLocaleString('en-PK')}`, 148.5, 25, { align: 'center' });
  doc.setTextColor(0, 0, 0);
}

function pdfFooter(doc) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount} | Pakistan Islamia HSS – Confidential`, 148.5, 207, { align: 'center' });
  }
}

async function generateFullReport() {
  const from = document.getElementById('reportFrom').value;
  const to = document.getElementById('reportTo').value;
  const section = document.getElementById('reportSection').value;
  if (!from || !to) return toast('Please select date range', 'error');

  toast('Generating report…', 'warning');

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let startY = 38;
  let firstPage = true;

  function addSection(title) {
    if (!firstPage) { doc.addPage(); startY = 38; }
    pdfHeader(doc, `${title} | ${formatDate(from)} – ${formatDate(to)}`);
    firstPage = false;
  }

  try {
    if (section === 'all' || section === 'cctv') {
      addSection('CCTV Records');
      const snap = await getCollection('cctv').get();
      const docs = snap.docs.map(d => d.data()).filter(d => d.date >= from && d.date <= to);
      doc.autoTable({ startY, head: [['Date','Camera ID','Location','Status','Inspector','Notes']], body: docs.map(d => [formatDate(d.date), d.cameraId, d.location, d.status, d.inspector, d.notes]), theme: 'striped', headStyles: { fillColor: [14,100,180] }, bodyStyles: { fontSize: 8 }, margin: { left: 14, right: 14 } });
    }

    if (section === 'all' || section === 'firstaid') {
      addSection('First Aid Records');
      firstPage = false;
      const snap = await getCollection('firstaid').get();
      const docs = snap.docs.map(d => d.data()).filter(d => d.date >= from && d.date <= to);
      doc.autoTable({ startY, head: [['Date','Time','Name','Type','Treatment','Attendant','Status']], body: docs.map(d => [formatDate(d.date), d.time, d.personName, d.type, d.treatment, d.attendant, d.status]), theme: 'striped', headStyles: { fillColor: [14,130,80] }, bodyStyles: { fontSize: 8 }, margin: { left: 14, right: 14 } });
    }

    if (section === 'all' || section === 'transport') {
      addSection('Transport Records');
      firstPage = false;
      const snap = await getCollection('transport').get();
      const docs = snap.docs.map(d => d.data()).filter(d => d.date >= from && d.date <= to);
      doc.autoTable({ startY, head: [['Date','Bus No.','Driver','Route','Departure','Return','Students','Status']], body: docs.map(d => [formatDate(d.date), d.busNo, d.driver, d.route, d.departure, d.returnTime, d.students, d.status]), theme: 'striped', headStyles: { fillColor: [100,14,180] }, bodyStyles: { fontSize: 8 }, margin: { left: 14, right: 14 } });
    }

    if (section === 'all' || section === 'instruments') {
      addSection('Instruments Condition Report');
      firstPage = false;
      const snap = await getCollection('instruments').get();
      const docs = snap.docs.map(d => d.data());
      doc.autoTable({ startY, head: [['Name','Category','Location','Last Checked','Condition','Next Service','Notes']], body: docs.map(d => [d.name, d.category, d.location, formatDate(d.lastChecked), d.condition, formatDate(d.nextService), d.notes]), theme: 'striped', headStyles: { fillColor: [180,50,14] }, bodyStyles: { fontSize: 8 }, margin: { left: 14, right: 14 } });
    }

    pdfFooter(doc);
    doc.save(`Islamia_HSS_Safety_Report_${from}_to_${to}.pdf`);
    toast('Full report downloaded ✓', 'success');
  } catch (e) {
    toast('Report generation failed: ' + e.message, 'error');
  }
}

// ===== REFRESH ALL =====
function refreshAll() {
  const activePage = document.querySelector('.page.active')?.id?.replace('page-', '');
  if (activePage === 'cctv') loadCCTV();
  if (activePage === 'firstaid') loadFirstAid();
  if (activePage === 'transport') loadTransport();
  if (activePage === 'instruments') loadInstruments();
  if (activePage === 'alerts') loadAlerts();
  if (activePage === 'reports') loadReportsCharts();
  refreshDashboard();
}

// ===== SEED DEMO DATA =====
async function seedDemoData() {
  const today2 = today();
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yst = yesterday.toISOString().split('T')[0];

  const cctvSeed = [
    { date: today2, cameraId: 'CAM-01', location: 'Main Gate', status: 'Working', inspector: 'Ahmed Ali', notes: 'All clear', createdAt: new Date().toISOString() },
    { date: today2, cameraId: 'CAM-02', location: 'Corridor B', status: 'Faulty', inspector: 'Ahmed Ali', notes: 'Night vision not working', createdAt: new Date().toISOString() },
    { date: yst, cameraId: 'CAM-03', location: 'Playground', status: 'Working', inspector: 'Sara Khan', notes: '', createdAt: new Date().toISOString() },
  ];

  const aidSeed = [
    { date: today2, time: '10:30', personName: 'Bilal Hassan', type: 'Minor Injury', treatment: 'Bandage applied', attendant: 'Nurse Fatima', status: 'Treated & Released', createdAt: new Date().toISOString() },
    { date: yst, time: '14:00', personName: 'Zainab Malik', type: 'Illness', treatment: 'Rest & ORS given', attendant: 'Nurse Fatima', status: 'Under Observation', createdAt: new Date().toISOString() },
  ];

  const transSeed = [
    { date: today2, busNo: 'PB-2241', driver: 'Rashid Mehmood', route: 'Saddar – School', departure: '07:30', returnTime: '14:00', students: 42, status: 'On Time', notes: '', createdAt: new Date().toISOString() },
    { date: today2, busNo: 'PB-3305', driver: 'Kamran Shah', route: 'Cantt – School', departure: '07:45', returnTime: '14:15', students: 38, status: 'Issue Reported', notes: 'Tyre puncture near railway crossing', createdAt: new Date().toISOString() },
  ];

  const instrSeed = [
    { name: 'Fire Extinguisher A1', category: 'Fire', location: 'Block A Ground Floor', lastChecked: today2, condition: 'Working', nextService: '2025-12-01', notes: '', flagged: false, createdAt: new Date().toISOString() },
    { name: 'First Aid Kit Room 5', category: 'Medical', location: 'Room 5', lastChecked: yst, condition: 'Needs Maintenance', nextService: '2025-09-01', notes: 'Some medicines expired', flagged: true, createdAt: new Date().toISOString() },
    { name: 'CAM-04 DVR', category: 'CCTV', location: 'Server Room', lastChecked: today2, condition: 'Faulty', nextService: '2025-08-15', notes: 'Hard disk failure', flagged: true, createdAt: new Date().toISOString() },
    { name: 'PA System', category: 'Communication', location: 'Principal Office', lastChecked: today2, condition: 'Working', nextService: '2026-01-01', notes: '', flagged: false, createdAt: new Date().toISOString() },
  ];

  for (const d of cctvSeed) await getCollection('cctv').add(d);
  for (const d of aidSeed) await getCollection('firstaid').add(d);
  for (const d of transSeed) await getCollection('transport').add(d);
  for (const d of instrSeed) await getCollection('instruments').add(d);
}

// ===== INIT =====
async function init() {
  // Check if demo data needed
  try {
    const snap = await getCollection('cctv').limit(1).get();
    if (snap.empty) {
      await seedDemoData();
    }
  } catch (e) {}

  refreshDashboard();
  refreshAlertBadge();
}

setTimeout(init, 600);
