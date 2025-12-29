'use client';

import { Html } from '@react-three/drei';

interface HotspotTooltipProps {
  label: string;
  forms?: string;
  transcription?: string;
  audioUrl?: string;
  isZoomedView: boolean;
  isMobile: boolean;
  isActive: boolean;
  showTranscription: boolean;
  onPlayAudio: () => void;
  onCloseTranscription: () => void;
}

export function HotspotTooltip({
  label,
  forms,
  transcription,
  audioUrl,
  isZoomedView,
  isMobile,
  isActive,
  showTranscription,
  onPlayAudio,
  onCloseTranscription,
}: HotspotTooltipProps) {
  return (
    <Html
      position={[0, 0, 0]}
      distanceFactor={6}
      center={false}
      style={{
        pointerEvents: 'auto',
        transform: 'translate(0, -50%)',
      }}
    >
      <div
        style={{
          transform: isMobile ? 'scale(0.6)' : isZoomedView ? 'scale(0.5)' : 'scale(1)',
          transformOrigin: 'left center',
        }}
      >
        <div
          className="flex items-center"
          style={{
            animation: 'tooltipAppear 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {/* Connector line with gradient and rounded ends */}
          <div
            style={{
              width: isMobile ? '15px' : isZoomedView ? '25px' : '40px',
              height: isMobile ? '1px' : '2px',
              background: isActive
                ? 'linear-gradient(90deg, #4CAF50 0%, #2E7D32 50%, #4CAF50 100%)'
                : 'linear-gradient(90deg, #3887A6 0%, #0C3559 50%, #3887A6 100%)',
              borderRadius: '2px',
              boxShadow: isActive ? '0 0 6px rgba(76, 175, 80, 0.4)' : '0 0 6px rgba(56, 135, 166, 0.4)',
            }}
          />
          {/* Rounded connector dot */}
          <div
            style={{
              width: isMobile ? '3px' : isZoomedView ? '4px' : '6px',
              height: isMobile ? '3px' : isZoomedView ? '4px' : '6px',
              background: isActive
                ? 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)'
                : 'linear-gradient(135deg, #3887A6 0%, #0C3559 100%)',
              borderRadius: '50%',
              marginLeft: '-2px',
              boxShadow: isActive ? '0 0 8px rgba(76, 175, 80, 0.5)' : '0 0 8px rgba(56, 135, 166, 0.5)',
            }}
          />
          {/* Label box with animation */}
          <div
            className={`${
              isMobile ? 'px-1.5 py-0.5' : isZoomedView ? 'px-2 py-1' : 'px-4 py-2'
            } rounded-xl font-semibold flex flex-col gap-0.5`}
            style={{
              background: isActive
                ? 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)'
                : 'linear-gradient(135deg, #0C3559 0%, #0a2a47 100%)',
              border: isActive
                ? isMobile
                  ? '1px solid #4CAF50'
                  : '2px solid #4CAF50'
                : isMobile
                ? '1px solid #3887A6'
                : '2px solid #3887A6',
              borderRadius: isMobile ? '6px' : isZoomedView ? '8px' : '12px',
              color: '#ffffff',
              fontSize: isMobile ? '9px' : isZoomedView ? '10px' : '14px',
              boxShadow: isActive
                ? '0 4px 20px rgba(46, 125, 50, 0.4), 0 0 15px rgba(76, 175, 80, 0.3)'
                : '0 4px 20px rgba(12, 53, 89, 0.4), 0 0 15px rgba(56, 135, 166, 0.3)',
              marginLeft: '-2px',
              cursor: audioUrl ? 'pointer' : 'default',
              minWidth: showTranscription && transcription ? (isMobile ? '80px' : isZoomedView ? '120px' : '180px') : 'auto',
              maxWidth: isMobile ? '120px' : 'none',
            }}
            onClick={e => {
              e.stopPropagation();
              if (audioUrl) onPlayAudio();
            }}
          >
            <div className="flex items-center gap-1 whitespace-nowrap" style={{ gap: isMobile ? '2px' : '8px' }}>
              {label} {forms && <span style={{ opacity: 0.7, fontSize: '0.85em' }}>{forms}</span>}
              {/* Animated bars when playing */}
              {isActive && (
                <div
                  style={{
                    display: 'flex',
                    gap: isMobile ? '1px' : '2px',
                    alignItems: 'flex-end',
                    height: isMobile ? '8px' : isZoomedView ? '10px' : '14px',
                    marginLeft: isMobile ? '2px' : '4px',
                  }}
                >
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      style={{
                        width: isMobile ? '2px' : '3px',
                        background: '#fff',
                        borderRadius: '1px',
                        animation: `soundBarTooltip 0.5s ease-in-out infinite alternate`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            {/* Transcription shown for 8 seconds after audio plays */}
            {showTranscription && transcription && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                }}
              >
                <div
                  style={{
                    fontSize: isMobile ? '7px' : isZoomedView ? '8px' : '12px',
                    fontWeight: 400,
                    fontStyle: 'italic',
                    opacity: 0.9,
                    whiteSpace: isMobile ? 'nowrap' : 'normal',
                    overflow: isMobile ? 'hidden' : 'visible',
                    textOverflow: isMobile ? 'ellipsis' : 'clip',
                    maxWidth: isMobile ? '100px' : 'none',
                    flex: 1,
                  }}
                >
                  &ldquo;{transcription}&rdquo;
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTranscription();
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: isMobile ? '14px' : '18px',
                    height: isMobile ? '14px' : '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: isMobile ? '8px' : '10px',
                    color: '#fff',
                    flexShrink: 0,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes tooltipAppear {
          0% {
            opacity: 0;
            transform: translateX(-20px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes soundBarTooltip {
          0% { height: 4px; }
          100% { height: 14px; }
        }
      `}</style>
    </Html>
  );
}
