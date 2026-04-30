require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function seed() {
  console.log('🌱 Seeding 7 days of dummy data to Supabase...');
  
  const transactions = [];
  const categories = ['Makanan', 'Transport', 'Belanja'];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    
    // Income
    transactions.push({
      title: 'Pemasukan Harian',
      amount: Math.floor(Math.random() * 500000) + 1000000,
      category: 'Bisnis',
      intent: 'income',
      created_at: new Date(d.getTime() + 3600000).toISOString(),
      metadata: { date: dateStr }
    });
    
    // Expenses
    const numExp = Math.floor(Math.random() * 3) + 1;
    for(let j=0; j<numExp; j++) {
      transactions.push({
        title: 'Pengeluaran Dummy',
        amount: -(Math.floor(Math.random() * 200000) + 50000),
        category: categories[Math.floor(Math.random() * categories.length)],
        intent: 'expense',
        created_at: new Date(d.getTime() + 7200000 + j*10000).toISOString(),
        metadata: { date: dateStr }
      });
    }
  }

  const { error } = await supabase.from('transactions').insert(transactions);
  if (error) {
    console.error('Error seeding Supabase:', error);
  } else {
    console.log(`✅ Successfully seeded ${transactions.length} transactions into Supabase!`);
  }
}

seed();
