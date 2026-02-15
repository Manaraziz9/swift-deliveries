import { useLang } from '@/contexts/LangContext';
import { MapPin, Link2, LayoutGrid, Package, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type OrderStepData } from './MultiStepTaskEntry';

interface OrderStepsSummaryProps {
  /** The first/main order description */
  mainOrderDescription: string;
  steps: OrderStepData[];
}

export default function OrderStepsSummary({ mainOrderDescription, steps }: OrderStepsSummaryProps) {
  const { lang } = useLang();

  if (steps.length === 0) return null;

  // Group steps: linked steps with same chainGroupId are shown connected
  const allSteps = [
    { id: 'main', description: mainOrderDescription, relation: 'main' as const, address: '', chainGroupId: '' },
    ...steps,
  ];

  const isLinkedToPrevious = (index: number) => {
    if (index === 0) return false;
    const current = allSteps[index];
    const prev = allSteps[index - 1];
    if (current.relation === 'main' || prev.relation === 'main') {
      // Main is linked to next if next is linked
      if (index === 1 && (allSteps[1] as OrderStepData).relation === 'linked') return true;
      return false;
    }
    return (current as OrderStepData).relation === 'linked' &&
      (current as OrderStepData).chainGroupId === (prev as OrderStepData).chainGroupId;
  };

  return (
    <div className="space-y-1">
      {allSteps.map((step, index) => {
        const linked = isLinkedToPrevious(index);
        const nextLinked = index < allSteps.length - 1 && isLinkedToPrevious(index + 1);

        return (
          <div key={step.id} className="relative">
            {/* Vertical line above */}
            {linked && (
              <div className="absolute start-[19px] -top-1 w-0.5 h-2 bg-primary/40" />
            )}

            <div className={cn(
              "flex items-start gap-3 p-3 rounded-xl border transition-all",
              linked || nextLinked
                ? "border-primary/20 bg-primary/5"
                : "border-border bg-card"
            )}>
              {/* Step number */}
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                step.relation === 'main'
                  ? "bg-primary text-primary-foreground"
                  : (step as OrderStepData).relation === 'linked'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
              )}>
                {index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-bold truncate">
                    {step.description || (lang === 'ar' ? `خطوة ${index + 1}` : `Step ${index + 1}`)}
                  </p>
                  {step.relation !== 'main' && (
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5 shrink-0",
                      (step as OrderStepData).relation === 'linked'
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {(step as OrderStepData).relation === 'linked'
                        ? <><Link2 className="h-2.5 w-2.5" />{lang === 'ar' ? 'مرتبطة' : 'Linked'}</>
                        : <><LayoutGrid className="h-2.5 w-2.5" />{lang === 'ar' ? 'منفصلة' : 'Independent'}</>
                      }
                    </span>
                  )}
                </div>
                {step.address && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {step.address}
                  </p>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="h-3 w-3 shrink-0" />
                  {lang === 'ar' ? 'قيد البحث عن مزود' : 'Finding provider'}
                </p>
              </div>
            </div>

            {/* Vertical line below */}
            {nextLinked && (
              <div className="absolute start-[19px] -bottom-1 w-0.5 h-2 bg-primary/40" />
            )}
          </div>
        );
      })}
    </div>
  );
}
