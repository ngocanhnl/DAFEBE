// import { useEffect, useRef, useState } from "react";
// import { Button, Form, InputGroup, Card, Spinner } from "react-bootstrap";

// // Cấu hình endpoint Gemini và Qdrant
// const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
// const QDRANT_API_URL = "https://17287bcd-e993-4bf8-b129-b587d76d47c8.eu-central-1-0.aws.cloud.qdrant.io/collections/chatbot_vectors/points"; // Thay bằng URL Qdrant Cloud của bạn
// const QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.LWyQxpLjxPQoQITJfMW78hirBFKsYbuvPJjZ-RNE22I"; // Thay bằng API key Qdrant
// const GEMINI_API_KEY = "AIzaSyD9TbFi-n5l_pilO2IPQTZuhdHKqPo6hVQ"; // Thay bằng API key Gemini

// export default function Chatbot() {
//   const [messages, setMessages] = useState([
//     { role: "bot", text: "Xin chào! Tôi là trợ lý tư vấn khóa học. Bạn cần hỗ trợ gì?" }
//   ]);
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const chatEndRef = useRef(null);

//   useEffect(() => {
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   // Lưu vector vào Qdrant
//   async function saveVectorToQdrant(vector, payload) {
//     await fetch(QDRANT_API_URL, {
//       method: "PUT",
//       headers: {
//         "Content-Type": "application/json",
//         "api-key": QDRANT_API_KEY
//       },
//       body: JSON.stringify({
//         points: [{
//           id: Date.now(),
//           vector,
//           payload
//         }]
//       })
//     });
//   }

//   // Gọi Gemini API để sinh câu trả lời và vector hóa
//   async function handleSend() {
//     if (!input.trim()) return;
//     setLoading(true);
//     const userMsg = { role: "user", text: input };
//     setMessages(msgs => [...msgs, userMsg]);
//     setInput("");
//     try {
//       // Gọi Gemini để lấy câu trả lời
//       const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           contents: [{ parts: [{ text: input }] }]
//         })
//       });
//       const data = await res.json();
//       const botText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Xin lỗi, tôi chưa hiểu ý bạn.";
//       setMessages(msgs => [...msgs, { role: "bot", text: botText }]);

//       // Vector hóa câu hỏi (giả lập, thực tế nên dùng Gemini Embedding hoặc API vector hóa)
//       const vector = Array(1536).fill(Math.random()); // Thay bằng vector thực tế
//       await saveVectorToQdrant(vector, { question: input, answer: botText });
//     } catch (err) {
//       setMessages(msgs => [...msgs, { role: "bot", text: "Có lỗi khi kết nối AI." }]);
//     }
//     setLoading(false);
//   }

//   function handleKeyDown(e) {
//     if (e.key === "Enter" && !loading) handleSend();
//   }

//   return (
//     <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, width: 350 }}>
//       <Card>
//         <Card.Header className="bg-primary text-white">Tư vấn khóa học</Card.Header>
//         <Card.Body style={{ maxHeight: 400, overflowY: "auto", background: "#f8f9fa" }}>
//           {messages.map((msg, i) => (
//             <div key={i} style={{ textAlign: msg.role === "user" ? "right" : "left" }}>
//               <span className={msg.role === "user" ? "badge bg-info" : "badge bg-secondary"}>
//                 {msg.text}
//               </span>
//             </div>
//           ))}
//           <div ref={chatEndRef} />
//         </Card.Body>
//         <Card.Footer>
//           <InputGroup>
//             <Form.Control
//               placeholder="Nhập câu hỏi về khóa học..."
//               value={input}
//               onChange={e => setInput(e.target.value)}
//               onKeyDown={handleKeyDown}
//               disabled={loading}
//             />
//             <Button onClick={handleSend} disabled={loading || !input.trim()}>
//               {loading ? <Spinner size="sm" /> : "Gửi"}
//             </Button>
//           </InputGroup>
//         </Card.Footer>
//       </Card>
//     </div>
//   );
// }
import { useEffect, useRef, useState } from "react";
import { Button, Form, InputGroup, Card, Spinner } from "react-bootstrap";

// ====================== CONFIG ======================
const GEMINI_API_KEY = "AIzaSyDzX5cVtr1g--VOPTBbuysgNBJAeiMiTwM"; // API key Gemini
const GEMINI_CHAT_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
const GEMINI_EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${GEMINI_API_KEY}`;

const QDRANT_URL = "https://17287bcd-e993-4bf8-b129-b587d76d47c8.eu-central-1-0.aws.cloud.qdrant.io";
const QDRANT_COLLECTION = "chatbot_vectors";
const QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.LWyQxpLjxPQoQITJfMW78hirBFKsYbuvPJjZ-RNE22I";

// ====================== CHATBOT COMPONENT ======================
export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Xin chào! Tôi là trợ lý tư vấn khóa học. Bạn cần hỗ trợ gì?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


async function askChatbot(question) {
  const res = await fetch("http://localhost:4000/api/chatbot/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question })
  });

  if (!res.ok) {
    // Backend trả 500, 400... thì throw
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || "Server error");
  }

  return res.json();
}


  // ========== Hàm lưu vector vào Qdrant qua backend ========== 
  async function saveVectorToQdrant(vector, payload) {
    await fetch("http://localhost:4000/api/chatbot/qdrant/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vector, payload })
    });
  }

  // ========== Xử lý khi gửi tin nhắn ==========
  async function handleSend() {
    if (!input.trim()) return;
    setLoading(true);

    const userMsg = { role: "user", text: input };
    setMessages(msgs => [...msgs, userMsg]);
    setInput("");

    try {
  // Gửi câu hỏi lên backend, nhận về answer và (tuỳ chọn) qdrantResult
  const { answer, qdrantResult } = await askChatbot(input);
  setMessages(msgs => [...msgs, { role: "bot", text: answer }]);

    } catch (err) {
      console.error("Lỗi:", err);
      setMessages(msgs => [...msgs, { role: "bot", text: "Có lỗi khi kết nối AI." }]);
    }

    setLoading(false);
  }

  // ========== Hỗ trợ Enter để gửi ==========
  function handleKeyDown(e) {
    if (e.key === "Enter" && !loading) handleSend();
  }

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, width: 350 }}>
      <Card>
        <Card.Header className="bg-primary text-white">Tư vấn khóa học</Card.Header>
        {/* <Card.Body style={{ maxHeight: 400, overflowY: "auto", background: "#f8f9fa" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ textAlign: msg.role === "user" ? "right" : "left", marginBottom: 8 }}>
              <span className={msg.role === "user" ? "badge bg-info p-2" : "badge bg-secondary p-2"}>
                {msg.text}
              </span>
            </div>
          ))}
          <div ref={chatEndRef} />
        </Card.Body> */}
        <Card.Body
            style={{
              maxHeight: 400,
              overflowY: "auto",
              background: "#f8f9fa",
              padding: "10px",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  alignItems: "flex-start",
                  marginBottom: 10
                }}
              >
                {msg.role === "bot" && (
                  <img
                    src="/bot-avatar.png"
                    alt="Bot"
                    style={{ width: 32, height: 32, borderRadius: "50%", marginRight: 8 }}
                  />
                )}
                <div
                  style={{
                    background: msg.role === "user" ? "#0d6efd" : "#e9ecef",
                    color: msg.role === "user" ? "#fff" : "#000",
                    padding: "10px 14px",
                    borderRadius: 16,
                    maxWidth: "75%",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                  }}
                >
                  {msg.text}
                </div>
                {msg.role === "user" && (
                  <img
                    src="/user-avatar.png"
                    alt="User"
                    style={{ width: 32, height: 32, borderRadius: "50%", marginLeft: 8 }}
                  />
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </Card.Body>
        <Card.Footer>
          <InputGroup>
            <Form.Control
              placeholder="Nhập câu hỏi về khóa học..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()}>
              {loading ? <Spinner size="sm" /> : "Gửi"}
            </Button>
          </InputGroup>
        </Card.Footer>
      </Card>
    </div>
  );
}
