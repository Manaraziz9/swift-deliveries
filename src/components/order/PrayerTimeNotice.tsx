import { useLang } from '@/contexts/LangContext';
import { usePrayerTimes } from '@/hooks/usePrayerTimes';
import { Clock } from 'lucide-react';

interface PrayerTimeNoticeProps {
  className?: string;
}

export default function PrayerTimeNotice({ className }: PrayerTimeNoticeProps) {
  const { lang } = useLang();
  const { getDeliveryAdjustment, nextPrayer } = usePrayerTimes();

  if (!getDeliveryAdjustment) return null;

  const { prayer, delayMinutes } = getDeliveryAdjustment;

  return (
    <div className={`flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm ${className || ''}`}>
      <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <div>
        <p className="font-medium">
          {lang === 'ar'
            ? `وقت صلاة ${prayer.nameAr} — قد يتأخر التوصيل ~${delayMinutes} دقيقة`
            : `${prayer.name} prayer time — delivery may be delayed ~${delayMinutes} min`}
        </p>
        {nextPrayer && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {lang === 'ar'
              ? `الصلاة القادمة: ${nextPrayer.nameAr} ${nextPrayer.time.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`
              : `Next: ${nextPrayer.name} at ${nextPrayer.time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
          </p>
        )}
      </div>
    </div>
  );
}
