import { useState } from 'react';
import { useLang } from '@/contexts/LangContext';
import { CreditCard, Smartphone, Building2, Wallet, Receipt, ShoppingBag, Shield, Sparkles, Check, AlertTriangle } from 'lucide-react';
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
      gradient: 'from-[#004D71] to-[#006494]',
      popular: true,
    },
    {
      id: 'card' as PaymentMethod,
      name: lang === 'ar' ? 'بطاقة ائتمان' : 'Credit Card',
      description: 'Visa, Mastercard, Amex',
      icon: CreditCard,
      gradient: 'from-blue-600 to-purple-600',
    },
    {
      id: 'applepay' as PaymentMethod,
      name: 'Apple Pay',
      description: lang === 'ar' ? 'دفع سريع وآمن' : 'Fast & secure payment',
      icon: Smartphone,
      gradient: 'from-gray-800 to-black',
    },
    {
      id: 'stcpay' as PaymentMethod,
      name: 'STC Pay',
      description: lang === 'ar' ? 'محفظة STC' : 'STC Wallet',
      icon: Wallet,
      gradient: 'from-[#4F008C] to-[#6B21A8]',
    },
    {
      id: 'cash' as PaymentMethod,
      name: lang === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery',
      description: lang === 'ar' ? 'ادفع نقداً عند التوصيل' : 'Pay cash when delivered',
      icon: Receipt,
      gradient: 'from-emerald to-teal-600',
    },
  ];

  // Calculate costs breakdown
  const itemsCount = formData.items.length;
  const deliveryFee = 15;
  const serviceFee = estimatedTotal * 0.05;
  const total = estimatedTotal + deliveryFee + serviceFee;

  return (
    <div className="space-y-6 pb-24">
      {/* Header with icon */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold">
          <CreditCard className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-bold">
            {lang === 'ar' ? 'الدفع' : 'Payment'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {lang === 'ar' ? 'اختر طريقة الدفع المفضلة' : 'Choose your preferred payment method'}
          </p>
        </div>
      </div>

      {/* Premium Order Summary Card */}
      <div className="card-premium overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h4 className="font-bold">
                {lang === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
              </h4>
              <p className="text-xs text-muted-foreground">
                {lang === 'ar' ? `${itemsCount} منتجات` : `${itemsCount} items`}
              </p>
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              {lang === 'ar' ? 'المنتجات' : 'Items'}
            </span>
            <span className="font-medium">{estimatedTotal.toFixed(2)} {lang === 'ar' ? 'ر.س' : 'SAR'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              {lang === 'ar' ? 'رسوم التوصيل' : 'Delivery Fee'}
            </span>
            <span className="font-medium">{deliveryFee.toFixed(2)} {lang === 'ar' ? 'ر.س' : 'SAR'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">
              {lang === 'ar' ? 'رسوم الخدمة' : 'Service Fee'}
            </span>
            <span className="font-medium">{serviceFee.toFixed(2)} {lang === 'ar' ? 'ر.س' : 'SAR'}</span>
          </div>
          
          {/* Total with premium styling */}
          <div className="pt-3 mt-3 border-t border-dashed border-border">
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">{lang === 'ar' ? 'الإجمالي' : 'Total'}</span>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-rating-star animate-pulse" />
                <span className="font-bold text-xl bg-gradient-gold bg-clip-text text-transparent">
                  {total.toFixed(2)} {lang === 'ar' ? 'ر.س' : 'SAR'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods with premium design */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald" />
          <p className="text-sm font-medium">
            {lang === 'ar' ? 'طرق دفع آمنة' : 'Secure Payment Methods'}
          </p>
        </div>
        
        <div className="space-y-3">
          {paymentMethods.map((method, index) => (
            <button
              key={method.id}
              onClick={() => handleMethodSelect(method.id)}
              className={cn(
                "w-full p-4 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 text-start group",
                "hover:scale-[1.01] hover:shadow-lg",
                selectedMethod === method.id
                  ? "border-primary bg-gradient-to-r from-primary/10 to-primary/5 shadow-md"
                  : "border-border hover:border-primary/40 bg-card"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Icon with gradient */}
              <div className={cn(
                "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0 shadow-md transition-transform duration-300 group-hover:scale-105",
                method.gradient
              )}>
                <method.icon className="h-6 w-6" />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">{method.name}</span>
                  {method.popular && (
                    <span className="text-[10px] bg-gradient-gold text-primary-foreground px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" />
                      {lang === 'ar' ? 'الأكثر استخداماً' : 'Popular'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{method.description}</p>
              </div>
              
              {/* Selection indicator */}
              <div className={cn(
                "w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-300",
                selectedMethod === method.id
                  ? "border-primary bg-primary scale-110"
                  : "border-muted-foreground/30 group-hover:border-primary/50"
              )}>
                {selectedMethod === method.id && (
                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cash Warning with premium styling */}
      {selectedMethod === 'cash' && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 p-4 flex items-start gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="font-medium text-amber-700 dark:text-amber-400 text-sm">
              {lang === 'ar' ? 'ملاحظة مهمة' : 'Important Note'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {lang === 'ar'
                ? 'يرجى تجهيز المبلغ المطلوب عند استلام الطلب. قد يتم إلغاء الطلب في حال عدم التواجد.'
                : 'Please have the exact amount ready upon delivery. Order may be cancelled if unavailable.'}
            </p>
          </div>
        </div>
      )}

      {/* Security badge */}
      <div className="flex items-center justify-center gap-2 pt-4 text-muted-foreground">
        <Shield className="h-4 w-4 text-emerald" />
        <span className="text-xs">
          {lang === 'ar' ? 'جميع المعاملات محمية ومشفرة بأعلى معايير الأمان' : 'All transactions are secure and encrypted'}
        </span>
      </div>
    </div>
  );
}
