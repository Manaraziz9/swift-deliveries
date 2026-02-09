import { useState } from 'react';
import { useLang } from '@/contexts/LangContext';
import { CreditCard, Smartphone, Building2, Check, Loader2, X, Shield, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (paymentMethod: string) => void;
  amount: number;
  currency?: string;
}

type PaymentMethod = 'card' | 'mada' | 'applepay' | 'stcpay';

export default function PaymentModal({
  open,
  onClose,
  onSuccess,
  amount,
  currency = 'SAR',
}: PaymentModalProps) {
  const { lang } = useLang();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  const paymentMethods = [
    {
      id: 'mada' as PaymentMethod,
      name: lang === 'ar' ? 'مدى' : 'Mada',
      icon: Building2,
      color: 'bg-[#004D71]',
    },
    {
      id: 'card' as PaymentMethod,
      name: lang === 'ar' ? 'بطاقة ائتمان' : 'Credit Card',
      icon: CreditCard,
      color: 'bg-gradient-to-r from-blue-600 to-purple-600',
    },
    {
      id: 'applepay' as PaymentMethod,
      name: 'Apple Pay',
      icon: Smartphone,
      color: 'bg-black',
    },
    {
      id: 'stcpay' as PaymentMethod,
      name: 'STC Pay',
      icon: Smartphone,
      color: 'bg-[#4F008C]',
    },
  ];

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsProcessing(false);
    onSuccess(selectedMethod);
  };

  const handleQuickPay = async (method: PaymentMethod) => {
    setSelectedMethod(method);
    setIsProcessing(true);

    // Simulate quick payment (Apple Pay, STC Pay, Mada)
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsProcessing(false);
    onSuccess(method);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            {lang === 'ar' ? 'الدفع الآمن' : 'Secure Payment'}
          </DialogTitle>
        </DialogHeader>

        {/* Amount Display */}
        <div className="text-center py-4 bg-muted rounded-xl">
          <p className="text-sm text-muted-foreground mb-1">
            {lang === 'ar' ? 'المبلغ المطلوب' : 'Amount Due'}
          </p>
          <p className="text-3xl font-bold">
            {amount.toFixed(2)} <span className="text-lg">{currency}</span>
          </p>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3">
          <p className="text-sm font-medium">
            {lang === 'ar' ? 'اختر طريقة الدفع' : 'Select Payment Method'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => {
                  if (method.id !== 'card') {
                    handleQuickPay(method.id);
                  } else {
                    setSelectedMethod(method.id);
                  }
                }}
                disabled={isProcessing}
                className={cn(
                  "p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                  selectedMethod === method.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", method.color)}>
                  <method.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium">{method.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Card Form */}
        {selectedMethod === 'card' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                {lang === 'ar' ? 'رقم البطاقة' : 'Card Number'}
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="4242 4242 4242 4242"
                maxLength={19}
                className="w-full px-4 py-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                {lang === 'ar' ? 'اسم حامل البطاقة' : 'Cardholder Name'}
              </label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder={lang === 'ar' ? 'الاسم على البطاقة' : 'Name on card'}
                className="w-full px-4 py-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {lang === 'ar' ? 'تاريخ الانتهاء' : 'Expiry'}
                </label>
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">CVV</label>
                <input
                  type="text"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  maxLength={4}
                  className="w-full px-4 py-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-gradient-gold text-primary-foreground py-4 rounded-xl font-bold shadow-gold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {lang === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                </>
              ) : (
                <>
                  <Lock className="h-5 w-5" />
                  {lang === 'ar' ? `ادفع ${amount.toFixed(2)} ${currency}` : `Pay ${amount.toFixed(2)} ${currency}`}
                </>
              )}
            </button>
          </form>
        )}

        {/* Processing Overlay */}
        {isProcessing && selectedMethod !== 'card' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {lang === 'ar' ? 'جاري معالجة الدفع...' : 'Processing payment...'}
            </p>
          </div>
        )}

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
          <Shield className="h-4 w-4" />
          {lang === 'ar' ? 'معاملة مشفرة وآمنة' : 'Encrypted & Secure Transaction'}
        </div>
      </DialogContent>
    </Dialog>
  );
}
