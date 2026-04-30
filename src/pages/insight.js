export function renderInsight(container, filterDays = 'all') {
  const fd = JSON.parse(localStorage.getItem('kasiq_finance_data') || '{"balance":0,"transactions":[]}');
  let txs = fd.transactions || [];

  // ── Global Time Filter ────────────────────────
  if (filterDays !== 'all') {
    const today = new Date().toISOString().split('T')[0];
    if (filterDays === '1') {
      txs = txs.filter(t => t.date === today);
    } else {
      const days = parseInt(filterDays);
      const cutoff = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
      txs = txs.filter(t => t.date >= cutoff);
    }
  }

  // ── Compute Core Metrics ──────────────────────
  let totalIn = 0, totalOut = 0;
  const catMap = {};
  const dayMap = {};

  txs.forEach(t => {
    const d = t.date || new Date().toISOString().split('T')[0];
    if (!dayMap[d]) dayMap[d] = { income: 0, expense: 0 };
    if (t.amount > 0) { totalIn += t.amount; dayMap[d].income += t.amount; }
    else { totalOut += Math.abs(t.amount); dayMap[d].expense += Math.abs(t.amount); }
    if (t.category && t.amount < 0) {
      catMap[t.category] = (catMap[t.category] || 0) + Math.abs(t.amount);
    }
  });

  const netCashflow = totalIn - totalOut;
  const savingsRate = totalIn > 0 ? ((netCashflow / totalIn) * 100) : 0;
  const expTxs = txs.filter(t => t.amount < 0);
  const avgTxAmount = expTxs.length > 0 ? totalOut / expTxs.length : 0;
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];
  const topCatPercent = topCat && totalOut > 0 ? Math.round((topCat[1] / totalOut) * 100) : 0;

  // ── Find the most expensive day ──────────────
  const days = Object.entries(dayMap).sort((a, b) => b[1].expense - a[1].expense);
  const borosDay = days[0];
  const borosDate = borosDay ? borosDay[0] : null;
  const borosAmount = borosDay ? borosDay[1].expense : 0;

  // ── Streak: consecutive days with expenses ──
  const sortedDates = Object.keys(dayMap).sort();
  let streak = 0;
  let tempStreak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i-1]);
    const curr = new Date(sortedDates[i]);
    const diff = (curr - prev) / 86400000;
    if (diff === 1) { tempStreak++; streak = Math.max(streak, tempStreak); }
    else { tempStreak = 1; }
  }
  streak = Math.max(streak, tempStreak > 1 ? tempStreak : 1);

  // ── Smart Spending Analysis ───────────────────
  const spendByCategory = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, val]) => ({
      name,
      val,
      percent: totalOut > 0 ? Math.round((val / totalOut) * 100) : 0
    }));

  // ── Generate deep insights ────────────────────
  const insights = [];

  // Insight 1: Saving rate
  if (totalIn > 0) {
    if (savingsRate >= 50) insights.push({ icon: '🏆', type: 'success', title: 'Wah, Tumben Banget!', body: `Kamu berhasil nyimpen <strong>${savingsRate.toFixed(0)}%</strong> uangmu bulan ini. Jujur aku kaget, pertahankan kebiasaan bagus ini ya!`, tag: 'Sultan' });
    else if (savingsRate >= 20) insights.push({ icon: '✅', type: 'info', title: 'Masih Aman Sih', body: `Saving rate kamu <strong>${savingsRate.toFixed(0)}%</strong>. Cukup aman buat sehari-hari, tapi pelan-pelan coba kurangi pengeluaran yang nggak perlu.`, tag: 'Stabil' });
    else if (savingsRate > 0) insights.push({ icon: '⚠️', type: 'warning', title: 'Awas, Mepet Banget!', body: `Tabungan kamu sisa <strong>${savingsRate.toFixed(0)}%</strong> doang. Coba cek lagi deh, bulan ini banyakan beli kebutuhan atau cuma laper mata?`, tag: 'Hati-hati' });
    else insights.push({ icon: '🚨', type: 'danger', title: 'Lebih Besar Pasak...', body: `Pengeluaran kamu udah ngelewatin pemasukan bulan ini. Yuk setop dulu checkout keranjangnya sebelum dompet makin nangis.`, tag: 'Minus' });
  }

  // Insight 2: Most expensive day
  if (borosDay && borosAmount > avgTxAmount * 2) {
    insights.push({ icon: '📅', type: 'warning', title: 'Hari Paling Khilaf', body: `Coba inget-inget, di tanggal <strong>${borosDate}</strong> kamu beli apa aja? Sampai habis <strong>Rp ${borosAmount.toLocaleString('id-ID')}</strong> lho. Lain kali direm dikit ya.`, tag: 'Rekor Boros' });
  }

  // Insight 3: Needs vs Wants (50/30/20 Rule)
  const needsCategories = ['Makanan', 'Transport', 'Kesehatan'];
  const wantsCategories = ['Belanja', 'Hiburan', 'Lainnya'];
  let needsTotal = 0;
  let wantsTotal = 0;
  
  Object.entries(catMap).forEach(([cat, val]) => {
    if (needsCategories.includes(cat)) needsTotal += val;
    if (wantsCategories.includes(cat)) wantsTotal += val;
  });

  const wantsPercent = totalOut > 0 ? (wantsTotal / totalOut) * 100 : 0;
  const needsPercent = totalOut > 0 ? (needsTotal / totalOut) * 100 : 0;

  if (wantsPercent > 35) {
    if (savingsRate >= 20) {
      insights.push({ icon: '🎉', type: 'success', title: 'Self-Reward Approved', body: `Sebanyak <strong>${wantsPercent.toFixed(0)}%</strong> pengeluaranmu buat Hiburan/Belanja. Tapi karena tabunganmu aman, <em>self-reward</em> sah-sah aja kok! <em>Work hard, play hard!</em>`, tag: 'Self Reward' });
    } else {
      insights.push({ icon: '🛍️', type: 'danger', title: 'Korban Gaya Hidup', body: `Gawat! <strong>${wantsPercent.toFixed(0)}%</strong> uangmu habis buat keinginan (Wants). Padahal tabungan lagi mepet lho. Kurangin foya-foya, utamakan kebutuhan pokok ya.`, tag: 'Foya-foya' });
    }
  } else if (needsPercent > 70) {
    insights.push({ icon: '🥗', type: 'tip', title: 'Mode Bertahan Hidup', body: `Hebat! <strong>${needsPercent.toFixed(0)}%</strong> uangmu murni buat bertahan hidup (Makan/Transport). Kamu disiplin banget, tapi jangan lupa bahagiain diri sendiri sesekali ya.`, tag: 'Frugal Living' });
  } else if (topCat && topCatPercent > 40) {
    insights.push({ icon: '🎯', type: 'tip', title: `Fokus ke ${topCat[0]}`, body: `Aku perhatiin <strong>${topCatPercent}%</strong> pengeluaran kamu didominasi oleh <strong>${topCat[0]}</strong>. Selama itu emang prioritas kamu bulan ini, aman kok.`, tag: 'Evaluasi' });
  }

  // Insight 4: Latte Factor (Bocor Halus)
  const smallTxs = expTxs.filter(t => Math.abs(t.amount) <= 35000);
  const smallTxsTotal = smallTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  if (smallTxs.length >= 7) {
    insights.push({ icon: '☕', type: 'info', title: 'Awas Bocor Halus!', body: `Kamu punya <strong>${smallTxs.length} transaksi</strong> receh (di bawah Rp35k). Kelihatannya murah, tapi totalnya nyedot <strong>Rp ${smallTxsTotal.toLocaleString('id-ID')}</strong> lho. Jangan diremehin!`, tag: 'Latte Factor' });
  } else if (streak >= 5) {
    // Insight 5: Spending Streak
    insights.push({ icon: '🔥', type: 'danger', title: 'Jajan Tiap Hari?', body: `Kamu keluar uang <strong>${streak} hari berturut-turut!</strong> Dompet juga butuh istirahat, coba tantang dirimu buat <em>"No Spend Day"</em> besok.`, tag: 'Streak Boros' });
  }

  // Insight 6: Kas-iQ Engagement Reward (Gamification)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTxs = txs.filter(t => t.date && t.date.startsWith(todayStr));
  
  if (todayTxs.length >= 3) {
    insights.unshift({ icon: '🌟', type: 'success', title: 'Si Paling Disiplin!', body: `Wah, kamu udah rajin nyatet <strong>${todayTxs.length} transaksi</strong> hari ini. Kas-iQ bangga banget sama ketelitianmu. Terus semangat ya ngatur uangnya!`, tag: 'Daily Quest' });
  } else if (todayTxs.length > 0 && txs.length <= 5) {
    insights.unshift({ icon: '🌱', type: 'success', title: 'Awal yang Bagus!', body: `Kas-iQ seneng banget lihat kamu mulai peduli sama keuanganmu hari ini. Yuk rutinin catat pengeluaran biar AI makin pinter ngasih saran!`, tag: 'Langkah Pertama' });
  }

  // Insight 7: Income Win (Lomba/Bonus)
  const incomeTxsToday = txs.filter(t => t.amount > 0 && t.date && t.date.startsWith(todayStr));
  if (incomeTxsToday.length > 0) {
    const lastIncome = incomeTxsToday[0];
    let incomeMsg = `Wah, ada uang masuk Rp ${lastIncome.amount.toLocaleString('id-ID')}! `;
    if ((lastIncome.title || '').toLowerCase().includes('lomba')) {
      incomeMsg += `Menang lomba ya? Hebat banget kamu nambah-nambah income terus! 🏆`;
    } else {
      incomeMsg += `Lumayan banget buat nambah saldo tabunganmu hari ini. Semangat! 💰`;
    }
    insights.unshift({ icon: '✨', type: 'success', title: 'Income Win!', body: incomeMsg, tag: 'Rejeki' });
  }

  // Insight 8: Health Check (Meal frequency)
  const mealTxsToday = txs.filter(t => t.date && t.date.startsWith(todayStr) && t.category === 'Makanan');
  // If it's already late in the day (e.g. after 4 PM) and meals < 2
  const currentHour = new Date().getHours();
  if (currentHour >= 16 && mealTxsToday.length > 0 && mealTxsToday.length < 2) {
    insights.push({ icon: '🥗', type: 'warning', title: 'Sudah Makan Belum?', body: `Aku liat hari ini kamu baru nyatet makan ${mealTxsToday.length} kali. Lupa nyatet atau lagi hemat banget? Saving boleh, tapi jaga kesehatan tetap nomor satu ya!`, tag: 'Kesehatan' });
  }

  const COLORS = { 'Makanan': '#f97316', 'Transport': '#f59e0b', 'Bisnis': '#3b82f6', 'Belanja': '#8b5cf6', 'Hiburan': '#ec4899', 'Kesehatan': '#10b981', 'Lainnya': '#94a3b8' };
  const insightColors = { success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#14532d', tag: '#10b981' }, info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1e3a8a', tag: '#3b82f6' }, warning: { bg: '#fffbeb', border: '#fde68a', text: '#78350f', tag: '#f59e0b' }, danger: { bg: '#fff1f2', border: '#fecdd3', text: '#881337', tag: '#ef4444' }, tip: { bg: '#f5f3ff', border: '#ddd6fe', text: '#4c1d95', tag: '#8b5cf6' } };

  container.innerHTML = `
    <style>
      .insight-kpi-card { background: white; padding: 24px; border-radius: 24px; border: 1px solid rgba(0,0,0,0.03); box-shadow: 0 4px 20px rgba(0,0,0,0.04); position: relative; overflow: hidden; transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease; }
      .insight-kpi-card:hover { transform: translateY(-6px); box-shadow: 0 12px 30px rgba(0,0,0,0.08); }
      .insight-kpi-bg-icon { position: absolute; right: -15px; bottom: -25px; font-size: 7rem; opacity: 0.04; user-select: none; pointer-events: none; filter: grayscale(100%); transition: transform 0.5s ease; }
      .insight-kpi-card:hover .insight-kpi-bg-icon { transform: scale(1.1) rotate(-5deg); filter: grayscale(0%); opacity: 0.1; }
      .insight-progress-bar { height: 100%; border-radius: 8px; transition: width 1.5s cubic-bezier(0.22, 1, 0.36, 1); }
      .insight-message-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
      .insight-message-card:hover { transform: scale(1.02); box-shadow: 0 8px 25px rgba(0,0,0,0.05) !important; }
      .custom-scroll::-webkit-scrollbar { width: 6px; }
      .custom-scroll::-webkit-scrollbar-track { background: transparent; }
      .custom-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      .custom-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
    </style>
    <div style="padding:32px; background:#f8fafc; min-height:100%; font-family:Inter, sans-serif;">

      <!-- Header & Filters -->
      <div style="margin-bottom:32px; display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:16px;">
        <div>
          <h2 style="font-size:1.8rem; font-weight:900; color:#0f172a; margin-bottom:6px; letter-spacing:-0.5px;">📊 Laporan Keuangan Mendalam</h2>
          <p style="color:#64748b; font-size:0.9rem; font-weight:500;">Analisis cerdas pola keuangan kamu — bukan sekedar angka, tapi wawasan yang bisa diambil tindakan.</p>
        </div>
        <div style="display:flex; gap:6px; background:white; padding:6px; border-radius:14px; border:1px solid #e2e8f0; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
          <button class="insight-filter-btn ${filterDays === 'all' ? 'active' : ''}" data-filter="all" style="padding:8px 16px; border:none; background:${filterDays === 'all' ? '#0f172a' : 'transparent'}; color:${filterDays === 'all' ? 'white' : '#64748b'}; border-radius:10px; font-size:0.85rem; font-weight:700; cursor:pointer; transition:all 0.2s;">All-Time</button>
          <button class="insight-filter-btn ${filterDays === '30' ? 'active' : ''}" data-filter="30" style="padding:8px 16px; border:none; background:${filterDays === '30' ? '#0f172a' : 'transparent'}; color:${filterDays === '30' ? 'white' : '#64748b'}; border-radius:10px; font-size:0.85rem; font-weight:700; cursor:pointer; transition:all 0.2s;">30 Hari</button>
          <button class="insight-filter-btn ${filterDays === '7' ? 'active' : ''}" data-filter="7" style="padding:8px 16px; border:none; background:${filterDays === '7' ? '#0f172a' : 'transparent'}; color:${filterDays === '7' ? 'white' : '#64748b'}; border-radius:10px; font-size:0.85rem; font-weight:700; cursor:pointer; transition:all 0.2s;">7 Hari</button>
          <button class="insight-filter-btn ${filterDays === '1' ? 'active' : ''}" data-filter="1" style="padding:8px 16px; border:none; background:${filterDays === '1' ? '#0f172a' : 'transparent'}; color:${filterDays === '1' ? 'white' : '#64748b'}; border-radius:10px; font-size:0.85rem; font-weight:700; cursor:pointer; transition:all 0.2s;">Hari Ini</button>
        </div>
      </div>

      <!-- KPI Row -->
      <!-- KPI Row -->
      <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:20px; margin-bottom:32px;">
        <div class="insight-kpi-card">
          <div class="insight-kpi-bg-icon">💰</div>
          <p style="font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Saving Rate</p>
          <h3 style="font-size:2.4rem; font-weight:900; color:${savingsRate >= 20 ? '#10b981' : savingsRate > 0 ? '#f59e0b' : '#ef4444'}; margin-bottom:4px; letter-spacing:-1px;">${savingsRate.toFixed(0)}%</h3>
          <p style="font-size:0.75rem; color:#94a3b8; font-weight:600;">Target ideal: ≥30%</p>
        </div>
        <div class="insight-kpi-card">
          <div class="insight-kpi-bg-icon">💸</div>
          <p style="font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Avg Per Transaksi</p>
          <h3 style="font-size:1.6rem; font-weight:900; color:#0f172a; margin-bottom:4px; letter-spacing:-0.5px;">Rp ${Math.round(avgTxAmount).toLocaleString('id-ID')}</h3>
          <p style="font-size:0.75rem; color:#94a3b8; font-weight:600;">dari ${expTxs.length} pengeluaran</p>
        </div>
        <div class="insight-kpi-card">
          <div class="insight-kpi-bg-icon">🔥</div>
          <p style="font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Kategori Terbesar</p>
          <h3 style="font-size:1.6rem; font-weight:900; color:${COLORS[topCat?.[0]] || '#0f172a'}; margin-bottom:4px; letter-spacing:-0.5px;">${topCat?.[0] || 'N/A'}</h3>
          <p style="font-size:0.75rem; color:#94a3b8; font-weight:600;">${topCatPercent}% dari pengeluaran</p>
        </div>
        <div class="insight-kpi-card">
          <div class="insight-kpi-bg-icon">🗓️</div>
          <p style="font-size:0.75rem; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Hari Aktif Dicatat</p>
          <h3 style="font-size:2.4rem; font-weight:900; color:#3b82f6; margin-bottom:4px; letter-spacing:-1px;">${sortedDates.length}</h3>
          <p style="font-size:0.75rem; color:#94a3b8; font-weight:600;">Streak ${streak} hari berturut</p>
        </div>
      </div>

      <!-- Main Grid: Category Breakdown + Insights -->
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:24px;">

        <!-- Category Breakdown -->
        <div style="background:white; padding:32px; border-radius:32px; border:1px solid rgba(0,0,0,0.03); box-shadow:0 10px 40px rgba(0,0,0,0.03);">
          <h3 style="font-size:1.1rem; font-weight:800; color:#0f172a; margin-bottom:6px;">Distribusi Pengeluaran</h3>
          <p style="font-size:0.85rem; color:#64748b; font-weight:500; margin-bottom:28px;">Breakdown persentase aliran uang kamu.</p>
          <div style="display:flex; flex-direction:column; gap:20px; max-height: 400px; overflow-y: auto; padding-right: 8px;" class="custom-scroll">
            ${spendByCategory.length === 0 ? '<p style="color:#94a3b8; text-align:center; padding:24px;">Belum ada data pengeluaran.</p>' :
              spendByCategory.map(c => `
                <div>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                      <div style="width:14px; height:14px; border-radius:5px; background:${COLORS[c.name] || '#94a3b8'};"></div>
                      <span style="font-size:0.95rem; font-weight:700; color:#334155;">${c.name}</span>
                    </div>
                    <div style="text-align:right; display:flex; align-items:center; gap:10px;">
                      <span style="font-size:0.95rem; font-weight:800; color:#0f172a;">Rp ${c.val.toLocaleString('id-ID')}</span>
                      <span style="font-size:0.75rem; font-weight:800; color:${COLORS[c.name] || '#94a3b8'}; background:${(COLORS[c.name] || '#94a3b8')}15; padding:4px 10px; border-radius:8px;">${c.percent}%</span>
                    </div>
                  </div>
                  <div style="background:#f1f5f9; border-radius:8px; height:10px; overflow:hidden;">
                    <div class="insight-progress-bar" style="width:${c.percent}%; background:linear-gradient(90deg, ${COLORS[c.name] || '#94a3b8'}cc, ${COLORS[c.name] || '#94a3b8'});"></div>
                  </div>
                </div>
              `).join('')
            }
          </div>
        </div>

        <!-- AI-Powered Insights -->
        <div style="display:flex; flex-direction:column; gap:16px;">
          <div style="margin-bottom:8px;">
            <h3 style="font-size:1.1rem; font-weight:800; color:#0f172a; margin-bottom:6px;">🧠 Insight Keuangan</h3>
            <p style="font-size:0.85rem; color:#64748b; font-weight:500;">Temuan cerdas berdasarkan pola transaksimu.</p>
          </div>
          
          <!-- AI Summary Sticky Note -->
          <div style="background: linear-gradient(135deg, #fdfcf0 0%, #fffbeb 100%); padding: 20px; border-radius: 20px; border: 1px dashed #fde68a; margin-bottom: 8px; position: relative; overflow: hidden;">
            <div style="position: absolute; top: -10px; right: -10px; font-size: 3rem; opacity: 0.1;">📝</div>
            <h4 style="font-size: 0.9rem; font-weight: 800; color: #78350f; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
              <span>🤖</span> Catatan Kas-iQ
            </h4>
            <p style="font-size: 0.85rem; color: #92400e; line-height: 1.5; font-weight: 500;">
              ${filterDays === '1' 
                ? (txs.length > 0 ? `Hari ini kamu sudah mencatat <strong>${txs.length} transaksi</strong>. Semangat menjaga ritme pengeluaranmu!` : "Belum ada transaksi hari ini nih. Yuk, jangan lupa dicatat kalau ada jajan ya!")
                : `Secara keseluruhan, kamu lebih sering belanja di kategori <strong>${topCat?.[0] || '...'}</strong>. Coba perhatikan lagi apakah itu benar-benar kebutuhan atau sekedar keinginan?`
              }
            </p>
          </div>

          <div style="max-height:500px; overflow-y:auto; padding-right:10px; display:flex; flex-direction:column; gap:16px;" class="custom-scroll">
            ${insights.length === 0 ? '<div style="background:white; padding:40px; border-radius:24px; text-align:center; color:#94a3b8; border:2px dashed #e2e8f0; font-weight:600;">📭 Tambahkan lebih banyak transaksi untuk mendapatkan insight.</div>' :
              insights.map(ins => {
                const c = insightColors[ins.type] || insightColors.info;
                return `
                  <div class="insight-message-card" style="background:${c.bg}; border-left:6px solid ${c.tag}; border-radius:24px; padding:24px; display:flex; gap:20px; align-items:flex-start; box-shadow:0 4px 15px rgba(0,0,0,0.02); border-top:1px solid rgba(0,0,0,0.02); border-right:1px solid rgba(0,0,0,0.02); border-bottom:1px solid rgba(0,0,0,0.02);">
                    <span style="font-size:2rem; flex-shrink:0; background:white; padding:12px; border-radius:16px; box-shadow:0 4px 12px rgba(0,0,0,0.04);">${ins.icon}</span>
                    <div style="flex:1;">
                      <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px; flex-wrap:wrap;">
                        <h4 style="font-size:1rem; font-weight:800; color:${c.text};">${ins.title}</h4>
                        <span style="font-size:0.75rem; font-weight:800; background:${c.tag}; color:white; padding:4px 12px; border-radius:8px; white-space:nowrap; letter-spacing:0.5px;">${ins.tag}</span>
                      </div>
                      <p style="font-size:0.9rem; color:${c.text}; opacity:0.9; line-height:1.6; font-weight:500;">${ins.body}</p>
                    </div>
                  </div>
                `;
              }).join('')
            }
          </div>
        </div>
      </div>

      <!-- Daily Expense Timeline -->
      <div style="background:white; padding:24px; border-radius:24px; border:1px solid rgba(0,0,0,0.04); box-shadow:0 2px 16px rgba(0,0,0,0.04); margin-bottom:24px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <div>
            <h3 style="font-size:1rem; font-weight:700; color:#1e293b; margin-bottom:4px;">Kalender Pengeluaran Harian</h3>
            <p style="font-size:0.75rem; color:#94a3b8;">Lihat hari mana kamu paling boros — tingginya bar = makin besar pengeluaran</p>
          </div>
          <button id="btn-export-csv" style="background:#1e293b; color:white; border:none; padding:9px 18px; border-radius:12px; font-size:0.82rem; font-weight:600; cursor:pointer;">↓ Export CSV</button>
        </div>
        <div style="display:flex; align-items:flex-end; gap:4px; height:120px; padding-bottom:8px; border-bottom:1px solid #f1f5f9; overflow-x:auto; padding-top:20px;">
          ${sortedDates.length === 0 ? '<p style="color:#94a3b8; text-align:center; width:100%;">Belum ada data.</p>' :
            (() => {
              // Show last 30 days max to avoid overflow
              const displayDates = sortedDates.slice(-30);
              const maxExp = Math.max(...displayDates.map(d => dayMap[d].expense), 1);
              const labelStep = displayDates.length > 14 ? Math.ceil(displayDates.length / 7) : 1;
              return displayDates.map((d, idx) => {
                const exp = dayMap[d].expense;
                const inc = dayMap[d].income;
                const pct = Math.max(4, (exp / maxExp) * 100);
                const isBorosDay = d === borosDate;
                const showLabel = idx % labelStep === 0 || idx === displayDates.length - 1;
                return `
                  <div style="flex:1; min-width:${displayDates.length > 14 ? '20px' : '28px'}; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; gap:2px; height:100%;" title="${d}: Pengeluaran Rp ${exp.toLocaleString('id-ID')}${inc > 0 ? ` | Pemasukan Rp ${inc.toLocaleString('id-ID')}` : ''}">
                    ${inc > 0 ? `<div style="width:100%; height:4px; background:#d1fae5; border-radius:3px; margin-bottom:2px;"></div>` : ''}
                    <div style="width:100%; height:${pct}%; background:${isBorosDay ? '#ef4444' : '#3b82f6'}; border-radius:4px 4px 0 0; transition:all 0.8s; opacity:${isBorosDay ? '1' : '0.7'}; position:relative;">
                      ${isBorosDay ? `<div style="position:absolute; top:-18px; left:50%; transform:translateX(-50%); font-size:0.55rem; font-weight:700; color:#ef4444; white-space:nowrap;">😱 BOROS</div>` : ''}
                    </div>
                    <span style="font-size:0.5rem; color:${isBorosDay ? '#ef4444' : '#94a3b8'}; font-weight:${isBorosDay ? '700' : '400'}; white-space:nowrap; visibility:${showLabel ? 'visible' : 'hidden'}; min-height:10px;">${d.slice(5)}</span>
                  </div>
                `;
              }).join('');
            })()
          }
        </div>
        <div style="display:flex; gap:16px; margin-top:12px; font-size:0.72rem;">
          <span><span style="display:inline-block; width:10px; height:10px; background:#3b82f6; border-radius:2px; margin-right:4px;"></span>Pengeluaran Normal</span>
          <span><span style="display:inline-block; width:10px; height:10px; background:#ef4444; border-radius:2px; margin-right:4px;"></span>Hari Paling Boros</span>
          <span><span style="display:inline-block; width:10px; height:4px; background:#d1fae5; border-radius:2px; margin-right:4px; vertical-align:middle;"></span>Ada Pemasukan</span>
        </div>
      </div>

      <!-- Transaction Detail Table -->
      <div style="background:white; border-radius:24px; padding:24px; box-shadow:0 2px 16px rgba(0,0,0,0.04); border:1px solid rgba(0,0,0,0.03);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <div>
            <h3 style="font-size:1rem; font-weight:700; color:#1e293b;">Riwayat Transaksi Lengkap</h3>
            <p style="font-size:0.78rem; color:#94a3b8; margin-top:2px;">${txs.length} transaksi tercatat</p>
          </div>
        </div>
        <div style="max-height:400px; overflow-y:auto;" class="custom-scroll">
          <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.88rem;">
            <thead>
              <tr style="border-bottom:2px solid #f1f5f9;">
                <th style="padding:12px 16px; color:#94a3b8; font-weight:600; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px;">Tanggal</th>
                <th style="padding:12px 16px; color:#94a3b8; font-weight:600; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px;">Keterangan</th>
                <th style="padding:12px 16px; color:#94a3b8; font-weight:600; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px;">Kategori</th>
                <th style="padding:12px 16px; color:#94a3b8; font-weight:600; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px; text-align:right;">Nominal</th>
              </tr>
            </thead>
            <tbody>
              ${txs.length === 0 ? `<tr><td colspan="4" style="text-align:center; padding:48px; color:#94a3b8;">📭 Belum ada transaksi. Mulai chat dengan Kas-iQ untuk mencatat.</td></tr>` :
                txs.map(t => `
                  <tr style="border-bottom:1px solid #f8fafc;" onmouseover="this.style.background='#fafbfc'" onmouseout="this.style.background='transparent'">
                    <td style="padding:14px 16px; color:#64748b;">${t.date || '-'}</td>
                    <td style="padding:14px 16px; font-weight:500; color:#1e293b;">${t.title}</td>
                    <td style="padding:14px 16px;">
                      <span style="background:${COLORS[t.category] || '#94a3b8'}15; color:${COLORS[t.category] || '#94a3b8'}; padding:4px 10px; border-radius:8px; font-size:0.75rem; font-weight:600;">${t.category || '-'}</span>
                    </td>
                    <td style="padding:14px 16px; text-align:right; font-weight:800; color:${t.amount > 0 ? '#10b981' : '#ef4444'};">
                      ${t.amount > 0 ? '+' : '−'} Rp ${Math.abs(t.amount).toLocaleString('id-ID')}
                    </td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Data Management Section -->
      <div style="margin-top: 32px; padding: 24px; background: #f8fafc; border-radius: 24px; border: 1.5px dashed #e2e8f0; display: flex; align-items: center; justify-content: space-between; gap: 20px;">
        <div style="flex: 1;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 4px;">Data Management</h4>
          <p style="font-size: 0.78rem; color: #64748b; margin: 0;">Unduh laporan transaksi kamu atau bersihkan riwayat untuk mulai dari awal.</p>
        </div>
        <div style="display: flex; gap: 12px;">
          <button id="btn-export-csv" style="display: flex; align-items: center; gap: 8px; background: white; border: 1.5px solid #e2e8f0; padding: 10px 18px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; color: #1e293b; cursor: pointer; transition: all 0.2s;">
            📥 Export CSV
          </button>
          <button id="btn-clear-all" style="display: flex; align-items: center; gap: 8px; background: #fff1f2; border: 1.5px solid #fecaca; padding: 10px 18px; border-radius: 12px; font-size: 0.85rem; font-weight: 600; color: #dc2626; cursor: pointer; transition: all 0.2s;">
            🗑️ Reset Data
          </button>
        </div>
      </div>
    </div>
  `;

  // ── Export CSV ────────────────────────────────
  // ── Global Filter Logic ───────────────────────
  container.querySelectorAll('.insight-filter-btn').forEach(btn => {
    btn.onclick = () => {
      renderInsight(container, btn.dataset.filter);
    };
  });

  document.getElementById('btn-export-csv')?.addEventListener('click', () => {
    if (txs.length === 0) { alert('Belum ada data untuk diekspor.'); return; }
    const headers = ['Tanggal', 'Keterangan', 'Kategori', 'Nominal'];
    const rows = txs.map(t => [t.date || '', `"${t.title}"`, t.category || '', t.amount]);
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kasiq_transaksi_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('btn-clear-all')?.addEventListener('click', () => {
    if (confirm('⚠️ Hapus semua data keuangan dan riwayat chat? Tindakan ini tidak bisa dibatalkan.')) {
      if (confirm('Yakin 100%?')) {
        localStorage.removeItem('kasiq_finance_data');
        localStorage.removeItem('kasiq_chat_history');
        alert('Data berhasil direset.');
        window.location.reload();
      }
    }
  });
}
