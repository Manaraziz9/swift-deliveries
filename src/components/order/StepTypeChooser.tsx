import { useLang } from '@/contexts/LangContext';
import { LayoutGrid, Link2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type StepRelation = 'independent' | 'linked';

interface StepTypeChooserProps {
  onSelect: (type: StepRelation) => void;
  onCancel: () => void;
}

export default function StepTypeChooser({ onSelect, onCancel }: StepTypeChooserProps) {
  const { lang } = useLang();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      className="space-y-3 p-4 rounded-2xl border-2 border-primary/20 bg-card shadow-lg"
    >
      <p className="text-sm font-bold text-center">
        {lang === 'ar' ? 'وش نوع الخطوة؟' : 'What type of step?'}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Independent */}
        <button
          onClick={() => onSelect('independent')}
          className={cn(
            "p-4 rounded-2xl border-2 border-border hover:border-primary/50 transition-all text-center space-y-2 group hover:bg-primary/5"
          )}
        >
          <div className="w-12 h-12 mx-auto rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
            <LayoutGrid className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <p className="text-sm font-bold">{lang === 'ar' ? 'طلب منفصل' : 'Independent'}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {lang === 'ar'
              ? 'مهمة جديدة ما لها علاقة بالطلب الأول'
              : 'A new task unrelated to the first order'}
          </p>
        </button>

        {/* Linked */}
        <button
          onClick={() => onSelect('linked')}
          className={cn(
            "p-4 rounded-2xl border-2 border-border hover:border-primary/50 transition-all text-center space-y-2 group hover:bg-primary/5"
          )}
        >
          <div className="w-12 h-12 mx-auto rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors">
            <Link2 className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <p className="text-sm font-bold">{lang === 'ar' ? 'خطوة مرتبطة' : 'Linked Step'}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {lang === 'ar'
              ? 'نفس الشخص يكمل هذي بعد الأولى'
              : 'Same person continues after the first'}
          </p>
        </button>
      </div>

      <button
        onClick={onCancel}
        className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {lang === 'ar' ? 'إلغاء' : 'Cancel'}
      </button>
    </motion.div>
  );
}
