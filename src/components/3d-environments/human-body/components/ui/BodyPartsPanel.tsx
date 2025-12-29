'use client';

import { BODY_PARTS, ANATOMY_HOTSPOTS, HEAD_HOTSPOTS, TORSO_HOTSPOTS, LEGS_HOTSPOTS, HAND_HOTSPOTS } from '../../data';
import { BodyPartButton } from './BodyPartButton';
import { HotspotMenuItem } from './HotspotMenuItem';
import { FullscreenButton } from './FullscreenButton';

interface BodyPartsPanelProps {
  focusedPart: string;
  setFocusedPart: (part: string) => void;
  audioVolume: number;
  setAudioVolume: (volume: number) => void;
  headExpanded: boolean;
  setHeadExpanded: (expanded: boolean) => void;
  torsoExpanded: boolean;
  setTorsoExpanded: (expanded: boolean) => void;
  legsExpanded: boolean;
  setLegsExpanded: (expanded: boolean) => void;
  handExpanded: boolean;
  setHandExpanded: (expanded: boolean) => void;
  playingHotspotId: string | null;
  handlePlayFromMenu: (hotspotId: string) => void;
}

export function BodyPartsPanel({
  focusedPart,
  setFocusedPart,
  audioVolume,
  setAudioVolume,
  headExpanded,
  setHeadExpanded,
  torsoExpanded,
  setTorsoExpanded,
  legsExpanded,
  setLegsExpanded,
  handExpanded,
  setHandExpanded,
  playingHotspotId,
  handlePlayFromMenu,
}: BodyPartsPanelProps) {
  return (
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
  );
}
