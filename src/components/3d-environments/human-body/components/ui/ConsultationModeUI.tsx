'use client';

import { BODY_PARTS } from '../../data';
import { FullscreenButton } from './FullscreenButton';

const CONSULTATION_ROUNDS = 10;

interface ConsultationModeUIProps {
  focusedPart: string;
  setFocusedPart: (part: string) => void;
  consultationState: 'idle' | 'playing' | 'finished';
  consultationRound: number;
  consultationScore: number;
  isAudioPlaying: boolean;
  lastAnswerCorrect: boolean | null;
  replayConsultationAudio: () => void;
  startConsultation: () => void;
  exitConsultation: () => void;
  getConsultationDiagnosis: () => { emoji: string; title: string; message: string };
}

export function ConsultationModeUI({
  focusedPart,
  setFocusedPart,
  consultationState,
  consultationRound,
  consultationScore,
  isAudioPlaying,
  lastAnswerCorrect,
  replayConsultationAudio,
  startConsultation,
  exitConsultation,
  getConsultationDiagnosis,
}: ConsultationModeUIProps) {
  return (
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
            {/* Fullscreen Button */}
            <FullscreenButton compact />
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
            {/* Fullscreen Button */}
            <div className="border-t border-white/10 mt-2 pt-2">
              <FullscreenButton />
            </div>
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
  );
}
