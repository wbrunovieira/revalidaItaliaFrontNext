// /src/components/ui/modern-divider.tsx
import { cn } from '@/lib/utils';

interface ModernDividerProps {
  variant?: 'center' | 'start' | 'end' | 'fade' | 'pulse';
  className?: string;
  glowColor?: 'primary' | 'secondary' | 'accent';
  thickness?: 'thin' | 'medium' | 'thick';
  spacing?: 'sm' | 'md' | 'lg';
}

export function ModernDivider({
  variant = 'center',
  className,
  glowColor = 'secondary',
  thickness = 'thin',
  spacing = 'md',
}: ModernDividerProps) {
  const glowColors = {
    primary: 'from-primary via-primary to-primary',
    secondary: 'from-secondary via-secondary to-secondary',
    accent: 'from-yellow-400 via-yellow-400 to-yellow-400',
  };

  const thicknessMap = {
    thin: 'h-px',
    medium: 'h-0.5',
    thick: 'h-1',
  };

  const spacingMap = {
    sm: 'my-4',
    md: 'my-6',
    lg: 'my-8',
  };

  const glowThicknessMap = {
    thin: 'h-1',
    medium: 'h-1.5',
    thick: 'h-2',
  };

  return (
    <div className={cn('relative', spacingMap[spacing], className)}>
      <div className="absolute inset-0 flex items-center">
        <div className={cn('w-full border-t border-white/10', thicknessMap[thickness])}></div>
      </div>
      
      {variant === 'center' && (
        <div className="relative flex justify-center">
          <span className="bg-primary px-4">
            <div className={cn(
              'w-16 bg-gradient-to-r from-transparent to-transparent rounded-full animate-pulse-subtle',
              glowColors[glowColor],
              glowThicknessMap[thickness]
            )}></div>
          </span>
        </div>
      )}

      {variant === 'start' && (
        <div className="relative flex justify-start">
          <span className="bg-primary pr-8">
            <div className={cn(
              'w-24 bg-gradient-to-r',
              glowColor === 'primary' ? 'from-primary to-transparent' :
              glowColor === 'secondary' ? 'from-secondary to-transparent' :
              'from-yellow-400 to-transparent',
              'rounded-full',
              glowThicknessMap[thickness]
            )}></div>
          </span>
        </div>
      )}

      {variant === 'end' && (
        <div className="relative flex justify-end">
          <span className="bg-primary pl-8">
            <div className={cn(
              'w-24 bg-gradient-to-l',
              glowColor === 'primary' ? 'from-primary to-transparent' :
              glowColor === 'secondary' ? 'from-secondary to-transparent' :
              'from-yellow-400 to-transparent',
              'rounded-full',
              glowThicknessMap[thickness]
            )}></div>
          </span>
        </div>
      )}

      {variant === 'fade' && (
        <div className="relative">
          <div className={cn(
            'w-full bg-gradient-to-r from-transparent via-white/20 to-transparent',
            thicknessMap[thickness]
          )}></div>
        </div>
      )}

      {variant === 'pulse' && (
        <div className="relative">
          <div className={cn(
            'w-full bg-gradient-to-r from-transparent to-transparent animate-pulse',
            glowColors[glowColor],
            thicknessMap[thickness]
          )}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-slide"></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple divider without glow effect
export function SimpleDivider({ 
  className, 
  spacing = 'md' 
}: { 
  className?: string; 
  spacing?: 'sm' | 'md' | 'lg';
}) {
  const spacingMap = {
    sm: 'my-2',
    md: 'my-3',
    lg: 'my-4',
  };

  return (
    <div className={cn('border-t border-white/5', spacingMap[spacing], className)} />
  );
}