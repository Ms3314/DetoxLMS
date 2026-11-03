/** What a focus session is tied to, plus its length (null = open-ended). */
export interface StartParams {
  playlistId: string;
  videoId: string;
  targetMs: number | null;
}
