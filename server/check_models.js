const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // Note: The SDK might not have a direct listModels, we use a fetch to the official endpoint
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    console.log('--- MODELS TERSEDIA UNTUK KEY ANDA ---');
    data.models.forEach(m => {
      if (m.supportedGenerationMethods.includes('generateContent')) {
        console.log(`- ${m.name.replace('models/', '')}`);
      }
    });
  } catch (err) {
    console.error('Gagal list models:', err.message);
  }
}

listModels();
