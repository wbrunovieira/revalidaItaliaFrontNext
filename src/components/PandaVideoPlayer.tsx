// src/components/PandaVideoPlayer.tsx

'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Loader2, ExternalLink } from 'lucide-react';

interface Props {
  videoId: string;
  title?: string;
  thumbnailUrl?: string;
  playerUrl?: string;
}

export default function PandaVideoPlayer({
  videoId,
  title,
  thumbnailUrl,
  playerUrl,
}: Props) {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message || '';
      if (msg.includes('config.tv.pandavideo')) {
        event.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', handler);
    return () =>
      window.removeEventListener(
        'unhandledrejection',
        handler
      );
  }, []);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fallback, setFallback] = useState(false);

  const pullzone =
    process.env.NEXT_PUBLIC_PANDA_VIDEO_PULLZONE;
  const embedUrl =
    playerUrl ||
    `https://player-${pullzone}.tv.pandavideo.com.br/embed/?v=${videoId}`;

  useEffect(() => {
    setIsLoading(true);
    setFallback(false);
    const timer = setTimeout(
      () => setIsLoading(false),
      2000
    );
    return () => clearTimeout(timer);
  }, [embedUrl]);

  useEffect(() => {
    const onClick = () => setIsLoading(false);
    const el = iframeRef.current;
    el?.addEventListener('click', onClick);
    return () => el?.removeEventListener('click', onClick);
  }, []);

  const handleLoad = () => setIsLoading(false);
  const openNew = () => window.open(embedUrl, '_blank');
  const retry = () => {
    setFallback(false);
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current)
          iframeRef.current.src = embedUrl;
      }, 100);
    }
  };

  if (fallback) {
    return (
      <div className="relative w-full h-full min-h-[400px] bg-gray-900 flex flex-col items-center justify-center p-6">
        <h3 className="text-xl text-white mb-4">{title}</h3>
        <button
          onClick={openNew}
          className="mb-2 px-4 py-2 bg-secondary text-primary rounded"
        >
          Abrir em nova janela
        </button>
        <button
          onClick={retry}
          className="px-3 py-1 text-gray-400"
        >
          Voltar
        </button>
        {thumbnailUrl && (
          <div className="mt-4 relative w-full h-24 opacity-50 rounded overflow-hidden">
            <Image
              src={thumbnailUrl}
              alt="thumb"
              fill
              className="object-cover"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px] bg-black">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
          <Loader2
            className="animate-spin text-secondary"
            size={32}
          />
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full h-full border-none"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        onLoad={handleLoad}
        loading="eager"
        title={title}
      />
      {!isLoading && (
        <button
          onClick={() => setFallback(true)}
          className="absolute top-4 right-4 p-2 bg-gray-800/80 rounded"
          title="Abrir em nova janela"
        >
          <ExternalLink size={14} />
        </button>
      )}
    </div>
  );
}
