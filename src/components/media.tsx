"use client";

import type { CSSProperties } from "react";

/** True when a stored media address points to a video file. */
export const isVideo = (src?: string | null) =>
  !!src && (/^data:video\//.test(src) || /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(src));

const fill: CSSProperties = { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" };

/** Renders an image or an autoplaying muted looping video. */
export default function Media({ src, alt = "", className, style }: { src: string; alt?: string; className?: string; style?: CSSProperties }) {
  const s = { ...fill, ...style };
  if (isVideo(src)) return <video className={className} style={s} src={src} autoPlay muted loop playsInline preload="metadata" aria-label={alt || undefined} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} style={s} src={src} alt={alt} />;
}
