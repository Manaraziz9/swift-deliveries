import { useState, useCallback } from 'react';
import { useLang } from '@/contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, ShoppingBag, RefreshCw, Search, Star, FlaskConical,
  ArrowLeft, ArrowRight, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Intent, INTENT_METADATA, getIntentMetadata } from '@/lib/orderIntentRules';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
}

export default function IntentSelection({ onSelect, onDiscover, onRate }: IntentSelectionProps) {
  const { lang, dir } = useLang();
  const navigate = useNavigate();
  const [hoveredIntent, setHoveredIntent] = useState<Intent | null>(null);
  
  const ArrowBack = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const handleIntentClick = useCallback((intent: Intent) => {
    const metadata = getIntentMetadata(intent);
    if (!metadata) return;

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
  }, [onSelect, onDiscover, onRate, navigate]);

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
      <div className="container py-8">
        {/* Title with decorative element */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {lang === 'ar' ? 'اختر طريقتك' : 'Choose Your Way'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">
            {lang === 'ar' ? 'وش حاب تسوي اليوم؟' : 'What would you like to do today?'}
          </h1>
          <p className="text-muted-foreground">
            {lang === 'ar' ? 'خلّنا نرتّبها عنك بخطوات بسيطة' : 'Let us arrange it for you in simple steps'}
          </p>
        </div>

        {/* Intent Cards Grid */}
        <TooltipProvider delayDuration={500}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTENT_METADATA.map((intent, index) => {
              const Icon = ICON_MAP[intent.icon as keyof typeof ICON_MAP];
              const isActionable = intent.isActionable;
              
              return (
                <Tooltip key={intent.code}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleIntentClick(intent.code)}
                      onMouseEnter={() => setHoveredIntent(intent.code)}
                      onMouseLeave={() => setHoveredIntent(null)}
                      className={cn(
                        "group relative flex flex-col items-center gap-4 rounded-2xl bg-card p-6 overflow-hidden",
                        "shadow-card transition-all duration-300",
                        "hover:shadow-card-hover hover:-translate-y-1",
                        "animate-scale-in text-center",
                        !isActionable && "opacity-90"
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
                  </TooltipTrigger>
                  <TooltipContent 
                    side="bottom" 
                    className="max-w-xs text-center"
                  >
                    <p>{lang === 'ar' ? intent.tooltipAr : intent.tooltipEn}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
}
