import { useLang } from '@/contexts/LangContext';
import { Package, ShoppingBag, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderFormData } from '../OrderWizard';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StepOrderTypeProps {
  formData: OrderFormData;
  updateFormData: (data: Partial<OrderFormData>) => void;
}

export default function StepOrderType({ formData, updateFormData }: StepOrderTypeProps) {
  const { lang } = useLang();

  const { data: domains } = useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('taxonomy')
        .select('*')
        .eq('type', 'domain')
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data;
    },
  });

  const orderTypes = [
    {
      value: 'DIRECT' as const,
      icon: Package,
      title: lang === 'ar' ? 'توصيل مباشر' : 'Direct Delivery',
      desc: lang === 'ar' ? 'استلام من نقطة وتوصيل لنقطة أخرى' : 'Pickup from one point and deliver to another',
    },
    {
      value: 'PURCHASE_DELIVER' as const,
      icon: ShoppingBag,
      title: lang === 'ar' ? 'شراء وتوصيل' : 'Purchase & Deliver',
      desc: lang === 'ar' ? 'شراء من محل وتوصيل لك' : 'Buy from a store and deliver to you',
    },
    {
      value: 'CHAIN' as const,
      icon: Link2,
      title: lang === 'ar' ? 'سلسلة مهام' : 'Chain Order',
      desc: lang === 'ar' ? 'شراء وتوصيل لطرف ثالث' : 'Purchase and deliver to a third party',
    },
  ];

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h3 className="text-lg font-bold mb-4">
          {lang === 'ar' ? 'اختر نوع الطلب' : 'Select Order Type'}
        </h3>
        <div className="space-y-3">
          {orderTypes.map(type => (
            <button
              key={type.value}
              onClick={() => updateFormData({ orderType: type.value })}
              className={cn(
                "w-full p-4 rounded-xl border text-start transition-all",
                formData.orderType === type.value
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  formData.orderType === type.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  <type.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">{type.title}</p>
                  <p className="text-sm text-muted-foreground">{type.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4">
          {lang === 'ar' ? 'اختر المجال' : 'Select Domain'}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {(domains || []).map(domain => (
            <button
              key={domain.code}
              onClick={() => updateFormData({ domainId: domain.code })}
              className={cn(
                "p-3 rounded-xl border text-center transition-all",
                formData.domainId === domain.code
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/50"
              )}
            >
              <span className="text-2xl mb-1 block">{domain.icon}</span>
              <p className="text-sm font-medium">
                {lang === 'ar' ? domain.name_ar : domain.name_en}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
