// Simple WebRTC signaling over Socket.IO for class livestreams
// Roles: broadcaster (teacher) and watcher (students)

module.exports = function initLivestreamSocket(io) {
  const nsp = io.of("/livestream");

  // Maps to track broadcaster per class and watchers
  const classIdToBroadcaster = new Map(); // classId -> socket.id
  const watcherToClass = new Map(); // watcherSocketId -> classId

  nsp.on("connection", (socket) => {
    let joinedClassId = null;
    let role = null;

    socket.on("join", ({ classId, as }) => {
      if (!classId) return;
      joinedClassId = String(classId);
      role = as === "broadcaster" ? "broadcaster" : "watcher";
      socket.join(joinedClassId);

      if (role === "broadcaster") {
        classIdToBroadcaster.set(joinedClassId, socket.id);
        // Notify existing watchers that a broadcaster is available
        socket.to(joinedClassId).emit("broadcaster_available");
      } else {
        watcherToClass.set(socket.id, joinedClassId);
        // If broadcaster exists, let them know a watcher joined
        const bId = classIdToBroadcaster.get(joinedClassId);
        if (bId) nsp.to(bId).emit("watcher_joined", { watcherId: socket.id });
      }
    });

    // WebRTC signaling relays
    socket.on("offer", ({ watcherId, description }) => {
      if (watcherId) nsp.to(watcherId).emit("offer", { description, from: socket.id });
    });

    socket.on("answer", ({ to, description }) => {
      if (to) nsp.to(to).emit("answer", { description, from: socket.id });
    });

    socket.on("candidate", ({ to, candidate }) => {
      if (to) nsp.to(to).emit("candidate", { candidate, from: socket.id });
    });

    socket.on("leave", () => {
      cleanup();
      socket.leave(joinedClassId);
    });

    socket.on("disconnect", () => {
      const wasBroadcaster = role === "broadcaster";
      const classId = joinedClassId;
      cleanup();
      if (wasBroadcaster && classId) {
        // Notify watchers the broadcaster left
        nsp.to(classId).emit("broadcaster_left");
      }
    });

    function cleanup() {
      if (!joinedClassId) return;
      if (role === "broadcaster") {
        const current = classIdToBroadcaster.get(joinedClassId);
        if (current === socket.id) classIdToBroadcaster.delete(joinedClassId);
      } else {
        watcherToClass.delete(socket.id);
      }
      joinedClassId = null;
      role = null;
    }
  });
};


