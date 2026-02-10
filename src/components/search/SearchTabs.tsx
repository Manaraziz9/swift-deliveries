import { useLang } from '@/contexts/LangContext';
import { cn } from '@/lib/utils';

interface SearchTabsProps {
  active: 'all' | 'shops' | 'services';
  onChange: (tab: 'all' | 'shops' | 'services') => void;
}

export default function SearchTabs({ active, onChange }: SearchTabsProps) {
  const { lang } = useLang();

  const tabs: { key: 'all' | 'shops' | 'services'; label: string }[] = [
    { key: 'all', label: lang === 'ar' ? 'الكل' : 'All' },
    { key: 'shops', label: lang === 'ar' ? 'محلات' : 'Shops' },
    { key: 'services', label: lang === 'ar' ? 'خدمات' : 'Services' },
  ];

  return (
    <div className="flex gap-1">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            active === tab.key
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
