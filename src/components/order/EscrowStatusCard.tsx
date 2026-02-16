import { useEffect, useRef, useState } from 'react';
import { useLang } from '@/contexts/LangContext';
import { useEscrow } from '@/hooks/useEscrow';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Lock, Unlock, ArrowDownRight, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';

interface EscrowStatusCardProps {
  orderId: string;
  stages?: { id: string; stage_type: string; status: string; sequence_no: number }[];
}

export default function EscrowStatusCard({ orderId, stages = [] }: EscrowStatusCardProps) {
  const { lang } = useLang();
  const queryClient = useQueryClient();
  const { totalHeld, totalReleased, remaining, transactions, isLoading } = useEscrow(orderId);
  const [releaseFlash, setReleaseFlash] = useState<string | null>(null);
  const prevReleasedRef = useRef(totalReleased);

  // Realtime escrow updates
  useEffect(() => {
    if (!orderId) return;
    const channel = supabase
      .channel(`escrow-${orderId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'escrow_transactions',
        filter: `order_id=eq.${orderId}`,
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['escrow', orderId] });
        const tx = payload.new as any;
        if (tx.transaction_type === 'release') {
          setReleaseFlash(tx.stage_id);
          setTimeout(() => setReleaseFlash(null), 3000);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId, queryClient]);

  // Detect released amount change for animation
  useEffect(() => {
    if (totalReleased > prevReleasedRef.current && prevReleasedRef.current > 0) {
      // Amount increased - flash is handled by realtime
    }
    prevReleasedRef.current = totalReleased;
  }, [totalReleased]);

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
      {/* Release flash notification */}
      <AnimatePresence>
        {releaseFlash && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-emerald/10 border-b border-emerald/20 overflow-hidden"
          >
            <div className="px-4 py-2.5 flex items-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10, stiffness: 200 }}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald" />
              </motion.div>
              <p className="text-xs font-medium text-emerald">
                {lang === 'ar' ? 'تم إفراج جزء من المبلغ بنجاح ✓' : 'Funds partially released successfully ✓'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        {/* Animated progress bar */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">
              {lang === 'ar' ? 'تم الإفراج' : 'Released'}
            </span>
            <motion.span
              key={progressPercent}
              initial={{ scale: 1.3, color: 'hsl(var(--emerald))' }}
              animate={{ scale: 1 }}
              className="font-bold text-emerald"
            >
              {progressPercent.toFixed(0)}%
            </motion.span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald to-emerald/80 rounded-full"
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Amounts with animation */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <Lock className="h-4 w-4 mx-auto mb-1 text-amber-500" />
            <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'محجوز' : 'Held'}</p>
            <p className="font-bold text-sm">{totalHeld.toFixed(0)} {currency}</p>
          </div>
          <motion.div
            key={totalReleased}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.5 }}
            className="bg-muted/50 rounded-xl p-3 text-center"
          >
            <Unlock className="h-4 w-4 mx-auto mb-1 text-emerald" />
            <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'مُفرج' : 'Released'}</p>
            <p className="font-bold text-sm text-emerald">{totalReleased.toFixed(0)} {currency}</p>
          </motion.div>
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
              const isFlashing = releaseFlash === stage.id;
              return (
                <motion.div
                  key={stage.id}
                  className={cn(
                    'flex items-center gap-2 text-xs rounded-lg px-2 py-1.5 transition-colors',
                    isFlashing && 'bg-emerald/10'
                  )}
                  animate={isFlashing ? { backgroundColor: ['hsl(var(--emerald) / 0.15)', 'transparent'] } : {}}
                  transition={{ duration: 2 }}
                >
                  <motion.div
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
                      isDone ? 'bg-emerald text-white' : 'bg-muted text-muted-foreground'
                    )}
                    animate={isFlashing ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    {stage.sequence_no}
                  </motion.div>
                  <span className={cn('flex-1', isDone && 'text-emerald font-medium')}>
                    {stage.stage_type === 'purchase' ? (lang === 'ar' ? 'الشراء' : 'Purchase') :
                     stage.stage_type === 'dropoff' ? (lang === 'ar' ? 'التوصيل' : 'Delivery') :
                     stage.stage_type === 'pickup' ? (lang === 'ar' ? 'الاستلام' : 'Pickup') :
                     stage.stage_type}
                  </span>
                  {release ? (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-emerald font-medium"
                    >
                      ✓ {Number(release.amount).toFixed(0)} {currency}
                    </motion.span>
                  ) : (
                    <span className="text-muted-foreground">
                      {lang === 'ar' ? 'قيد الانتظار' : 'Pending'}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
