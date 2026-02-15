import { useState } from 'react';
import { useLang } from '@/contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, CreditCard, Smartphone, Building2,
  Check, Loader2, Lock, Shield, Package, MapPin, Zap, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { type CompletedOrderStep } from '@/hooks/useOrderSession';

interface FinalCheckoutViewProps {
  steps: CompletedOrderStep[];
  onPay: (method: string) => void;
  onBack: () => void;
  isProcessing?: boolean;
}

type PaymentMethod = 'applepay' | 'mada' | 'card' | 'tamara';

export default function FinalCheckoutView({
  steps,
  onPay,
  onBack,
  isProcessing = false,
}: FinalCheckoutViewProps) {
  const { lang, dir } = useLang();
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('applepay');

  // Calculate totals
  const itemsTotal = steps.reduce((sum, step) =>
    sum + step.items.reduce((s, item) => s + (item.price || 0) * item.quantity, 0), 0);
  const deliveryFee = 15 + (steps.length - 1) * 8;
  const urgentExtra = steps.some(s => s.isUrgent) ? Math.round(deliveryFee * 0.5) : 0;
  const subtotal = itemsTotal + deliveryFee + urgentExtra;
  const vat = Math.round(subtotal * 0.15 * 100) / 100;
  const grandTotal = Math.round((subtotal + vat) * 100) / 100;

  const paymentMethods: { id: PaymentMethod; name: string; icon: any; desc?: string }[] = [
    { id: 'applepay', name: 'Apple Pay', icon: Smartphone },
    { id: 'mada', name: lang === 'ar' ? 'مدى' : 'Mada', icon: Building2 },
    { id: 'card', name: lang === 'ar' ? 'بطاقة ائتمان' : 'Credit Card', icon: CreditCard },
    { id: 'tamara', name: 'Tamara', icon: CreditCard, desc: lang === 'ar' ? 'قسّم على 4' : 'Split into 4' },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-3 flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ms-2 text-muted-foreground hover:text-foreground">
            <BackArrow className="h-5 w-5" />
          </button>
          <h1 className="font-bold flex items-center gap-2">
            💳 {lang === 'ar' ? 'ملخص الطلب والدفع' : 'Order Summary & Payment'}
          </h1>
          <span className="text-lg font-bold font-en text-primary ms-auto">YA</span>
        </div>
      </div>

      <div className="container py-4 space-y-6">
        {/* Steps cards with timeline */}
        <div className="relative space-y-0">
          {/* Vertical orange line */}
          {steps.length > 1 && (
            <div className="absolute start-[19px] top-10 bottom-10 w-0.5 bg-primary/20 z-0" />
          )}

          {steps.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative z-10 mb-3"
            >
              <div className="rounded-2xl border bg-card p-4 ms-2">
                <div className="flex items-start gap-3">
                  {/* Step number circle */}
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0 -ms-6">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold truncate">{step.merchantName}</p>
                    </div>

                    {/* Delivery & urgency info */}
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {step.deliveryType === 'my_location'
                          ? (lang === 'ar' ? 'موقعي' : 'My location')
                          : (lang === 'ar' ? 'موقع ثاني' : 'Other location')}
                      </span>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                        {step.isUrgent
                          ? <><Zap className="h-3 w-3 text-primary" />{lang === 'ar' ? 'مستعجل' : 'Urgent'}</>
                          : <><Clock className="h-3 w-3" />{lang === 'ar' ? 'عادي' : 'Normal'}</>}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="space-y-1">
                      {step.items.map((item, j) => (
                        <div key={j} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{item.description}</span>
                            <span className="text-muted-foreground shrink-0">×{item.quantity}</span>
                          </div>
                          {item.price != null && (
                            <span className="text-primary font-medium shrink-0 ms-2">
                              {(item.price * item.quantity).toFixed(0)} {lang === 'ar' ? 'ر.س' : 'SAR'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Price breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-2xl border bg-card space-y-3"
        >
          <h3 className="font-bold text-sm">{lang === 'ar' ? 'تفصيل الأسعار' : 'Price Breakdown'}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{lang === 'ar' ? 'إجمالي المنتجات' : 'Items total'}</span>
              <span>{itemsTotal.toFixed(2)} {lang === 'ar' ? 'ر.س' : 'SAR'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {lang === 'ar'
                  ? `رسوم التوصيل (${steps.length} خطوة)`
                  : `Delivery fee (${steps.length} steps)`}
              </span>
              <span>{deliveryFee.toFixed(2)} {lang === 'ar' ? 'ر.س' : 'SAR'}</span>
            </div>
            {urgentExtra > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {lang === 'ar' ? 'رسم الاستعجال' : 'Urgency fee'}
                </span>
                <span>{urgentExtra.toFixed(2)} {lang === 'ar' ? 'ر.س' : 'SAR'}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{lang === 'ar' ? 'ضريبة القيمة المضافة 15%' : 'VAT 15%'}</span>
              <span>{vat.toFixed(2)} {lang === 'ar' ? 'ر.س' : 'SAR'}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-bold">{lang === 'ar' ? 'الإجمالي الكلي' : 'Grand Total'}</span>
              <span className="text-lg font-bold text-primary">{grandTotal.toFixed(2)} {lang === 'ar' ? 'ر.س' : 'SAR'}</span>
            </div>
          </div>
        </motion.div>

        {/* Payment methods */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <h3 className="font-bold text-sm">{lang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</h3>
          <div className="space-y-2">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                disabled={isProcessing}
                className={cn(
                  "w-full p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all",
                  selectedMethod === method.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <method.icon className="h-5 w-5 text-foreground" />
                </div>
                <div className="flex-1 text-start">
                  <p className="text-sm font-bold">{method.name}</p>
                  {method.desc && <p className="text-xs text-muted-foreground">{method.desc}</p>}
                </div>
                {selectedMethod === method.id && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-4 w-4" />
          {lang === 'ar' ? 'معاملة مشفرة وآمنة' : 'Encrypted & Secure Transaction'}
        </div>
      </div>

      {/* Fixed bottom pay button */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-background border-t border-border p-4 safe-area-bottom">
        <div className="container">
          <button
            onClick={() => onPay(selectedMethod)}
            disabled={isProcessing}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:brightness-95 transition-all shadow-ya-accent"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {lang === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
              </>
            ) : (
              <>
                <Lock className="h-5 w-5" />
                {lang === 'ar'
                  ? `ادفع الآن ${grandTotal.toFixed(2)} ر.س`
                  : `Pay Now ${grandTotal.toFixed(2)} SAR`}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
