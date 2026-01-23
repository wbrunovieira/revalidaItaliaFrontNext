'use client';

import {
  BONE_PARTS,
  BONE_HOTSPOTS,
  SKULL_HOTSPOTS,
  SPINE_HOTSPOTS,
  RIBCAGE_HOTSPOTS,
  PELVIS_HOTSPOTS,
  UPPER_LIMB_HOTSPOTS,
  LOWER_LIMB_HOTSPOTS,
} from '../../data';
import { BonePartButton } from './BonePartButton';
import { HotspotMenuItem } from './HotspotMenuItem';
import { FullscreenButton } from './FullscreenButton';

interface BonePartsPanelProps {
  focusedPart: string;
  setFocusedPart: (part: string) => void;
  audioVolume: number;
  setAudioVolume: (volume: number) => void;
  skullExpanded: boolean;
  setSkullExpanded: (expanded: boolean) => void;
  spineExpanded: boolean;
  setSpineExpanded: (expanded: boolean) => void;
  ribcageExpanded: boolean;
  setRibcageExpanded: (expanded: boolean) => void;
  pelvisExpanded: boolean;
  setPelvisExpanded: (expanded: boolean) => void;
  limbsExpanded: boolean;
  setLimbsExpanded: (expanded: boolean) => void;
  playingHotspotId: string | null;
  handlePlayFromMenu: (hotspotId: string) => void;
}

export function BonePartsPanel({
  focusedPart,
  setFocusedPart,
  audioVolume,
  setAudioVolume,
  skullExpanded,
  setSkullExpanded,
  spineExpanded,
  setSpineExpanded,
  ribcageExpanded,
  setRibcageExpanded,
  pelvisExpanded,
  setPelvisExpanded,
  limbsExpanded,
  setLimbsExpanded,
  playingHotspotId,
  handlePlayFromMenu,
}: BonePartsPanelProps) {
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
            {BONE_PARTS.map(part => {
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
            {BONE_PARTS.map((part, index) => {
              // Determine which hotspots and expanded state to use
              const getExpandConfig = () => {
                switch (part.id) {
                  case 'skull':
                    return {
                      hotspots: SKULL_HOTSPOTS,
                      expanded: skullExpanded,
                      toggle: () => setSkullExpanded(!skullExpanded),
                      title: 'Ossa del cranio',
                    };
                  case 'spine':
                    return {
                      hotspots: SPINE_HOTSPOTS,
                      expanded: spineExpanded,
                      toggle: () => setSpineExpanded(!spineExpanded),
                      title: 'Colonna vertebrale',
                    };
                  case 'ribcage':
                    return {
                      hotspots: RIBCAGE_HOTSPOTS,
                      expanded: ribcageExpanded,
                      toggle: () => setRibcageExpanded(!ribcageExpanded),
                      title: 'Gabbia toracica',
                    };
                  case 'pelvis':
                    return {
                      hotspots: PELVIS_HOTSPOTS,
                      expanded: pelvisExpanded,
                      toggle: () => setPelvisExpanded(!pelvisExpanded),
                      title: 'Ossa del bacino',
                    };
                  case 'limbs':
                    return {
                      hotspots: [...UPPER_LIMB_HOTSPOTS, ...LOWER_LIMB_HOTSPOTS],
                      expanded: limbsExpanded,
                      toggle: () => setLimbsExpanded(!limbsExpanded),
                      title: 'Ossa degli arti',
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
                  <BonePartButton
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
                      <div className="text-xs text-white/60 font-medium mb-1 px-1">Parti dello scheletro</div>
                    </>
                  )}
                  {/* Expandable hotspots */}
                  {hasExpander && expandConfig && (
                    <div
                      className={`
                      overflow-hidden transition-all duration-300 ease-in-out
                      ${expandConfig.expanded ? 'max-h-[300px] opacity-100 mt-2' : 'max-h-0 opacity-0'}
                    `}
                    >
                      <div className="bg-[#0a2a47] rounded-lg p-2 ml-2 border-l-2 border-[#3887A6]/50 max-h-[280px] overflow-y-auto
                        [&::-webkit-scrollbar]:w-1.5
                        [&::-webkit-scrollbar-track]:bg-[#0a2a47]
                        [&::-webkit-scrollbar-track]:rounded-full
                        [&::-webkit-scrollbar-thumb]:bg-[#3887A6]
                        [&::-webkit-scrollbar-thumb]:rounded-full
                        [&::-webkit-scrollbar-thumb]:hover:bg-[#4a9dc0]
                        scrollbar-thin scrollbar-track-[#0a2a47] scrollbar-thumb-[#3887A6]"
                      >
                        <div className="text-[10px] text-white/50 font-medium px-1 mb-1 sticky top-0 bg-[#0a2a47] pb-1">
                          {expandConfig.title}
                        </div>
                        <div className="space-y-1">
                          {expandConfig.hotspots.map(hotspot => {
                            const boneHotspot = BONE_HOTSPOTS.find(h => h.id === hotspot.id);
                            return (
                              <HotspotMenuItem
                                key={hotspot.id}
                                hotspot={hotspot}
                                isPlaying={playingHotspotId === hotspot.id}
                                transcription={boneHotspot?.transcription || ''}
                                onPlay={() => handlePlayFromMenu(hotspot.id)}
                              />
                            );
                          })}
                        </div>
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
