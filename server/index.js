const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ══════════════════════════════════════════════
// 1. DATABASE LAYER (Supabase)
// ══════════════════════════════════════════════
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
let supabase = null;

if (supabaseUrl && supabaseUrl !== 'undefined') {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase connected:', supabaseUrl);
}

// ══════════════════════════════════════════════
// 2. AI ENGINE — Autonomous Financial Agent
// ══════════════════════════════════════════════
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = `
Kamu adalah Kas-iQ, sebuah Autonomous AI Financial Agent.
Bukan sekedar chatbot — kamu adalah sistem yang aktif menganalisis, mencatat, dan memberi insight keuangan.

TUGAS UTAMA:
Analisis setiap pesan user dan kembalikan JSON terstruktur.
Kamu bukan sekedar pencatat — kamu adalah COMPANION yang peduli dengan keuangan user.

ATURAN KLASIFIKASI:
- Pembelian/pengeluaran/biaya → type: "expense"
- Gaji/pemasukan/transfer masuk → type: "income"  
- User minta hapus/batalkan → type: "delete"
- User bertanya tentang saldo/rekap/summary/prediksi → type: "query" (TIDAK simpan ke transaksi)
- Pesan tidak jelas tanpa nominal → needs_confirmation: true
- Pesan tidak terkait keuangan sama sekali → type: "unknown", is_important: false

KONVERSI SHORTHAND:
"k" = ribu, "jt" = juta, "rb" = ribu
Contoh: "20k" = 20000, "1.5jt" = 1500000, "50rb" = 50000

KLASIFIKASI KATEGORI:
Makanan, Transport, Bisnis, Belanja, Hiburan, Kesehatan, Lainnya

ATURAN REPLY (PROFESSIONAL FINANCIAL COMPANION):
- Karakter: Profesional, membantu, sopan, dan terpercaya.
- Gaya Bahasa: Formal, santai tapi tetap beradab (Bahasa Indonesia yang baik).
- FINANCIAL ANALYSIS: Berikan analisis logis berdasarkan [CONTEXT] dan [USER GOAL]. Jika user bertanya saran, berikan pertimbangan pro-kontra secara objektif.
- Untuk type "query": Berikan jawaban mendalam tentang kondisi keuangan user tanpa nada meremehkan.
- Untuk type "expense"/"income": Konfirmasi pencatatan dengan sopan (misal: "Baik, transaksi 'Kopi' sebesar Rp 20.000 telah berhasil saya catat ke kategori Makanan.").
- KHUSUS SCAN STRUK: Ekstrak Nama Toko + Detail Item di "raw_text".

JSON SCHEMA WAJIB:
{
  "is_important": boolean,
  "type": "income" | "expense" | "delete" | "query" | "unknown",
  "amount": number | null,
  "category": "Makanan" | "Transport" | "Bisnis" | "Belanja" | "Hiburan" | "Kesehatan" | "Lainnya",
  "intent": "personal" | "business" | "unknown",
  "confidence": number,
  "needs_confirmation": boolean,
  "question": string | null,
  "options": string[] | null,
  "raw_text": string,
  "reply": string,
  "proactive_action": string | null,
  "proactive_options": string[] | null
}

PROACTIVE ACTION RULES:
- Jika type === "income" dan amount > 0 → isi proactive_action: "Wah, ada uang masuk! 🥳 Mau aku bantu sisihkan 20% (Rp " + (amount * 0.2).toLocaleString('id-ID') + ") untuk tabungan kamu?", isi proactive_options: ["Boleh, sisihkan 20%", "Jangan dulu"]
- Jika expense kategori Makanan dan amount > 30000 → isi proactive_action: "Pengeluaran makanan cukup besar. Catat sebagai makan bisnis atau pribadi?"
- Jika amount > 500000 → isi proactive_action: "Pengeluaran besar terdeteksi. Ingin saya buat catatan khusus?"
- Jika tidak ada trigger → proactive_action: null
`;

const model = genAI.getGenerativeModel({
  model: "gemini-flash-latest",
  systemInstruction,
  generationConfig: {
    responseMimeType: "application/json"
  }
});

// ══════════════════════════════════════════════
// 3. INTELLIGENCE PIPELINE
// ══════════════════════════════════════════════
app.post('/api/chat', async (req, res) => {
  console.log(`\n📩 Incoming request: "${req.body.message}"`);
  try {
    const { message, context, image_base64, mime_type } = req.body;

    // PRE-FILTER — Hemat token, skip pesan tidak relevan (kecuali ada gambar)
    const financialHint = /\d|rp|ribu|rb|juta|jt|k\b|beli|bayar|gaji|transfer|uang|catat|hapus|reset|batal|harga|ongkir|cicil|tabung|hutang|piutang|modal|laba|rugi|pengeluaran|pemasukan|saldo|nota|struk|kwitansi|cek|berapa|sisa|rekap|ringkasan|total|minggu|bulan/i;
    const isAiConfirmation = message.includes('User memilih:') || message.includes('— jawaban:');

    if (!image_base64 && (!financialHint.test(message) || isAiConfirmation)) {
      if (supabase) {
        await supabase.from('raw_messages').insert([{ text: message }]);
      }

      const reply = isAiConfirmation
        ? `Siap! Pilihan <strong>${message.split(':').pop().trim()}</strong> sudah saya catat sebagai preferensi konteks kamu. ✨`
        : "Halo! 👋 Saya <strong>Kas-iQ</strong>, autonomous financial agent kamu. Coba kirim foto struk, atau ketik: <strong>beli kopi 15k</strong>.";

      return res.json({
        reply,
        status: isAiConfirmation ? "replied" : "non_financial"
      });
    }

    // Simpan raw message (non-blocking)
    if (supabase) {
      supabase.from('raw_messages').insert([{ text: message || '[IMAGE ATTACHED]' }]).then(() => { }).catch(e => console.error(e));
    }

    // Injeksi konteks keuangan ke prompt
    let finalPrompt = message || "Tolong ekstrak total bayar dan nama toko dari struk ini. Catat sebagai pengeluaran.";
    const userGoal = context?.goal ? `[USER GOAL: Menabung untuk "${context.goal.name}" dengan target Rp ${context.goal.target.toLocaleString('id-ID')}]` : "[USER GOAL: Belum ada target spesifik]";

    if (context) {
      finalPrompt = `
[FINANCIAL CONTEXT]
Saldo saat ini: Rp ${(context.balance || 0).toLocaleString('id-ID')}
Total transaksi: ${(context.recent_transactions || []).length}
${userGoal}
5 Transaksi Terakhir: ${JSON.stringify(context.recent_transactions || [])}
[/FINANCIAL CONTEXT]

Pesan User: "${message || 'Tolong catat transaksi dari gambar ini'}"

INSTRUKSI TAMBAHAN:
- Jika user bertanya tentang saran belanja/saldo, hubungkan dengan [USER GOAL] mereka jika ada.
- Berikan motivasi jika mereka semakin dekat dengan target tabungannya.
      `;
    }

    // Siapkan konten untuk Gemini
    const contents = [];
    if (image_base64) {
      contents.push({
        inlineData: {
          data: image_base64,
          mimeType: mime_type || "image/jpeg"
        }
      });
    }
    contents.push(finalPrompt);

    // Panggil AI
    let result;
    try {
      result = await model.generateContent(contents);
    } catch (apiError) {
      console.error('🔥 GEMINI API ERROR:', apiError.message);
      if (apiError.message.includes('429') || apiError.message.includes('quota')) {
        return res.json({
          reply: "⚠️ **Kuota AI Habis (Limit 429)**\n\nMaaf banget, sepertinya batas penggunaan gratis Gemini API kamu sudah tercapai untuk hari ini. \n\n**Solusi:**\n1. Tunggu beberapa saat (biasanya reset tiap jam/hari).\n2. Ganti `GEMINI_API_KEY` di file `.env` dengan key baru.\n\nServer tetap jalan kok, cuma otaknya lagi istirahat sebentar! ☕",
          status: "quota_exceeded"
        });
      }
      throw apiError;
    }
    const responseText = result.response.text();

    let aiData;
    try {
      aiData = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('JSON Parse Error:', responseText.substring(0, 200));
      return res.json({
        reply: "Maaf, ada kendala teknis dalam membaca data. Coba ulangi ya!",
        status: "error"
      });
    }

    // CONFIRMATION FLOW
    if (aiData.needs_confirmation) {
      return res.json({
        reply: aiData.question || aiData.reply,
        options: aiData.options || ["Pribadi", "Bisnis", "Bukan Transaksi"],
        status: "needs_confirmation",
        intelligence: aiData
      });
    }

    // QUERY TYPE — Jawab langsung, tidak simpan transaksi
    if (aiData.type === 'query' || aiData.type === 'unknown') {
      return res.json({
        reply: aiData.reply,
        status: "replied",
        intelligence: aiData
      });
    }

    // VALIDATION LAYER
    let transactionStatus = 'processed';
    const validTypes = ['income', 'expense'];
    const isValidTransaction =
      aiData.is_important &&
      validTypes.includes(aiData.type) &&
      typeof aiData.amount === 'number' &&
      aiData.amount > 0 &&
      aiData.confidence >= 0.7;

    // HANDLE DELETE
    if (aiData.type === 'delete') {
      if (supabase) {
        const { data: last } = await supabase
          .from('transactions')
          .select('id')
          .order('created_at', { ascending: false })
          .limit(1);

        if (last && last.length > 0) {
          const { error: delErr } = await supabase
            .from('transactions')
            .delete()
            .eq('id', last[0].id);

          if (!delErr) {
            transactionStatus = 'deleted';
            console.log('🗑️ Transaction deleted.');
          }
        }
      }
    }
    // HANDLE VALID TRANSACTION
    else if (isValidTransaction) {
      if (supabase) {
        const { error } = await supabase.from('transactions').insert([{
          title: aiData.raw_text || message,
          amount: aiData.type === 'expense' ? -aiData.amount : aiData.amount,
          category: aiData.category,
          intent: aiData.intent,
          metadata: aiData
        }]);

        if (!error) {
          transactionStatus = 'stored';
          console.log(`💰 Stored: [${aiData.type}] ${aiData.raw_text} → ${aiData.category} (${aiData.amount}) | Confidence: ${aiData.confidence}`);
        } else {
          console.error('DB Insert Error:', error.message);
        }
      } else {
        // Supabase tidak ada, tetap tandai stored untuk local sync
        transactionStatus = 'stored';
      }
    } else {
      console.log(`⚠️ Skipped (${!aiData.is_important ? 'not important' :
          !validTypes.includes(aiData.type) ? `type: ${aiData.type}` :
            aiData.amount <= 0 ? 'amount <= 0' :
              `confidence: ${aiData.confidence}`
        })`);
    }

    // RETURN RESPONSE
    res.json({
      reply: aiData.reply,
      intelligence: aiData,
      status: transactionStatus,
      // Phase 7: Proactive action data
      proactive_action: transactionStatus === 'stored' ? aiData.proactive_action : null,
      proactive_options: transactionStatus === 'stored' ? aiData.proactive_options : null
    });

  } catch (error) {
    console.error('🔥 PIPELINE ERROR:', error.message);
    res.status(500).json({
      error: 'Sistem Kas-iQ mengalami gangguan.',
      details: error.message
    });
  }
});

// GET /api/transactions — untuk sinkronisasi dashboard
app.get('/api/transactions', async (req, res) => {
  if (!supabase) return res.json({ data: [] });
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json({ data: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ---------------------------------------------------
// Endpoint: Generate detailed chart using Matplotlib (Python)
// ---------------------------------------------------
app.post('/api/chart', express.json({ limit: '2mb' }), async (req, res) => {
  try {
    const { pastData, futureData, goal } = req.body; // arrays of {date, balance}
    const { spawn } = require('child_process');
    const py = spawn('python', ['python/plot_balance.py']);
    // Kirim data JSON ke script Python via stdin
    py.stdin.write(JSON.stringify({ pastData, futureData, goal }));
    py.stdin.end();

    const chunks = [];
    py.stdout.on('data', data => chunks.push(data));
    py.stderr.on('data', err => console.error('Python error:', err.toString()));
    py.on('close', code => {
      if (code === 0) {
        const imgBuffer = Buffer.concat(chunks);
        res.set('Content-Type', 'image/png');
        res.send(imgBuffer);
      } else {
        console.error('Python script exited with code', code);
        res.status(500).json({ error: 'Failed to generate chart' });
      }
    });
  } catch (e) {
    console.error('Chart endpoint error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`🚀 Kas-iQ Autonomous Financial Agent | Port ${port}`);
  console.log(`📊 Pipeline: Pre-Filter → Gemini AI → Validation → Supabase`);
  console.log(`🤖 Mode: Autonomous (query + proactive actions enabled)`);
});
