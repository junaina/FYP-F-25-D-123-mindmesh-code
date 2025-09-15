"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseWebRTCReturn = {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMicOn: boolean;
  isCamOn: boolean;
  isScreenSharing: boolean;
  start: () => Promise<void>;
  toggleMic: () => void;
  toggleCam: () => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  // manual signaling (dev only)
  createOffer: () => Promise<string>;
  applyAnswer: (sdp: string) => Promise<void>;
  createAnswer: (offerSdp: string) => Promise<string>;
  leave: () => void;
};

export function useWebRTC(): UseWebRTCReturn {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const ensurePC = () => {
    if (!pcRef.current) {
      pcRef.current = new RTCPeerConnection({ iceServers: [] });
      pcRef.current.ontrack = (e) => {
        const [stream] = e.streams;
        setRemoteStream(stream);
      };
    }
    return pcRef.current!;
  };

  const start = useCallback(async () => {
    if (localStreamRef.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({
  video: { width: { ideal: 640 }, height: { ideal: 360 } }, // was 1280x720 strict
  audio: true,
});
     console.log("Got local stream:", stream);
  stream.getTracks().forEach((t) => {
    console.log("Track:", t.kind, "state:", t.readyState, "enabled:", t.enabled);
  });
    localStreamRef.current = stream;
    setLocalStream(stream);

    const pc = ensurePC();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
  }, []);

  const toggleMic = () => {
    const s = localStreamRef.current;
    if (!s) return;
    s.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsMicOn(s.getAudioTracks().every((t) => t.enabled));
  };

  const toggleCam = () => {
    const s = localStreamRef.current;
    if (!s) return;
    s.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
    setIsCamOn(s.getVideoTracks().every((t) => t.enabled));
  };

  const startScreenShare = async () => {
    const pc = ensurePC();
    // @ts-ignore
    const displayStream: MediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });
    const track = displayStream.getVideoTracks()[0];
    const sender = pc.getSenders().find((s) => s.track?.kind === "video");
    if (sender && track) {
      await sender.replaceTrack(track);
      setIsScreenSharing(true);
      track.onended = async () => {
        // restore camera when share ends
        const camTrack = localStreamRef.current?.getVideoTracks()[0];
        if (camTrack) await sender.replaceTrack(camTrack);
        setIsScreenSharing(false);
      };
    }
  };

  const stopScreenShare = async () => {
    const pc = ensurePC();
    const sender = pc.getSenders().find((s) => s.track?.kind === "video");
    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    if (sender && camTrack) {
      await sender.replaceTrack(camTrack);
      setIsScreenSharing(false);
    }
  };

  // Manual signaling helpers (dev only)
  const createOffer = async () => {
    const pc = ensurePC();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    return btoa(JSON.stringify(offer));
  };

  const applyAnswer = async (sdp: string) => {
    const pc = ensurePC();
    const answer = JSON.parse(atob(sdp));
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
  };

  const createAnswer = async (offerSdp: string) => {
    const pc = ensurePC();
    const offer = JSON.parse(atob(offerSdp));
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return btoa(JSON.stringify(answer));
  };

  const leave = () => {
    pcRef.current?.getSenders().forEach((s) => s.track?.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setRemoteStream(null);
  };

  useEffect(() => {
    return () => leave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    localStream,
    remoteStream,
    isMicOn,
    isCamOn,
    isScreenSharing,
    start,
    toggleMic,
    toggleCam,
    startScreenShare,
    stopScreenShare,
    createOffer,
    applyAnswer,
    createAnswer,
    leave,
  };
}
