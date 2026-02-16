import { useLang } from '@/contexts/LangContext';
import { useEscrow } from '@/hooks/useEscrow';
import { Shield, Lock, Unlock, ArrowDownRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EscrowStatusCardProps {
  orderId: string;
  stages?: { id: string; stage_type: string; status: string; sequence_no: number }[];
}

export default function EscrowStatusCard({ orderId, stages = [] }: EscrowStatusCardProps) {
  const { lang } = useLang();
  const { totalHeld, totalReleased, remaining, transactions, isLoading } = useEscrow(orderId);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl shadow-ya-sm p-4 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (totalHeld === 0) return null;

  const progressPercent = totalHeld > 0 ? (totalReleased / totalHeld) * 100 : 0;
  const currency = lang === 'ar' ? 'ر.س' : 'SAR';

  return (
    <div className="bg-card rounded-xl shadow-ya-sm overflow-hidden mb-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald/10 to-emerald/5 p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald/20 flex items-center justify-center">
            <Shield className="h-5 w-5 text-emerald" />
          </div>
          <div>
            <h4 className="font-bold text-sm">
              {lang === 'ar' ? 'الحماية المالية' : 'Financial Protection'}
            </h4>
            <p className="text-xs text-muted-foreground">
              {lang === 'ar' ? 'أموالك محمية حتى إتمام كل خطوة' : 'Your funds are protected until each step is complete'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">
              {lang === 'ar' ? 'تم الإفراج' : 'Released'}
            </span>
            <span className="font-bold text-emerald">{progressPercent.toFixed(0)}%</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald to-emerald/80 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <Lock className="h-4 w-4 mx-auto mb-1 text-amber-500" />
            <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'محجوز' : 'Held'}</p>
            <p className="font-bold text-sm">{totalHeld.toFixed(0)} {currency}</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <Unlock className="h-4 w-4 mx-auto mb-1 text-emerald" />
            <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'مُفرج' : 'Released'}</p>
            <p className="font-bold text-sm text-emerald">{totalReleased.toFixed(0)} {currency}</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <ArrowDownRight className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'متبقي' : 'Remaining'}</p>
            <p className="font-bold text-sm">{remaining.toFixed(0)} {currency}</p>
          </div>
        </div>

        {/* Per-stage release timeline */}
        {stages.length > 0 && (
          <div className="space-y-2">
            {stages.map((stage) => {
              const release = transactions.find(
                t => t.stage_id === stage.id && t.transaction_type === 'release'
              );
              const isDone = stage.status === 'completed';
              return (
                <div key={stage.id} className="flex items-center gap-2 text-xs">
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center',
                    isDone ? 'bg-emerald text-white' : 'bg-muted text-muted-foreground'
                  )}>
                    {stage.sequence_no}
                  </div>
                  <span className={cn('flex-1', isDone && 'text-emerald font-medium')}>
                    {stage.stage_type === 'purchase' ? (lang === 'ar' ? 'الشراء' : 'Purchase') :
                     stage.stage_type === 'dropoff' ? (lang === 'ar' ? 'التوصيل' : 'Delivery') :
                     stage.stage_type === 'pickup' ? (lang === 'ar' ? 'الاستلام' : 'Pickup') :
                     stage.stage_type}
                  </span>
                  {release ? (
                    <span className="text-emerald font-medium">
                      ✓ {Number(release.amount).toFixed(0)} {currency}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {lang === 'ar' ? 'قيد الانتظار' : 'Pending'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
