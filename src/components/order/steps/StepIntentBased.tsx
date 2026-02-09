import { useLang } from '@/contexts/LangContext';
import { Package, ShoppingBag, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderFormData } from '../OrderWizard';
import { Intent, getIntentMetadata, intentToOrderType } from '@/lib/orderIntentRules';

interface StepIntentBasedProps {
  formData: OrderFormData;
  updateFormData: (data: Partial<OrderFormData>) => void;
  selectedIntent: Intent;
}

export default function StepIntentBased({ formData, updateFormData, selectedIntent }: StepIntentBasedProps) {
  const { lang } = useLang();
  const metadata = getIntentMetadata(selectedIntent);

  // Get relevant sub-options based on intent
  const getSubOptions = () => {
    if (selectedIntent === 'TASK') {
      return [
        {
          value: 'delivery',
          icon: Package,
          title: lang === 'ar' ? 'توصيل سريع' : 'Quick Delivery',
          desc: lang === 'ar' ? 'استلام وتوصيل بسيط' : 'Simple pickup and delivery',
        },
        {
          value: 'errand',
          icon: Package,
          title: lang === 'ar' ? 'مشوار' : 'Errand',
          desc: lang === 'ar' ? 'تنفيذ مهمة محددة' : 'Execute a specific task',
        },
      ];
    }

    if (selectedIntent === 'BUY') {
      return [
        {
          value: 'store',
          icon: ShoppingBag,
          title: lang === 'ar' ? 'من محل معين' : 'From a specific store',
          desc: lang === 'ar' ? 'حدد المحل والمنتجات' : 'Specify store and products',
        },
        {
          value: 'any',
          icon: ShoppingBag,
          title: lang === 'ar' ? 'من أي محل' : 'From any store',
          desc: lang === 'ar' ? 'نختار لك الأفضل' : 'We choose the best for you',
        },
      ];
    }

    if (selectedIntent === 'COORDINATE') {
      return [
        {
          value: 'tailor',
          icon: RefreshCw,
          title: lang === 'ar' ? 'خياط / ورشة' : 'Tailor / Workshop',
          desc: lang === 'ar' ? 'توصيل لجهة تصنيع' : 'Delivery to a manufacturer',
        },
        {
          value: 'supplier',
          icon: RefreshCw,
          title: lang === 'ar' ? 'مورد' : 'Supplier',
          desc: lang === 'ar' ? 'توصيل لمورد أو تاجر' : 'Delivery to a supplier or trader',
        },
        {
          value: 'person',
          icon: RefreshCw,
          title: lang === 'ar' ? 'شخص آخر' : 'Another person',
          desc: lang === 'ar' ? 'هدية أو تسليم لصديق' : 'Gift or delivery to a friend',
        },
      ];
    }

    return [];
  };

  const subOptions = getSubOptions();

  return (
    <div className="space-y-6 pb-20">
      {/* Intent Header */}
      {metadata && (
        <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
          <span className="text-3xl mb-2 block">{metadata.emoji}</span>
          <h3 className="text-lg font-bold">
            {lang === 'ar' ? metadata.titleAr : metadata.titleEn}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'ar' ? metadata.descAr : metadata.descEn}
          </p>
        </div>
      )}

      {/* Sub-options if available */}
      {subOptions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3">
            {lang === 'ar' ? 'حدد التفاصيل' : 'Specify details'}
          </h4>
          <div className="space-y-3">
            {subOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  // Store sub-selection in notes or a dedicated field
                  updateFormData({ 
                    notes: formData.notes 
                      ? `${formData.notes}\n[${option.value}]` 
                      : `[${option.value}]` 
                  });
                }}
                className={cn(
                  "w-full p-4 rounded-xl border text-start transition-all",
                  "border-border hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <option.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">{option.title}</p>
                    <p className="text-sm text-muted-foreground">{option.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
