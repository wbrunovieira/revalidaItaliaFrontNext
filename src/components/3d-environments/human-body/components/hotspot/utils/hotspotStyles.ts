type HotspotType = 'point' | 'area';

interface HotspotStyleContext {
  hotspotType: HotspotType;
  isScriviTarget: boolean;
  isScriviMode: boolean;
  challengeMode: boolean;
  showCorrectAnswer: boolean;
  isActive: boolean;
  tooltipVisible: boolean;
  hovered: boolean;
  scriviColorPhase: number;
  getScriviTargetColor: () => string;
}

// Base colors based on hotspot type
// Point: Primary (#0C3559) - specific location
// Area: Secondary (#3887A6) - body region
export function getBaseColors(hotspotType: HotspotType) {
  const baseColor = hotspotType === 'area' ? '#3887A6' : '#0C3559';
  const hoverColor = hotspotType === 'area' ? '#4ECDC4' : '#3887A6';
  return { baseColor, hoverColor };
}

export function getHotspotColor(ctx: HotspotStyleContext): string {
  const { baseColor, hoverColor } = getBaseColors(ctx.hotspotType);

  if (ctx.isScriviTarget) return ctx.getScriviTargetColor();

  if (ctx.isScriviMode && !ctx.isScriviTarget) {
    // Scrivi mode non-target - show like study mode
    if (ctx.isActive) return '#4CAF50';
    if (ctx.tooltipVisible || ctx.hovered) return hoverColor;
    return baseColor;
  }

  if (ctx.challengeMode) {
    // Challenge/Consultation mode - hide unless hovered or correct answer
    if (ctx.showCorrectAnswer) return '#4CAF50';
    if (ctx.hovered) return hoverColor;
    return '#1a1a2e';
  }

  // Study mode - normal colors based on type
  if (ctx.isActive) return '#4CAF50';
  if (ctx.tooltipVisible || ctx.hovered) return hoverColor;
  return baseColor;
}

export function getHotspotEmissive(ctx: HotspotStyleContext): number {
  if (ctx.isScriviTarget) return 1.5 + ctx.scriviColorPhase * 1.5;

  if (ctx.isScriviMode && !ctx.isScriviTarget) {
    if (ctx.isActive) return 1.5;
    if (ctx.tooltipVisible || ctx.hovered) return 1.2;
    return 0.6;
  }

  if (ctx.challengeMode) {
    if (ctx.showCorrectAnswer) return 1.5;
    if (ctx.hovered) return 0.8;
    return 0.1;
  }

  if (ctx.isActive) return 1.5;
  if (ctx.tooltipVisible || ctx.hovered) return 1.2;
  return 0.6;
}

export function getHotspotOpacity(ctx: HotspotStyleContext): number {
  if (ctx.isScriviTarget) return 1.0;

  if (ctx.isScriviMode && !ctx.isScriviTarget) {
    if (ctx.isActive) return 0.9;
    if (ctx.tooltipVisible || ctx.hovered) return 0.9;
    return 0.5;
  }

  if (ctx.challengeMode) {
    if (ctx.showCorrectAnswer) return 0.9;
    return 0.1;
  }

  if (ctx.isActive) return 0.9;
  if (ctx.tooltipVisible || ctx.hovered) return 0.9;
  return 0.5;
}
