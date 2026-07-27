'use client';

/**
 * Minimal Mux HLS embed. In production, swap the <video> tag for
 * `@mux/mux-player-react` (adds adaptive bitrate + analytics out of the box)
 * and request a signed playback URL from a short-lived server route instead
 * of using the public playback ID directly, since course video is paid
 * content gated by enrollment.
 */
export function LessonVideo({ playbackId }: { playbackId: string }) {
  return (
    <video
      className="aspect-video w-full rounded-2xl bg-black"
      controls
      src={`https://stream.mux.com/${playbackId}.m3u8`}
    />
  );
}
