"use client";

import { useEffect, useRef } from "react";

interface RutubeVideoProps {
  videoId: string;
  title?: string;
  className?: string;
}

export function RutubeVideo({ videoId, title, className }: RutubeVideoProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Автовоспроизведение после загрузки iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      // Попытка запустить автовоспроизведение через postMessage
      const tryPlay = () => {
        if (iframe.contentWindow) {
          try {
            iframe.contentWindow.postMessage(
              JSON.stringify({ type: "player:play" }),
              "https://rutube.ru"
            );
          } catch (e) {
            // Игнорируем ошибки CORS
          }
        }
      };

      // Несколько попыток с задержкой для надежности
      setTimeout(tryPlay, 500);
      setTimeout(tryPlay, 1000);
      setTimeout(tryPlay, 2000);
    };

    iframe.addEventListener("load", handleLoad);

    return () => {
      iframe.removeEventListener("load", handleLoad);
    };
  }, []);

  const embedUrl = `https://rutube.ru/play/embed/${videoId}?autoplay=1&muted=1&playsinline=1&start=0`;

  const hasFullHeight = className?.includes("h-full") || className?.includes("!aspect-auto");
  
  return (
    <div className={`${hasFullHeight ? "" : "aspect-video"} w-full rounded-lg overflow-hidden bg-black ${className || ""}`}>
      <iframe
        ref={iframeRef}
        width="100%"
        height="100%"
        src={embedUrl}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        className="w-full h-full"
        title={title || "Видео"}
        loading="lazy"
      />
    </div>
  );
}

