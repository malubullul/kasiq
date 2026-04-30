
export function renderWelcome(container) {
  container.innerHTML = `
    <div class="welcome-screen fusion-edition light-theme">
      <!-- Background Elements -->
      <div class="light-ray ray-1"></div>
      <div class="light-ray ray-2"></div>
      <div class="bg-glow"></div>

      <!-- Floating Glass Nav -->
      <nav class="fusion-nav">
        <div class="nav-content">
          <div class="nav-logo">
            <span class="logo-icon">💠</span> Kas-iQ
          </div>
          <div class="nav-links-desktop">
            <a href="#dashboard">Dashboard</a>
            <a href="#chat">AI Agent</a>
            <a href="#insight">Analisis</a>
          </div>
          <div class="nav-actions">
             <button id="btn-get-started" class="btn-fusion-primary">Mulai Sekarang — Gratis</button>
          </div>
        </div>
      </nav>

      <main class="fusion-main">
        <!-- Hero Section -->
        <section class="fusion-hero">
          <div class="hero-tag">🚀 Revolusi Manajemen Keuangan Pribadi</div>
          <h1 class="hero-title">
            Kelola uangmu <br>
            <span class="gradient-text-fusion">dengan Kecerdasan AI.</span>
          </h1>
          <p class="hero-subtitle">
            Kas-iQ adalah agen finansial proaktif yang mengkategorikan transaksi, mengatur target, dan menumbuhkan asetmu secara otonom.
          </p>
          <div class="hero-btns">
            <button class="btn-fusion-primary-large" onclick="window.location.hash='dashboard'">Mulai Otomatisasi</button>
            <button class="btn-fusion-secondary" onclick="document.querySelector('.bento-section').scrollIntoView({behavior:'smooth'})">Lihat Fitur</button>
          </div>
        </section>

        <!-- Bento Section with Mini Previews -->
        <section class="bento-section">
          <div class="bento-grid-fusion">
            
            <!-- Large Card: AI Agent -->
            <div class="bento-card-fusion bento-span-2 reveal">
              <div class="bento-card-content">
                <span class="card-badge">AI Percakapan</span>
                <h3>Aksi Finansial Berbasis Chat</h3>
                <p>Kirim pesan seperti "Beli nasi ayam 12rb" dan biarkan AI kami melakukan pencatatan secara ajaib.</p>
              </div>
              <div class="mini-ui-chat-container">
                <img src="/ai_head.png" alt="AI Agent" class="card-img-ai floating">
                <div class="mini-ui-chat">
                  <div class="chat-bubble user">Beli kopi 25rb</div>
                  <div class="chat-bubble ai">
                    <div class="ai-status">✨ Terdeteksi: <strong>Makanan</strong></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Small Card: Analytics -->
            <div class="bento-card-fusion reveal">
              <div class="bento-card-content">
                <h3>Analisis Real-time</h3>
                <p>Visualisasi saldo yang selalu mutakhir.</p>
              </div>
              <div class="mini-ui-graph">
                <div class="graph-bar" style="height:40%"></div>
                <div class="graph-bar" style="height:70%"></div>
                <div class="graph-bar highlight" style="height:90%"></div>
              </div>
            </div>

            <!-- Small Card: Growth -->
            <div class="bento-card-fusion reveal">
              <div class="bento-card-content">
                <h3>Pertumbuhan Otonom</h3>
                <p>Saran cerdas AI untuk asetmu.</p>
              </div>
              <img src="/growth_plant.png" alt="Growth" class="card-img-sphere floating">
            </div>

            <!-- Wide Card: Automation -->
            <div class="bento-card-fusion bento-span-2 reveal">
              <div class="bento-card-content">
                <span class="card-badge">Otomatisasi</span>
                <h3>Otomatisasi Alur Keuangan</h3>
                <p>Integrasi cerdas pencatatan dan analisis dalam satu sistem otonom.</p>
              </div>
              <div class="mini-ui-workflow-container">
                 <img src="/automation_gears.png" alt="Automation" class="card-img-gears floating">
                 <div class="mini-ui-workflow">
                  <div class="wf-node">Input</div>
                  <div class="wf-line"></div>
                  <div class="wf-node active">AI Logic</div>
                  <div class="wf-line"></div>
                  <div class="wf-node">Hasil</div>
                </div>
              </div>
            </div>

          </div>
        </section>

        <!-- Premium Footer CTA -->
        <section class="fusion-footer-cta reveal">
          <h2 class="cta-title">Bangun sistem keuanganmu <br> bersama Kas-iQ sekarang.</h2>
          <button class="btn-fusion-primary-xl" onclick="window.location.hash='dashboard'">Mulai Sekarang</button>
        </section>

      </main>

      <footer class="fusion-footer">
        <p>© 2026 Tim Kas-iQ • Masa Depan Manajemen Keuangan</p>
      </footer>
    </div>
  `;

  // Animation logic
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.1 });

  container.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  document.getElementById('btn-get-started').onclick = () => {
    window.location.hash = 'dashboard';
  };
}
