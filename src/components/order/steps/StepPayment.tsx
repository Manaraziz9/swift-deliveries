import { useState } from 'react';
import { useLang } from '@/contexts/LangContext';
import { CreditCard, Smartphone, Building2, Wallet, Receipt, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderFormData } from '../OrderWizard';

interface StepPaymentProps {
  formData: OrderFormData;
  updateFormData: (data: Partial<OrderFormData>) => void;
  estimatedTotal: number;
}

type PaymentMethod = 'card' | 'mada' | 'applepay' | 'stcpay' | 'cash';

export default function StepPayment({ formData, updateFormData, estimatedTotal }: StepPaymentProps) {
  const { lang } = useLang();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    (formData as any).paymentMethod || 'mada'
  );

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    updateFormData({ paymentMethod: method } as any);
  };

  const paymentMethods = [
    {
      id: 'mada' as PaymentMethod,
      name: lang === 'ar' ? 'مدى' : 'Mada',
      description: lang === 'ar' ? 'الدفع ببطاقة مدى' : 'Pay with Mada card',
      icon: Building2,
      color: 'bg-[#004D71]',
      popular: true,
    },
    {
      id: 'card' as PaymentMethod,
      name: lang === 'ar' ? 'بطاقة ائتمان' : 'Credit Card',
      description: 'Visa, Mastercard, Amex',
      icon: CreditCard,
      color: 'bg-gradient-to-r from-blue-600 to-purple-600',
    },
    {
      id: 'applepay' as PaymentMethod,
      name: 'Apple Pay',
      description: lang === 'ar' ? 'دفع سريع وآمن' : 'Fast & secure payment',
      icon: Smartphone,
      color: 'bg-black',
    },
    {
      id: 'stcpay' as PaymentMethod,
      name: 'STC Pay',
      description: lang === 'ar' ? 'محفظة STC' : 'STC Wallet',
      icon: Wallet,
      color: 'bg-[#4F008C]',
    },
    {
      id: 'cash' as PaymentMethod,
      name: lang === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery',
      description: lang === 'ar' ? 'ادفع نقداً عند التوصيل' : 'Pay cash when delivered',
      icon: Receipt,
      color: 'bg-emerald',
    },
  ];

  // Calculate costs breakdown
  const itemsCount = formData.items.length;
  const deliveryFee = 15; // Fixed delivery fee for demo
  const serviceFee = estimatedTotal * 0.05; // 5% service fee
  const total = estimatedTotal + deliveryFee + serviceFee;

  return (
    <div className="space-y-6 pb-24">
      <h3 className="text-lg font-bold">
        {lang === 'ar' ? 'الدفع' : 'Payment'}
      </h3>

      {/* Order Summary */}
      <div className="rounded-xl bg-card border p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <h4 className="font-medium">
            {lang === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
          </h4>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {lang === 'ar' ? `المنتجات (${itemsCount})` : `Items (${itemsCount})`}
            </span>
            <span>{estimatedTotal.toFixed(2)} {lang === 'ar' ? 'ر.س' : 'SAR'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {lang === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee'}
            </span>
            <span>{deliveryFee.toFixed(2)} {lang === 'ar' ? 'ر.س' : 'SAR'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {lang === 'ar' ? 'رسوم الخدمة' : 'Service Fee'}
            </span>
            <span>{serviceFee.toFixed(2)} {lang === 'ar' ? 'ر.س' : 'SAR'}</span>
          </div>
          <div className="border-t pt-2 mt-2 flex justify-between font-bold">
            <span>{lang === 'ar' ? 'الإجمالي' : 'Total'}</span>
            <span className="text-primary">{total.toFixed(2)} {lang === 'ar' ? 'ر.س' : 'SAR'}</span>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div>
        <p className="text-sm font-medium mb-3">
          {lang === 'ar' ? 'اختر طريقة الدفع' : 'Select Payment Method'}
        </p>
        <div className="space-y-2">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => handleMethodSelect(method.id)}
              className={cn(
                "w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-start",
                selectedMethod === method.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0",
                method.color
              )}>
                <method.icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{method.name}</span>
                  {method.popular && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {lang === 'ar' ? 'الأكثر استخداماً' : 'Popular'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{method.description}</p>
              </div>
              <div className={cn(
                "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center",
                selectedMethod === method.id
                  ? "border-primary bg-primary"
                  : "border-muted-foreground/30"
              )}>
                {selectedMethod === method.id && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cash Warning */}
      {selectedMethod === 'cash' && (
        <div className="rounded-xl bg-warning/10 border border-warning/30 p-4">
          <p className="text-sm text-warning-foreground">
            {lang === 'ar'
              ? 'يرجى تجهيز المبلغ المطلوب عند استلام الطلب. قد يتم إلغاء الطلب في حال عدم التواجد.'
              : 'Please have the exact amount ready upon delivery. Order may be cancelled if unavailable.'}
          </p>
        </div>
      )}
    </div>
  );
}
