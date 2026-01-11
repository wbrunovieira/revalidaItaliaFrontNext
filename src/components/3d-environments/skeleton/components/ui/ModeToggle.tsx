'use client';

type GameMode = 'study' | 'challenge' | 'consultation' | 'scrivi';

interface ModeToggleProps {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  isModeMenuExpanded: boolean;
  setIsModeMenuExpanded: (expanded: boolean) => void;
  startChallenge: () => void;
  startConsultation: () => void;
  startScrivi: () => void;
  exitChallenge: () => void;
  exitConsultation: () => void;
  exitScrivi: () => void;
}

export function ModeToggle({
  gameMode,
  setGameMode,
  isModeMenuExpanded,
  setIsModeMenuExpanded,
  startChallenge,
  startConsultation,
  startScrivi,
  exitChallenge,
  exitConsultation,
  exitScrivi,
}: ModeToggleProps) {
  const handleStudyClick = () => {
    if (gameMode === 'challenge') exitChallenge();
    else if (gameMode === 'consultation') exitConsultation();
    else if (gameMode === 'scrivi') exitScrivi();
    else setGameMode('study');
  };

  return (
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
              onClick={handleStudyClick}
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
                    Esplora lo scheletro
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
              onClick={handleStudyClick}
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
  );
}
