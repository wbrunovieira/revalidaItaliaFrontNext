'use client';

import { BODY_PARTS, ANATOMY_HOTSPOTS } from '../../data';

interface ChallengeModeUIProps {
  focusedPart: string;
  setFocusedPart: (part: string) => void;
  challengeState: 'idle' | 'playing' | 'won' | 'lost';
  currentTargetLabel: string;
  completedHotspots: string[];
  score: number;
  showCorrectAnswer: boolean;
  getElapsedTime: () => string;
  restartChallenge: () => void;
  exitChallenge: () => void;
}

export function ChallengeModeUI({
  focusedPart,
  setFocusedPart,
  challengeState,
  currentTargetLabel,
  completedHotspots,
  score,
  showCorrectAnswer,
  getElapsedTime,
  restartChallenge,
  exitChallenge,
}: ChallengeModeUIProps) {
  return (
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
  );
}
