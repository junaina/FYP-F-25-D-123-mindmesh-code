"use client";

import { useEffect, useMemo, useRef } from "react";
import clsx from "clsx";

type Props = {
  stream?: MediaStream | null;
  name?: string;
  isPresenting?: boolean;
  muted?: boolean;
  mirrored?: boolean;
  placeholder?: React.ReactNode;
};

export default function VideoTile({
  stream,
  name,
  isPresenting,
  muted,
  mirrored,
  placeholder,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  // Do we truly have a usable video track?
  const hasLiveVideo = useMemo(() => {
    if (!stream) return false;
    const vt = stream.getVideoTracks?.()[0];
    return !!vt && vt.enabled && vt.readyState === "live";
  }, [stream]);

  useEffect(() => {
  const el = ref.current;
  if (!el || !stream) return;

  // set srcObject only when it changes
  if (el.srcObject !== stream) {
    el.muted = true;          // must be true for autoplay
    el.srcObject = stream;
  }

  const handleLoaded = () => {
    el.play().catch((err) => console.warn("video.play() failed:", err));
  };

  // play once metadata is ready; no immediate play() call
  el.addEventListener("loadedmetadata", handleLoaded, { once: true });

  return () => {
    el.removeEventListener("loadedmetadata", handleLoaded);
  };
}, [stream]);


  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl ring-1 ring-border bg-secondary",
        "aspect-video", // guarantees height so video can paint
        isPresenting && "ring-2 ring-brand"
      )}
    >
      <video
        ref={ref}
        className={clsx(
          "absolute inset-0 h-full w-full object-cover",
          mirrored && "scale-x-[-1]"
        )}
        playsInline
        autoPlay
        // keep muted true; remote audio should be played via separate audio element later
        muted={muted ?? true}
      />

      {!hasLiveVideo && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          {placeholder ?? "Camera off"}
        </div>
      )}

      {name && (
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/40 px-2 py-1 text-xs text-white backdrop-blur">
          {name}
        </div>
      )}
    </div>
  );
}
