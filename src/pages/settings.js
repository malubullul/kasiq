export function renderSettings(container) {
  const SETTINGS_KEY = 'kasiq_settings';
  const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');

  const getSetting = (key, def) => settings[key] !== undefined ? settings[key] : def;
  const saveSetting = (key, val) => {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    s[key] = val;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  };

  container.innerHTML = `
    <div style="padding: 28px; background: #f8fafc; min-height: 100%;">

      <div style="margin-bottom: 28px;">
        <h2 style="font-size: 1.6rem; font-weight: 800; color: #1e293b; margin-bottom: 6px;">⚙️ Pengaturan</h2>
        <p style="color: #64748b; font-size: 0.9rem;">Personalisasi Kas-iQ sesuai kebutuhanmu.</p>
      </div>

      <!-- Profile Header -->
      <div style="background: white; border-radius: 24px; padding: 24px; margin-bottom: 24px; display: flex; align-items: center; gap: 20px; box-shadow: 0 2px 16px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.03);">
        <div style="width: 72px; height: 72px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 1.8rem; color: white; border: 4px solid #f1f5f9;">
          👤
        </div>
        <div style="flex: 1;">
          <h3 style="font-size: 1.2rem; font-weight: 800; color: #1e293b; margin: 0;">Kas-iQ Explorer</h3>
          <p style="font-size: 0.85rem; color: #94a3b8; margin: 4px 0 0 0;">Personal Account &bull; Member sejak April 2026</p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.7rem; font-weight: 700; color: #3b82f6; text-transform: uppercase; background: #eff6ff; padding: 4px 10px; border-radius: 10px;">Pro Edition</div>
        </div>
      </div>

      <!-- Preferences Card -->
      <div class="settings-card">
        <h3 class="settings-card-title">Fitur Pintar AI</h3>

        <div class="settings-row">
          <div class="settings-label">
            <strong>Pisah Uang Pribadi & Bisnis</strong>
            <p>AI akan membedakan pengeluaran pribadi vs usaha</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="toggle-split" ${getSetting('split_mode', true) ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="settings-row">
          <div class="settings-label">
            <strong>Klasifikasi Kategori Otomatis</strong>
            <p>AI menebak kategori transaksi tanpa konfirmasi</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="toggle-auto-cat" ${getSetting('auto_category', true) ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="settings-row" style="border: none;">
          <div class="settings-label">
            <strong>Proactive AI Nudge</strong>
            <p>AI memberi saran otomatis setelah transaksi dicatat</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="toggle-nudge" ${getSetting('proactive_nudge', true) ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      </div>

        <div class="settings-row" style="border: none;">
          <div class="settings-label">
            <strong>Mode Hemat Token</strong>
            <p>Pre-filter pesan lebih ketat — hemat kuota API</p>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="toggle-save-token" ${getSetting('save_token_mode', false) ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- Data Control Card -->
      <div class="settings-card">
        <h3 class="settings-card-title">Data & Privasi</h3>
        <div class="privacy-notice">
          🔒 <strong>Kas-iQ tidak menyimpan foto atau rekaman suara secara permanen.</strong>
          Hanya hasil analisis AI (teks & angka) yang tersimpan di database.
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 16px;">
          <button class="settings-btn" id="btn-export-csv" style="background:#f0fdf4; color:#166534; border-color:#bbf7d0;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Unduh Laporan CSV
          </button>

          <button class="settings-btn" id="btn-export-json">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Semua Data (JSON)
          </button>
          <button class="settings-btn settings-btn-danger" id="btn-clear-chat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Hapus Riwayat Chat
          </button>

          <button class="settings-btn settings-btn-danger" id="btn-clear-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Reset Semua Data Keuangan
          </button>
        </div>
      </div>

      <!-- App Info -->
      <div class="settings-card" style="text-align: center; background: transparent; box-shadow: none; border: none; margin-top: 20px;">
        <div style="font-size: 1.8rem; margin-bottom: 8px;">🤖</div>
        <h3 style="font-size: 0.95rem; font-weight: 700; color: #1e293b;">Kas-iQ Autonomous Financial Agent</h3>
        <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">Powered by Gemini AI + Supabase <span id="server-status"></span></p>
        <div class="version-badge">v2.0 — Hackathon Edition</div>
      </div>
    </div>
  `;

  // ── Toggle Listeners ──────────────────────────
  container.querySelector('#toggle-split').onchange = e => saveSetting('split_mode', e.target.checked);
  container.querySelector('#toggle-auto-cat').onchange = e => saveSetting('auto_category', e.target.checked);
  container.querySelector('#toggle-nudge').onchange = e => saveSetting('proactive_nudge', e.target.checked);
  container.querySelector('#toggle-save-token').onchange = e => saveSetting('save_token_mode', e.target.checked);

  // Check backend connectivity
  fetch('http://127.0.0.1:3000/api/health', { method: 'GET' })
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      const statusEl = container.querySelector('#server-status');
      if (statusEl && data) {
        statusEl.innerHTML = `&nbsp; ● <span style="color:#10b981;">Server Online</span>`;
      }
    })
    .catch(() => {
      const statusEl = container.querySelector('#server-status');
      if (statusEl) {
        statusEl.innerHTML = `&nbsp; ● <span style="color:#f59e0b;">Server Offline</span>`;
      }
    });

  // ── Export JSON ───────────────────────────────
  container.querySelector('#btn-export-json').onclick = () => {
    const fd = localStorage.getItem('kasiq_finance_data') || '{}';
    const blob = new Blob([fd], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kasiq_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Export CSV ────────────────────────────────
  container.querySelector('#btn-export-csv').onclick = () => {
    const fdStr = localStorage.getItem('kasiq_finance_data');
    if (!fdStr) return showToast('Belum ada data.');
    const fd = JSON.parse(fdStr);
    const txs = fd.transactions || [];
    if (txs.length === 0) return showToast('Belum ada transaksi.');

    const headers = ['ID', 'Tanggal', 'Keterangan', 'Kategori', 'Tipe', 'Nominal'];
    const rows = txs.map(t => [
      t.id || '',
      t.date || '',
      `"${t.title.replace(/"/g, '""')}"`,
      t.category || 'Lainnya',
      t.amount > 0 ? 'Pemasukan' : 'Pengeluaran',
      Math.abs(t.amount)
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Laporan_Kas_i_Q_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Clear Chat History ────────────────────────
  container.querySelector('#btn-clear-chat').onclick = () => {
    if (confirm('Yakin hapus riwayat chat? Transaksi yang sudah tercatat tetap aman.')) {
      localStorage.removeItem('kasiq_chat_history');
      showToast('Riwayat chat berhasil dihapus ✓');
    }
  };

  // ── Reset All Data ────────────────────────────
  container.querySelector('#btn-clear-all').onclick = () => {
    if (confirm('⚠️ PERINGATAN: Ini akan menghapus SEMUA data keuangan dan riwayat chat. Tidak bisa dibatalkan!')) {
      if (confirm('Yakin 100%? Semua data akan hilang.')) {
        ['kasiq_finance_data', 'kasiq_chat_history',
          'kasiq_seeded_v2', 'kasiq_seeded_v3'].forEach(k => localStorage.removeItem(k));
        showToast('Semua data berhasil direset ✓');
        setTimeout(() => window.location.hash = '#chat', 800);
      }
    }
  };

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:#1e293b;color:white;padding:12px 24px;border-radius:16px;font-size:0.88rem;font-weight:600;z-index:9999;animation:slideUp 0.3s ease;box-shadow:0 8px 24px rgba(0,0,0,0.2);`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 2500);
  }

  // ── Inject Styles ─────────────────────────────
  const style = document.createElement('style');
  style.innerHTML = `
    .settings-card {
      background: white;
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 16px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.04);
      border: 1px solid rgba(0,0,0,0.03);
    }
    .settings-card-title {
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #94a3b8;
      margin-bottom: 20px;
    }
    .settings-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 0;
      border-bottom: 1px solid #f1f5f9;
      gap: 16px;
    }
    .settings-label strong { font-size: 0.9rem; color: #1e293b; display: block; margin-bottom: 3px; }
    .settings-label p { font-size: 0.78rem; color: #94a3b8; }
    .settings-select {
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      padding: 6px 12px;
      font-size: 0.85rem;
      color: #1e293b;
      font-weight: 600;
      cursor: pointer;
      outline: none;
    }
    .settings-select:focus { border-color: #3b82f6; }
    .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
    .toggle-switch input { opacity: 0; width: 0; height: 0; }
    .toggle-slider { position: absolute; cursor: pointer; inset: 0; background: #e2e8f0; border-radius: 24px; transition: 0.2s; }
    .toggle-slider:before { content: ''; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.2s; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
    input:checked + .toggle-slider { background: #3b82f6; }
    input:checked + .toggle-slider:before { transform: translateX(20px); }
    .privacy-notice { background: #f8fafc; border-radius: 12px; padding: 14px 16px; font-size: 0.83rem; color: #475569; line-height: 1.5; }
    .settings-btn {
      display: flex; align-items: center; gap: 10px;
      width: 100%; padding: 12px 18px;
      background: white; border: 1.5px solid #e2e8f0;
      border-radius: 12px; font-size: 0.88rem; font-weight: 600;
      color: #374151; cursor: pointer; transition: all 0.2s;
    }
    .settings-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
    .settings-btn-danger { color: #dc2626 !important; border-color: #fecaca !important; }
    .settings-btn-danger:hover { background: #fff1f2 !important; }
    .version-badge {
      display: inline-block; margin-top: 12px;
      background: #eff6ff; color: #3b82f6;
      padding: 4px 12px; border-radius: 8px;
      font-size: 0.75rem; font-weight: 700;
    }
    @keyframes slideUp { from { transform: translateX(-50%) translateY(12px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
  `;
  container.appendChild(style);
}
