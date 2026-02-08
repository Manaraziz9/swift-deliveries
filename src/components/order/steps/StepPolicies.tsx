import { useLang } from '@/contexts/LangContext';
import { Ban, RefreshCw, Coins, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderFormData } from '../OrderWizard';

interface StepPoliciesProps {
  formData: OrderFormData;
  updateFormData: (data: Partial<OrderFormData>) => void;
}

export default function StepPolicies({ formData, updateFormData }: StepPoliciesProps) {
  const { lang } = useLang();

  const showPurchasePolicies = formData.orderType === 'PURCHASE_DELIVER' || formData.orderType === 'CHAIN';

  const substitutionOptions = [
    {
      value: 'NONE' as const,
      icon: Ban,
      title: lang === 'ar' ? 'لا استبدال' : 'No Substitution',
      desc: lang === 'ar' ? 'إذا غير متوفر، لا تشتري' : 'If unavailable, do not purchase',
    },
    {
      value: 'SAME_CATEGORY' as const,
      icon: RefreshCw,
      title: lang === 'ar' ? 'نفس الفئة' : 'Same Category',
      desc: lang === 'ar' ? 'استبدل بمنتج مشابه' : 'Replace with similar product',
    },
    {
      value: 'WITHIN_PRICE' as const,
      icon: Coins,
      title: lang === 'ar' ? 'ضمن السعر' : 'Within Price',
      desc: lang === 'ar' ? 'استبدل بما لا يتجاوز السقف' : 'Replace within price cap',
    },
    {
      value: 'CUSTOM_RULES' as const,
      icon: Settings2,
      title: lang === 'ar' ? 'قواعد مخصصة' : 'Custom Rules',
      desc: lang === 'ar' ? 'حسب الملاحظات أدناه' : 'According to notes below',
    },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Price Cap */}
      {showPurchasePolicies && (
        <div>
          <label className="block text-sm font-medium mb-2">
            {lang === 'ar' ? 'سقف الشراء (ريال)' : 'Purchase Price Cap (SAR)'}
          </label>
          <input
            type="number"
            min={0}
            value={formData.priceCap || ''}
            onChange={e => updateFormData({ priceCap: e.target.value ? parseInt(e.target.value) : null })}
            placeholder={lang === 'ar' ? 'مثال: 500' : 'e.g., 500'}
            className="w-full rounded-xl border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            dir="ltr"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {lang === 'ar'
              ? 'الحد الأقصى للمبلغ الذي يمكن للمنفذ إنفاقه'
              : 'Maximum amount the executor can spend'}
          </p>
        </div>
      )}

      {/* Substitution Policy */}
      {showPurchasePolicies && (
        <div>
          <h4 className="font-medium mb-3">
            {lang === 'ar' ? 'سياسة الاستبدال' : 'Substitution Policy'}
          </h4>
          <div className="space-y-2">
            {substitutionOptions.map(option => (
              <button
                key={option.value}
                onClick={() => updateFormData({ substitutionPolicy: option.value })}
                className={cn(
                  "w-full p-3 rounded-xl border text-start transition-all flex items-start gap-3",
                  formData.substitutionPolicy === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  formData.substitutionPolicy === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  <option.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium text-sm">{option.title}</p>
                  <p className="text-xs text-muted-foreground">{option.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-2">
          {lang === 'ar' ? 'ملاحظات إضافية' : 'Additional Notes'}
        </label>
        <textarea
          value={formData.notes}
          onChange={e => updateFormData({ notes: e.target.value })}
          placeholder={lang === 'ar'
            ? 'أي تعليمات خاصة للمنفذ...'
            : 'Any special instructions for the executor...'}
          className="w-full rounded-xl border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[120px]"
        />
      </div>
    </div>
  );
}
