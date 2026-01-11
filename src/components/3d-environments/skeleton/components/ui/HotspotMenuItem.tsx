'use client';

interface HotspotMenuItemProps {
  hotspot: { id: string; label: string };
  isPlaying: boolean;
  transcription: string;
  onPlay: () => void;
}

export function HotspotMenuItem({ hotspot, isPlaying, transcription, onPlay }: HotspotMenuItemProps) {
  return (
    <button
      onClick={onPlay}
      className={`
        w-full px-2 py-1.5 rounded-md text-xs transition-all duration-200
        flex items-center gap-2 text-left
        ${isPlaying ? 'bg-[#2E7D32] text-white' : 'bg-[#0a2a47] text-white/80 hover:bg-[#1a3a55] hover:text-white'}
      `}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium">{hotspot.label}</div>
        {isPlaying && <div className="text-[10px] opacity-80 truncate italic mt-0.5">{transcription}</div>}
      </div>
      {isPlaying && (
        <div className="flex gap-0.5 items-end h-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="w-0.5 bg-white rounded-sm"
              style={{
                animation: 'soundBar 0.5s ease-in-out infinite alternate',
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}
    </button>
  );
}
