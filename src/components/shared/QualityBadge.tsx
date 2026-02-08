import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QualityBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function QualityBadge({ score, size = 'md', className }: QualityBadgeProps) {
  const sizes = {
    sm: 'text-xs px-1.5 py-0.5 gap-0.5',
    md: 'text-sm px-2 py-1 gap-1',
    lg: 'text-base px-3 py-1.5 gap-1.5',
  };

  return (
    <span className={cn(
      "inline-flex items-center rounded-full font-semibold bg-gradient-gold text-primary-foreground",
      sizes[size],
      className
    )}>
      <Star className={cn("fill-current", size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
      {score.toFixed(1)}
    </span>
  );
}
