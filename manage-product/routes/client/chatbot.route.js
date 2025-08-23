const express = require('express');
const router = express.Router();
const axios = require('axios');
const chatbotController = require('../../controllers/api/chatbot.controller');

// API chatbot hỏi Gemini và Qdrant
router.post('/ask', chatbotController.ask);

// Qdrant config
const QDRANT_URL = "https://17287bcd-e993-4bf8-b129-b587d76d47c8.eu-central-1-0.aws.cloud.qdrant.io";
const QDRANT_COLLECTION = "chatbot_vectors";
const QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.LWyQxpLjxPQoQITJfMW78hirBFKsYbuvPJjZ-RNE22I";

// Tìm kiếm vector gần nhất
router.post('/qdrant/search', async (req, res) => {
  const { vector, limit = 3 } = req.body;
  if (!Array.isArray(vector) || !vector.length) {
    return res.status(400).json({ error: 'Missing vector' });
  }
  try {
    const qres = await axios.post(
      `${QDRANT_URL}/collections/${QDRANT_COLLECTION}/points/search`,
      { vector, limit },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': QDRANT_API_KEY
        }
      }
    );
    res.json(qres.data);
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// Lưu vector mới
router.post('/qdrant/upsert', async (req, res) => {
  const { vector, payload } = req.body;
  if (!Array.isArray(vector) || !vector.length) {
    return res.status(400).json({ error: 'Missing vector' });
  }
  try {
    await axios.put(
      `${QDRANT_URL}/collections/${QDRANT_COLLECTION}/points`,
      {
        points: [
          {
            id: Date.now(),
            vector,
            payload
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': QDRANT_API_KEY
        }
      }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

module.exports = router;
