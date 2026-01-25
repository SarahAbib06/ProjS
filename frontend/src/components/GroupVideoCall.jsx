import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const SIGNALING_SERVER = "http://localhost:5000";

export default function GroupVideoCall({ userId, conversationId }) {
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);

  const peersRef = useRef({}); // { remoteSocketId: RTCPeerConnection }
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    // Connexion socket
    socketRef.current = io(SIGNALING_SERVER);

    socketRef.current.emit("join-group-call", { conversationId, userId });

    // Local stream
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        localStreamRef.current = stream;
        const localVideo = document.getElementById("localVideo");
        if (localVideo) localVideo.srcObject = stream;
      });

    // Quand quelqu’un rejoint
    socketRef.current.on("user-joined", ({ socketId, userId }) => {
      console.log("👤 New user:", socketId);

      createPeerConnection(socketId, true); // On crée et on envoie une offre
      setParticipants(p => [...p, socketId]);
    });

    // Recevoir une offre
    socketRef.current.on("group-offer", async ({ from, sdp }) => {
      const pc = createPeerConnection(from, false);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current.emit("group-answer", { to: from, sdp: answer });
    });

    // Recevoir une answer
    socketRef.current.on("group-answer", async ({ from, sdp }) => {
      await peersRef.current[from].setRemoteDescription(
        new RTCSessionDescription(sdp)
      );
    });

    // ICE
    socketRef.current.on("group-ice-candidate", ({ from, candidate }) => {
      if (peersRef.current[from]) {
        peersRef.current[from].addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    // Quand un user quitte
    socketRef.current.on("user-left", ({ socketId }) => {
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].close();
        delete peersRef.current[socketId];
      }
      setParticipants(p => p.filter(id => id !== socketId));
    });

    return () => {
      Object.values(peersRef.current).forEach(pc => pc.close());
      if (localStreamRef.current)
        localStreamRef.current.getTracks().forEach(t => t.stop());
      socketRef.current.disconnect();
    };
  }, []);

  // Création PeerConnection
  const createPeerConnection = (remoteSocketId, isInitiator) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peersRef.current[remoteSocketId] = pc;

    // Ajouter local stream
    localStreamRef.current.getTracks().forEach(track =>
      pc.addTrack(track, localStreamRef.current)
    );

    // ICE sending
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("group-ice-candidate", {
          to: remoteSocketId,
          candidate: event.candidate,
        });
      }
    };

    // Remote stream
    pc.ontrack = ({ streams }) => {
      const remoteVideo = document.getElementById(`video-${remoteSocketId}`);
      if (remoteVideo) remoteVideo.srcObject = streams[0];
    };

    // Initiateur → crée l’offre
    if (isInitiator) {
      setTimeout(async () => {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current.emit("group-offer", {
          to: remoteSocketId,
          sdp: offer,
        });
      }, 300);
    }

    return pc;
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Group Video Call</h1>

      <h3>My Camera</h3>
      <video id="localVideo" autoPlay playsInline muted style={{ width: 300 }} />

      <h3>Participants</h3>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {participants.map((socketId) => (
          <video
            key={socketId}
            id={`video-${socketId}`}
            autoPlay
            playsInline
            style={{ width: 300, margin: 10, background: "#000" }}
          />
        ))}
      </div>
    </div>
  );
}