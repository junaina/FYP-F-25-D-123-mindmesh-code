"use client";

import { Mic, MicOff, Video, VideoOff, ScreenShare, MessageSquare, Hand, MoreHorizontal, PhoneOff, Captions } from "lucide-react";

type Props = {
  isMicOn: boolean;
  isCamOn: boolean;
  isScreenSharing: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onShare: () => void;
  onStopShare: () => void;
  onLeave: () => void;
};

export default function BottomToolbar({
  isMicOn,
  isCamOn,
  isScreenSharing,
  onToggleMic,
  onToggleCam,
  onShare,
  onStopShare,
  onLeave,
}: Props) {
  const Btn = ({
    active,
    danger,
    children,
    onClick,
    label,
  }: {
    active?: boolean;
    danger?: boolean;
    children: React.ReactNode;
    onClick?: () => void;
    label: string;
  }) => (
    <button
      onClick={onClick}
      aria-label={label}
      className={`h-11 w-11 rounded-full ring-1 ring-border transition hover:opacity-90 ${
        danger
          ? "bg-red-500 text-white"
          : active
          ? "bg-brand text-brand-foreground"
          : "bg-secondary text-foreground"
      }`}
      title={label}
    >
      <div className="flex h-full items-center justify-center">{children}</div>
    </button>
  );

  return (
    <div className="flex items-center justify-center gap-3 rounded-full bg-background/60 p-2 backdrop-blur">
      <Btn label="Toggle microphone (M)" active={!isMicOn} onClick={onToggleMic}>
        {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
      </Btn>
      <Btn label="Toggle camera (V)" active={!isCamOn} onClick={onToggleCam}>
        {isCamOn ? <Video size={18} /> : <VideoOff size={18} />}
      </Btn>
      <Btn label="Captions (placeholder)">
        <Captions size={18} />
      </Btn>
      <Btn label="Raise hand (placeholder)">
        <Hand size={18} />
      </Btn>
      {isScreenSharing ? (
        <Btn label="Stop sharing" active onClick={onStopShare}>
          <ScreenShare size={18} />
        </Btn>
      ) : (
        <Btn label="Present screen" onClick={onShare}>
          <ScreenShare size={18} />
        </Btn>
      )}
      <Btn label="More options (placeholder)">
        <MoreHorizontal size={18} />
      </Btn>
      <Btn label="Leave call" danger onClick={onLeave}>
        <PhoneOff size={18} />
      </Btn>
    </div>
  );
}
