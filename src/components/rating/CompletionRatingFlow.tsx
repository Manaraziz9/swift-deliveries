import { useState, useEffect } from 'react';
import { Star, X, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLang } from '@/contexts/LangContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RatingDimension {
  key: string;
  labelAr: string;
  labelEn: string;
  icon: string;
}

const dimensions: RatingDimension[] = [
  { key: 'speed', labelAr: 'السرعة', labelEn: 'Speed', icon: '⚡' },
  { key: 'quality', labelAr: 'الجودة', labelEn: 'Quality', icon: '✨' },
  { key: 'communication', labelAr: 'التواصل', labelEn: 'Communication', icon: '💬' },
  { key: 'accuracy', labelAr: 'الدقة', labelEn: 'Accuracy', icon: '🎯' },
  { key: 'professionalism', labelAr: 'الاحترافية', labelEn: 'Professionalism', icon: '👔' },
];

interface CompletionRatingFlowProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  merchantId?: string | null;
  merchantName?: string;
}

export default function CompletionRatingFlow({
  isOpen,
  onClose,
  orderId,
  merchantId,
  merchantName,
}: CompletionRatingFlowProps) {
  const { lang } = useLang();
  const { user } = useAuth();
  const [step, setStep] = useState(0); // 0 = executor, 1 = merchant (if applicable)
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({
    executor: {},
    merchant: {},
  });
  const [comments, setComments] = useState({ executor: '', merchant: '' });
  const [submitting, setSubmitting] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);

  const totalSteps = merchantId ? 2 : 1;
  const currentTarget = step === 0 ? 'executor' : 'merchant';

  // Check if already rated
  useEffect(() => {
    if (!user || !orderId || !isOpen) return;
    supabase
      .from('internal_ratings')
      .select('id')
      .eq('order_id', orderId)
      .eq('rater_id', user.id)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setAlreadyRated(true);
      });
  }, [user, orderId, isOpen]);

  const handleStarClick = (dimension: string, rating: number) => {
    setScores(prev => ({
      ...prev,
      [currentTarget]: { ...prev[currentTarget], [dimension]: rating },
    }));
  };

  const allRated = dimensions.every(d => (scores[currentTarget][d.key] || 0) > 0);

  const handleNext = () => {
    if (!allRated) {
      toast.error(lang === 'ar' ? 'الرجاء تقييم جميع المعايير' : 'Please rate all criteria');
      return;
    }
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      // Submit executor rating
      const { error: execError } = await supabase.from('internal_ratings').insert({
        order_id: orderId,
        entity_id: orderId,
        entity_type: 'executor',
        rater_id: user.id,
        scores_json: scores.executor,
        comment: comments.executor.trim() || null,
      });
      if (execError) throw execError;

      // Submit merchant rating if applicable
      if (merchantId && Object.keys(scores.merchant).length > 0) {
        const { error: merchError } = await supabase.from('internal_ratings').insert({
          order_id: orderId,
          entity_id: merchantId,
          entity_type: 'merchant',
          rater_id: user.id,
          scores_json: scores.merchant,
          comment: comments.merchant.trim() || null,
        });
        if (merchError) throw merchError;
      }

      toast.success(lang === 'ar' ? 'شكراً لتقييمك! 🌟' : 'Thanks for your rating! 🌟');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(lang === 'ar' ? 'حدث خطأ' : 'Error submitting rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || alreadyRated) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border/30 p-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">
              {step === 0
                ? (lang === 'ar' ? '⭐ قيّم المنفذ' : '⭐ Rate Executor')
                : (lang === 'ar' ? `⭐ قيّم ${merchantName || 'المحل'}` : `⭐ Rate ${merchantName || 'Merchant'}`)}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === 'ar' ? `الخطوة ${step + 1} من ${totalSteps}` : `Step ${step + 1} of ${totalSteps}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dimensions */}
        <div className="p-4 space-y-5">
          {dimensions.map(dim => (
            <div key={dim.key}>
              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                <span>{dim.icon}</span>
                {lang === 'ar' ? dim.labelAr : dim.labelEn}
              </p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => handleStarClick(dim.key, star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        'h-7 w-7 transition-colors',
                        (scores[currentTarget][dim.key] || 0) >= star
                          ? 'fill-primary text-primary'
                          : 'text-muted-foreground/30'
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Comment */}
          <div>
            <p className="text-sm font-medium mb-2">
              {lang === 'ar' ? '💭 تعليق (اختياري)' : '💭 Comment (optional)'}
            </p>
            <Textarea
              value={comments[currentTarget]}
              onChange={e => setComments(prev => ({ ...prev, [currentTarget]: e.target.value }))}
              placeholder={lang === 'ar' ? 'شاركنا تجربتك...' : 'Share your experience...'}
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                {lang === 'ar' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                {lang === 'ar' ? 'السابق' : 'Back'}
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={submitting || !allRated}
              className="flex-1 bg-gradient-gold text-primary-foreground font-semibold"
            >
              {submitting
                ? (lang === 'ar' ? 'جاري الإرسال...' : 'Submitting...')
                : step < totalSteps - 1
                  ? (lang === 'ar' ? 'التالي' : 'Next')
                  : (lang === 'ar' ? 'إرسال التقييم' : 'Submit Rating')}
              {!submitting && step < totalSteps - 1 && (lang === 'ar' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
              {!submitting && step >= totalSteps - 1 && <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
