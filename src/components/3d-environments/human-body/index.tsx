'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Environment3DProps } from '../registry';
import Environment3DContainer from '../Environment3DContainer';

// Import data from extracted modules
import {
  BODY_PARTS,
  ANATOMY_HOTSPOTS,
  HEAD_HOTSPOTS,
  TORSO_HOTSPOTS,
  LEGS_HOTSPOTS,
  HAND_HOTSPOTS,
} from './data';

// Import UI components
import { BodyPartButton, HotspotMenuItem, FullscreenButton } from './components/ui';

// Import scene components
import { Scene } from './components/scene';

// Import hooks
import { useChallengeMode, useConsultationMode, useScriviMode } from './hooks';

// Game mode constants
const CONSULTATION_ROUNDS = 10;
const SCRIVI_ROUNDS = 10;

export default function HumanBodyEnvironment({}: Environment3DProps) {
  // Basic state
  const [bodyRotation, setBodyRotation] = useState(0);
  const [focusedPart, setFocusedPart] = useState('full');
  const [audioVolume, setAudioVolume] = useState(0.7);
  const [headExpanded, setHeadExpanded] = useState(false);
  const [torsoExpanded, setTorsoExpanded] = useState(false);
  const [legsExpanded, setLegsExpanded] = useState(false);
  const [handExpanded, setHandExpanded] = useState(false);
  const [playingHotspotId, setPlayingHotspotId] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<'study' | 'challenge' | 'consultation' | 'scrivi'>('study');
  const [isModeMenuExpanded, setIsModeMenuExpanded] = useState(true);

  // Refs
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const menuAudioRef = useRef<HTMLAudioElement | null>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);

  // Game mode hooks
  const {
    challengeState,
    currentTargetId,
    score,
    completedHotspots,
    showCorrectAnswer,
    currentTargetLabel,
    startChallenge,
    handleChallengeClick,
    restartChallenge,
    exitChallenge,
    getElapsedTime,
  } = useChallengeMode(setGameMode, setFocusedPart);

  const {
    consultationState,
    consultationRound,
    consultationScore,
    consultationTargetId,
    isAudioPlaying,
    lastAnswerCorrect,
    showCorrectAnswer: showConsultationCorrectAnswer,
    startConsultation,
    handleConsultationClick,
    replayConsultationAudio,
    exitConsultation,
    getConsultationDiagnosis,
  } = useConsultationMode(audioVolume, setGameMode, setFocusedPart);

  const {
    scriviState,
    scriviRound,
    scriviScore,
    scriviTargetId,
    scriviInput,
    scriviAnswerFeedback,
    scriviInputRef,
    currentScriviLabel,
    setScriviInput,
    startScrivi,
    handleScriviSubmit,
    exitScrivi,
    getScriviDiagnosis,
  } = useScriviMode(setGameMode, setFocusedPart);

  // Play audio from menu
  const handlePlayFromMenu = useCallback(
    (hotspotId: string) => {
      const hotspot = ANATOMY_HOTSPOTS.find(h => h.id === hotspotId);
      if (!hotspot?.audioUrl) return;

      // Stop any currently playing audio
      if (menuAudioRef.current) {
        menuAudioRef.current.pause();
        menuAudioRef.current.currentTime = 0;
      }

      const audio = new Audio(hotspot.audioUrl);
      audio.volume = audioVolume;
      menuAudioRef.current = audio;

      audio.onplay = () => {
        setPlayingHotspotId(hotspotId);
      };

      audio.onended = () => {
        setPlayingHotspotId(null);
      };

      audio.onerror = () => {
        setPlayingHotspotId(null);
        console.error('Error playing audio:', hotspot.audioUrl);
      };

      audio.play().catch(err => {
        console.error('Error playing audio:', err);
        setPlayingHotspotId(null);
      });
    },
    [audioVolume]
  );

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (menuAudioRef.current) {
        menuAudioRef.current.pause();
        menuAudioRef.current = null;
      }
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    lastX.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - lastX.current;
    lastX.current = e.clientX;
    setBodyRotation(prev => prev + deltaX * 0.01);
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  return (
    <Environment3DContainer title="Corpo Umano - Anatomia">
      <div
        style={{ width: '100%', height: '100%', cursor: isDragging.current ? 'grabbing' : 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <Canvas
          shadows
          camera={{
            position: [0, 0.5, 5],
            fov: 50,
            near: 0.1,
            far: 100,
          }}
        >
          <color attach="background" args={['#1a1a2e']} />
          <fog attach="fog" args={['#1a1a2e', 8, 20]} />
          <Scene
            bodyRotation={bodyRotation}
            focusedPart={focusedPart}
            controlsRef={controlsRef}
            audioVolume={audioVolume}
            activeHotspotId={playingHotspotId}
            gameMode={gameMode}
            challengeMode={gameMode === 'challenge' || gameMode === 'consultation'}
            challengeTargetId={
              gameMode === 'challenge' ? currentTargetId : gameMode === 'consultation' ? consultationTargetId : null
            }
            showCorrectAnswer={gameMode === 'challenge' ? showCorrectAnswer : showConsultationCorrectAnswer}
            scriviTargetId={gameMode === 'scrivi' ? scriviTargetId : null}
            isScriviMode={gameMode === 'scrivi'}
            onChallengeClick={
              gameMode === 'challenge'
                ? handleChallengeClick
                : gameMode === 'consultation'
                ? handleConsultationClick
                : undefined
            }
          />
        </Canvas>

        {/* Mode Toggle - Collapsible Version */}
        <div className="absolute top-14 left-4 z-20">
          {isModeMenuExpanded ? (
            /* Expanded Version */
            <div className="bg-[#0C3559]/95 backdrop-blur-md rounded-xl p-2 md:p-4 shadow-2xl border-2 border-[#3887A6]/40 md:min-w-[280px] transition-all duration-300">
              {/* Header with label and collapse button */}
              <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-[#3887A6]/30">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3887A6] animate-pulse"></div>
                  <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">Modalità</span>
                </div>
                <button
                  onClick={() => setIsModeMenuExpanded(false)}
                  className="p-1 rounded-md hover:bg-[#3887A6]/30 transition-colors"
                  title="Riduci menu"
                >
                  <svg
                    className="w-4 h-4 text-white/60 hover:text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Mode Buttons - Vertical */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    if (gameMode === 'challenge') exitChallenge();
                    else if (gameMode === 'consultation') exitConsultation();
                    else if (gameMode === 'scrivi') exitScrivi();
                    else setGameMode('study');
                  }}
                  className={`group relative px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    gameMode === 'study'
                      ? 'bg-gradient-to-r from-[#3887A6] to-[#4a9dc0] text-white shadow-lg shadow-[#3887A6]/50 scale-[1.02]'
                      : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90 hover:scale-[1.01]'
                  }`}
                  title="Modalità Studio"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    <div className="flex-1 text-left">
                      <div className="font-bold">Studio</div>
                      <div
                        className={`text-xs mt-0.5 transition-opacity ${
                          gameMode === 'study' ? 'text-white/90' : 'text-white/40'
                        }`}
                      >
                        Esplora l&apos;anatomia
                      </div>
                    </div>
                    {gameMode === 'study' && (
                      <span className="flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={startChallenge}
                  className={`group relative px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    gameMode === 'challenge'
                      ? 'bg-gradient-to-r from-[#3887A6] to-[#4a9dc0] text-white shadow-lg shadow-[#3887A6]/50 scale-[1.02]'
                      : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90 hover:scale-[1.01]'
                  }`}
                  title="Modalità Trova"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="flex-1 text-left">
                      <div className="font-bold">Trova</div>
                      <div
                        className={`text-xs mt-0.5 transition-opacity ${
                          gameMode === 'challenge' ? 'text-white/90' : 'text-white/40'
                        }`}
                      >
                        Testa le conoscenze
                      </div>
                    </div>
                    {gameMode === 'challenge' && (
                      <span className="flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={startConsultation}
                  className={`group relative px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    gameMode === 'consultation'
                      ? 'bg-gradient-to-r from-[#3887A6] to-[#4a9dc0] text-white shadow-lg shadow-[#3887A6]/50 scale-[1.02]'
                      : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90 hover:scale-[1.01]'
                  }`}
                  title="Simulazione Medica"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <div className="flex-1 text-left">
                      <div className="font-bold">Ascolta</div>
                      <div
                        className={`text-xs mt-0.5 transition-opacity ${
                          gameMode === 'consultation' ? 'text-white/90' : 'text-white/40'
                        }`}
                      >
                        Pratica l&apos;ascolto
                      </div>
                    </div>
                    {gameMode === 'consultation' && (
                      <span className="flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                      </span>
                    )}
                  </div>
                </button>

                <button
                  onClick={startScrivi}
                  className={`group relative px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    gameMode === 'scrivi'
                      ? 'bg-gradient-to-r from-[#FF9F43] to-[#FFC107] text-white shadow-lg shadow-[#FF9F43]/50 scale-[1.02]'
                      : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90 hover:scale-[1.01]'
                  }`}
                  title="Modalità Scrivi"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    <div className="flex-1 text-left">
                      <div className="font-bold">Scrivi</div>
                      <div
                        className={`text-xs mt-0.5 transition-opacity ${
                          gameMode === 'scrivi' ? 'text-white/90' : 'text-white/40'
                        }`}
                      >
                        Pratica di scrittura
                      </div>
                    </div>
                    {gameMode === 'scrivi' && (
                      <span className="flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                      </span>
                    )}
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* Collapsed Version - Minimal icons only */
            <div className="bg-[#0C3559]/95 backdrop-blur-md rounded-xl p-2 shadow-2xl border-2 border-[#3887A6]/40 transition-all duration-300">
              <div className="flex flex-col gap-1.5">
                {/* Expand button */}
                <button
                  onClick={() => setIsModeMenuExpanded(true)}
                  className="p-2 rounded-lg bg-[#3887A6]/30 hover:bg-[#3887A6]/50 transition-colors mb-1"
                  title="Espandi menu"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>

                {/* Study Mode */}
                <button
                  onClick={() => {
                    if (gameMode === 'challenge') exitChallenge();
                    else if (gameMode === 'consultation') exitConsultation();
                    else if (gameMode === 'scrivi') exitScrivi();
                    else setGameMode('study');
                  }}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    gameMode === 'study'
                      ? 'bg-gradient-to-r from-[#3887A6] to-[#4a9dc0] text-white shadow-lg'
                      : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90'
                  }`}
                  title="Studio"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </button>

                {/* Challenge Mode */}
                <button
                  onClick={startChallenge}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    gameMode === 'challenge'
                      ? 'bg-gradient-to-r from-[#3887A6] to-[#4a9dc0] text-white shadow-lg'
                      : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90'
                  }`}
                  title="Trova"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>

                {/* Consultation Mode */}
                <button
                  onClick={startConsultation}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    gameMode === 'consultation'
                      ? 'bg-gradient-to-r from-[#3887A6] to-[#4a9dc0] text-white shadow-lg'
                      : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90'
                  }`}
                  title="Ascolta"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </button>

                {/* Scrivi Mode */}
                <button
                  onClick={startScrivi}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    gameMode === 'scrivi'
                      ? 'bg-gradient-to-r from-[#FF9F43] to-[#FFC107] text-white shadow-lg'
                      : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90'
                  }`}
                  title="Scrivi"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Challenge Mode UI */}
        {gameMode === 'challenge' && (
          <>
            {/* Challenge Body Parts Navigation - Responsive */}
            {/* Mobile: Bottom horizontal bar */}
            <div className="md:hidden absolute bottom-16 left-0 right-0 z-20 px-2">
              <div className="bg-[#0C3559]/95 backdrop-blur-sm rounded-xl p-2 shadow-xl border border-[#3887A6]/30">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {BODY_PARTS.map(part => (
                    <button
                      key={part.id}
                      onClick={() => setFocusedPart(part.id)}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                        focusedPart === part.id
                          ? 'bg-gradient-to-r from-[#3887A6] to-[#4a9dc0] text-white shadow-lg'
                          : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90'
                      }`}
                      title={part.label}
                    >
                      <span className="text-lg">{part.icon}</span>
                      <span className="text-[10px] font-medium whitespace-nowrap">{part.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop: Right side panel */}
            <div className="hidden md:block absolute top-16 right-4 z-20">
              <div className="bg-[#0C3559] backdrop-blur-sm rounded-lg p-3 shadow-xl border border-[#3887A6]/30">
                <div className="text-xs text-white/60 font-medium mb-2 px-1">Naviga</div>
                <div className="flex flex-col gap-2">
                  {BODY_PARTS.map((part, index) => (
                    <div key={part.id}>
                      <button
                        onClick={() => setFocusedPart(part.id)}
                        className={`
                          w-full px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
                          flex items-center gap-2 border-2 whitespace-nowrap
                          ${
                            focusedPart === part.id
                              ? 'bg-[#3887A6] text-white border-[#3887A6] shadow-md'
                              : 'bg-[#0F2940] text-white/70 border-transparent hover:bg-[#1a3a55] hover:text-white'
                          }
                        `}
                      >
                        <span className="text-base">{part.icon}</span>
                        {part.label}
                      </button>
                      {index === 0 && <div className="border-b border-white/10 my-2" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Challenge Prompt - Responsive */}
            {challengeState === 'playing' && currentTargetLabel && (
              <div className="absolute top-16 md:top-32 left-1/2 transform -translate-x-1/2 z-20">
                <div className="bg-[#0C3559] backdrop-blur-sm rounded-xl px-4 md:px-8 py-2 md:py-4 shadow-2xl border-2 border-[#3887A6]">
                  <div className="text-center">
                    <div className="text-white/60 text-xs md:text-sm mb-0.5 md:mb-1">Clicca su:</div>
                    <div className="text-white text-lg md:text-2xl font-bold">{currentTargetLabel}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Progress Bar - Responsive */}
            {challengeState === 'playing' && (
              <div className="absolute top-4 md:top-16 right-4 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 z-20">
                <div className="bg-[#0C3559] backdrop-blur-sm rounded-lg px-3 md:px-4 py-1.5 md:py-2 shadow-xl border border-[#3887A6]/30">
                  <div className="flex items-center gap-2 md:gap-4">
                    <div className="text-white/60 text-xs md:text-sm">
                      {completedHotspots.length}/{ANATOMY_HOTSPOTS.length}
                    </div>
                    <div className="w-20 md:w-48 h-1.5 md:h-2 bg-[#0F2940] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#4CAF50] transition-all duration-300"
                        style={{ width: `${(completedHotspots.length / ANATOMY_HOTSPOTS.length) * 100}%` }}
                      />
                    </div>
                    <div className="text-white/60 text-xs md:text-sm">⏱ {getElapsedTime()}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Lost Modal - Responsive */}
            {challengeState === 'lost' && !showCorrectAnswer && (
              <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/50 p-4">
                <div className="bg-[#0C3559] rounded-2xl p-4 md:p-8 shadow-2xl border-2 border-red-500 max-w-md text-center">
                  <div className="text-4xl md:text-6xl mb-2 md:mb-4">😢</div>
                  <h2 className="text-white text-xl md:text-2xl font-bold mb-1 md:mb-2">Sbagliato!</h2>
                  <p className="text-white/70 text-sm md:text-base mb-3 md:mb-4">
                    Hai completato {score} su {ANATOMY_HOTSPOTS.length} parti.
                  </p>
                  <div className="flex gap-2 md:gap-4 justify-center">
                    <button
                      onClick={restartChallenge}
                      className="px-4 md:px-6 py-2 md:py-3 bg-[#3887A6] text-white rounded-lg text-sm md:text-base font-medium hover:bg-[#2d6d8a] transition-all"
                    >
                      🔄 Riprova
                    </button>
                    <button
                      onClick={exitChallenge}
                      className="px-4 md:px-6 py-2 md:py-3 bg-[#0F2940] text-white/70 rounded-lg text-sm md:text-base font-medium hover:bg-[#1a3a55] transition-all"
                    >
                      📚 Studio
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Won Modal - Responsive */}
            {challengeState === 'won' && (
              <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/50 p-4">
                <div className="bg-[#0C3559] rounded-2xl p-4 md:p-8 shadow-2xl border-2 border-[#4CAF50] max-w-md text-center">
                  <div className="text-4xl md:text-6xl mb-2 md:mb-4">🎉</div>
                  <h2 className="text-white text-xl md:text-2xl font-bold mb-1 md:mb-2">Complimenti!</h2>
                  <p className="text-white/70 text-sm md:text-base mb-1 md:mb-2">
                    Hai completato tutte le {ANATOMY_HOTSPOTS.length} parti anatomiche!
                  </p>
                  <p className="text-[#4CAF50] text-lg md:text-xl font-bold mb-3 md:mb-4">Tempo: {getElapsedTime()}</p>
                  <div className="flex gap-2 md:gap-4 justify-center">
                    <button
                      onClick={restartChallenge}
                      className="px-4 md:px-6 py-2 md:py-3 bg-[#4CAF50] text-white rounded-lg text-sm md:text-base font-medium hover:bg-[#3d8b40] transition-all"
                    >
                      🔄 <span className="hidden md:inline">Gioca ancora</span>
                      <span className="md:hidden">Riprova</span>
                    </button>
                    <button
                      onClick={exitChallenge}
                      className="px-4 md:px-6 py-2 md:py-3 bg-[#0F2940] text-white/70 rounded-lg text-sm md:text-base font-medium hover:bg-[#1a3a55] transition-all"
                    >
                      📚 Studio
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Consultation Mode UI */}
        {gameMode === 'consultation' && (
          <>
            {/* Consultation Body Parts Navigation - Responsive */}
            {/* Mobile: Bottom horizontal bar */}
            <div className="md:hidden absolute bottom-16 left-0 right-0 z-20 px-2">
              <div className="bg-[#0C3559]/95 backdrop-blur-sm rounded-xl p-2 shadow-xl border border-[#3887A6]/30">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {BODY_PARTS.map(part => (
                    <button
                      key={part.id}
                      onClick={() => setFocusedPart(part.id)}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                        focusedPart === part.id
                          ? 'bg-gradient-to-r from-[#3887A6] to-[#4a9dc0] text-white shadow-lg'
                          : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90'
                      }`}
                      title={part.label}
                    >
                      <span className="text-lg">{part.icon}</span>
                      <span className="text-[10px] font-medium whitespace-nowrap">{part.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop: Right side panel */}
            <div className="hidden md:block absolute top-16 right-4 z-20">
              <div className="bg-[#0C3559] backdrop-blur-sm rounded-lg p-3 shadow-xl border border-[#3887A6]/30">
                <div className="text-xs text-white/60 font-medium mb-2 px-1">Naviga</div>
                <div className="flex flex-col gap-2">
                  {BODY_PARTS.map((part, index) => (
                    <div key={part.id}>
                      <button
                        onClick={() => setFocusedPart(part.id)}
                        className={`
                          w-full px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
                          flex items-center gap-2 border-2 whitespace-nowrap
                          ${
                            focusedPart === part.id
                              ? 'bg-[#3887A6] text-white border-[#3887A6] shadow-md'
                              : 'bg-[#0F2940] text-white/70 border-transparent hover:bg-[#1a3a55] hover:text-white'
                          }
                        `}
                      >
                        <span className="text-base">{part.icon}</span>
                        {part.label}
                      </button>
                      {index === 0 && <div className="border-b border-white/10 my-2" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Patient Card - Audio indicator - Responsive */}
            {consultationState === 'playing' && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 md:top-32 md:left-auto md:translate-x-0 md:right-[200px] z-20">
                <div
                  className={`bg-[#0C3559] backdrop-blur-sm rounded-xl px-4 md:px-6 py-3 md:py-4 shadow-2xl border-2 transition-all duration-300 ${
                    lastAnswerCorrect === true
                      ? 'border-[#4CAF50]'
                      : lastAnswerCorrect === false
                      ? 'border-red-500'
                      : 'border-[#3887A6]'
                  }`}
                >
                  <div className="text-center">
                    {/* Feedback indicator */}
                    {lastAnswerCorrect !== null ? (
                      <div
                        className={`text-2xl md:text-4xl mb-1 md:mb-2 ${
                          lastAnswerCorrect ? 'animate-bounce' : 'animate-pulse'
                        }`}
                      >
                        {lastAnswerCorrect ? '✅' : '❌'}
                      </div>
                    ) : (
                      <div className="text-2xl md:text-4xl mb-1 md:mb-2">🏥</div>
                    )}
                    <div className="text-white/60 text-xs md:text-sm mb-0.5 md:mb-1">
                      {lastAnswerCorrect === true
                        ? 'Corretto!'
                        : lastAnswerCorrect === false
                        ? 'Sbagliato!'
                        : 'Il paziente parla...'}
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2 md:mb-3">
                      {isAudioPlaying ? (
                        <div className="flex gap-1 items-end h-4 md:h-6">
                          {[1, 2, 3, 4, 5].map(i => (
                            <div
                              key={i}
                              className="w-1 bg-[#4CAF50] rounded-sm"
                              style={{
                                animation: 'soundBar 0.4s ease-in-out infinite alternate',
                                animationDelay: `${i * 0.08}s`,
                              }}
                            />
                          ))}
                        </div>
                      ) : lastAnswerCorrect === null ? (
                        <div className="text-white/40 text-xs md:text-sm">Audio terminato</div>
                      ) : null}
                    </div>
                    {lastAnswerCorrect === null && (
                      <button
                        onClick={replayConsultationAudio}
                        className="px-3 md:px-4 py-1.5 md:py-2 bg-[#3887A6] text-white rounded-lg text-xs md:text-sm font-medium hover:bg-[#2d6d8a] transition-all flex items-center gap-2 mx-auto"
                      >
                        🔄 <span className="hidden md:inline">Ascolta di nuovo</span>
                        <span className="md:hidden">Replay</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Progress Bar - Responsive */}
            {consultationState === 'playing' && (
              <div className="absolute top-4 right-4 md:top-16 md:right-auto md:left-1/2 md:transform md:-translate-x-1/2 z-20">
                <div className="bg-[#0C3559] backdrop-blur-sm rounded-lg px-2 md:px-4 py-2 md:py-3 shadow-xl border border-[#3887A6]/30">
                  <div className="flex flex-col gap-1.5 md:gap-2">
                    {/* General progress */}
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="text-white/60 text-xs md:text-sm">
                        <span className="md:hidden">
                          {consultationRound}/{CONSULTATION_ROUNDS}
                        </span>
                        <span className="hidden md:inline w-24">
                          Ascolta {consultationRound}/{CONSULTATION_ROUNDS}
                        </span>
                      </div>
                      <div className="w-16 md:w-40 h-1.5 md:h-2 bg-[#0F2940] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#3887A6] transition-all duration-300"
                          style={{ width: `${(consultationRound / CONSULTATION_ROUNDS) * 100}%` }}
                        />
                      </div>
                    </div>
                    {/* Correct/Wrong counts - Hidden on mobile for space */}
                    <div className="hidden md:flex items-center gap-4 justify-center">
                      <div className="flex items-center gap-2">
                        <span className="text-[#4CAF50] text-sm">✅</span>
                        <div className="w-16 h-1.5 bg-[#0F2940] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#4CAF50] transition-all duration-300"
                            style={{ width: `${(consultationScore / CONSULTATION_ROUNDS) * 100}%` }}
                          />
                        </div>
                        <span className="text-[#4CAF50] text-sm font-medium">{consultationScore}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-400 text-sm">❌</span>
                        <div className="w-16 h-1.5 bg-[#0F2940] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500 transition-all duration-300"
                            style={{
                              width: `${((consultationRound - 1 - consultationScore) / CONSULTATION_ROUNDS) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-red-400 text-sm font-medium">
                          {Math.max(0, consultationRound - 1 - consultationScore)}
                        </span>
                      </div>
                    </div>
                    {/* Mobile: Compact score */}
                    <div className="flex md:hidden items-center gap-2 justify-center text-xs">
                      <span className="text-[#4CAF50]">✅{consultationScore}</span>
                      <span className="text-red-400">❌{Math.max(0, consultationRound - 1 - consultationScore)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Finished Modal - Responsive */}
            {consultationState === 'finished' && (
              <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/50 p-4">
                <div className="bg-[#0C3559] rounded-2xl p-4 md:p-8 shadow-2xl border-2 border-[#3887A6] max-w-md text-center">
                  <div className="text-4xl md:text-6xl mb-2 md:mb-4">{getConsultationDiagnosis().emoji}</div>
                  <h2 className="text-white text-xl md:text-2xl font-bold mb-1 md:mb-2">
                    {getConsultationDiagnosis().title}
                  </h2>
                  <p className="text-white/70 text-sm md:text-base mb-3 md:mb-4">
                    {getConsultationDiagnosis().message}
                  </p>
                  <div className="text-[#4CAF50] text-lg md:text-xl font-bold mb-3 md:mb-4">
                    Punteggio: {consultationScore}/{CONSULTATION_ROUNDS}
                  </div>
                  <div className="flex gap-2 md:gap-4 justify-center">
                    <button
                      onClick={startConsultation}
                      className="px-4 md:px-6 py-2 md:py-3 bg-[#3887A6] text-white rounded-lg text-sm md:text-base font-medium hover:bg-[#2d6d8a] transition-all"
                    >
                      🔄 <span className="hidden md:inline">Gioca ancora</span>
                      <span className="md:hidden">Riprova</span>
                    </button>
                    <button
                      onClick={exitConsultation}
                      className="px-4 md:px-6 py-2 md:py-3 bg-[#0F2940] text-white/70 rounded-lg text-sm md:text-base font-medium hover:bg-[#1a3a55] transition-all"
                    >
                      📚 Studio
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Scrivi Mode UI */}
        {gameMode === 'scrivi' && (
          <>
            {/* Scrivi Body Parts Navigation - Responsive */}
            {/* Mobile: Bottom horizontal bar */}
            <div className="md:hidden absolute bottom-16 left-0 right-0 z-20 px-2">
              <div className="bg-[#0C3559]/95 backdrop-blur-sm rounded-xl p-2 shadow-xl border border-[#FF9F43]/30">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {BODY_PARTS.filter(p => p.id !== 'rules').map(part => (
                    <button
                      key={part.id}
                      onClick={() => setFocusedPart(part.id)}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                        focusedPart === part.id
                          ? 'bg-gradient-to-r from-[#FF9F43] to-[#FFC107] text-white shadow-lg'
                          : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90'
                      }`}
                      title={part.label}
                    >
                      <span className="text-lg">{part.icon}</span>
                      <span className="text-[10px] font-medium whitespace-nowrap">{part.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop: Right side panel */}
            <div className="hidden md:block absolute top-16 right-4 z-20">
              <div className="bg-[#0C3559] backdrop-blur-sm rounded-lg p-3 shadow-xl border border-[#FF9F43]/30">
                <div className="text-xs text-white/60 font-medium mb-2 px-1">Naviga</div>
                <div className="flex flex-col gap-2">
                  {BODY_PARTS.filter(p => p.id !== 'rules').map(part => (
                    <button
                      key={part.id}
                      onClick={() => setFocusedPart(part.id)}
                      className={`
                        w-full px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
                        flex items-center gap-2 border-2 whitespace-nowrap
                        ${
                          focusedPart === part.id
                            ? 'bg-[#FF9F43] text-white border-[#FF9F43] shadow-md'
                            : 'bg-[#0F2940] text-white/70 border-transparent hover:bg-[#1a3a55] hover:text-white'
                        }
                      `}
                    >
                      <span className="text-base">{part.icon}</span>
                      {part.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input Card - Responsive */}
            {scriviState === 'playing' && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 md:top-32 md:left-auto md:translate-x-0 md:right-[200px] z-20">
                <div
                  className={`bg-[#0C3559] backdrop-blur-sm rounded-xl px-4 md:px-6 py-3 md:py-4 shadow-2xl border-2 transition-all duration-300 ${
                    scriviAnswerFeedback === 'correct'
                      ? 'border-[#4CAF50]'
                      : scriviAnswerFeedback === 'wrong'
                      ? 'border-red-500'
                      : 'border-[#FF9F43]'
                  }`}
                >
                  <div className="text-center">
                    {/* Feedback indicator */}
                    {scriviAnswerFeedback !== null ? (
                      <div
                        className={`text-2xl md:text-4xl mb-1 md:mb-2 ${
                          scriviAnswerFeedback === 'correct' ? 'animate-bounce' : 'animate-pulse'
                        }`}
                      >
                        {scriviAnswerFeedback === 'correct' ? '✅' : '❌'}
                      </div>
                    ) : (
                      <div className="text-2xl md:text-4xl mb-1 md:mb-2">✏️</div>
                    )}
                    <div className="text-white/60 text-xs md:text-sm mb-2">
                      {scriviAnswerFeedback === 'correct'
                        ? 'Corretto!'
                        : scriviAnswerFeedback === 'wrong'
                        ? `Era: ${currentScriviLabel}`
                        : 'Scrivi il nome della parte evidenziata'}
                    </div>

                    {/* Input field */}
                    {scriviAnswerFeedback === null && (
                      <form
                        onSubmit={e => {
                          e.preventDefault();
                          handleScriviSubmit();
                        }}
                        className="flex flex-col gap-2"
                      >
                        <input
                          ref={scriviInputRef}
                          type="text"
                          value={scriviInput}
                          onChange={e => setScriviInput(e.target.value)}
                          placeholder="Scrivi qui..."
                          className="w-full px-3 py-2 bg-[#0F2940] border border-[#FF9F43]/30 rounded-lg text-white placeholder-white/40 text-sm md:text-base focus:outline-none focus:border-[#FF9F43] transition-colors"
                          autoComplete="off"
                          autoCapitalize="none"
                        />
                        <button
                          type="submit"
                          disabled={!scriviInput.trim()}
                          className="px-4 py-2 bg-[#FF9F43] text-white rounded-lg text-sm font-medium hover:bg-[#e8903d] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <span>Conferma</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Progress Bar - Responsive */}
            {scriviState === 'playing' && (
              <div className="absolute top-4 right-4 md:top-16 md:right-auto md:left-1/2 md:transform md:-translate-x-1/2 z-20">
                <div className="bg-[#0C3559] backdrop-blur-sm rounded-lg px-2 md:px-4 py-2 md:py-3 shadow-xl border border-[#FF9F43]/30">
                  <div className="flex flex-col gap-1.5 md:gap-2">
                    {/* General progress */}
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="text-white/60 text-xs md:text-sm">
                        <span className="md:hidden">
                          {scriviRound}/{SCRIVI_ROUNDS}
                        </span>
                        <span className="hidden md:inline w-24">
                          Scrivi {scriviRound}/{SCRIVI_ROUNDS}
                        </span>
                      </div>
                      <div className="w-16 md:w-40 h-1.5 md:h-2 bg-[#0F2940] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#FF9F43] transition-all duration-300"
                          style={{ width: `${(scriviRound / SCRIVI_ROUNDS) * 100}%` }}
                        />
                      </div>
                    </div>
                    {/* Correct/Wrong counts - Hidden on mobile for space */}
                    <div className="hidden md:flex items-center gap-4 justify-center">
                      <div className="flex items-center gap-2">
                        <span className="text-[#4CAF50] text-sm">✅</span>
                        <div className="w-16 h-1.5 bg-[#0F2940] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#4CAF50] transition-all duration-300"
                            style={{ width: `${(scriviScore / SCRIVI_ROUNDS) * 100}%` }}
                          />
                        </div>
                        <span className="text-[#4CAF50] text-sm font-medium">{scriviScore}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-400 text-sm">❌</span>
                        <div className="w-16 h-1.5 bg-[#0F2940] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500 transition-all duration-300"
                            style={{
                              width: `${((scriviRound - 1 - scriviScore) / SCRIVI_ROUNDS) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-red-400 text-sm font-medium">
                          {Math.max(0, scriviRound - 1 - scriviScore)}
                        </span>
                      </div>
                    </div>
                    {/* Mobile: Compact score */}
                    <div className="flex md:hidden items-center gap-2 justify-center text-xs">
                      <span className="text-[#4CAF50]">✅{scriviScore}</span>
                      <span className="text-red-400">❌{Math.max(0, scriviRound - 1 - scriviScore)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Finished Modal - Responsive */}
            {scriviState === 'finished' && (
              <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/50 p-4">
                <div className="bg-[#0C3559] rounded-2xl p-4 md:p-8 shadow-2xl border-2 border-[#FF9F43] max-w-md text-center">
                  <div className="text-4xl md:text-6xl mb-2 md:mb-4">{getScriviDiagnosis().emoji}</div>
                  <h2 className="text-white text-xl md:text-2xl font-bold mb-1 md:mb-2">
                    {getScriviDiagnosis().title}
                  </h2>
                  <p className="text-white/70 text-sm md:text-base mb-3 md:mb-4">{getScriviDiagnosis().message}</p>
                  <div className="text-[#FF9F43] text-lg md:text-xl font-bold mb-3 md:mb-4">
                    Punteggio: {scriviScore}/{SCRIVI_ROUNDS}
                  </div>
                  <div className="flex gap-2 md:gap-4 justify-center">
                    <button
                      onClick={startScrivi}
                      className="px-4 md:px-6 py-2 md:py-3 bg-[#FF9F43] text-white rounded-lg text-sm md:text-base font-medium hover:bg-[#e8903d] transition-all"
                    >
                      🔄 <span className="hidden md:inline">Gioca ancora</span>
                      <span className="md:hidden">Riprova</span>
                    </button>
                    <button
                      onClick={exitScrivi}
                      className="px-4 md:px-6 py-2 md:py-3 bg-[#0F2940] text-white/70 rounded-lg text-sm md:text-base font-medium hover:bg-[#1a3a55] transition-all"
                    >
                      📚 Studio
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Body Parts Panel - Responsive Version */}
        {/* Mobile: Bottom horizontal bar with scroll */}
        {/* Desktop: Right side vertical panel */}
        {gameMode === 'study' && (
          <>
            {/* Mobile Version - Bottom horizontal bar */}
            <div className="md:hidden absolute bottom-16 left-0 right-0 z-20 px-2">
              <div className="bg-[#0C3559]/95 backdrop-blur-sm rounded-xl p-2 shadow-xl border border-[#3887A6]/30">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-[#3887A6]/50">
                  {/* Fullscreen button first */}
                  <FullscreenButton compact />
                  {/* Separator */}
                  <div className="w-px h-8 bg-white/20 flex-shrink-0" />
                  {BODY_PARTS.map(part => {
                    const displayLabel = part.id === 'rules' ? 'Istruzioni' : part.label;
                    return (
                      <button
                        key={part.id}
                        onClick={() => setFocusedPart(part.id)}
                        className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all ${
                          focusedPart === part.id
                            ? 'bg-gradient-to-r from-[#3887A6] to-[#4a9dc0] text-white shadow-lg'
                            : 'bg-[#0F2940] text-white/60 hover:bg-[#1a3a55] hover:text-white/90'
                        }`}
                        title={displayLabel}
                      >
                        <span className="text-lg">{part.icon}</span>
                        <span className="text-[10px] font-medium whitespace-nowrap">{displayLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Desktop Version - Right side panel */}
            <div className="hidden md:block absolute top-16 right-4 z-20">
              <div className="bg-[#0C3559] backdrop-blur-sm rounded-lg p-3 space-y-2 shadow-xl border border-[#3887A6]/30 max-h-[70vh] overflow-y-auto">
                {/* Fullscreen Button Section */}
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-white/60 font-medium px-1">Visualizzazione</div>
                  <FullscreenButton />
                  <div className="border-b border-white/10 my-1" />
                </div>

                <div className="flex flex-col gap-2">
                  {BODY_PARTS.map((part, index) => {
                    // Determine which hotspots and expanded state to use
                    const getExpandConfig = () => {
                      switch (part.id) {
                        case 'head':
                          return {
                            hotspots: HEAD_HOTSPOTS,
                            expanded: headExpanded,
                            toggle: () => setHeadExpanded(!headExpanded),
                            title: 'Dettagli della testa',
                          };
                        case 'torso':
                          return {
                            hotspots: TORSO_HOTSPOTS,
                            expanded: torsoExpanded,
                            toggle: () => setTorsoExpanded(!torsoExpanded),
                            title: 'Dettagli del torso',
                          };
                        case 'legs':
                          return {
                            hotspots: LEGS_HOTSPOTS,
                            expanded: legsExpanded,
                            toggle: () => setLegsExpanded(!legsExpanded),
                            title: 'Dettagli delle gambe',
                          };
                        case 'hand':
                          return {
                            hotspots: HAND_HOTSPOTS,
                            expanded: handExpanded,
                            toggle: () => setHandExpanded(!handExpanded),
                            title: 'Dettagli della mano',
                          };
                        default:
                          return null;
                      }
                    };

                    const expandConfig = getExpandConfig();
                    const hasExpander = expandConfig !== null;

                    // In study mode, show "Istruzioni" instead of "Regole"
                    const displayLabel = part.id === 'rules' ? 'Istruzioni' : part.label;

                    return (
                      <div key={part.id}>
                        <BodyPartButton
                          part={part}
                          isActive={focusedPart === part.id}
                          onClick={() => setFocusedPart(part.id)}
                          label={displayLabel}
                          hasExpander={hasExpander}
                          isExpanded={expandConfig?.expanded}
                          onExpandToggle={expandConfig?.toggle}
                        />
                        {/* Separator and label after Istruzioni */}
                        {index === 0 && (
                          <>
                            <div className="border-b border-white/10 my-2" />
                            <div className="text-xs text-white/60 font-medium mb-1 px-1">Parti del corpo</div>
                          </>
                        )}
                        {/* Expandable hotspots */}
                        {hasExpander && expandConfig && (
                          <div
                            className={`
                            overflow-hidden transition-all duration-300 ease-in-out
                            ${expandConfig.expanded ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'}
                          `}
                          >
                            <div className="bg-[#0a2a47] rounded-lg p-2 space-y-1 ml-2 border-l-2 border-[#3887A6]/50">
                              <div className="text-[10px] text-white/50 font-medium px-1 mb-1">
                                {expandConfig.title}
                              </div>
                              {expandConfig.hotspots.map(hotspot => {
                                const anatomyHotspot = ANATOMY_HOTSPOTS.find(h => h.id === hotspot.id);
                                return (
                                  <HotspotMenuItem
                                    key={hotspot.id}
                                    hotspot={hotspot}
                                    isPlaying={playingHotspotId === hotspot.id}
                                    transcription={anatomyHotspot?.transcription || ''}
                                    onPlay={() => handlePlayFromMenu(hotspot.id)}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Volume Control */}
                <div className="border-t border-white/10 pt-3 mt-3">
                  <div className="text-xs text-white/60 font-medium mb-2 px-1 flex items-center gap-2">
                    <span>🔊</span>
                    <span>Volume</span>
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <button
                      onClick={() => setAudioVolume(0)}
                      className="text-white/60 hover:text-white transition-colors"
                      title="Mute"
                    >
                      {audioVolume === 0 ? '🔇' : '🔈'}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={audioVolume}
                      onChange={e => setAudioVolume(parseFloat(e.target.value))}
                      className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-3
                      [&::-webkit-slider-thumb]:h-3
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-[#3887A6]
                      [&::-webkit-slider-thumb]:shadow-md
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:w-3
                      [&::-moz-range-thumb]:h-3
                      [&::-moz-range-thumb]:rounded-full
                      [&::-moz-range-thumb]:bg-[#3887A6]
                      [&::-moz-range-thumb]:border-0
                      [&::-moz-range-thumb]:cursor-pointer"
                    />
                    <span className="text-xs text-white/60 w-8 text-right">{Math.round(audioVolume * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* CSS for menu sound bar animation */}
        <style>{`
          @keyframes soundBar {
            0% { height: 4px; }
            100% { height: 12px; }
          }
        `}</style>
      </div>
    </Environment3DContainer>
  );
}
