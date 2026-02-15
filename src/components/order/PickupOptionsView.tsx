import { useState } from 'react';
import { useLang } from '@/contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import {
  PackageCheck, Clock, CalendarClock, Bell,
  ArrowLeft, ArrowRight, Check, MapPin, Phone, Truck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PickupOptionsViewProps {
  orderId: string;
  onComplete: () => void;
}

type PickupOption = 'immediate' | 'reminder' | 'open';

export default function PickupOptionsView({ orderId, onComplete }: PickupOptionsViewProps) {
  const { lang, dir } = useLang();
  const navigate = useNavigate();
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const [selected, setSelected] = useState<PickupOption | null>(null);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  const handleConfirm = () => {
    // In production, this would save the pickup preference
    onComplete();
  };

  const options: { id: PickupOption; icon: any; title: string; desc: string }[] = [
    {
      id: 'immediate',
      icon: PackageCheck,
      title: lang === 'ar' ? 'استلام فوري' : 'Immediate Pickup',
      desc: lang === 'ar'
        ? 'المندوب يوصل كل شيء الآن ويُغلق الطلب'
        : 'Courier delivers everything now and closes the order',
    },
    {
      id: 'reminder',
      icon: CalendarClock,
      title: lang === 'ar' ? 'ذكّرني بالاستلام' : 'Remind Me Later',
      desc: lang === 'ar'
        ? 'اختر تاريخ ووقت للتذكير بالاستلام'
        : 'Choose a date and time for a pickup reminder',
    },
    {
      id: 'open',
      icon: Clock,
      title: lang === 'ar' ? 'الطلب مفتوح' : 'Keep Order Open',
      desc: lang === 'ar'
        ? 'يبقى الطلب بانتظار الاستلام — تذكير كل 24 ساعة'
        : 'Order stays awaiting pickup — reminder every 24 hours',
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ms-2 text-muted-foreground hover:text-foreground">
            <BackArrow className="h-5 w-5" />
          </button>
          <h1 className="font-bold">{lang === 'ar' ? 'كيف تبي تستلم؟' : 'How to receive?'}</h1>
          <span className="text-lg font-bold font-en text-primary ms-auto">YA</span>
        </div>
      </div>

      <div className="container py-6 space-y-6">
        {/* Success header */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
            <Check className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold">
            {lang === 'ar' ? 'تم الدفع بنجاح!' : 'Payment Successful!'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'ar' ? 'كيف تبي تستلم طلبك؟' : 'How would you like to receive your order?'}
          </p>
        </motion.div>

        {/* Options */}
        <div className="space-y-3">
          {options.map((option, i) => (
            <motion.button
              key={option.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelected(option.id)}
              className={cn(
                "w-full p-4 rounded-2xl border-2 text-start transition-all",
                selected === option.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  selected === option.id ? "bg-primary/10" : "bg-muted"
                )}>
                  <option.icon className={cn(
                    "h-5 w-5",
                    selected === option.id ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">{option.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{option.desc}</p>
                </div>
                {selected === option.id && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                    <Check className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Reminder date/time picker */}
        {selected === 'reminder' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3 p-4 rounded-2xl border bg-card"
          >
            <div>
              <label className="text-xs font-bold mb-1.5 block">
                {lang === 'ar' ? 'التاريخ' : 'Date'}
              </label>
              <input
                type="date"
                value={reminderDate}
                onChange={e => setReminderDate(e.target.value)}
                className="w-full rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-bold mb-1.5 block">
                {lang === 'ar' ? 'الوقت' : 'Time'}
              </label>
              <input
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                className="w-full rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </motion.div>
        )}

        {/* Open order info */}
        {selected === 'open' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-2"
          >
            <div className="flex items-center gap-2 text-sm">
              <Bell className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {lang === 'ar' ? 'تذكير تلقائي كل 24 ساعة' : 'Auto reminder every 24 hours'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {lang === 'ar'
                ? 'بعد 7 أيام بدون استجابة، يُغلق الطلب تلقائياً'
                : 'After 7 days without response, the order closes automatically'}
            </p>
          </motion.div>
        )}

        {/* Immediate sub-options */}
        {selected === 'immediate' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-2xl border bg-card space-y-3"
          >
            <button className="w-full flex items-center gap-3 p-3 rounded-xl border hover:border-primary/30 transition-all">
              <Truck className="h-5 w-5 text-primary" />
              <div className="text-start flex-1">
                <p className="text-sm font-bold">{lang === 'ar' ? 'أرسل أحد يستلم لي' : 'Send someone to pick up'}</p>
                <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'رسوم توصيل إضافية' : 'Additional delivery fee'}</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-3 rounded-xl border hover:border-primary/30 transition-all">
              <MapPin className="h-5 w-5 text-primary" />
              <div className="text-start flex-1">
                <p className="text-sm font-bold">{lang === 'ar' ? 'بروح أستلم بنفسي' : "I'll pick up myself"}</p>
                <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'عرض الموقع والتواصل' : 'View location & contact'}</p>
              </div>
            </button>
          </motion.div>
        )}

        {/* Confirm button */}
        {selected && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <button
              onClick={handleConfirm}
              disabled={selected === 'reminder' && (!reminderDate || !reminderTime)}
              className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:brightness-95 transition-all shadow-ya-accent"
            >
              <Check className="h-5 w-5" />
              {lang === 'ar' ? 'تأكيد' : 'Confirm'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
