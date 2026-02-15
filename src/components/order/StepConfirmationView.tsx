import { useLang } from '@/contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { Check, Plus, CreditCard, Package, MapPin, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { type CompletedOrderStep } from '@/hooks/useOrderSession';

interface StepConfirmationViewProps {
  currentStep: CompletedOrderStep;
  allSteps: CompletedOrderStep[];
  onAddStep: () => void;
  onCheckout: () => void;
}

export default function StepConfirmationView({
  currentStep,
  allSteps,
  onAddStep,
  onCheckout,
}: StepConfirmationViewProps) {
  const { lang, dir } = useLang();
  const navigate = useNavigate();
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const stepNumber = allSteps.length;

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ms-2 text-muted-foreground hover:text-foreground">
            <BackArrow className="h-5 w-5" />
          </button>
          <h1 className="font-bold">{lang === 'ar' ? 'تأكيد الخطوة' : 'Step Confirmed'}</h1>
          <span className="text-lg font-bold font-en text-primary ms-auto">YA</span>
        </div>
      </div>

      <div className="container py-6 space-y-6">
        {/* Success animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
            <Check className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold">
            {lang === 'ar'
              ? `تم تأكيد الخطوة ${stepNumber}!`
              : `Step ${stepNumber} Confirmed!`}
          </h2>
        </motion.div>

        {/* Current step summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-2xl border-2 border-primary/20 bg-primary/5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              {stepNumber}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{currentStep.merchantName}</p>
              <p className="text-xs text-muted-foreground">
                {currentStep.items.length} {lang === 'ar' ? 'عنصر' : 'items'}
              </p>
            </div>
            <p className="text-sm font-bold text-primary">
              ~{currentStep.estimatedPrice.low}-{currentStep.estimatedPrice.high} {lang === 'ar' ? 'ر.س' : 'SAR'}
            </p>
          </div>
          <div className="space-y-1">
            {currentStep.items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="truncate">{item.description}</span>
                <span className="text-muted-foreground shrink-0">×{item.quantity}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* All previous steps */}
        {allSteps.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <h3 className="text-sm font-bold text-muted-foreground">
              {lang === 'ar' ? 'كل الخطوات' : 'All Steps'}
            </h3>
            <div className="relative space-y-0">
              {allSteps.map((step, i) => (
                <div key={step.id} className="relative">
                  {/* Vertical connector */}
                  {i < allSteps.length - 1 && (
                    <div className="absolute start-[15px] top-10 bottom-0 w-0.5 bg-primary/20" />
                  )}
                  <div className="flex items-center gap-3 p-3 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 relative z-10">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{step.merchantName}</p>
                      <p className="text-xs text-muted-foreground">
                        {step.items.length} {lang === 'ar' ? 'عنصر' : 'items'} · ~{step.estimatedPrice.low}-{step.estimatedPrice.high} {lang === 'ar' ? 'ر.س' : 'SAR'}
                      </p>
                    </div>
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Add more question */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center space-y-2"
        >
          <h3 className="text-lg font-bold">
            {lang === 'ar' ? 'تبي شي ثاني؟' : 'Need anything else?'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {lang === 'ar'
              ? 'نفس المندوب يكمل معاك — أضف خطوة جديدة'
              : 'Same courier continues with you — add a new step'}
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <button
            onClick={onAddStep}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-primary/40 text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary/60 transition-all"
          >
            <Plus className="h-5 w-5" />
            {lang === 'ar' ? '+الخطوة التالية' : '+Next Step'}
          </button>

          <button
            onClick={onCheckout}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:brightness-95 transition-all shadow-ya-accent"
          >
            <CreditCard className="h-5 w-5" />
            {lang === 'ar' ? 'متابعة للدفع' : 'Continue to Payment'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
