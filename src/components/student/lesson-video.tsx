function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const videoId = u.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (u.hostname === 'youtu.be') {
      const videoId = u.pathname.slice(1);
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    if (u.hostname.includes('vimeo.com')) {
      const videoId = u.pathname.split('/').filter(Boolean).pop();
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Renders a lesson's video from either a direct URL (YouTube/Vimeo embed,
 * or a direct file URL played natively) or a Mux playback ID. videoUrl
 * takes priority — it works today without a Mux account. See
 * docs/ROADMAP.md phase 2 for swapping Mux in with signed playback URLs.
 */
export function LessonVideo({ videoUrl, playbackId }: { videoUrl?: string | null; playbackId?: string | null }) {
  if (videoUrl) {
    const embedUrl = toEmbedUrl(videoUrl);
    if (embedUrl) {
      return (
        <iframe
          className="aspect-video w-full rounded-2xl bg-black"
          src={embedUrl}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
    return <video className="aspect-video w-full rounded-2xl bg-black" controls src={videoUrl} />;
  }

  if (playbackId) {
    return (
      <video
        className="aspect-video w-full rounded-2xl bg-black"
        controls
        src={`https://stream.mux.com/${playbackId}.m3u8`}
      />
    );
  }

  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-ink-100 text-sm text-ink-700">
      No video attached to this lesson yet.
    </div>
  );
}
