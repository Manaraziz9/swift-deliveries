import { cn } from '@/lib/utils';

interface SearchChipsProps {
  chips: string[];
  onSelect: (chip: string) => void;
}

export default function SearchChips({ chips, onSelect }: SearchChipsProps) {
  return (
    <div className="container pb-2 overflow-x-auto">
      <div className="flex gap-2 pb-1">
        {chips.map(chip => (
          <button
            key={chip}
            onClick={() => onSelect(chip)}
            className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
