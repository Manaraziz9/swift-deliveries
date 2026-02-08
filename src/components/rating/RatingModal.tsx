import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLang } from '@/contexts/LangContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RatingCategory {
  key: string;
  labelAr: string;
  labelEn: string;
}

const merchantCategories: RatingCategory[] = [
  { key: 'quality', labelAr: 'جودة المنتج/الخدمة', labelEn: 'Product/Service Quality' },
  { key: 'accuracy', labelAr: 'دقة المواصفات', labelEn: 'Specification Accuracy' },
  { key: 'communication', labelAr: 'التواصل', labelEn: 'Communication' },
];

const executorCategories: RatingCategory[] = [
  { key: 'punctuality', labelAr: 'الالتزام بالوقت', labelEn: 'Punctuality' },
  { key: 'professionalism', labelAr: 'الاحترافية', labelEn: 'Professionalism' },
  { key: 'care', labelAr: 'العناية بالطلب', labelEn: 'Care for Order' },
];

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  entityId: string;
  entityType: 'merchant' | 'executor';
  entityName: string;
  onSuccess?: () => void;
}

export default function RatingModal({
  isOpen,
  onClose,
  orderId,
  entityId,
  entityType,
  entityName,
  onSuccess,
}: RatingModalProps) {
  const { lang } = useLang();
  const { user } = useAuth();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = entityType === 'merchant' ? merchantCategories : executorCategories;

  const handleStarClick = (category: string, rating: number) => {
    setScores(prev => ({ ...prev, [category]: rating }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Check all categories are rated
    const allRated = categories.every(cat => scores[cat.key] && scores[cat.key] > 0);
    if (!allRated) {
      toast.error(lang === 'ar' ? 'الرجاء تقييم جميع المعايير' : 'Please rate all criteria');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('internal_ratings').insert({
        order_id: orderId,
        entity_id: entityId,
        entity_type: entityType,
        rater_id: user.id,
        scores_json: scores,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      toast.success(lang === 'ar' ? 'تم إرسال التقييم بنجاح!' : 'Rating submitted successfully!');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(lang === 'ar' ? 'حدث خطأ أثناء إرسال التقييم' : 'Error submitting rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl animate-scale-in">
        <div className="sticky top-0 bg-card border-b border-border/30 p-4 flex items-center justify-between">
          <h3 className="font-bold text-lg">
            {lang === 'ar' ? 'تقييم' : 'Rate'} {entityName}
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {categories.map(cat => (
            <div key={cat.key}>
              <p className="text-sm font-medium mb-2">
                {lang === 'ar' ? cat.labelAr : cat.labelEn}
              </p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => handleStarClick(cat.key, star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        'h-7 w-7 transition-colors',
                        scores[cat.key] >= star
                          ? 'fill-primary text-primary'
                          : 'text-muted-foreground/30'
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div>
            <p className="text-sm font-medium mb-2">
              {lang === 'ar' ? 'تعليق (اختياري)' : 'Comment (optional)'}
            </p>
            <Textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={lang === 'ar' ? 'شاركنا تجربتك...' : 'Share your experience...'}
              className="resize-none"
              rows={3}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-gradient-gold text-primary-foreground font-semibold"
          >
            {submitting
              ? (lang === 'ar' ? 'جاري الإرسال...' : 'Submitting...')
              : (lang === 'ar' ? 'إرسال التقييم' : 'Submit Rating')}
          </Button>
        </div>
      </div>
    </div>
  );
}
