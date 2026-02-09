import { useState } from 'react';
import { useLang } from '@/contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { useCreateOrder } from '@/hooks/useOrders';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Loader2, CreditCard } from 'lucide-react';
import StepOrderType from './steps/StepOrderType';
import StepSource from './steps/StepSource';
import StepItems from './steps/StepItems';
import StepDestination from './steps/StepDestination';
import StepPolicies from './steps/StepPolicies';
import StepReview from './steps/StepReview';
import StepPayment from './steps/StepPayment';
import PaymentModal from '@/components/payment/PaymentModal';
import PaymentSuccessModal from '@/components/payment/PaymentSuccessModal';
import { cn } from '@/lib/utils';

export interface OrderFormData {
  // Step 1: Order Type
  orderType: 'DIRECT' | 'PURCHASE_DELIVER' | 'CHAIN';
  domainId: string;
  
  // Step 2: Source
  sourceMerchantId: string | null;
  sourceBranchId: string | null;
  pickupAddress: string;
  pickupLat: number | null;
  pickupLng: number | null;
  
  // Step 3: Items
  items: {
    mode: 'catalog_item' | 'free_text';
    catalogItemId?: string;
    description: string;
    quantity: number;
    unit?: string;
    photos?: string[];
  }[];
  
  // Step 4: Destination
  dropoffAddress: string;
  dropoffLat: number | null;
  dropoffLng: number | null;
  recipientName: string;
  recipientPhone: string;
  
  // Step 5: Policies
  priceCap: number | null;
  substitutionPolicy: 'NONE' | 'SAME_CATEGORY' | 'WITHIN_PRICE' | 'CUSTOM_RULES';
  notes: string;

  // Step 6: Payment
  paymentMethod?: string;
}

const initialData: OrderFormData = {
  orderType: 'PURCHASE_DELIVER',
  domainId: '',
  sourceMerchantId: null,
  sourceBranchId: null,
  pickupAddress: '',
  pickupLat: null,
  pickupLng: null,
  items: [],
  dropoffAddress: '',
  dropoffLat: null,
  dropoffLng: null,
  recipientName: '',
  recipientPhone: '',
  priceCap: null,
  substitutionPolicy: 'NONE',
  notes: '',
  paymentMethod: 'mada',
};

interface OrderWizardProps {
  merchantId?: string;
  branchId?: string;
}

export default function OrderWizard({ merchantId, branchId }: OrderWizardProps) {
  const { lang, dir } = useLang();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OrderFormData>(() => ({
    ...initialData,
    sourceMerchantId: merchantId || null,
    sourceBranchId: branchId || null,
  }));
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string>('');

  const createOrder = useCreateOrder();

  // Calculate estimated total (demo values)
  const estimatedTotal = formData.items.reduce((sum, item) => sum + item.quantity * 25, 0) || 50;
  const deliveryFee = 15;
  const serviceFee = estimatedTotal * 0.05;
  const totalAmount = estimatedTotal + deliveryFee + serviceFee;

  const steps = [
    { id: 1, title: lang === 'ar' ? 'نوع الطلب' : 'Order Type' },
    { id: 2, title: lang === 'ar' ? 'المصدر' : 'Source' },
    { id: 3, title: lang === 'ar' ? 'المنتجات' : 'Items' },
    { id: 4, title: lang === 'ar' ? 'الوجهة' : 'Destination' },
    { id: 5, title: lang === 'ar' ? 'السياسات' : 'Policies' },
    { id: 6, title: lang === 'ar' ? 'الدفع' : 'Payment' },
    { id: 7, title: lang === 'ar' ? 'المراجعة' : 'Review' },
  ];

  const updateFormData = (data: Partial<OrderFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (step < 7) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    // If payment method requires online payment, show modal
    if (formData.paymentMethod && formData.paymentMethod !== 'cash') {
      setShowPaymentModal(true);
    } else {
      // Cash on delivery - create order directly
      await createOrderDraft('cash');
    }
  };

  const createOrderDraft = async (paymentMethod: string) => {
    try {
      const result = await createOrder.mutateAsync({
        order: {
          order_type: formData.orderType,
          domain_id: formData.domainId || null,
          source_merchant_id: formData.sourceMerchantId,
          source_branch_id: formData.sourceBranchId,
          pickup_address: formData.pickupAddress,
          pickup_lat: formData.pickupLat,
          pickup_lng: formData.pickupLng,
          dropoff_address: formData.dropoffAddress,
          dropoff_lat: formData.dropoffLat,
          dropoff_lng: formData.dropoffLng,
          recipient_name: formData.recipientName,
          recipient_phone: formData.recipientPhone,
          purchase_price_cap: formData.priceCap,
          substitution_policy: formData.substitutionPolicy,
          notes: formData.notes,
          status: paymentMethod === 'cash' ? 'draft' : 'paid',
          totals_json: {
            items: estimatedTotal,
            delivery: deliveryFee,
            service: serviceFee,
            total: totalAmount,
            payment_method: paymentMethod,
          },
        },
        items: formData.items.map(item => ({
          item_mode: item.mode,
          catalog_item_id: item.catalogItemId || null,
          free_text_description: item.description,
          quantity: item.quantity,
          unit: item.unit || null,
          photo_urls: item.photos || [],
        })),
      });

      return result;
    } catch (error: any) {
      toast.error(error.message || (lang === 'ar' ? 'حدث خطأ' : 'An error occurred'));
      throw error;
    }
  };

  const handlePaymentSuccess = async (paymentMethod: string) => {
    setShowPaymentModal(false);
    
    try {
      const result = await createOrderDraft(paymentMethod);
      setCreatedOrderId(result.id);
      setShowSuccessModal(true);
    } catch {
      // Error already handled in createOrderDraft
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate(`/orders/${createdOrderId}`);
  };

  const ArrowNext = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const ArrowPrev = dir === 'rtl' ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Bar */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container py-3">
          <div className="flex justify-between items-center mb-2">
            {steps.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                    step === s.id
                      ? "bg-primary text-primary-foreground"
                      : step > s.id
                      ? "bg-emerald text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {step > s.id ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : s.id}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-4 sm:w-8 h-0.5 mx-0.5 sm:mx-1",
                      step > s.id ? "bg-emerald" : "bg-muted"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-sm font-medium text-center">{steps[step - 1].title}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className="container py-6">
        {step === 1 && (
          <StepOrderType formData={formData} updateFormData={updateFormData} />
        )}
        {step === 2 && (
          <StepSource formData={formData} updateFormData={updateFormData} />
        )}
        {step === 3 && (
          <StepItems formData={formData} updateFormData={updateFormData} />
        )}
        {step === 4 && (
          <StepDestination formData={formData} updateFormData={updateFormData} />
        )}
        {step === 5 && (
          <StepPolicies formData={formData} updateFormData={updateFormData} />
        )}
        {step === 6 && (
          <StepPayment 
            formData={formData} 
            updateFormData={updateFormData}
            estimatedTotal={estimatedTotal}
          />
        )}
        {step === 7 && (
          <StepReview formData={formData} />
        )}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 inset-x-0 bg-background border-t p-4">
        <div className="container flex gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 py-3 rounded-xl border border-border font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors"
            >
              <ArrowPrev className="h-4 w-4" />
              {lang === 'ar' ? 'السابق' : 'Back'}
            </button>
          )}
          
          {step < 7 ? (
            <button
              onClick={handleNext}
              className="flex-1 bg-gradient-gold text-primary-foreground py-3 rounded-xl font-bold shadow-gold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              {lang === 'ar' ? 'التالي' : 'Next'}
              <ArrowNext className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={createOrder.isPending}
              className="flex-1 bg-gradient-gold text-primary-foreground py-3 rounded-xl font-bold shadow-gold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {createOrder.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : formData.paymentMethod === 'cash' ? (
                <>
                  <Check className="h-5 w-5" />
                  {lang === 'ar' ? 'تأكيد الطلب' : 'Confirm Order'}
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  {lang === 'ar' ? `ادفع ${totalAmount.toFixed(0)} ر.س` : `Pay ${totalAmount.toFixed(0)} SAR`}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        amount={totalAmount}
        currency={lang === 'ar' ? 'ر.س' : 'SAR'}
      />

      {/* Success Modal */}
      <PaymentSuccessModal
        open={showSuccessModal}
        onClose={handleSuccessClose}
        orderId={createdOrderId}
        amount={totalAmount}
        currency={lang === 'ar' ? 'ر.س' : 'SAR'}
        paymentMethod={formData.paymentMethod || 'cash'}
      />
    </div>
  );
}
