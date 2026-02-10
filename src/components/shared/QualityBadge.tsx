import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QualityBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function QualityBadge({ score, size = 'md', className }: QualityBadgeProps) {
  const sizes = {
    sm: 'text-xs px-2.5 py-1 gap-1',
    md: 'text-sm px-3 py-1.5 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  };

  const iconSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <span className={cn(
      "inline-flex items-center rounded-xl font-bold bg-ya-highlight text-foreground shadow-ya-highlight",
      sizes[size],
      className
    )}>
      <Star className={cn("fill-current", iconSizes[size])} />
      {score.toFixed(1)}
    </span>
  );
}
