import { useLang } from '@/contexts/LangContext';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface Stage {
  id: string;
  stage_type: string;
  sequence_no: number;
  status: string;
}

const stageLabels: Record<string, { ar: string; en: string }> = {
  purchase: { ar: 'شراء', en: 'Buy' },
  pickup: { ar: 'استلام', en: 'Pickup' },
  dropoff: { ar: 'توصيل', en: 'Deliver' },
  handover: { ar: 'تسليم', en: 'Handover' },
  onsite: { ar: 'موقع', en: 'On-site' },
};

interface OrderProgressBarProps {
  stages: Stage[];
}

export default function OrderProgressBar({ stages }: OrderProgressBarProps) {
  const { lang } = useLang();
  if (stages.length === 0) return null;

  const activeIndex = stages.findIndex(s => s.status === 'in_progress');
  const currentStep = activeIndex >= 0 ? activeIndex : stages.filter(s => s.status === 'completed').length;

  return (
    <div className="bg-card rounded-2xl shadow-ya-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold">
          {lang === 'ar' ? 'تقدم الطلب' : 'Order Progress'}
        </h3>
        <span className="text-xs font-bold text-primary">
          {currentStep}/{stages.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative flex items-center gap-0 w-full">
        {stages.map((stage, i) => {
          const isDone = stage.status === 'completed';
          const isActive = stage.status === 'in_progress';
          const label = stageLabels[stage.stage_type] || { ar: stage.stage_type, en: stage.stage_type };

          return (
            <div key={stage.id} className="flex-1 flex flex-col items-center relative">
              {/* Connector line */}
              {i > 0 && (
                <div
                  className={cn(
                    'absolute top-3.5 h-0.5 -z-0',
                    isDone ? 'bg-primary' : 'bg-border',
                  )}
                  style={{
                    width: '100%',
                    [lang === 'ar' ? 'right' : 'left']: '50%',
                    transform: lang === 'ar' ? 'translateX(50%)' : 'translateX(-50%)',
                  }}
                />
              )}

              {/* Circle */}
              <div className={cn(
                'relative z-10 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                isDone
                  ? 'bg-primary text-primary-foreground'
                  : isActive
                  ? 'bg-primary text-primary-foreground animate-pulse ring-4 ring-primary/20'
                  : 'bg-muted text-muted-foreground border-2 border-border',
              )}>
                {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>

              {/* Label */}
              <span className={cn(
                'text-[10px] mt-1.5 text-center leading-tight',
                isDone || isActive ? 'text-primary font-bold' : 'text-muted-foreground'
              )}>
                {lang === 'ar' ? label.ar : label.en}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current step text */}
      {activeIndex >= 0 && (
        <div className="mt-3 text-center">
          <p className="text-xs text-primary font-medium">
            {lang === 'ar'
              ? `الخطوة ${activeIndex + 1} من ${stages.length} — جاري التنفيذ`
              : `Step ${activeIndex + 1} of ${stages.length} — In Progress`}
          </p>
        </div>
      )}
    </div>
  );
}
