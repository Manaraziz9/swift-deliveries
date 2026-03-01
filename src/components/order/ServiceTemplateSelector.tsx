import { useLang } from '@/contexts/LangContext';
import { SERVICE_TEMPLATES, type ServiceTemplate } from '@/lib/serviceTemplates';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Props {
  onSelect: (template: ServiceTemplate) => void;
  embedded?: boolean;
}

export default function ServiceTemplateSelector({ onSelect, embedded }: Props) {
  const { lang, dir } = useLang();
  const navigate = useNavigate();
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <div className={embedded ? "" : "min-h-screen bg-background"}>
      {/* Header - only show when not embedded */}
      {!embedded && (
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="container py-3 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ms-2 text-muted-foreground hover:text-foreground">
              <BackArrow className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <h1 className="font-bold text-lg">
                {lang === 'ar' ? 'اختر نوع الخدمة' : 'Choose Service Type'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {lang === 'ar' ? 'نموذج ذكي يتكيّف مع احتياجك' : 'Smart form adapts to your needs'}
              </p>
            </div>
            <span className="text-lg font-bold font-en text-primary">YA</span>
          </div>
        </div>
      )}

      <div className="container py-5 space-y-4">
        {/* Smart hint */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-accent border border-primary/20"
        >
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <p className="text-sm">
            {lang === 'ar' 
              ? 'اختر الخدمة وراح نعطيك نموذج جاهز بكل التفاصيل اللي تحتاجها ✨'
              : 'Pick a service and we\'ll give you a ready form with all the details you need ✨'}
          </p>
        </motion.div>

        {/* Template Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {SERVICE_TEMPLATES.map((template, index) => (
            <motion.button
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelect(template)}
              className={cn(
                "relative overflow-hidden rounded-2xl p-4 text-start transition-all",
                "hover:scale-[1.02] active:scale-[0.98]",
                "border-2 border-transparent hover:border-white/30",
                "shadow-lg hover:shadow-xl"
              )}
            >
              {/* Gradient Background */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-90",
                template.color
              )} />
              
              {/* Illustration */}
              <div className="absolute top-2 end-2 text-4xl opacity-30">
                {template.illustration}
              </div>
              
              {/* Content */}
              <div className="relative z-10 text-white">
                <span className="text-2xl mb-2 block">{template.icon}</span>
                <h3 className="font-bold text-sm leading-tight mb-1">
                  {lang === 'ar' ? template.title_ar : template.title_en}
                </h3>
                <p className="text-[11px] opacity-80 leading-snug">
                  {lang === 'ar' ? template.subtitle_ar : template.subtitle_en}
                </p>
                <div className="mt-3 text-[10px] font-medium bg-white/20 rounded-full px-2 py-0.5 inline-block backdrop-blur-sm">
                  {template.fields.length} {lang === 'ar' ? 'حقل ذكي' : 'smart fields'}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
