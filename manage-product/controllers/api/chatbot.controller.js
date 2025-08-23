const axios = require('axios');

// Config Gemini & Qdrant
const GEMINI_API_KEY = "AIzaSyDzX5cVtr1g--VOPTBbuysgNBJAeiMiTwM"; // lưu key trong .env
const GEMINI_MODEL = "gemini-1.5-flash"; // chọn cứng model miễn phí
const GEMINI_CHAT_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
const GEMINI_EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${GEMINI_API_KEY}`;

const QDRANT_URL = "https://17287bcd-e993-4bf8-b129-b587d76d47c8.eu-central-1-0.aws.cloud.qdrant.io";
const QDRANT_COLLECTION = "chatbot_vectors";
const QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.LWyQxpLjxPQoQITJfMW78hirBFKsYbuvPJjZ-RNE22I";




// let conversationHistory = [];

// // ✅ Chuẩn hóa text
// function normalize(text) {
//   return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
// }

// // ✅ Lấy embedding
// async function getEmbedding(text) {
//   const res = await axios.post(GEMINI_EMBED_URL, {
//     content: { parts: [{ text }] }
//   });
//   return res.data?.embedding?.values || [];
// }

// // ✅ Gọi Gemini với lịch sử hội thoại và few-shot
// async function askGemini(history, context, question) {
//   const historyText = history.slice(-5).map(h => `Người: ${h.q}\nBot: ${h.a}`).join("\n");

//   const prompt = `
// Bạn là một trợ lý tư vấn khóa học thân thiện, nói chuyện tự nhiên như người thật.

// Lịch sử hội thoại gần đây:
// ${historyText || "Chưa có."}

// Thông tin hiện có:
// ${context || "Hiện tại chưa có thông tin chi tiết."}

// Người dùng hỏi: "${question}"

// Cách trả lời:
// - Nếu có thông tin về khóa học, giới thiệu tự nhiên, không nhắc đến "dữ liệu" hay "ngữ cảnh".
// - Nếu chỉ có một khóa học, trình bày chi tiết và gợi ý hỏi thêm về lịch khai giảng hoặc thông tin khác.
// - Nếu không có thông tin phù hợp, nói lịch sự: "Hiện tại mình chưa có thông tin về khóa này, nhưng mình có thể gợi ý các khóa khác nếu bạn muốn."
// - Luôn gợi mở để người dùng tiếp tục trò chuyện.

// Ví dụ trả lời mẫu:
// Người: Có khóa học tiếng Nhật không?
// Bot: Bên mình đang có một khóa học tiếng Nhật cho người mới bắt đầu, tên là Japanese (T1). Khóa này gồm 10 buổi, học bằng tiếng Việt và tập trung vào Hiragana, Katakana, cùng từ vựng cơ bản. Bạn có muốn mình gửi lịch khai giảng không?

// Người: Danh sách khóa học tiếng Anh
// Bot: Hiện tại bên mình có 3 khóa tiếng Anh: English Basic, English Intermediate và English Speaking. Bạn muốn mình giới thiệu chi tiết về khóa nào?

// Người: Có lớp tiếng Hàn nâng cao không?
// Bot: Hiện tại mình chưa thấy khóa tiếng Hàn nâng cao, nhưng bên mình có một số khóa tiếng Hàn cơ bản. Bạn có muốn mình gửi thông tin chi tiết không?
// `;

//   const res = await axios.post(GEMINI_CHAT_URL, {
//     contents: [{ parts: [{ text: prompt }] }]
//   });

//   return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "Xin lỗi, mình chưa có thông tin cụ thể.";
// }

// // ✅ Lấy toàn bộ dữ liệu
// async function getAllCourses() {
//   const qres = await axios.post(
//     `${QDRANT_URL}/collections/${QDRANT_COLLECTION}/points/scroll`,
//     { limit: 200, with_payload: true },
//     { headers: { 'Content-Type': 'application/json', 'api-key': QDRANT_API_KEY } }
//   );
//   return qres.data?.result?.points || [];
// }

// function isGeneralQuestion(text) {
//   const keywords = ["danh sách", "những khóa học", "có những gì", "liệt kê", "tất cả khóa học"];
//   return keywords.some(k => text.toLowerCase().includes(k));
// }

// exports.ask = async (req, res) => {
//   const { question } = req.body;
//   if (!question) return res.status(400).json({ error: 'Missing question' });

//   try {
//     const cleanQuestion = normalize(question);
//     let qdrantResult = [];

//     // ✅ 1. Kiểm tra câu hỏi tổng quát
//     if (isGeneralQuestion(cleanQuestion)) {
//       qdrantResult = await getAllCourses();
//     } else {
//       // ✅ 2. Tìm bằng embedding
//       const vector = await getEmbedding(cleanQuestion);
//       if (vector.length) {
//         const qres = await axios.post(
//           `${QDRANT_URL}/collections/${QDRANT_COLLECTION}/points/search`,
//           { vector, limit: 5, with_payload: true },
//           { headers: { 'Content-Type': 'application/json', 'api-key': QDRANT_API_KEY } }
//         );
//         qdrantResult = qres.data?.result || [];
//       }

//       // ✅ 3. Fallback fuzzy match
//       if (qdrantResult.length < 2) {
//         const allCourses = await getAllCourses();
//         const titles = allCourses.map(c => c.payload.title);
//         const bestMatch = stringSimilarity.findBestMatch(question, titles);
//         if (bestMatch.bestMatch.rating > 0.4) {
//           qdrantResult = allCourses.filter(c => c.payload.title === bestMatch.bestMatch.target);
//         }
//       }
//     }

//     // ✅ 4. Tạo context mềm mại
//     let context = "";
//     if (qdrantResult.length) {
//       if (isGeneralQuestion(cleanQuestion)) {
//         context = "Danh sách các khóa học hiện có:\n" +
//           qdrantResult.map((p, i) => `${i + 1}. ${p.payload?.title || ""} (${p.payload?.category || ""})`).join("\n");
//       } else {
//         context = qdrantResult.map((p, i) =>
//           `${i + 1}. ${p.payload?.title || ""} | ${p.payload?.description || ""}`
//         ).join("\n");
//       }
//     }

//     const answer = await askGemini(conversationHistory, context, question);
//     conversationHistory.push({ q: question, a: answer });

//     console.log("Chatbot ask:", question);
//     console.log("Chatbot answer:", answer);

//     res.json({ answer, qdrantResult });

//   } catch (err) {
//     console.error("Chatbot ask error:", err.response?.data || err.message);
//     res.status(500).json({ error: err.message });
//   }
// };

let conversationHistory = [];

// ✅ Chuẩn hóa text
function normalize(text) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// ✅ Hàm nhận diện ngày trong tuần
function extractWeekdays(question) {
  const mapping = {
    "thứ 2": 1, "thứ hai": 1,
    "thứ 3": 2, "thứ ba": 2,
    "thứ 4": 3, "thứ tư": 3,
    "thứ 5": 4, "thứ năm": 4,
    "thứ 6": 5, "thứ sáu": 5,
    "thứ 7": 6, "thứ bảy": 6,
    "chủ nhật": 0
  };

  const result = [];
  for (const [k, v] of Object.entries(mapping)) {
    if (question.toLowerCase().includes(k)) result.push(v);
  }
  return result;
}

// ✅ Lấy embedding
async function getEmbedding(text) {
  const res = await axios.post(GEMINI_EMBED_URL, {
    content: { parts: [{ text }] }
  });
  return res.data?.embedding?.values || [];
}

// ✅ Gọi Gemini với lịch sử hội thoại và few-shot
async function askGemini(history, context, question) {
  const historyText = history.slice(-5).map(h => `Người: ${h.q}\nBot: ${h.a}`).join("\n");

  const prompt = `
Bạn là một trợ lý tư vấn khóa học thân thiện, nói chuyện tự nhiên như người thật.

Lịch sử hội thoại gần đây:
${historyText || "Chưa có."}

Thông tin hiện có:
${context || "Hiện tại chưa có thông tin chi tiết."}

Người dùng hỏi: "${question}"

Cách trả lời:
- Nếu có thông tin về khóa học, giới thiệu tự nhiên, không nhắc đến "dữ liệu" hay "ngữ cảnh".
- Nếu chỉ có một khóa học, trình bày chi tiết và gợi ý hỏi thêm về lịch khai giảng hoặc thông tin khác.
- Nếu không có thông tin phù hợp, nói lịch sự: "Hiện tại mình chưa có thông tin về khóa này, nhưng mình có thể gợi ý các khóa khác nếu bạn muốn."
- Luôn gợi mở để người dùng tiếp tục trò chuyện.

Ví dụ trả lời mẫu:
Người: Có khóa học tiếng Nhật không?
Bot: Bên mình đang có một khóa học tiếng Nhật cho người mới bắt đầu, tên là Japanese (T1). Khóa này gồm 10 buổi, học bằng tiếng Việt và tập trung vào Hiragana, Katakana, cùng từ vựng cơ bản. Bạn có muốn mình gửi lịch khai giảng không?

Người: Danh sách khóa học tiếng Anh
Bot: Hiện tại bên mình có 3 khóa tiếng Anh: English Basic, English Intermediate và English Speaking. Bạn muốn mình giới thiệu chi tiết về khóa nào?

Người: Có lớp tiếng Hàn nâng cao không?
Bot: Hiện tại mình chưa thấy khóa tiếng Hàn nâng cao, nhưng bên mình có một số khóa tiếng Hàn cơ bản. Bạn có muốn mình gửi thông tin chi tiết không?
`;

  const res = await axios.post(GEMINI_CHAT_URL, {
    contents: [{ parts: [{ text: prompt }] }]
  });

  return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || "Xin lỗi, mình chưa có thông tin cụ thể.";
}

// ✅ Lấy toàn bộ dữ liệu
async function getAllCourses() {
  const qres = await axios.post(
    `${QDRANT_URL}/collections/${QDRANT_COLLECTION}/points/scroll`,
    { limit: 200, with_payload: true },
    { headers: { 'Content-Type': 'application/json', 'api-key': QDRANT_API_KEY } }
  );
  return qres.data?.result?.points || [];
}

function isGeneralQuestion(text) {
  const keywords = ["danh sách", "những khóa học", "có những gì", "liệt kê", "tất cả khóa học"];
  return keywords.some(k => text.toLowerCase().includes(k));
}

exports.ask = async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: 'Missing question' });

  try {
    const cleanQuestion = normalize(question);
    let qdrantResult = [];
    const allCourses = await getAllCourses();

    // ✅ 1. Kiểm tra câu hỏi tổng quát
    if (isGeneralQuestion(cleanQuestion)) {
      qdrantResult = allCourses;
    } else {
      // ✅ 2. Kiểm tra nếu có nhắc tới thứ (lịch học)
      const matchedDays = extractWeekdays(question);
      if (matchedDays.length) {
        qdrantResult = allCourses.filter(c => {
          const schedule = c.payload.schedule || [];
          return schedule.some(s => matchedDays.includes(s.day_of_week));
        });
      }

      // ✅ 3. Nếu chưa tìm được thì dùng embedding
      if (!qdrantResult.length) {
        const vector = await getEmbedding(cleanQuestion);
        if (vector.length) {
          const qres = await axios.post(
            `${QDRANT_URL}/collections/${QDRANT_COLLECTION}/points/search`,
            { vector, limit: 5, with_payload: true },
            { headers: { 'Content-Type': 'application/json', 'api-key': QDRANT_API_KEY } }
          );
          qdrantResult = qres.data?.result || [];
        }

        // ✅ 4. Fallback fuzzy match
        if (qdrantResult.length < 2) {
          const titles = allCourses.map(c => c.payload.title);
          const bestMatch = stringSimilarity.findBestMatch(question, titles);
          if (bestMatch.bestMatch.rating > 0.4) {
            qdrantResult = allCourses.filter(c => c.payload.title === bestMatch.bestMatch.target);
          }
        }
      }
    }

    // ✅ 5. Tạo context có lịch học rõ ràng
    let context = "";
    if (qdrantResult.length) {
      context = qdrantResult.map((p, i) => {
        const scheduleText = (p.payload.schedule || []).map(s =>
          `Thứ ${s.day_of_week + 1} (${s.start_time}-${s.end_time})`
        ).join(", ") || "Chưa có lịch";
        return `${i + 1}. ${p.payload?.title || ""} | ${p.payload?.description || ""} | Lịch học: ${scheduleText}`;
      }).join("\n");
    }

    const answer = await askGemini(conversationHistory, context, question);
    conversationHistory.push({ q: question, a: answer });

    console.log("Chatbot ask:", question);
    console.log("Chatbot answer:", answer);

    res.json({ answer, qdrantResult });

  } catch (err) {
    console.error("Chatbot ask error:", err.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
};