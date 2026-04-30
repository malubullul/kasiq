import './dashboard.css'

const CATEGORY_COLORS = {
  'Makanan': '#f97316', 'Transport': '#f59e0b', 'Bisnis': '#3b82f6',
  'Belanja': '#8b5cf6', 'Hiburan': '#ec4899', 'Kesehatan': '#10b981', 'Lainnya': '#94a3b8'
};
let categoryMap_g = {};

function timeSince(dateStr) {
  if (!dateStr) return '';
  // Handle timestamp number
  if (typeof dateStr === 'number') {
    const diff = (Date.now() - dateStr) / 1000;
    if (diff < 60) return 'baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return `${Math.floor(diff / 86400)} hari lalu`;
  }
  // Handle date string (YYYY-MM-DD)
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (dateStr === today) return 'hari ini';
  if (dateStr === yesterday) return 'kemarin';
  return dateStr;
}

// ══════════════════════════════════════════════
// FINANCIAL DIGITAL TWIN — Core Engine
// ══════════════════════════════════════════════

function calcFinancialScore(totalIn, totalOut, txs) {
  if (txs.length === 0) return { score: 0, label: 'Belum Ada Data', color: '#94a3b8' };
  let s = 0;
  if (totalIn > 0) s += Math.min(30, Math.round(((totalIn - totalOut) / totalIn) * 30));
  else if (totalOut === 0) s += 15;
  const cats = new Set(txs.filter(t => t.amount < 0).map(t => t.category));
  s += Math.min(25, cats.size * 8);
  if (totalIn > 0) s += 25;
  const days = new Set(txs.map(t => t.date));
  s += Math.min(20, days.size * 5);
  s = Math.min(100, Math.max(0, s));
  const label = s >= 80 ? 'Excellent' : s >= 60 ? 'Good' : s >= 40 ? 'Fair' : 'Needs Work';
  const color = s >= 80 ? '#10b981' : s >= 60 ? '#3b82f6' : s >= 40 ? '#f59e0b' : '#ef4444';
  return { score: s, label, color };
}

function getRiskRadar(balance, totalIn, totalOut, prediction) {
  if (totalIn === 0 && totalOut === 0) return { level: 'Unknown', icon: '⏳', cls: 'risk-unknown', desc: 'Belum cukup data' };
  if (prediction && prediction.daysLeft <= 7) return { level: 'Financial Crash Risk', icon: '🔴', cls: 'risk-crash', desc: `Saldo habis dalam ${prediction.daysLeft} hari` };
  if (totalOut > totalIn * 0.9 && totalIn > 0) return { level: 'Drifting', icon: '🟡', cls: 'risk-drift', desc: 'Pengeluaran mendekati batas pemasukan' };
  if (balance > 0 && totalOut < totalIn * 0.6) return { level: 'Stable Future', icon: '🟢', cls: 'risk-stable', desc: 'Keuangan dalam kondisi sehat' };
  return { level: 'Cautious', icon: '🟡', cls: 'risk-drift', desc: 'Perlu pengawasan' };
}

function calcBurnMetrics(balance, totalOut, txs) {
  const expTxs = txs.filter(t => t.amount < 0);
  if (expTxs.length < 1) return null;
  const uniqueDays = [...new Set(expTxs.map(t => t.date))];
  const numDays = Math.max(1, uniqueDays.length);
  const avgDaily = totalOut / numDays;
  const incTxs = txs.filter(t => t.amount > 0);
  const avgDailyIncome = incTxs.length > 0 ? incTxs.reduce((s, t) => s + t.amount, 0) / numDays : 0;
  if (avgDaily <= 0) return null;
  return { avgDaily, avgDailyIncome, daysLeft: balance > 0 ? Math.round(balance / avgDaily) : 0 };
}

// ── Build daily balance timeline ─────────────────
function buildBalanceTimeline(txs) {
  const sorted = [...txs].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const dayMap = {};
  sorted.forEach(t => {
    const d = t.date || new Date().toISOString().split('T')[0];
    if (!dayMap[d]) dayMap[d] = { net: 0, volume: 0, income: 0, expense: 0 };
    dayMap[d].net += t.amount;
    dayMap[d].volume += Math.abs(t.amount);
    if (t.amount > 0) dayMap[d].income += t.amount;
    if (t.amount < 0) dayMap[d].expense += Math.abs(t.amount);
  });
  let cum = 0;
  return Object.entries(dayMap).map(([date, data]) => {
    cum += data.net;
    return { date, balance: cum, volume: data.volume, income: data.income, expense: data.expense };
  });
}

function getHealthStatus(totalIn, totalOut) {
  if (totalIn === 0 && totalOut === 0) return { label: 'Belum Ada Data', cls: 'health-neutral', icon: '⏳' };
  if (totalOut === 0) return { label: 'Aman', cls: 'health-aman', icon: '🟢' };
  const r = totalOut / (totalIn || 1);
  if (r < 0.6) return { label: 'Aman', cls: 'health-aman', icon: '🟢' };
  if (r < 0.9) return { label: 'Waspada', cls: 'health-waspada', icon: '🟡' };
  return { label: 'Risiko', cls: 'health-risiko', icon: '🔴' };
}

function buildDonutGradient(categories, totalOut) {
  if (categories.length === 0) return 'conic-gradient(#e2e8f0 0% 100%)';
  let cum = 0;
  const parts = categories.slice(0, 5).map(c => {
    const pct = (categoryMap_g[c.name] / (totalOut || 1)) * 100;
    const start = cum; cum += pct;
    return `${CATEGORY_COLORS[c.name] || '#94a3b8'} ${start.toFixed(1)}% ${cum.toFixed(1)}%`;
  });
  return `conic-gradient(${parts.join(', ')})`;
}

// ══════════════════════════════════════════════
// RENDER DASHBOARD
// ══════════════════════════════════════════════
export function renderDashboard(container) {
  let fd = JSON.parse(localStorage.getItem('kasiq_finance_data') || '{"balance":0,"transactions":[]}');

  // Auto-seed realistic dummy data (v3)
  if (!localStorage.getItem('kasiq_seeded_v3')) {
    const dummyTxs = [];
    let bal = 4500000;

    // Day 0 (7 days ago): Gaji
    let d = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];
    dummyTxs.push({ id: 'd0in', date: d, amount: 6500000, category: 'Bisnis', title: 'Gaji Bulanan' });
    bal += 6500000;
    dummyTxs.push({ id: 'd0ex', date: d, amount: -150000, category: 'Makanan', title: 'Makan Steak Hoka Hoka' });
    bal -= 150000;

    // Day 1: Normal
    d = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];
    dummyTxs.push({ id: 'd1ex1', date: d, amount: -35000, category: 'Makanan', title: 'Makan Nasi Padang' });
    dummyTxs.push({ id: 'd1ex2', date: d, amount: -20000, category: 'Transport', title: 'Bensin Motor' });
    bal -= 55000;

    // Day 2: Agak boros
    d = new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0];
    dummyTxs.push({ id: 'd2ex1', date: d, amount: -350000, category: 'Belanja', title: 'Belanja Keperluan Rumah' });
    dummyTxs.push({ id: 'd2ex2', date: d, amount: -150000, category: 'Hiburan', title: 'Nonton Bioskop' });
    dummyTxs.push({ id: 'd2ex3', date: d, amount: -45000, category: 'Makanan', title: 'Kopi Susu Senja' });
    bal -= 545000;

    // Day 3: Normal
    d = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
    dummyTxs.push({ id: 'd3ex1', date: d, amount: -15000, category: 'Makanan', title: 'Nasi Kuning' });
    dummyTxs.push({ id: 'd3ex2', date: d, amount: -120000, category: 'Belanja', title: 'Topup E-Money' });
    bal -= 135000;

    // Day 4: Pemasukan sampingan
    d = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
    dummyTxs.push({ id: 'd4in', date: d, amount: 850000, category: 'Bisnis', title: 'Project Freelance' });
    bal += 850000;
    dummyTxs.push({ id: 'd4ex1', date: d, amount: -250000, category: 'Belanja', title: 'Belanja Mingguan' });
    bal -= 250000;

    // Day 5: Normal
    d = new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0];
    dummyTxs.push({ id: 'd5ex1', date: d, amount: -40000, category: 'Makanan', title: 'Ayam Geprek' });
    bal -= 40000;

    // Day 6 (Today)
    d = new Date().toISOString().split('T')[0];
    dummyTxs.push({ id: 'd6ex1', date: d, amount: -55000, category: 'Transport', title: 'Gojek PP Kantor' });
    dummyTxs.push({ id: 'd6ex2', date: d, amount: -28000, category: 'Makanan', title: 'Kopi Kenangan' });
    bal -= 83000;

    fd = { balance: bal, transactions: dummyTxs };
    localStorage.setItem('kasiq_finance_data', JSON.stringify(fd));
    localStorage.setItem('kasiq_seeded_v3', 'true');
  }

  const txs = fd.transactions || [];
  let totalIn = 0, totalOut = 0;
  categoryMap_g = {};
  txs.forEach(t => {
    if (t.amount > 0) totalIn += t.amount;
    else { const a = Math.abs(t.amount); totalOut += a; if (t.category) categoryMap_g[t.category] = (categoryMap_g[t.category] || 0) + a; }
  });

  const balance = totalIn - totalOut;
  const health = getHealthStatus(totalIn, totalOut);
  const fScore = calcFinancialScore(totalIn, totalOut, txs);
  const burn = calcBurnMetrics(balance, totalOut, txs);
  const risk = getRiskRadar(balance, totalIn, totalOut, burn);
  const maxVal = Math.max(totalIn, totalOut) || 1;
  const categories = Object.entries(categoryMap_g).map(([n, v]) => ({ name: n, val: v, percent: Math.round((v / (totalOut || 1)) * 100) })).sort((a, b) => b.val - a.val);
  const donutGradient = buildDonutGradient(categories, totalOut);
  const timeline = buildBalanceTimeline(txs);
  const activities = txs.slice(0, 3).map(t => ({ text: `AI mencatat: <strong>${t.title}</strong> → ${t.category}`, date: t.date }));

  // Proactive Warning - Sarcastic Edition
  const catCounts = {};
  txs.filter(t => t.amount < 0).forEach(t => { catCounts[t.category] = (catCounts[t.category] || 0) + 1; });
  let warningHtml = '';
  if (totalOut > totalIn && totalIn > 0) {
    warningHtml = `<div class="proactive-warning danger"><span>💀</span><div><strong>Kas-iQ Notice:</strong> Gede pasak daripada tiang nih bos! Sisa saldo lu udah megap-megap, kurang-kurangin fomo-nya!</div></div>`;
  } else if (Object.values(catCounts).some(c => c >= 4)) {
    const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
    warningHtml = `<div class="proactive-warning warn"><span>🙄</span><div><strong>Kas-iQ noticed:</strong> Lu udah jajan <strong>${topCat[0]}</strong> sampe ${topCat[1]}x. Inget masa depan, jangan turuti nafsu mulu!</div></div>`;
  }



  container.innerHTML = `
    <div class="dashboard-container">
      ${warningHtml}

      <!-- Row 0: Score + Risk Radar + Chart -->
      <div class="top-row">
        <div class="score-card">
          <div class="score-ring" style="--score-color:${fScore.color}; --score-pct:${fScore.score}">
            <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="score-bg"/><circle cx="60" cy="60" r="52" class="score-fg" style="stroke-dashoffset:${326.7 - (326.7 * fScore.score / 100)}"/></svg>
            <div class="score-value">${fScore.score}</div>
          </div>
          <div class="score-meta">
            <h3>Financial Score</h3>
            <span class="score-label" style="color:${fScore.color}">${fScore.label}</span>
          </div>
          <div class="risk-radar ${risk.cls}">
            <span>${risk.icon}</span>
            <div><strong>${risk.level}</strong><p>${risk.desc}</p></div>
          </div>
        </div>

        <div class="chart-panel">
          <div class="chart-header">
            <div>
              <h3>Financial Momentum</h3>
              <p class="chart-subtitle">Riwayat pergerakan saldo kamu</p>
            </div>
            <div class="chart-filters" id="chart-filters">
              <button class="cf-btn active" data-days="7">1W</button>
              <button class="cf-btn" data-days="30">1M</button>
              <button class="cf-btn" data-days="90">3M</button>
              <button class="cf-btn" data-days="365">1Y</button>
            </div>
          </div>
          <div id="chart-content">
            ${timeline.length > 0
      ? `<div class="chart-empty"><p>⏳ Memuat chart performa tinggi...</p></div>`
      : `<div class="chart-empty"><p>📈 Grafik muncul setelah transaksi pertama</p></div>`}
          </div>
        </div>
      </div>

      <!-- Row 2: Stats Grid -->
      <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr);">
        <div class="stat-card main-balance">
          <p class="balance-label">Total Saldo</p>
          <h2 class="balance-amount">Rp ${balance.toLocaleString('id-ID')}</h2>
          <div class="health-badge ${health.cls}">${health.icon} ${health.label}</div>
          <div class="balance-meta"><span>↑ Rp ${totalIn.toLocaleString('id-ID')}</span><span>↓ Rp ${totalOut.toLocaleString('id-ID')}</span></div>
        </div>
        <div class="stat-card chart-card">
          <div class="card-header"><h3>Income vs Expense</h3></div>
          <div class="bar-chart-container">
            <div class="bar-group"><div class="bar-fill income" style="height:${(totalIn / maxVal) * 100}%"></div><span class="bar-label">In</span></div>
            <div class="bar-group"><div class="bar-fill expense" style="height:${(totalOut / maxVal) * 100}%"></div><span class="bar-label">Out</span></div>
          </div>
          <div class="chart-legend"><span class="legend-dot income-dot"></span>Rp ${totalIn.toLocaleString('id-ID')}&nbsp;<span class="legend-dot expense-dot"></span>Rp ${totalOut.toLocaleString('id-ID')}</div>
        </div>
        <div class="stat-card chart-card">
          <div class="card-header"><h3>Distribusi Pengeluaran</h3></div>
          <div class="donut-chart-container">
            <div class="donut-display" style="background:${donutGradient}"><div class="donut-center"><span>${categories[0]?.percent || 0}%</span><small>${categories[0]?.name || 'N/A'}</small></div></div>
            <div class="donut-legend">${categories.slice(0, 4).map(c => `<div class="legend-item"><span class="dot" style="background:${CATEGORY_COLORS[c.name] || '#94a3b8'}"></span><p>${c.name} <em>${c.percent}%</em></p></div>`).join('')}${categories.length === 0 ? '<p class="legend-empty">Belum ada data</p>' : ''}</div>
          </div>
        </div>
        <div class="stat-card chart-card goal-card" style="cursor: pointer;" id="goal-widget">
          <div class="card-header"><h3>🎯 Target Tabungan</h3></div>
          <div class="goal-container" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center;">
            <div style="width:70px; height:70px; border-radius:50%; background:conic-gradient(#3b82f6 var(--goal-pct), #f1f5f9 0); display:flex; align-items:center; justify-content:center; margin-bottom:12px;">
              <div style="width:56px; height:56px; background:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.8rem; color:#1e293b;" id="goal-pct-text">0%</div>
            </div>
            <h4 id="goal-name" style="font-size:0.9rem; color:#1e293b; margin-bottom:4px;">Set Target</h4>
            <p id="goal-amount" style="font-size:0.75rem; color:#94a3b8;">Klik untuk mengatur</p>
          </div>
        </div>
      </div>

      <!-- Row 3: Transactions + AI Activity -->
      <div class="bottom-row">
        <div class="recent-transactions">
          <div class="section-header"><h3>Transaksi Terakhir</h3><button class="btn-text" id="btn-liat-semua">Liat Semua →</button></div>
          <div class="transaction-list" id="dashboard-trans-list">${txs.length === 0 ? '<div class="no-trans"><span>📭</span><p>Belum ada transaksi</p></div>' : ''}</div>
        </div>
        <div class="ai-activity-panel">
          <div class="section-header"><h3>🤖 AI Activity</h3><span class="ai-live-badge">LIVE</span></div>
          <div class="activity-feed">
            ${activities.length > 0 ? activities.map(a => `<div class="activity-item"><span class="activity-dot"></span><div class="activity-content"><p>${a.text}</p><small>${timeSince(a.date)}</small></div></div>`).join('') : '<div class="activity-item"><span class="activity-dot"></span><div class="activity-content"><p>AI Agent aktif & siap membantu</p><small>baru saja</small></div></div>'}
            <div class="activity-item thinking"><span class="activity-dot pulse"></span><div class="activity-content"><p>AI menganalisis pola...</p><small>dalam proses</small></div></div>
          </div>
        </div>
      </div>
    </div>
  `;

  let activeEditId = null;
  let showAllTxs = false;
  let currentFilterDate = null;

  // Render transactions with grouping and filtering
  const list = document.getElementById('dashboard-trans-list');
  const btnLiatSemua = document.getElementById('btn-liat-semua');

  btnLiatSemua.onclick = () => {
    showAllTxs = !showAllTxs;
    btnLiatSemua.innerText = showAllTxs ? 'Sembunyikan ↑' : 'Liat Semua →';
    renderTxList(currentFilterDate);
  };

  const renderTxList = (filterDate = null) => {
    if (!list) return;
    currentFilterDate = filterDate;

    let displayTxs = txs;
    if (filterDate) {
      displayTxs = txs.filter(t => (t.date || '').startsWith(filterDate));
      btnLiatSemua.style.display = 'none'; // Hide button when filtering
    } else {
      btnLiatSemua.style.display = 'block';
      if (!showAllTxs && displayTxs.length > 5) {
        displayTxs = displayTxs.slice(0, 5);
      }
    }

    if (displayTxs.length === 0) {
      if (filterDate) {
        list.innerHTML = `
          <div style="margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; background:#eff6ff; padding:8px 12px; border-radius:8px; border:1px solid #bfdbfe;">
            <span style="font-size:0.8rem; font-weight:700; color:#1e3a8a;">📅 Filter: ${filterDate}</span>
            <button class="btn-clear-filter" style="background:none; border:none; color:#ef4444; font-weight:bold; cursor:pointer;">✕ Tutup Filter</button>
          </div>
          <div class="no-trans"><span>📭</span><p>Belum ada transaksi di tanggal ini</p></div>
        `;
        list.querySelector('.btn-clear-filter').onclick = () => renderTxList(null);
      } else {
        list.innerHTML = `<div class="no-trans"><span>📭</span><p>Belum ada transaksi</p></div>`;
      }
      return;
    }

    // Group by date
    const grouped = {};
    displayTxs.forEach(t => {
      const d = t.date || 'Unknown';
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(t);
    });

    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    let html = '';
    if (filterDate) {
      html += `
        <div style="margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; background:#eff6ff; padding:8px 12px; border-radius:8px; border:1px solid #bfdbfe;">
          <span style="font-size:0.8rem; font-weight:700; color:#1e3a8a;">📅 Filter: ${filterDate}</span>
          <button class="btn-clear-filter" style="background:none; border:none; color:#ef4444; font-weight:bold; cursor:pointer;">✕ Tutup Filter</button>
        </div>
      `;
    }

    sortedDates.forEach(date => {
      const displayDate = timeSince(date) === 'hari ini' ? 'Hari Ini' : (timeSince(date) === 'kemarin' ? 'Kemarin' : date);
      html += `<div style="margin-top:16px; margin-bottom:8px; font-size:0.75rem; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #f1f5f9; padding-bottom:4px;">${displayDate}</div>`;

      grouped[date].forEach(t => {
        const conf = t.confidence ? Math.round(t.confidence * 100) : null;
        html += `
          <div class="transaction-item" style="margin-bottom:8px;">
            <div class="trans-info">
              <div class="trans-icon">${t.amount > 0 ? '💰' : '💸'}</div>
              <div class="trans-text">
                <h4>${t.title}</h4>
                <p><span class="cat-badge" style="background:${CATEGORY_COLORS[t.category] || '#94a3b8'}20;color:${CATEGORY_COLORS[t.category] || '#94a3b8'}">${t.category}</span>${conf ? `<span class="conf-badge">AI ${conf}%</span>` : ''}</p>
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <div class="trans-amount ${t.amount > 0 ? 'plus' : 'minus'}">${t.amount > 0 ? '+' : '−'} Rp ${Math.abs(t.amount).toLocaleString('id-ID')}</div>
              <button class="btn-edit-tx" data-id="${t.id}" style="background:transparent; border:none; cursor:pointer; font-size:1rem; opacity:0.5; transition:0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.5" title="Edit Transaksi">✏️</button>
              <button class="btn-del-tx" data-id="${t.id}" style="background:transparent; border:none; cursor:pointer; font-size:1.1rem; opacity:0.5; transition:0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.5" title="Hapus Transaksi">🗑️</button>
            </div>
          </div>
        `;
      });
    });

    list.innerHTML = html;

    if (filterDate) {
      list.querySelector('.btn-clear-filter').onclick = () => renderTxList(null);
    }

    // Attach dynamic handlers
    list.querySelectorAll('.btn-del-tx').forEach(btn => {
      btn.onclick = (e) => {
        const id = e.currentTarget.dataset.id;

        // Custom Delete Confirmation Modal
        const delModal = document.createElement('div');
        delModal.style.cssText = `position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:9999; width:90%; max-width:360px; animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);`;
        delModal.innerHTML = `
          <div style="background:white; padding:32px; border-radius:28px; box-shadow:0 30px 60px rgba(0,0,0,0.15); border:1px solid #f1f5f9; text-align:center;">
            <div style="background:#fef2f2; color:#ef4444; width:60px; height:60px; border-radius:20px; display:flex; align-items:center; justify-content:center; font-size:1.8rem; margin:0 auto 20px;">🗑️</div>
            <h3 style="margin:0 0 10px; font-weight:800; color:#1e293b;">Hapus Transaksi?</h3>
            <p style="margin:0 0 28px; color:#64748b; font-size:0.9rem; line-height:1.5;">Tindakan ini tidak bisa dibatalkan. Kamu yakin ingin menghapus catatan ini?</p>
            <div style="display:flex; gap:12px;">
              <button id="cancel-del" style="flex:1; padding:14px; border-radius:14px; border:none; background:#f1f5f9; color:#64748b; font-weight:700; cursor:pointer;">Batal</button>
              <button id="confirm-del" style="flex:1; padding:14px; border-radius:14px; border:none; background:#ef4444; color:white; font-weight:700; cursor:pointer; box-shadow:0 10px 20px rgba(239,68,68,0.2);">Ya, Hapus</button>
            </div>
          </div>
        `;

        document.body.appendChild(delModal);

        document.getElementById('cancel-del').onclick = () => delModal.remove();
        document.getElementById('confirm-del').onclick = () => {
          const newTxs = txs.filter(t => t.id != id);
          const newBalance = newTxs.reduce((sum, t) => sum + t.amount, 0);
          localStorage.setItem('kasiq_finance_data', JSON.stringify({ balance: newBalance, transactions: newTxs }));
          delModal.remove();
          if (window.updateFinanceData) window.updateFinanceData({ balance: newBalance, transactions: newTxs });
        };
      };
    });

    list.querySelectorAll('.btn-edit-tx').forEach(btn => {
      btn.onclick = (e) => {
        activeEditId = e.currentTarget.dataset.id;
        const t = txs.find(tx => tx.id == activeEditId);
        if (t) {
          document.getElementById('edit-title').value = t.title;
          document.getElementById('edit-amount').value = Math.abs(t.amount);
          document.getElementById('edit-category').value = t.category || 'Lainnya';
          document.getElementById('edit-modal').style.display = 'flex';
        }
      };
    });
  };

  renderTxList(null);

  // Edit Modal UI Injection (Singleton Pattern)
  let modalContainer = document.getElementById('edit-modal');
  if (!modalContainer) {
    modalContainer = document.createElement('div');
    modalContainer.id = 'edit-modal';
    modalContainer.style.cssText = `display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:90%; max-width:400px; z-index:9999; animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);`;
    document.body.appendChild(modalContainer);
  }

  modalContainer.innerHTML = `
    <div style="background:white; padding:32px; border-radius:28px; box-shadow:0 30px 60px rgba(0,0,0,0.15); border:1px solid #f1f5f9;">
      <h3 style="margin-bottom:24px; font-weight:800; color:#1e293b; display:flex; align-items:center; gap:12px;">
        <div style="background:#fef3c7; padding:10px; border-radius:12px; font-size:1.5rem;">✏️</div>
        Edit Transaksi
      </h3>
      
      <div style="margin-bottom:16px;">
        <label style="display:block; font-size:0.7rem; font-weight:700; color:#94a3b8; text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px;">Keterangan</label>
        <input type="text" id="edit-title" style="width:100%; padding:14px; border-radius:14px; border:2px solid #f1f5f9; outline:none; font-family:inherit; font-size:1rem; transition:border-color 0.2s;" onfocus="this.style.borderColor='#3b82f6'">
      </div>
      
      <div style="margin-bottom:16px;">
        <label style="display:block; font-size:0.7rem; font-weight:700; color:#94a3b8; text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px;">Nominal (Rp)</label>
        <input type="number" id="edit-amount" style="width:100%; padding:14px; border-radius:14px; border:2px solid #f1f5f9; outline:none; font-family:inherit; font-size:1rem; transition:border-color 0.2s;" onfocus="this.style.borderColor='#3b82f6'">
      </div>
      
      <div style="margin-bottom:28px;">
        <label style="display:block; font-size:0.7rem; font-weight:700; color:#94a3b8; text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px;">Kategori</label>
        <select id="edit-category" style="width:100%; padding:14px; border-radius:14px; border:2px solid #f1f5f9; outline:none; font-family:inherit; font-size:1rem; background:white;">
          ${Object.keys(CATEGORY_COLORS).map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
      
      <div style="display:flex; gap:12px;">
        <button id="btn-cancel-edit" style="flex:1; padding:14px; border-radius:14px; border:none; background:#f1f5f9; color:#64748b; font-weight:700; cursor:pointer;">Batal</button>
        <button id="btn-save-edit" style="flex:1; padding:14px; border-radius:14px; border:none; background:#1e293b; color:white; font-weight:700; cursor:pointer; box-shadow:0 10px 20px rgba(30,41,59,0.2);">Simpan</button>
      </div>
    </div>
  `;

  // Delete and Edit logic is now handled dynamically inside renderTxList()

  document.getElementById('btn-cancel-edit').onclick = () => { modalContainer.style.display = 'none'; };
  document.getElementById('btn-save-edit').onclick = () => {
    const newTitle = document.getElementById('edit-title').value;
    const newAmt = parseInt(document.getElementById('edit-amount').value);
    const newCat = document.getElementById('edit-category').value;

    if (!newTitle || isNaN(newAmt)) return alert('Data tidak valid!');

    const updatedTxs = txs.map(t => {
      if (t.id == activeEditId) {
        const isExpense = t.amount < 0;
        return { ...t, title: newTitle, amount: isExpense ? -newAmt : newAmt, category: newCat };
      }
      return t;
    });

    const newBalance = updatedTxs.reduce((sum, t) => sum + t.amount, 0);
    localStorage.setItem('kasiq_finance_data', JSON.stringify({ balance: newBalance, transactions: updatedTxs }));
    modalContainer.style.display = 'none';
    if (window.updateFinanceData) window.updateFinanceData({ balance: newBalance, transactions: updatedTxs });
  };
  // Goal Widget Logic - Manual & Customizable
  const goalWidget = document.getElementById('goal-widget');
  if (goalWidget) {
    const settings = JSON.parse(localStorage.getItem('kasiq_settings') || '{"goal": {"name": "Membeli Laptop", "target": 10000000}}');
    const goal = settings.goal;
    const goalContainer = goalWidget.querySelector('.goal-container');

    // Hitung total yang sudah dialokasikan ke kategori "Tabungan"
    const totalSaved = txs.filter(t => t.category === 'Tabungan').reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const pct = goal.target > 0 ? Math.min(100, Math.round((totalSaved / goal.target) * 100)) : 0;

    goalWidget.querySelector('#goal-name').textContent = goal.name;
    goalWidget.querySelector('#goal-amount').textContent = `Rp ${totalSaved.toLocaleString('id-ID')} / ${parseInt(goal.target).toLocaleString('id-ID')}`;
    goalWidget.querySelector('#goal-pct-text').textContent = `${pct}%`;
    goalContainer.querySelector('div').style.setProperty('--goal-pct', `${pct}%`);
    goalWidget.onclick = (e) => {
      // Hapus modal lama kalau ada
      const existing = document.getElementById('goal-modal-unique');
      if (existing) existing.remove();

      const goalModal = document.createElement('div');
      goalModal.id = 'goal-modal-unique';
      goalModal.style.cssText = `position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); z-index:9999; width:90%; max-width:400px; animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); pointer-events: auto;`;

      goalModal.innerHTML = `
          <div class="modal-content" style="background:white; padding:32px; border-radius:28px; box-shadow:0 30px 60px rgba(0,0,0,0.15); border:1px solid #f1f5f9;">
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:24px;">
              <div style="background:#eff6ff; padding:10px; border-radius:12px; font-size:1.5rem;">🎯</div>
              <h3 style="margin:0; font-weight:800; color:#1e293b;">Set Target Tabungan</h3>
            </div>
            
            <div style="margin-bottom:20px;">
              <label style="display:block; font-size:0.7rem; font-weight:700; color:#94a3b8; text-transform:uppercase; margin-bottom:8px; letter-spacing:0.5px;">Mau nabung buat apa?</label>
              <input type="text" id="new-goal-name" value="${goal.name}" placeholder="Contoh: Beli PS5" style="width:100%; padding:14px; border-radius:14px; border:2px solid #f1f5f9; font-family:inherit; font-size:1rem; outline:none; transition:border-color 0.2s;" onfocus="this.style.borderColor='#3b82f6'">
            </div>
            
            <div style="margin-bottom:28px;">
              <label style="display:block; font-size:0.7rem; font-weight:700; color:#94a3b8; text-transform:uppercase; margin-bottom:8px; letter-spacing:0.5px;">Harga / Target (Rp)</label>
              <input type="number" id="new-goal-target" value="${goal.target}" placeholder="Contoh: 8000000" style="width:100%; padding:14px; border-radius:14px; border:2px solid #f1f5f9; font-family:inherit; font-size:1rem; outline:none; transition:border-color 0.2s;" onfocus="this.style.borderColor='#3b82f6'">
            </div>
            
            <div style="display:flex; gap:12px;">
              <button id="cancel-goal" style="flex:1; padding:14px; border-radius:14px; border:none; background:#f1f5f9; color:#64748b; font-weight:700; cursor:pointer; transition:all 0.2s;">Batal</button>
              <button id="save-goal" style="flex:2; padding:14px; border-radius:14px; border:none; background:#1e293b; color:white; font-weight:700; cursor:pointer; box-shadow:0 10px 20px rgba(30,41,59,0.2); transition:all 0.2s;">Simpan Target</button>
            </div>
          </div>
        `;

      document.body.appendChild(goalModal);
      document.getElementById('new-goal-name').focus();

      document.getElementById('cancel-goal').onclick = () => goalModal.remove();
      document.getElementById('save-goal').onclick = () => {
        const name = document.getElementById('new-goal-name').value;
        const target = parseInt(document.getElementById('new-goal-target').value);

        if (!name || isNaN(target) || target <= 0) {
          alert('Tolong isi data yang valid ya!');
          return;
        }

        settings.goal = { name, target };
        localStorage.setItem('kasiq_settings', JSON.stringify(settings));
        goalModal.remove();
        if (window.updateFinanceData) window.updateFinanceData({});
      };
    };
  }

  document.getElementById('btn-liat-semua').onclick = () => { window.location.hash = '#insight'; };

  // Render chart using Matplotlib via backend API
  const chartContent = document.getElementById('chart-content');

  if (chartContent && timeline.length > 0) {
    // Helper to request chart image using Chart.js (Classic Style)
    let myChart = null;

    const loadChart = (data) => {
      chartContent.innerHTML = `<canvas id="momentumChart" style="width:100%; height:320px;"></canvas>`;
      const ctx = document.getElementById('momentumChart').getContext('2d');

      const labels = data.pastData.map(d => d.date);
      const incomeData = data.pastData.map(d => d.income || 0);
      const expenseData = data.pastData.map(d => d.expense || 0);
      const balances = data.pastData.map(d => d.balance);

      if (myChart) myChart.destroy();

      myChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Pemasukan',
              data: incomeData,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderWidth: 2.5,
              pointRadius: 4,
              tension: 0, // Straight lines
              fill: true
            },
            {
              label: 'Pengeluaran',
              data: expenseData,
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              borderWidth: 2.5,
              pointRadius: 4,
              tension: 0, // Straight lines
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { 
              display: true, 
              position: 'top',
              labels: { usePointStyle: true, font: { family: 'Inter', size: 12, weight: '600' } }
            },
            tooltip: {
              enabled: true,
              backgroundColor: '#1e293b',
              padding: 16,
              cornerRadius: 12,
              titleFont: { size: 14, weight: 'bold' },
              bodyFont: { size: 13 },
              callbacks: {
                label: (context) => {
                  const label = context.dataset.label || '';
                  const value = context.raw || 0;
                  const balance = balances[context.dataIndex];
                  if (context.datasetIndex === 0) {
                    return [`${label}: Rp ${value.toLocaleString('id-ID')}`, `Total Saldo: Rp ${balance.toLocaleString('id-ID')}`];
                  }
                  return `${label}: Rp ${value.toLocaleString('id-ID')}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 10 }, color: '#94a3b8' }
            },
            y: {
              title: { display: true, text: 'Nominal (Rp)', font: { weight: 'bold' } },
              grid: { color: '#f1f5f9' },
              ticks: {
                font: { size: 10 },
                color: '#94a3b8',
                callback: (value) => value >= 1000000 ? (value / 1000000).toFixed(1) + 'M' : (value / 1000).toFixed(0) + 'k'
              }
            }
          }
        }
      });
    };

    const settings = JSON.parse(localStorage.getItem('kasiq_settings') || '{}');

    // Initial full chart
    loadChart({ pastData: timeline, goal: settings.goal });

    // Filter buttons – re‑fetch chart with filtered past data
    document.querySelectorAll('.cf-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.cf-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const days = parseInt(btn.dataset.days);
        const cutoff = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
        const filtered = timeline.filter(t => t.date >= cutoff);
        loadChart({ pastData: filtered, goal: settings.goal });
      };
    });
  }
}
