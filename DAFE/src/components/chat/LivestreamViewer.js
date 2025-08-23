import { useEffect, useRef, useState } from "react";
import { Card, Button, Alert } from "react-bootstrap";
import { io } from "socket.io-client";

export default function LivestreamViewer({ classId, title }) {
  const videoRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Đang kết nối...");
  const pcRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // const socket = io("http://localhost:4000/livestream", {
    //   withCredentials: true,
    //   transports: ["websocket"]
    // });
    const socket = io("http://localhost:4000/livestream", {
  path: "/socket.io", // đảm bảo đúng path
  transports: ["websocket"],
  withCredentials: true
});
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setStatus("Đang chờ giảng viên bắt đầu...");
      socket.emit("join", { classId, as: "watcher" });
    });

    socket.on("broadcaster_available", () => {
      setStatus("Giảng viên đã sẵn sàng. Đang yêu cầu kết nối...");
    });

    socket.on("offer", async ({ description, from }) => {
      try {
        const pc = createPeerConnection(from);
        pcRef.current = pc;
        await pc.setRemoteDescription(description);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { to: from, description: pc.localDescription });
      } catch (err) {
        console.error(err);
        setStatus("Không thể tạo kết nối WebRTC");
      }
    });

    socket.on("candidate", ({ candidate }) => {
      if (pcRef.current && candidate) {
        pcRef.current.addIceCandidate(candidate).catch(() => {});
      }
    });

    socket.on("broadcaster_left", () => {
      setStatus("Giảng viên đã dừng phát.");
      destroy();
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setStatus("Mất kết nối.");
      destroy();
    });

    return () => {
      socket.emit("leave");
      socket.disconnect();
      destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  function destroy() {
    if (pcRef.current) {
      try { pcRef.current.close(); } catch {}
      pcRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function createPeerConnection(to) {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current.emit("candidate", { to, candidate: e.candidate });
      }
    };
    pc.ontrack = (e) => {
      const [stream] = e.streams;
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        setStatus("Đang xem livestream");
      }
    };
    pc.onconnectionstatechange = () => {
      if (["failed","disconnected","closed"].includes(pc.connectionState)) {
        destroy();
      }
    };
    return pc;
  }

  return (
    <Card className="mt-3">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <strong>{title || "Livestream lớp học"}</strong>
          <div className="small">{connected ? "Đã kết nối" : "Chưa kết nối"}</div>
        </div>
      </Card.Header>
      <Card.Body>
        <video ref={videoRef} autoPlay playsInline controls style={{ width: '100%', background: '#000', borderRadius: 8 }} />
        <Alert variant="light" className="mt-2 py-2">{status}</Alert>
        <div className="d-flex gap-2">
          <Button size="sm" variant="outline-secondary" onClick={() => socketRef.current?.emit("join", { classId, as: "watcher" })}>Thử lại</Button>
        </div>
      </Card.Body>
    </Card>
  );
}


