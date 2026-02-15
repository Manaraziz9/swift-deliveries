import { useState } from 'react';
import { useLang } from '@/contexts/LangContext';
import { Trash2, ChevronDown, ChevronUp, MapPin, FileText, Link2, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import VoiceInputButton from '@/components/shared/VoiceInputButton';
import { motion, AnimatePresence } from 'framer-motion';

export type StepRelation = 'independent' | 'linked';

export interface OrderStepData {
  id: string;
  relation: StepRelation;
  /** Which chain group this belongs to (linked steps share the same chainGroupId) */
  chainGroupId: string;
  description: string;
  address: string;
  recipientName: string;
  recipientPhone: string;
  items: {
    description: string;
    quantity: number;
    unit: string;
  }[];
}

interface MultiStepTaskEntryProps {
  step: OrderStepData;
  stepIndex: number;
  totalSteps: number;
  /** The previous step if linked to show connection */
  isLinkedToPrevious: boolean;
  onUpdate: (data: Partial<OrderStepData>) => void;
  onRemove: () => void;
}

export default function MultiStepTaskEntry({
  step,
  stepIndex,
  isLinkedToPrevious,
  onUpdate,
  onRemove,
}: MultiStepTaskEntryProps) {
  const { lang } = useLang();
  const [expanded, setExpanded] = useState(true);
  const voice = useVoiceInput({
    lang,
    onResult: (text) => onUpdate({ description: (step.description + ' ' + text).trim() }),
  });

  const RelationIcon = step.relation === 'linked' ? Link2 : LayoutGrid;
  const relationLabel = step.relation === 'linked'
    ? (lang === 'ar' ? 'مرتبطة' : 'Linked')
    : (lang === 'ar' ? 'منفصلة' : 'Independent');

  return (
    <div className="relative">
      {/* Vertical connector line for linked steps */}
      {isLinkedToPrevious && (
        <div className="absolute start-5 -top-3 w-0.5 h-3 bg-primary/40" />
      )}

      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "rounded-2xl border-2 overflow-hidden transition-colors",
          step.relation === 'linked' ? "border-primary/30 bg-primary/5" : "border-border bg-card"
        )}
      >
        {/* Header */}
        <div className="p-4 flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
            step.relation === 'linked'
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}>
            {stepIndex + 2}
          </div>
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm truncate">
                {step.description || (lang === 'ar' ? `خطوة ${stepIndex + 2}` : `Step ${stepIndex + 2}`)}
              </p>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1 shrink-0",
                step.relation === 'linked'
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              )}>
                <RelationIcon className="h-2.5 w-2.5" />
                {relationLabel}
              </span>
            </div>
            {step.address && (
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" />
                {step.address}
              </p>
            )}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                {/* Description */}
                <div>
                  <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    {lang === 'ar' ? 'وصف المهمة' : 'Task Description'}
                  </label>
                  <div className="relative">
                    <textarea
                      value={step.description}
                      onChange={e => onUpdate({ description: e.target.value })}
                      placeholder={lang === 'ar'
                        ? 'اكتب تفاصيل المهمة… مثال: روح محل قطع الغيار واشتري الفلتر'
                        : 'Describe the task in detail...'}
                      className="w-full rounded-xl border bg-background px-4 py-3 pe-12 text-sm min-h-[80px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
                    />
                    <div className="absolute end-2 top-2">
                      <VoiceInputButton isListening={voice.isListening} isSupported={voice.isSupported} onToggle={voice.toggle} />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-bold mb-1.5 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {lang === 'ar' ? 'الموقع (اختياري)' : 'Location (optional)'}
                  </label>
                  <input
                    type="text"
                    value={step.address}
                    onChange={e => onUpdate({ address: e.target.value })}
                    placeholder={lang === 'ar' ? 'عنوان الموقع أو اسم المحل' : 'Address or store name'}
                    className="w-full rounded-xl border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>

                {/* Recipient (for independent steps) */}
                {step.relation === 'independent' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1.5">
                        {lang === 'ar' ? 'اسم المستلم' : 'Recipient'}
                      </label>
                      <input
                        type="text"
                        value={step.recipientName}
                        onChange={e => onUpdate({ recipientName: e.target.value })}
                        placeholder={lang === 'ar' ? 'اختياري' : 'Optional'}
                        className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5">
                        {lang === 'ar' ? 'رقم الهاتف' : 'Phone'}
                      </label>
                      <input
                        type="tel"
                        dir="ltr"
                        value={step.recipientPhone}
                        onChange={e => onUpdate({ recipientPhone: e.target.value })}
                        placeholder={lang === 'ar' ? 'اختياري' : 'Optional'}
                        className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
