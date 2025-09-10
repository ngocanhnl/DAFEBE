import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Badge, Button, Card, Form, ListGroup } from "react-bootstrap";
import { initializeApp } from "firebase/app";
import { getDatabase, onChildAdded, push, ref, serverTimestamp, update } from "firebase/database";
import { authApis, endpoints } from "../../configs/Apis";

// IMPORTANT: Set these in your frontend env (REACT_APP_*) or inline here for testing
const firebaseConfig = {
	apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
	authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
	databaseURL: process.env.REACT_APP_FIREBASE_DB_URL,
	projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
	storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.REACT_APP_FIREBASE_APP_ID
};

let firebaseApp;
let firebaseDb;
function ensureFirebase() {
	if (!firebaseApp) {
		firebaseApp = initializeApp(firebaseConfig);
		firebaseDb = getDatabase(firebaseApp);
	}
	return firebaseDb;
}

function buildRoomId(classId, instructorId, studentId) {
	return `class_${classId}__inst_${instructorId}__stu_${studentId}`;
}

export default function RealtimeChat({ classId, instructor }) {
	const [messages, setMessages] = useState([]);
	const [sending, setSending] = useState(false);
	const [text, setText] = useState("");
	const [profile, setProfile] = useState(null);
	const listRef = useRef(null);

	const instructorId = instructor?._id || instructor?.id || instructor;

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const me = await authApis().get(endpoints.profile);
				if (mounted) setProfile(me.data?.data || me.data);
			} catch {}
		})();
		return () => {
			mounted = false;
		};
	}, []);

	const roomId = useMemo(() => {
		if (!classId || !instructorId || !profile?.id) return null;
		return buildRoomId(classId, instructorId, profile.id);
	}, [classId, instructorId, profile]);

	useEffect(() => {
		if (!roomId) return;
		const db = ensureFirebase();
		const roomMessagesRef = ref(db, `chat/messages/${roomId}`);

		const unsubscribe = onChildAdded(roomMessagesRef, (snap) => {
			const val = snap.val();
			setMessages((prev) => [...prev, { id: snap.key, ...val }]);
			// scroll to bottom
			setTimeout(() => {
				if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
			}, 0);
		});
		return () => unsubscribe();
	}, [roomId]);

	const sendMessage = async (e) => {
		e?.preventDefault();
		if (!text.trim() || !roomId || !profile) return;
		setSending(true);
		try {
			const db = ensureFirebase();
			const msgRef = push(ref(db, `chat/messages/${roomId}`));
			await update(msgRef, {
				text: text.trim(),
				senderId: profile.id,
				senderName: profile.fullName || profile.username || "Tôi",
				createdAt: serverTimestamp(),
			});
			setText("");
			// also update participants list for instructor view
			await update(ref(db, `chat/rooms/${roomId}`), {
				classId,
				instructorId,
				studentId: profile.id,
				studentName: profile.fullName || profile.username || "Học viên",
				lastMessageAt: serverTimestamp(),
				lastMessage: text.trim()
			});
		} catch (err) {
			console.error(err);
		} finally {
			setSending(false);
		}
	};

	if (!profile) return (
		<Card className="mt-3">
			<Card.Body>
				<small>Đang tải chat...</small>
			</Card.Body>
		</Card>
	);

	return (
		<Card className="mt-3">
			<Card.Header>
				<div className="d-flex justify-content-between align-items-center">
					<strong>Chat với giảng viên</strong>
					{roomId ? <Badge bg="secondary">#{roomId.slice(-6)}</Badge> : null}
				</div>
			</Card.Header>
			<Card.Body style={{ padding: 0 }}>
				<div ref={listRef} style={{ height: 280, overflowY: "auto", padding: 12, background: "#fafafa" }}>
					{messages.length === 0 && <Alert variant="light" className="py-2">Hãy nhắn tin để bắt đầu trao đổi với giảng viên.</Alert>}
					<ListGroup variant="flush">
						{messages.map((m) => {
							const mine = m.senderId === profile.id;
							return (
								<ListGroup.Item key={m.id} className={mine ? "text-end" : ""}>
									<div className="small text-muted">{mine ? "Bạn" : m.senderName || "Giảng viên"}</div>
									<div>{m.text}</div>
								</ListGroup.Item>
							);
						})}
					</ListGroup>
				</div>
				<Form onSubmit={sendMessage} className="p-2 border-top bg-white">
					<div className="d-flex gap-2">
						<Form.Control
							value={text}
							onChange={(e) => setText(e.target.value)}
							placeholder="Nhập tin nhắn..."
						/>
						<Button type="submit" disabled={sending || !text.trim()}>Gửi</Button>
					</div>
				</Form>
			</Card.Body>
		</Card>
	);
}
