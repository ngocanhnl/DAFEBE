import { useEffect, useRef, useState } from "react";
import { Card, Button, Alert } from "react-bootstrap";
import { io } from "socket.io-client";

export default function LivestreamBroadcaster({ classId, title }) {
  const videoRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Đang kết nối...");
  const pcMap = useRef({}); // watcherId -> RTCPeerConnection
  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    // const socket = io(process.env.REACT_APP_API_BASE?.replace(/\/?$/, '') + '/livestream', {
    //   withCredentials: true,
    //   transports: ["websocket"]
    // });
    const socket = io("http://localhost:4000/livestream", {
      withCredentials: true,
      transports: ["websocket"]
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setStatus("Đã kết nối. Đang chờ bắt đầu livestream...");
      socket.emit("join", { classId, as: "broadcaster" });
    });

    socket.on("watcher_joined", ({ watcherId }) => {
      if (streamRef.current) {
        createOfferForWatcher(watcherId);
      }
    });

    socket.on("answer", ({ from, description }) => {
      const pc = pcMap.current[from];
      if (pc) pc.setRemoteDescription(description);
    });

    socket.on("candidate", ({ from, candidate }) => {
      const pc = pcMap.current[from];
      if (pc && candidate) pc.addIceCandidate(candidate).catch(() => {});
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setStatus("Mất kết nối tới server.");
      stopStream();
    });

    return () => {
      stopStream();
      socket.emit("leave");
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  async function startStream() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsStreaming(true);
      setStatus("Đang phát livestream...");
      // Gửi offer cho tất cả watcher đã kết nối
      Object.keys(pcMap.current).forEach(watcherId => {
        createOfferForWatcher(watcherId);
      });
    } catch (err) {
      setStatus("Không thể truy cập camera/micro: " + err.message);
    }
  }

  function stopStream() {
    setIsStreaming(false);
    setStatus("Đã dừng livestream.");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    Object.values(pcMap.current).forEach(pc => {
      try { pc.close(); } catch {}
    });
    pcMap.current = {};
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function createPeerConnection(watcherId) {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    // Add tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => pc.addTrack(track, streamRef.current));
    }
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current.emit("candidate", { to: watcherId, candidate: e.candidate });
      }
    };
    pc.onconnectionstatechange = () => {
      if (["failed","disconnected","closed"].includes(pc.connectionState)) {
        pc.close();
        delete pcMap.current[watcherId];
      }
    };
    pcMap.current[watcherId] = pc;
    return pc;
  }

  async function createOfferForWatcher(watcherId) {
    let pc = pcMap.current[watcherId];
    if (!pc) pc = createPeerConnection(watcherId);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit("offer", { watcherId, description: pc.localDescription });
    } catch (err) {
      setStatus("Lỗi khi tạo offer: " + err.message);
    }
  }

  return (
    <Card className="mt-3">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <strong>{title || "Phát Livestream lớp học"}</strong>
          <div className="small">{connected ? "Đã kết nối" : "Chưa kết nối"}</div>
        </div>
      </Card.Header>
      <Card.Body>
        <video ref={videoRef} autoPlay playsInline muted controls style={{ width: '100%', background: '#000', borderRadius: 8 }} />
        <Alert variant="light" className="mt-2 py-2">{status}</Alert>
        <div className="d-flex gap-2">
          {!isStreaming ? (
            <Button size="sm" variant="success" onClick={startStream}>Bắt đầu Livestream</Button>
          ) : (
            <Button size="sm" variant="danger" onClick={stopStream}>Dừng Livestream</Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
