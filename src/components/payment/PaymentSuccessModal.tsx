import { useLang } from '@/contexts/LangContext';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface PaymentSuccessModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  currency?: string;
  paymentMethod: string;
}

export default function PaymentSuccessModal({
  open,
  onClose,
  orderId,
  amount,
  currency = 'SAR',
  paymentMethod,
}: PaymentSuccessModalProps) {
  const { lang, dir } = useLang();

  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const methodNames: Record<string, string> = {
    card: lang === 'ar' ? 'بطاقة ائتمان' : 'Credit Card',
    mada: lang === 'ar' ? 'مدى' : 'Mada',
    applepay: 'Apple Pay',
    stcpay: 'STC Pay',
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm text-center">
        {/* Success Animation */}
        <div className="flex justify-center py-6">
          <div className="w-20 h-20 rounded-full bg-emerald/20 flex items-center justify-center animate-in zoom-in duration-300">
            <div className="w-14 h-14 rounded-full bg-emerald flex items-center justify-center">
              <Check className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold">
          {lang === 'ar' ? 'تم الدفع بنجاح!' : 'Payment Successful!'}
        </h2>
        
        <p className="text-muted-foreground">
          {lang === 'ar'
            ? 'تم استلام دفعتك وسيتم معالجة طلبك قريباً'
            : 'Your payment has been received and your order will be processed soon'}
        </p>

        {/* Payment Details */}
        <div className="bg-muted rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {lang === 'ar' ? 'رقم الطلب' : 'Order ID'}
            </span>
            <span className="font-mono font-medium">{orderId.slice(0, 8)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {lang === 'ar' ? 'المبلغ' : 'Amount'}
            </span>
            <span className="font-bold">{amount.toFixed(2)} {currency}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {lang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
            </span>
            <span>{methodNames[paymentMethod] || paymentMethod}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-gradient-gold text-primary-foreground py-3 rounded-xl font-bold shadow-gold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mt-2"
        >
          {lang === 'ar' ? 'تتبع الطلب' : 'Track Order'}
          <Arrow className="h-4 w-4" />
        </button>
      </DialogContent>
    </Dialog>
  );
}
