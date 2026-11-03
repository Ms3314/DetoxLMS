import type { ComponentType } from "react";

interface PlayerProps {
  videoId: string;
  startAt?: number;
  onEnded?: () => void;
  onReady?: (player: unknown) => void;
  onProgress?: (videoId: string, seconds: number) => void;
}

declare const Player: ComponentType<PlayerProps>;
export default Player;
