'use client';

import { RefObject } from 'react';
import { BODY_PARTS } from '../../data';
import { FullscreenButton } from './FullscreenButton';

const SCRIVI_ROUNDS = 10;

interface ScriviModeUIProps {
  focusedPart: string;
  setFocusedPart: (part: string) => void;
  scriviState: 'idle' | 'playing' | 'finished';
  scriviRound: number;
  scriviScore: number;
  scriviInput: string;
  scriviAnswerFeedback: 'correct' | 'wrong' | null;
  scriviInputRef: RefObject<HTMLInputElement | null>;
  currentScriviLabel: string;
  setScriviInput: (input: string) => void;
  handleScriviSubmit: () => void;
  startScrivi: () => void;
  exitScrivi: () => void;
  getScriviDiagnosis: () => { emoji: string; title: string; message: string };
}

export function ScriviModeUI({
  focusedPart,
  setFocusedPart,
  scriviState,
  scriviRound,
  scriviScore,
  scriviInput,
  scriviAnswerFeedback,
  scriviInputRef,
  currentScriviLabel,
  setScriviInput,
  handleScriviSubmit,
  startScrivi,
  exitScrivi,
  getScriviDiagnosis,
}: ScriviModeUIProps) {
  return (
    <>
      {/* Scrivi Body Parts Navigation - Responsive */}
      {/* Mobile: Bottom horizontal bar */}
      <div className="md:hidden absolute bottom-16 left-0 right-0 z-20 px-2">
        <div className="bg-[#0C3559]/95 backdrop-blur-sm rounded-xl p-2 shadow-xl border border-[#FF9F43]/30">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {/* Fullscreen button first */}
            <FullscreenButton compact />
            {/* Separator */}
            <div className="w-px h-8 bg-white/20 flex-shrink-0" />
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
          {/* Visualizzazione Section */}
          <div className="flex flex-col gap-2 mb-2">
            <div className="text-xs text-white/60 font-medium px-1">Visualizzazione</div>
            <FullscreenButton />
            <div className="border-b border-white/10 my-1" />
          </div>
          {/* Naviga Section */}
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
  );
}
