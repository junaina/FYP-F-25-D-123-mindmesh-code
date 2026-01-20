"use client";

import VideoTile from "./video-tile";

type Tile = {
  key: string;
  stream?: MediaStream | null;
  name: string;
  presenting?: boolean;
  self?: boolean;
};

export default function VideoGrid({
  main,
  side,
}: {
  main: Tile;
  side: Tile[];
}) {
  return (
    <div className="grid grid-cols-12 gap-4">
      {/* big stage (left) */}
      <div className="col-span-12 lg:col-span-8">
        <div className="aspect-video w-full">
          <VideoTile
            stream={main.stream}
            name={main.name}
            isPresenting={main.presenting}
            muted={main.self}
            mirrored={main.self}
            placeholder={<div className="text-sm">Waiting for video…</div>}
          />
        </div>
      </div>
      {/* right rail thumbnails */}
      <div className="col-span-12 lg:col-span-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          {side.map((t) => (
            <div key={t.key} className="aspect-video">
              <VideoTile
                stream={t.stream}
                name={t.name}
                isPresenting={t.presenting}
                muted={t.self}
                mirrored={t.self}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
