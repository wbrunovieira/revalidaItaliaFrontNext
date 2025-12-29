'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Html } from '@react-three/drei';

// Hotspot type
type HotspotType = 'point' | 'area';

interface HotspotProps {
  position: [number, number, number];
  label: string;
  forms?: string; // Singular with article + plural, e.g., "(l'orecchio, le orecchie)"
  hotspotId: string;
  size?: number;
  audioUrl?: string;
  transcription?: string;
  volume?: number;
  isZoomedView?: boolean;
  isActiveFromMenu?: boolean;
  // Challenge mode props
  challengeMode?: boolean;
  showCorrectAnswer?: boolean;
  isScriviTarget?: boolean; // Highlight this hotspot as the target in scrivi mode
  isScriviMode?: boolean; // True when in scrivi mode (to show all hotspots)
  hotspotType?: HotspotType; // point = sphere, area = hexagon with ring
  onHover?: (isHovered: boolean) => void;
  onAudioPlay?: () => void;
  onChallengeClick?: (hotspotId: string) => void;
}

export function Hotspot({
  position,
  label,
  forms,
  hotspotId,
  size = 3,
  audioUrl,
  transcription,
  volume = 1,
  isZoomedView = false,
  isActiveFromMenu = false,
  challengeMode = false,
  showCorrectAnswer = false,
  isScriviTarget = false,
  isScriviMode = false,
  hotspotType = 'point',
  onHover,
  onAudioPlay,
  onChallengeClick,
}: HotspotProps) {
  const [hovered, setHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect touch device and mobile screen
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);

    // Check if mobile screen (< 768px)
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Show tooltip based on hover, touch, playing audio, or active from menu
  const tooltipVisible = showTooltip || hovered || isPlaying || isActiveFromMenu;

  // Combine playing states (local or from menu)
  const isActive = isPlaying || isActiveFromMenu;

  const handlePointerOver = () => {
    if (!isTouchDevice) {
      setHovered(true);
      onHover?.(true);
    }
  };

  const handlePointerOut = () => {
    if (!isTouchDevice) {
      setHovered(false);
      onHover?.(false);
    }
  };

  const playAudio = useCallback(() => {
    if (!audioUrl) return;

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(audioUrl);
    audio.volume = volume;
    audioRef.current = audio;

    audio.onplay = () => {
      setIsPlaying(true);
      onAudioPlay?.();

      // Show transcription with 8-second timeout
      if (transcriptionTimeoutRef.current) {
        clearTimeout(transcriptionTimeoutRef.current);
      }
      setShowTranscription(true);
      transcriptionTimeoutRef.current = setTimeout(() => {
        setShowTranscription(false);
      }, 8000);
    };

    audio.onended = () => {
      setIsPlaying(false);
    };

    audio.onerror = () => {
      setIsPlaying(false);
      console.error('Error playing audio:', audioUrl);
    };

    audio.play().catch(err => {
      console.error('Error playing audio:', err);
      setIsPlaying(false);
    });
  }, [audioUrl, volume, onAudioPlay]);

  const handleClick = useCallback(() => {
    // In challenge mode, notify parent of click
    if (challengeMode) {
      onChallengeClick?.(hotspotId);
      return;
    }

    // Clear any existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    // Show tooltip (both desktop and mobile)
    setShowTooltip(true);
    onHover?.(true);

    // Hide tooltip after 8 seconds (enough time to read transcription)
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
      onHover?.(false);
    }, 8000);

    // Play audio (both desktop and mobile)
    if (audioUrl) {
      playAudio();
    }
  }, [audioUrl, playAudio, onHover, challengeMode, hotspotId, onChallengeClick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      if (transcriptionTimeoutRef.current) {
        clearTimeout(transcriptionTimeoutRef.current);
      }
    };
  }, []);

  // Close transcription manually
  const closeTranscription = useCallback(() => {
    setShowTranscription(false);
    if (transcriptionTimeoutRef.current) {
      clearTimeout(transcriptionTimeoutRef.current);
    }
  }, []);

  // Pulsing animation for scrivi target - alternates between primary and secondary colors
  const [pulseScale, setPulseScale] = useState(1);
  const [scriviColorPhase, setScriviColorPhase] = useState(0); // 0 = primary, 1 = secondary

  useEffect(() => {
    if (!isScriviTarget) {
      setPulseScale(1);
      setScriviColorPhase(0);
      return;
    }

    // Animate pulse for scrivi target
    let frame: number;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      // Pulse between 1.0 and 1.3 scale
      const scale = 1 + Math.sin(elapsed * 4) * 0.15;
      setPulseScale(scale);
      // Alternate colors - use sin wave to smoothly transition (every ~0.5 seconds)
      const colorPhase = (Math.sin(elapsed * 6) + 1) / 2; // 0 to 1
      setScriviColorPhase(colorPhase);
      frame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(frame);
  }, [isScriviTarget]);

  // Interpolate between primary and secondary colors for scrivi target
  const getScriviTargetColor = () => {
    const primary = { r: 12, g: 53, b: 89 }; // #0C3559
    const secondary = { r: 56, g: 135, b: 166 }; // #3887A6
    const r = Math.round(primary.r + (secondary.r - primary.r) * scriviColorPhase);
    const g = Math.round(primary.g + (secondary.g - primary.g) * scriviColorPhase);
    const b = Math.round(primary.b + (secondary.b - primary.b) * scriviColorPhase);
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Base colors based on hotspot type
  // Point: Primary (#0C3559) - specific location
  // Area: Secondary (#3887A6) - body region
  const baseColor = hotspotType === 'area' ? '#3887A6' : '#0C3559';
  const hoverColor = hotspotType === 'area' ? '#4ECDC4' : '#3887A6'; // Lighter version on hover

  // In scrivi mode: show all hotspots like study mode, but target is animated
  const getHotspotColor = () => {
    if (isScriviTarget) return getScriviTargetColor(); // Animated color between primary and secondary
    if (isScriviMode && !isScriviTarget) {
      // Scrivi mode non-target - show like study mode
      if (isActive) return '#4CAF50';
      if (tooltipVisible || hovered) return hoverColor;
      return baseColor;
    }
    if (challengeMode) {
      // Challenge/Consultation mode - hide unless hovered or correct answer
      if (showCorrectAnswer) return '#4CAF50';
      if (hovered) return hoverColor;
      return '#1a1a2e';
    }
    // Study mode - normal colors based on type
    if (isActive) return '#4CAF50';
    if (tooltipVisible || hovered) return hoverColor;
    return baseColor;
  };

  const getHotspotEmissive = () => {
    if (isScriviTarget) return 1.5 + scriviColorPhase * 1.5; // Pulses between 1.5 and 3.0
    if (isScriviMode && !isScriviTarget) {
      // Scrivi mode non-target - show like study mode
      if (isActive) return 1.5;
      if (tooltipVisible || hovered) return 1.2;
      return 0.6;
    }
    if (challengeMode) {
      if (showCorrectAnswer) return 1.5;
      if (hovered) return 0.8;
      return 0.1;
    }
    if (isActive) return 1.5;
    if (tooltipVisible || hovered) return 1.2;
    return 0.6;
  };

  const getHotspotOpacity = () => {
    if (isScriviTarget) return 1.0;
    if (isScriviMode && !isScriviTarget) {
      // Scrivi mode non-target - show like study mode
      if (isActive) return 0.9;
      if (tooltipVisible || hovered) return 0.9;
      return 0.5;
    }
    if (challengeMode) {
      if (showCorrectAnswer) return 0.9;
      return 0.1;
    }
    if (isActive) return 0.9;
    if (tooltipVisible || hovered) return 0.9;
    return 0.5;
  };

  // Animation for area outer ring
  const [areaRingScale, setAreaRingScale] = useState(1);

  useEffect(() => {
    if (hotspotType !== 'area' || challengeMode) {
      setAreaRingScale(1);
      return;
    }

    // Gentle pulsing animation for area rings
    let frame: number;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      // Pulse between 1.0 and 1.15 scale (subtle)
      const scale = 1 + Math.sin(elapsed * 2) * 0.075;
      setAreaRingScale(scale);
      frame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(frame);
  }, [hotspotType, challengeMode]);

  return (
    <group position={position}>
      {/* Main hotspot - different geometry based on type */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        scale={isScriviTarget ? pulseScale : 1}
        rotation={hotspotType === 'area' ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}
      >
        {hotspotType === 'area' ? (
          // Hexagon (6-sided cylinder) for areas - flattened
          <cylinderGeometry args={[size * 1.2, size * 1.2, size * 0.4, 6]} />
        ) : (
          // Sphere for points
          <sphereGeometry args={[size, 16, 16]} />
        )}
        <meshStandardMaterial
          color={getHotspotColor()}
          emissive={getHotspotColor()}
          emissiveIntensity={getHotspotEmissive()}
        />
      </mesh>

      {/* Inner ring - for both types */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} scale={isScriviTarget ? pulseScale : 1}>
        <ringGeometry args={[size * 1.3, size * 1.7, hotspotType === 'area' ? 6 : 32]} />
        <meshStandardMaterial
          color={isScriviTarget ? '#3887A6' : showCorrectAnswer ? '#4CAF50' : getHotspotColor()}
          emissive={isScriviTarget ? '#3887A6' : undefined}
          emissiveIntensity={isScriviTarget ? 1.5 : 0}
          transparent
          opacity={getHotspotOpacity()}
        />
      </mesh>

      {/* Outer pulsing ring - only for areas (indicates region) */}
      {hotspotType === 'area' && !challengeMode && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} scale={areaRingScale}>
          <ringGeometry args={[size * 2.0, size * 2.3, 6]} />
          <meshStandardMaterial
            color={baseColor}
            emissive={baseColor}
            emissiveIntensity={0.4}
            transparent
            opacity={0.3}
          />
        </mesh>
      )}

      {/* Label tooltip - positioned to the right (hidden in challenge mode unless showing correct answer) */}
      {/* Mobile: Smaller and more compact */}
      {((!challengeMode && tooltipVisible) || showCorrectAnswer) && (
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
                  if (audioUrl) playAudio();
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
                        closeTranscription();
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
      )}
    </group>
  );
}
