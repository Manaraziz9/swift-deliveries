import { useState, useCallback, useRef, useEffect } from 'react';
import { useLang } from '@/contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, ShoppingBag, RefreshCw, Search, Star, FlaskConical,
  ArrowLeft, ArrowRight, Sparkles, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Intent, INTENT_METADATA, getIntentMetadata } from '@/lib/orderIntentRules';
import { useIntentAnalytics } from '@/hooks/useIntentAnalytics';
import DraftsList from './DraftsList';
import { OrderDraft } from '@/hooks/useOrderDrafts';

const ICON_MAP = {
  Truck,
  ShoppingBag,
  RefreshCw,
  Search,
  Star,
  FlaskConical,
};

interface IntentSelectionProps {
  onSelect: (intent: Intent) => void;
  onDiscover?: () => void;
  onRate?: () => void;
  onRestoreDraft?: (draft: OrderDraft) => void;
}

// Long Press Hook
function useLongPress(callback: () => void, ms = 500) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  const start = useCallback(() => {
    setIsPressed(true);
    timerRef.current = setTimeout(() => {
      callback();
    }, ms);
  }, [callback, ms]);

  const stop = useCallback(() => {
    setIsPressed(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
    isPressed,
  };
}

// Animated Tooltip Component
function IntentTooltip({ 
  intent, 
  isVisible, 
  onClose 
}: { 
  intent: Intent; 
  isVisible: boolean; 
  onClose: () => void;
}) {
  const { lang, dir } = useLang();
  const metadata = getIntentMetadata(intent);

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible || !metadata) return null;

  return (
    <div 
      className={cn(
        "absolute inset-x-0 -bottom-2 translate-y-full z-50",
        "animate-fade-in"
      )}
      onClick={onClose}
    >
      <div className={cn(
        "mx-auto max-w-[90%] p-3 rounded-xl",
        "bg-popover/95 backdrop-blur-lg border shadow-lg",
        "text-sm text-center"
      )}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <Info className="h-4 w-4 text-primary" />
          <span className="font-bold">
            {lang === 'ar' ? metadata.titleAr : metadata.titleEn}
          </span>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {lang === 'ar' ? metadata.tooltipAr : metadata.tooltipEn}
        </p>
      </div>
    </div>
  );
}

export default function IntentSelection({ onSelect, onDiscover, onRate, onRestoreDraft }: IntentSelectionProps) {
  const { lang, dir } = useLang();
  const navigate = useNavigate();
  const [activeTooltip, setActiveTooltip] = useState<Intent | null>(null);
  const { trackIntentSelected } = useIntentAnalytics();
  
  const ArrowBack = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const handleIntentClick = useCallback((intent: Intent) => {
    const metadata = getIntentMetadata(intent);
    if (!metadata) return;

    // Track analytics
    trackIntentSelected(intent);

    if (intent === 'DISCOVER') {
      if (onDiscover) {
        onDiscover();
      } else {
        navigate('/search');
      }
      return;
    }

    if (intent === 'RATE') {
      if (onRate) {
        onRate();
      } else {
        navigate('/search?sort=quality');
      }
      return;
    }

    // Actionable intents proceed to order flow
    onSelect(intent);
  }, [onSelect, onDiscover, onRate, navigate, trackIntentSelected]);

  const handleLongPress = useCallback((intent: Intent) => {
    setActiveTooltip(intent);
  }, []);

  const handleRestoreDraft = useCallback((draft: OrderDraft) => {
    if (onRestoreDraft) {
      onRestoreDraft(draft);
    }
  }, [onRestoreDraft]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowBack className="h-4 w-4" />
              {lang === 'ar' ? 'رجوع' : 'Back'}
            </button>
            <h2 className="text-lg font-bold">{lang === 'ar' ? 'طلب جديد' : 'New Order'}</h2>
            <div className="w-16" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-6">
        {/* Saved Drafts */}
        <DraftsList 
          onSelectDraft={handleRestoreDraft}
          className="mb-6"
        />

        {/* Title with decorative element */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {lang === 'ar' ? 'اختر طريقتك' : 'Choose Your Way'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            {lang === 'ar' ? 'وش حاب تسوي اليوم؟' : 'What would you like to do today?'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {lang === 'ar' ? 'اضغط مطولاً لمعرفة المزيد عن كل خيار' : 'Long press for more info about each option'}
          </p>
        </div>

        {/* Intent Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INTENT_METADATA.map((intent, index) => (
            <IntentCard
              key={intent.code}
              intent={intent}
              index={index}
              isTooltipActive={activeTooltip === intent.code}
              onClick={() => handleIntentClick(intent.code)}
              onLongPress={() => handleLongPress(intent.code)}
              onTooltipClose={() => setActiveTooltip(null)}
              lang={lang}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Intent Card Component with Long Press
function IntentCard({
  intent,
  index,
  isTooltipActive,
  onClick,
  onLongPress,
  onTooltipClose,
  lang,
}: {
  intent: typeof INTENT_METADATA[0];
  index: number;
  isTooltipActive: boolean;
  onClick: () => void;
  onLongPress: () => void;
  onTooltipClose: () => void;
  lang: string;
}) {
  const Icon = ICON_MAP[intent.icon as keyof typeof ICON_MAP];
  const isActionable = intent.isActionable;
  
  const longPressHandlers = useLongPress(onLongPress, 500);

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    // Only trigger click if not a long press
    if (!longPressHandlers.isPressed) {
      onClick();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        {...longPressHandlers}
        className={cn(
          "w-full group relative flex flex-col items-center gap-4 rounded-2xl bg-card p-6 overflow-hidden",
          "shadow-card transition-all duration-300",
          "hover:shadow-card-hover hover:-translate-y-1",
          "animate-scale-in text-center select-none",
          !isActionable && "opacity-90",
          longPressHandlers.isPressed && "scale-95"
        )}
        style={{ animationDelay: `${index * 0.08}s` }}
      >
        {/* Gradient background */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity duration-300 group-hover:opacity-100",
          intent.gradient
        )} />
        
        {/* Emoji badge */}
        <div className="absolute top-3 end-3 text-xl opacity-60 group-hover:opacity-100 transition-opacity">
          {intent.emoji}
        </div>

        {/* Long press indicator */}
        <div className={cn(
          "absolute top-3 start-3 text-xs text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity",
          "flex items-center gap-1"
        )}>
          <Info className="h-3 w-3" />
        </div>

        {/* Icon container */}
        <div className={cn(
          "relative z-10 rounded-2xl p-5 transition-all duration-300",
          intent.iconBg,
          "group-hover:scale-110 group-hover:shadow-lg"
        )}>
          {Icon && <Icon className={cn("h-7 w-7", intent.iconColor)} />}
        </div>
        
        {/* Title */}
        <h3 className="relative z-10 text-lg font-bold">
          {lang === 'ar' ? intent.titleAr : intent.titleEn}
        </h3>
        
        {/* Description */}
        <p className="relative z-10 text-sm text-muted-foreground leading-relaxed">
          {lang === 'ar' ? intent.descAr : intent.descEn}
        </p>

        {/* Non-actionable badge */}
        {!isActionable && (
          <div className="relative z-10 inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
            {intent.code === 'DISCOVER' && (
              <>
                <Search className="h-3 w-3" />
                {lang === 'ar' ? 'استعراض' : 'Browse'}
              </>
            )}
            {intent.code === 'RATE' && (
              <>
                <Star className="h-3 w-3" />
                {lang === 'ar' ? 'مقارنة' : 'Compare'}
              </>
            )}
          </div>
        )}
      </button>

      {/* Animated Tooltip */}
      <IntentTooltip
        intent={intent.code}
        isVisible={isTooltipActive}
        onClose={onTooltipClose}
      />
    </div>
  );
}
