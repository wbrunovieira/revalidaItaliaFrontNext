'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Environment3DProps } from '../registry';
import Environment3DContainer from '../Environment3DContainer';

// Import data from extracted modules
import { ANATOMY_HOTSPOTS } from './data';

// Import UI components
import { ModeToggle, ChallengeModeUI, ConsultationModeUI, ScriviModeUI, BodyPartsPanel } from './components/ui';

// Import scene components
import { Scene } from './components/scene';

// Import hooks
import { useChallengeMode, useConsultationMode, useScriviMode } from './hooks';

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


        {/* Mode Toggle */}
        <ModeToggle
          gameMode={gameMode}
          setGameMode={setGameMode}
          isModeMenuExpanded={isModeMenuExpanded}
          setIsModeMenuExpanded={setIsModeMenuExpanded}
          startChallenge={startChallenge}
          startConsultation={startConsultation}
          startScrivi={startScrivi}
          exitChallenge={exitChallenge}
          exitConsultation={exitConsultation}
          exitScrivi={exitScrivi}
        />


        {/* Challenge Mode UI */}
        {gameMode === 'challenge' && (
          <ChallengeModeUI
            focusedPart={focusedPart}
            setFocusedPart={setFocusedPart}
            challengeState={challengeState}
            currentTargetLabel={currentTargetLabel}
            completedHotspots={completedHotspots}
            score={score}
            showCorrectAnswer={showCorrectAnswer}
            getElapsedTime={getElapsedTime}
            restartChallenge={restartChallenge}
            exitChallenge={exitChallenge}
          />
        )}


        {/* Consultation Mode UI */}
        {gameMode === 'consultation' && (
          <ConsultationModeUI
            focusedPart={focusedPart}
            setFocusedPart={setFocusedPart}
            consultationState={consultationState}
            consultationRound={consultationRound}
            consultationScore={consultationScore}
            isAudioPlaying={isAudioPlaying}
            lastAnswerCorrect={lastAnswerCorrect}
            replayConsultationAudio={replayConsultationAudio}
            startConsultation={startConsultation}
            exitConsultation={exitConsultation}
            getConsultationDiagnosis={getConsultationDiagnosis}
          />
        )}
        {/* Scrivi Mode UI */}
        {gameMode === 'scrivi' && (
          <ScriviModeUI
            focusedPart={focusedPart}
            setFocusedPart={setFocusedPart}
            scriviState={scriviState}
            scriviRound={scriviRound}
            scriviScore={scriviScore}
            scriviInput={scriviInput}
            scriviAnswerFeedback={scriviAnswerFeedback}
            scriviInputRef={scriviInputRef}
            currentScriviLabel={currentScriviLabel}
            setScriviInput={setScriviInput}
            handleScriviSubmit={handleScriviSubmit}
            startScrivi={startScrivi}
            exitScrivi={exitScrivi}
            getScriviDiagnosis={getScriviDiagnosis}
          />
        )}

        {/* Body Parts Panel - Study Mode */}
        {gameMode === 'study' && (
          <BodyPartsPanel
            focusedPart={focusedPart}
            setFocusedPart={setFocusedPart}
            audioVolume={audioVolume}
            setAudioVolume={setAudioVolume}
            headExpanded={headExpanded}
            setHeadExpanded={setHeadExpanded}
            torsoExpanded={torsoExpanded}
            setTorsoExpanded={setTorsoExpanded}
            legsExpanded={legsExpanded}
            setLegsExpanded={setLegsExpanded}
            handExpanded={handExpanded}
            setHandExpanded={setHandExpanded}
            playingHotspotId={playingHotspotId}
            handlePlayFromMenu={handlePlayFromMenu}
          />
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
