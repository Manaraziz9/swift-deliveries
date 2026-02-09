import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export default function SplashScreen({ onComplete, duration = 2500 }: SplashScreenProps) {
  const [phase, setPhase] = useState<'dots' | 'settle' | 'exit'>('dots');

  useEffect(() => {
    // Dots animation phase
    const settleTimer = setTimeout(() => setPhase('settle'), 1800);
    // Exit phase
    const exitTimer = setTimeout(() => setPhase('exit'), duration - 300);
    // Complete
    const completeTimer = setTimeout(onComplete, duration);

    return () => {
      clearTimeout(settleTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, duration]);

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ya-primary transition-opacity duration-300",
        phase === 'exit' && "opacity-0"
      )}
    >
      {/* Logo: YA• */}
      <div className="flex items-center gap-1 animate-fade-in">
        <span className="text-5xl sm:text-6xl font-bold text-white tracking-tight font-en">
          YA
        </span>
        <span 
          className={cn(
            "w-3 h-3 rounded-full bg-ya-highlight mt-1",
            phase === 'dots' && "animate-splash-dot-pulse"
          )}
        />
      </div>

      {/* Animated dots: Call → Act → Done */}
      <div className="flex items-center gap-2 mt-8 h-4">
        {phase === 'dots' && (
          <>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-ya-accent animate-splash-dot-appear"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
            <span
              className="w-2.5 h-2.5 rounded-full bg-ya-highlight animate-splash-dot-gold"
              style={{ animationDelay: '600ms' }}
            />
          </>
        )}
      </div>

      {/* Tagline */}
      <p 
        className={cn(
          "text-white/70 text-sm sm:text-base mt-8 font-light tracking-wide opacity-0",
          phase !== 'dots' && "animate-fade-in"
        )}
        style={{ animationDelay: '0.2s' }}
      >
        When you call, we act.
      </p>
    </div>
  );
}
