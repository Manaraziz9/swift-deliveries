import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceInputButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onToggle: () => void;
  className?: string;
}

export default function VoiceInputButton({ isListening, isSupported, onToggle, className }: VoiceInputButtonProps) {
  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "p-2 rounded-full transition-all duration-200",
        isListening
          ? "bg-destructive text-destructive-foreground animate-pulse"
          : "text-muted-foreground hover:text-primary hover:bg-primary/10",
        className
      )}
      aria-label={isListening ? 'Stop recording' : 'Start voice input'}
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}
