import './chat.css'

export function renderChat(container) {
  const STORAGE_KEY = 'kasiq_chat_history';
  const FINANCE_KEY = 'kasiq_finance_data';

  // ── Helpers ────────────────────────────────────
  const getTodayKey = () => new Date().toISOString().split('T')[0];

  function formatDateLabel(dateKey) {
    const today = getTodayKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateKey === today) return 'Hari Ini';
    if (dateKey === yesterday) return 'Kemarin';
    return new Date(dateKey).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  }

  function getAllHistory() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  }

  function saveMessage(role, content, meta = {}) {
    const history = getAllHistory();
    const today = getTodayKey();
    if (!history[today]) history[today] = [];
    history[today].push({ role, content, meta, ts: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }

  // ── HTML Structure ─────────────────────────────
  container.innerHTML = `
    <div class="chat-layout">
      <!-- Session Sidebar -->
      <div class="session-sidebar" id="session-sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">Riwayat</span>
          <button class="sidebar-close-btn" id="sidebar-close-btn">✕</button>
        </div>
        <div class="session-list" id="session-list"></div>
      </div>

      <!-- Main Chat -->
      <div class="chat-main">
        <div class="chat-topbar">
          <button class="topbar-btn" id="toggle-sidebar-btn" title="Riwayat Chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div class="topbar-identity">
            <span class="topbar-name">Kas-iQ</span>
            <span class="topbar-status"><span class="status-dot"></span>Autonomous Mode</span>
          </div>
        </div>

        <div class="chat-messages" id="chat-messages">
          <div class="chat-messages-inner" id="chat-messages-inner">
            <!-- Empty state / messages will be injected here -->
          </div>
        </div>

        <div class="chat-input-area">
          <div class="chat-input-inner">
            <div class="action-menu" id="action-menu">
              <button type="button" class="action-menu-item" id="btn-camera">📷 Foto Struk</button>
              <button type="button" class="action-menu-item" id="btn-gallery">🖼️ Galeri</button>
            </div>
            <div class="microcopy">Tanya atau catat keuanganmu — Kas-iQ yang urus ✨</div>
            <form class="chat-form" id="chat-form">
              <input type="file" id="camera-input" accept="image/*" capture="environment" class="hidden-inputs" />
              <input type="file" id="gallery-input" accept="image/*, .pdf" class="hidden-inputs" />
              <div id="normal-ui" style="display: flex; align-items: center; width: 100%; gap: 12px;">
                <button type="button" class="icon-btn" id="toggle-action-btn">＋</button>
                <button type="button" class="icon-btn" id="start-record-btn" title="Voice Note">🎙️</button>
                <input type="text" id="chat-input" placeholder="Ketik pengeluaran atau tanya keuanganmu..." autocomplete="off" />
                <button type="submit" class="btn-primary send-btn" id="send-text-btn">Kirim</button>
              </div>
              <div id="recording-ui" class="recording-ui" style="display: none;">
                <div class="recording-waves"><div class="wave"></div><div class="wave"></div><div class="wave"></div></div>
                <div class="recording-time" id="recording-time">00:00</div>
                <button type="button" class="btn-primary send-btn" id="send-record-btn" style="background: var(--success);">Selesai</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Immersive Voice Overlay -->
    <div class="voice-overlay" id="voice-overlay">
      <div class="voice-mic-circle">🎙️</div>
      <div class="voice-status">Mendengarkan...</div>
      <div class="voice-transcript-preview" id="voice-preview">"Ucapkan pengeluaranmu..."</div>
      <div class="voice-waves">
        <div class="voice-wave"></div>
        <div class="voice-wave"></div>
        <div class="voice-wave"></div>
        <div class="voice-wave"></div>
        <div class="voice-wave"></div>
      </div>
    </div>
  `;

  // ── DOM References ─────────────────────────────
  const messagesEl = document.getElementById('chat-messages-inner');
  const chatMessagesWrapper = document.getElementById('chat-messages'); // Keep reference for scrolling if needed
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
  const sidebar = document.getElementById('session-sidebar');
  const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
  const sessionList = document.getElementById('session-list');
  const toggleActionBtn = document.getElementById('toggle-action-btn');
  const actionMenu = document.getElementById('action-menu');
  const normalUi = document.getElementById('normal-ui');
  const recordingUi = document.getElementById('recording-ui');
  const startRecordBtn = document.getElementById('start-record-btn');
  const sendRecordBtn = document.getElementById('send-record-btn');
  const voiceOverlay = document.getElementById('voice-overlay');
  const voicePreview = document.getElementById('voice-preview');

  let activeSession = getTodayKey();

  // ── Session Sidebar ────────────────────────────
  function renderSidebar() {
    const history = getAllHistory();
    const keys = Object.keys(history).sort((a, b) => b.localeCompare(a));
    sessionList.innerHTML = '';

    if (keys.length === 0) {
      sessionList.innerHTML = '<p class="sidebar-empty">Belum ada riwayat.</p>';
      return;
    }

    keys.forEach(key => {
      const msgs = history[key];
      const preview = msgs.find(m => m.role === 'user')?.content || 'Sesi tanpa pesan';
      const item = document.createElement('div');
      item.className = `session-item ${key === activeSession ? 'active' : ''}`;
      item.innerHTML = `
        <div class="session-date">${formatDateLabel(key)}</div>
        <div class="session-preview">${preview.substring(0, 40)}${preview.length > 40 ? '...' : ''}</div>
      `;
      item.onclick = () => {
        activeSession = key;
        loadSession(key);
        renderSidebar();
        sidebar.classList.remove('open');
      };
      sessionList.appendChild(item);
    });
  }

  function loadSession(dateKey) {
    const history = getAllHistory();
    const msgs = history[dateKey] || [];
    messagesEl.innerHTML = '';

    if (msgs.length === 0) {
      renderEmptyState();
      return;
    }

    msgs.forEach(m => addMessage(m.content || m.text, m.role, false));
  }

  // ── Empty State (Phase 8: Onboarding) ─────────
  function renderEmptyState() {
    const financeData = JSON.parse(localStorage.getItem(FINANCE_KEY) || '{"transactions":[]}');
    const isFirstTime = financeData.transactions.length === 0;

    messagesEl.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-ai-avatar">🤖</div>
        <h3>${isFirstTime ? 'Selamat datang di Kas-iQ!' : 'Chat Baru'}</h3>
        <p>${isFirstTime
        ? 'Saya adalah <strong>Autonomous Financial Agent</strong> kamu. Saya akan mencatat, menganalisis, dan memberi insight keuanganmu secara otomatis.'
        : 'Ceritakan transaksimu hari ini, atau tanya apa pun tentang keuanganmu.'
      }</p>
        <div class="example-prompts">
          <button class="prompt-chip" data-prompt="beli kopi 25k">☕ beli kopi 25k</button>
          <button class="prompt-chip" data-prompt="gaji masuk 3jt">💰 gaji masuk 3jt</button>
          <button class="prompt-chip" data-prompt="berapa saldoku sekarang?">📊 berapa saldo?</button>
          <button class="prompt-chip" data-prompt="hapus transaksi terakhir">🗑️ hapus terakhir</button>
        </div>
      </div>
    `;

    messagesEl.querySelectorAll('.prompt-chip').forEach(chip => {
      chip.onclick = () => {
        const prompt = chip.dataset.prompt;
        addMessage(prompt, 'user');
        getAIResponse(prompt);
      };
    });
  }

  // ── Message Renderer ───────────────────────────
  function addMessage(content, role, shouldSave = true, imageUrl = null) {
    // Remove empty state if still showing
    const emptyState = messagesEl.querySelector('.empty-state-card');
    if (emptyState) emptyState.remove();

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    const avatarHtml = role === 'ai'
      ? `<div class="avatar"><img src="/kas_iq_avatar.png" alt="Kas-iQ" /></div>`
      : '';

    let imageHtml = '';
    if (imageUrl) {
      imageHtml = `<img src="${imageUrl}" style="max-width:200px; border-radius:12px; margin-bottom:8px; display:block;" />`;
    }

    msgDiv.innerHTML = `${avatarHtml}<div class="bubble">${imageHtml}${content}</div>`;
    messagesEl.appendChild(msgDiv);
    chatMessagesWrapper.scrollTop = chatMessagesWrapper.scrollHeight;

    if (shouldSave) {
      saveMessage(role, content, { imageUrl });
    }
  }

  // ── Typing Indicator ───────────────────────────
  function showTyping() {
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.className = 'message ai'; div.id = id;
    div.innerHTML = `
      <div class="avatar"><img src="/kas_iq_avatar.png" /></div>
      <div class="bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>
    `;
    messagesEl.appendChild(div);
    chatMessagesWrapper.scrollTop = chatMessagesWrapper.scrollHeight;
    return id;
  }

  // ── Confirmation Buttons ───────────────────────
  function renderConfirmationButtons(options, intelligence) {
    const btnContainer = document.createElement('div');
    btnContainer.className = 'message ai confirm-message';
    btnContainer.innerHTML = `
      <div class="avatar"><img src="/kas_iq_avatar.png" /></div>
      <div class="bubble confirm-bubble">
        ${options.map(opt => `<button class="confirm-btn" data-option="${opt}">${opt}</button>`).join('')}
      </div>
    `;
    messagesEl.appendChild(btnContainer);
    chatMessagesWrapper.scrollTop = chatMessagesWrapper.scrollHeight;

    btnContainer.querySelectorAll('.confirm-btn').forEach(btn => {
      btn.onclick = () => {
        const selected = btn.dataset.option;
        btnContainer.remove();
        addMessage(selected, 'user');
        getAIResponse(`${intelligence?.raw_text || ''} — jawaban: ${selected}`);
      };
    });
  }

  // ── Proactive Action Card (Phase 7) ───────────
  function renderProactiveAction(action, options) {
    if (!action) return;
    const card = document.createElement('div');
    card.className = 'message ai';
    const opts = options || ['Aktifkan', 'Abaikan'];
    card.innerHTML = `
      <div class="avatar"><img src="/kas_iq_avatar.png" /></div>
      <div class="bubble proactive-card">
        <div class="proactive-icon">🤖</div>
        <p class="proactive-text">${action}</p>
        <div class="proactive-actions">
          ${opts.map(o => `<button class="proactive-btn" data-action="${o}">${o}</button>`).join('')}
        </div>
      </div>
    `;
    messagesEl.appendChild(card);
    chatMessagesWrapper.scrollTop = chatMessagesWrapper.scrollHeight;

    card.querySelectorAll('.proactive-btn').forEach(btn => {
      btn.onclick = () => {
        const selected = btn.dataset.action;
        card.remove();

        if (selected.includes('Boleh, sisihkan 20%')) {
          addMessage(selected, 'user');
          // Logic Autonomous: Alokasi MANUAL atas kemauan user
          const fd = JSON.parse(localStorage.getItem(FINANCE_KEY) || '{"balance":0,"transactions":[]}');
          const lastTx = fd.transactions[0];
          if (lastTx && lastTx.amount > 0) {
            const amountToSave = lastTx.amount * 0.2;
            const newTx = {
              id: Date.now(),
              title: `Alokasi ke Target Tabungan (20% dari ${lastTx.title})`,
              amount: -amountToSave, // Dipindahkan dari saldo belanja ke tabungan
              category: 'Tabungan', // Kategori khusus untuk progres dashboard
              icon: '🎯',
              date: getTodayKey(),
              type: 'AI Manual Allocation'
            };
            fd.transactions = [newTx, ...fd.transactions];
            fd.balance -= amountToSave;
            localStorage.setItem(FINANCE_KEY, JSON.stringify(fd));

            addMessage(`Siap! Rp ${amountToSave.toLocaleString('id-ID')} berhasil dialokasikan ke target tabunganmu. Progres di Dashboard otomatis terupdate! 🏆`, 'ai');
          }
        } else if (selected !== 'Abaikan' && selected !== 'Jangan dulu') {
          addMessage(selected, 'user');
          getAIResponse(`User memilih: ${selected} untuk aksi: ${action}`);
        }
      };
    });
  }

  // ── Finance Sync ───────────────────────────────
  function syncWithIntelligence(aiData, status) {
    const fd = JSON.parse(localStorage.getItem(FINANCE_KEY) || '{"balance":0,"transactions":[]}');
    let { transactions = [], balance = 0 } = fd;

    if (status === 'deleted') {
      if (transactions.length > 0) {
        const deleted = transactions.shift();
        // deleted.amount is already signed (+income, -expense), so reverse it
        balance -= deleted.amount;
      }
    } else if (status === 'stored') {
      const amount = aiData.type === 'expense' ? -aiData.amount : aiData.amount;
      const newTx = {
        id: Date.now(),
        title: aiData.raw_text || 'Transaksi',
        amount,
        category: aiData.category || 'Lainnya',
        icon: aiData.type === 'expense' ? '💸' : '💰',
        date: getTodayKey(),
        type: 'AI Intelligence',
        confidence: aiData.confidence,
        intent: aiData.intent
      };
      transactions = [newTx, ...transactions];
      balance += amount;
    }

    if (window.updateFinanceData) {
      window.updateFinanceData({ balance, transactions });
    } else {
      localStorage.setItem(FINANCE_KEY, JSON.stringify({ balance, transactions }));
    }

    // AI Memory: Check habits after storing
    if (status === 'stored' && aiData.category) {
      const catCount = transactions.filter(t => t.category === aiData.category && t.amount < 0).length;
      if (catCount >= 3) {
        setTimeout(() => {
          const memoryCard = document.createElement('div');
          memoryCard.className = 'message ai';
          memoryCard.innerHTML = `
            <div class="avatar"><img src="/kas_iq_avatar.png" /></div>
            <div class="bubble proactive-card" style="background: linear-gradient(135deg, #eff6ff, #dbeafe) !important; border: 1px solid #bfdbfe !important;">
              <div class="proactive-icon">🧠</div>
              <p class="proactive-text" style="color: #1e3a8a !important;">Kas-iQ ingat: Kamu sering belanja di kategori <strong>${aiData.category}</strong> (${catCount}x). ${catCount >= 5 ? 'Hati-hati overspending!' : 'Mulai pantau budget-mu!'}</p>
            </div>
          `;
          messagesEl.appendChild(memoryCard);
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }, 1500);
      }
    }
  }

  // ── AI Request ─────────────────────────────────
  async function getAIResponse(userMessage, imagePayload = null) {
    const typingId = showTyping();

    try {
      const fd = JSON.parse(localStorage.getItem(FINANCE_KEY) || '{"balance":0,"transactions":[]}');
      const settings = JSON.parse(localStorage.getItem('kasiq_settings') || '{}');
      
      const body = {
        message: userMessage,
        context: {
          balance: fd.balance || 0,
          recent_transactions: (fd.transactions || []).slice(0, 5),
          goal: settings.goal || null
        }
      };

      if (imagePayload) {
        body.image_base64 = imagePayload.base64;
        body.mime_type = imagePayload.mimeType;
      }

      // Try to reach the local server
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      document.getElementById(typingId)?.remove();

      if (response.ok) {
        const data = await response.json();
        addMessage(data.reply, 'ai');

        if (data.status === 'stored' || data.status === 'deleted') {
          syncWithIntelligence(data.intelligence, data.status);
          if (data.proactive_action) {
            setTimeout(() => renderProactiveAction(data.proactive_action, data.proactive_options), 800);
          }
        }
      } else {
        throw new Error('Server issues');
      }

    } catch (err) {
      // ── VERCEL FALLBACK: Client-Side Intelligence ──
      document.getElementById(typingId)?.remove();
      console.warn('Backend offline, using Client-Side Intelligence...');

      const text = userMessage.toLowerCase();
      let amount = 0;
      
      // Regex Cerdas: Tangkap angka dan huruf 'k' (misal: 25k, 1jt, 1.000.000)
      const kMatch = text.match(/(\d+)\s*k/i);
      const jtMatch = text.match(/(\d+)\s*jt/i);
      const normalMatch = text.match(/(\d+[\d\.]*)/);

      if (kMatch) amount = parseInt(kMatch[1]) * 1000;
      else if (jtMatch) amount = parseInt(jtMatch[1]) * 1000000;
      else if (normalMatch) amount = parseInt(normalMatch[1].replace(/\./g, ''));

      const isIncome = text.includes('gaji') || text.includes('masuk') || text.includes('dapat') || text.includes('bonus');
      
      if (amount > 0) {
        // Simulasi data intelijen untuk syncWithIntelligence
        const mockIntelligence = {
          raw_text: userMessage,
          amount: amount,
          type: isIncome ? 'income' : 'expense',
          category: text.includes('makan') ? 'Makanan' : text.includes('kopi') ? 'Makanan' : text.includes('baju') ? 'Belanja' : 'Lainnya',
          confidence: 0.95,
          intent: isIncome ? 'track_income' : 'track_expense'
        };

        syncWithIntelligence(mockIntelligence, 'stored');
        addMessage(`✅ **Kas-iQ Intelligence (Local)**: Berhasil mencatat "${userMessage}" senilai Rp ${amount.toLocaleString('id-ID')}. (Tersimpan di Cloud Lokal)`, 'ai');
      } else {
        addMessage("Maaf, server sedang sibuk. Tapi saya bisa bantu catat pengeluaranmu secara langsung! Coba ketik: **'beli kopi 25k'** atau **'makan 35.000'**.", 'ai');
      }
    }
  }

  // ── Event Listeners ────────────────────────────
  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    input.value = '';
    getAIResponse(text);
  });

  toggleSidebarBtn.onclick = () => { renderSidebar(); sidebar.classList.toggle('open'); };
  sidebarCloseBtn.onclick = () => sidebar.classList.remove('open');
  toggleActionBtn.onclick = e => { e.stopPropagation(); actionMenu.classList.toggle('active'); };
  document.onclick = () => actionMenu.classList.remove('active');

  // -- Image Handling --
  const cameraInput = document.getElementById('camera-input');
  const galleryInput = document.getElementById('gallery-input');

  document.getElementById('btn-camera').onclick = () => { actionMenu.classList.remove('active'); cameraInput.click(); };
  document.getElementById('btn-gallery').onclick = () => { actionMenu.classList.remove('active'); galleryInput.click(); };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const base64 = dataUrl.split(',')[1];
      const mimeType = file.type;

      addMessage('Menganalisis struk/gambar ini...', 'user', true, dataUrl);
      getAIResponse('Tolong catat transaksi dari gambar ini.', { base64, mimeType });
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // reset
  };

  cameraInput.addEventListener('change', handleFileSelect);
  galleryInput.addEventListener('change', handleFileSelect);

  // -- Voice Note Handling --
  let recognition = null;
  let finalTranscript = '';
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'id-ID';

    recognition.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      input.value = finalTranscript + interim;
      if (voicePreview) {
        voicePreview.innerText = `"${finalTranscript + interim}"`;
      }
    };

    recognition.onerror = (e) => console.error('Speech error:', e.error);
    recognition.onend = () => {
      startRecordBtn.classList.remove('recording-pulse');
      startRecordBtn.style.color = '';
      if (finalTranscript.trim()) {
        addMessage(finalTranscript, 'user');
        getAIResponse(finalTranscript);
        input.value = '';
        finalTranscript = '';
      }
    };
  }

  startRecordBtn.onclick = () => {
    if (!recognition) {
      alert('Maaf, browser Anda tidak mendukung Voice Note.');
      return;
    }
    if (startRecordBtn.classList.contains('recording-pulse')) {
      recognition.stop();
      startRecordBtn.classList.remove('recording-pulse');
      startRecordBtn.style.color = '';
      voiceOverlay.classList.remove('active');
    } else {
      finalTranscript = '';
      input.value = '';
      voicePreview.innerText = '"Ucapkan pengeluaranmu..."';
      recognition.start();
      startRecordBtn.classList.add('recording-pulse');
      startRecordBtn.style.color = '#ef4444';
      voiceOverlay.classList.add('active');
      input.placeholder = 'Mendengarkan... (Klik mic untuk berhenti)';
    }
  };

  // ── Init ───────────────────────────────────────
  const history = getAllHistory();
  const today = getTodayKey();
  const todayMsgs = history[today] || [];
  if (todayMsgs.length > 0) {
    todayMsgs.forEach(m => addMessage(m.content || m.text, m.role, false, m.meta?.imageUrl));
  } else {
    renderEmptyState();
  }
}
