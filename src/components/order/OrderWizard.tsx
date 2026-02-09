import { useState, useCallback } from 'react';
import { useLang } from '@/contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { useCreateOrder } from '@/hooks/useOrders';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Check, Loader2, CreditCard } from 'lucide-react';
import IntentSelection from './IntentSelection';
import StepSource from './steps/StepSource';
import StepChainTasks from './steps/StepChainTasks';
import StepItems from './steps/StepItems';
import StepDestination from './steps/StepDestination';
import StepPolicies from './steps/StepPolicies';
import StepReview from './steps/StepReview';
import StepPayment from './steps/StepPayment';
import PaymentModal from '@/components/payment/PaymentModal';
import PaymentSuccessModal from '@/components/payment/PaymentSuccessModal';
import DecisionPrompt from './DecisionPrompt';
import SmartHint from './SmartHint';
import { cn } from '@/lib/utils';
import { 
  Intent, 
  OrderState, 
  intentToOrderType, 
  shouldShowPrompt, 
  applyConversion,
  getIntentMetadata,
  getTryConstraints
} from '@/lib/orderIntentRules';

// Chain Task type for multi-step orders
export interface ChainTask {
  id: string;
  sequence: number;
  type: 'pickup' | 'purchase' | 'dropoff' | 'handover' | 'onsite';
  merchantId: string | null;
  branchId: string | null;
  address: string;
  lat: number | null;
  lng: number | null;
  description: string;
}

export interface OrderFormData {
  // Intent (new)
  intent: Intent | null;
  
  // Order Type (internal)
  orderType: 'DIRECT' | 'PURCHASE_DELIVER' | 'CHAIN';
  domainId: string;
  
  // Recipient Type
  recipientType: 'SELF' | 'THIRD_PARTY';
  
  // Source (for DIRECT/PURCHASE_DELIVER)
  sourceMerchantId: string | null;
  sourceBranchId: string | null;
  pickupAddress: string;
  pickupLat: number | null;
  pickupLng: number | null;
  
  // Chain Tasks (for CHAIN orders)
  chainTasks: ChainTask[];
  
  // Items
  items: {
    mode: 'catalog_item' | 'free_text';
    catalogItemId?: string;
    description: string;
    quantity: number;
    unit?: string;
    photos?: string[];
    notes?: string;
  }[];
  
  // Destination
  dropoffAddress: string;
  dropoffLat: number | null;
  dropoffLng: number | null;
  recipientName: string;
  recipientPhone: string;
  
  // Policies
  priceCap: number | null;
  substitutionPolicy: 'NONE' | 'SAME_CATEGORY' | 'WITHIN_PRICE' | 'CUSTOM_RULES';
  notes: string;

  // Payment
  paymentMethod?: string;
  
  // Experiment flag (for TRY intent)
  experimentFlag?: boolean;
}

const initialData: OrderFormData = {
  intent: null,
  orderType: 'DIRECT',
  domainId: '',
  recipientType: 'SELF',
  sourceMerchantId: null,
  sourceBranchId: null,
  pickupAddress: '',
  pickupLat: null,
  pickupLng: null,
  chainTasks: [],
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
  experimentFlag: false,
};

interface OrderWizardProps {
  merchantId?: string;
  branchId?: string;
}

export default function OrderWizard({ merchantId, branchId }: OrderWizardProps) {
  const { lang, dir } = useLang();
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 = Intent selection
  const [formData, setFormData] = useState<OrderFormData>(() => ({
    ...initialData,
    sourceMerchantId: merchantId || null,
    sourceBranchId: branchId || null,
  }));
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string>('');
  const [showDecisionPrompt, setShowDecisionPrompt] = useState(false);
  const [decisionPromptData, setDecisionPromptData] = useState<{
    suggestedIntent: Intent;
    reason: 'third_party' | 'has_purchase' | 'complex_chain' | 'auto_convert';
  } | null>(null);
  const [showSmartHint, setShowSmartHint] = useState(false);
  const [smartHintDismissed, setSmartHintDismissed] = useState(false);

  const createOrder = useCreateOrder();

  // Calculate estimated total (demo values)
  const estimatedTotal = formData.items.reduce((sum, item) => sum + item.quantity * 25, 0) || 50;
  const deliveryFee = 15;
  const serviceFee = estimatedTotal * 0.05;
  const coordinationFee = formData.orderType === 'CHAIN' ? 10 : 0;
  const totalAmount = estimatedTotal + deliveryFee + serviceFee + coordinationFee;

  // Get current order state for rules engine
  const getOrderState = useCallback((): OrderState => ({
    intent: formData.intent || 'TASK',
    hasPurchase: formData.items.length > 0 || formData.orderType === 'PURCHASE_DELIVER',
    recipientType: formData.recipientType,
    stagesCount: formData.chainTasks.length || 2,
    hasHandover: formData.chainTasks.some(t => t.type === 'handover'),
  }), [formData]);

  // Dynamic steps based on intent/order type
  const getSteps = () => {
    const baseSteps = [
      { id: 1, key: 'source', title: lang === 'ar' ? 'المصدر' : 'Source' },
      { id: 2, key: 'items', title: lang === 'ar' ? 'المنتجات' : 'Items' },
      { id: 3, key: 'destination', title: lang === 'ar' ? 'الوجهة' : 'Destination' },
      { id: 4, key: 'policies', title: lang === 'ar' ? 'السياسات' : 'Policies' },
      { id: 5, key: 'payment', title: lang === 'ar' ? 'الدفع' : 'Payment' },
      { id: 6, key: 'review', title: lang === 'ar' ? 'المراجعة' : 'Review' },
    ];

    // CHAIN orders use tasks step instead of source
    if (formData.orderType === 'CHAIN') {
      baseSteps[0] = { id: 1, key: 'tasks', title: lang === 'ar' ? 'المهام' : 'Tasks' };
    }

    // TASK intent without purchase can skip policies
    if (formData.intent === 'TASK' && formData.items.length === 0) {
      return baseSteps.filter(s => s.key !== 'policies' && s.key !== 'items');
    }

    return baseSteps;
  };

  const steps = getSteps();
  const maxStep = steps.length;

  const updateFormData = (data: Partial<OrderFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  // Handle intent selection
  const handleIntentSelect = (intent: Intent) => {
    const orderType = intentToOrderType(intent);
    const isTry = intent === 'TRY';
    
    updateFormData({ 
      intent, 
      orderType,
      experimentFlag: isTry,
      // Apply TRY constraints
      ...(isTry && { priceCap: formData.priceCap || 100 }),
    });
    
    setStep(1); // Move to first step
  };

  const handleNext = () => {
    // Check for conversion prompts before advancing
    const state = getOrderState();
    const prompt = shouldShowPrompt(state);

    if (prompt.show && prompt.suggestedIntent && !smartHintDismissed) {
      if (prompt.autoConvert) {
        // Auto-convert with notification
        setDecisionPromptData({
          suggestedIntent: prompt.suggestedIntent,
          reason: prompt.reason!,
        });
        setShowDecisionPrompt(true);
        return;
      }
      
      // Show suggestion prompt
      setDecisionPromptData({
        suggestedIntent: prompt.suggestedIntent,
        reason: prompt.reason!,
      });
      setShowDecisionPrompt(true);
      return;
    }

    if (step < maxStep) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleDecisionAccept = () => {
    if (decisionPromptData) {
      const newState = applyConversion(getOrderState(), decisionPromptData.suggestedIntent);
      updateFormData({
        intent: newState.intent,
        orderType: intentToOrderType(newState.intent),
        experimentFlag: newState.experimentFlag,
      });
    }
    setShowDecisionPrompt(false);
    setDecisionPromptData(null);
    // Continue to next step
    if (step < maxStep) setStep(step + 1);
  };

  const handleDecisionDecline = () => {
    setShowDecisionPrompt(false);
    setDecisionPromptData(null);
    setSmartHintDismissed(true);
    // Continue to next step anyway
    if (step < maxStep) setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (formData.paymentMethod && formData.paymentMethod !== 'cash') {
      setShowPaymentModal(true);
    } else {
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
            coordination: coordinationFee,
            total: totalAmount,
            payment_method: paymentMethod,
            intent: formData.intent,
            experiment_flag: formData.experimentFlag,
          },
        },
        items: formData.items.map(item => ({
          item_mode: item.mode,
          catalog_item_id: item.catalogItemId || null,
          free_text_description: item.description + (item.notes ? `\n[ملاحظة: ${item.notes}]` : ''),
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
      // Error already handled
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    navigate(`/orders/${createdOrderId}`);
  };

  const handleSmartHintConvert = () => {
    updateFormData({
      intent: 'COORDINATE',
      orderType: 'CHAIN',
    });
    setShowSmartHint(false);
  };

  const ArrowNext = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const ArrowPrev = dir === 'rtl' ? ArrowRight : ArrowLeft;

  // Check if we should show smart hint on review step
  const shouldShowSmartHintOnReview = step === maxStep && 
    formData.recipientType === 'THIRD_PARTY' && 
    formData.intent !== 'COORDINATE' &&
    !smartHintDismissed;

  // Step 0: Intent Selection
  if (step === 0) {
    return <IntentSelection onSelect={handleIntentSelect} />;
  }

  const currentStepData = steps[step - 1];
  const intentMetadata = formData.intent ? getIntentMetadata(formData.intent) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b">
        <div className="container py-3">
          {/* Back Button Row */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => step > 0 ? handleBack() : navigate(-1)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowPrev className="h-4 w-4" />
              {step > 1 
                ? (lang === 'ar' ? 'السابق' : 'Back')
                : (lang === 'ar' ? 'تغيير النوع' : 'Change Type')
              }
            </button>
            <div className="flex items-center gap-2">
              {intentMetadata && (
                <span className="text-lg">{intentMetadata.emoji}</span>
              )}
              <h2 className="text-sm font-bold">
                {intentMetadata 
                  ? (lang === 'ar' ? intentMetadata.titleAr : intentMetadata.titleEn)
                  : (lang === 'ar' ? 'طلب جديد' : 'New Order')
                }
              </h2>
            </div>
            <div className="w-16" />
          </div>
          
          {/* Progress Bar */}
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
          <p className="text-sm font-medium text-center">{currentStepData?.title}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className="container py-6">
        {/* Smart Hint */}
        {shouldShowSmartHintOnReview && (
          <SmartHint
            isVisible={true}
            onConvert={handleSmartHintConvert}
            onDismiss={() => setSmartHintDismissed(true)}
            suggestedIntent="COORDINATE"
          />
        )}

        {currentStepData?.key === 'source' && (
          <StepSource formData={formData} updateFormData={updateFormData} />
        )}
        {currentStepData?.key === 'tasks' && (
          <StepChainTasks formData={formData} updateFormData={updateFormData} />
        )}
        {currentStepData?.key === 'items' && (
          <StepItems formData={formData} updateFormData={updateFormData} />
        )}
        {currentStepData?.key === 'destination' && (
          <StepDestination formData={formData} updateFormData={updateFormData} />
        )}
        {currentStepData?.key === 'policies' && (
          <StepPolicies formData={formData} updateFormData={updateFormData} />
        )}
        {currentStepData?.key === 'payment' && (
          <StepPayment 
            formData={formData} 
            updateFormData={updateFormData}
            estimatedTotal={estimatedTotal}
          />
        )}
        {currentStepData?.key === 'review' && (
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
          
          {step < maxStep ? (
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

      {/* Decision Prompt */}
      {decisionPromptData && (
        <DecisionPrompt
          isOpen={showDecisionPrompt}
          onClose={() => setShowDecisionPrompt(false)}
          onAccept={handleDecisionAccept}
          onDecline={handleDecisionDecline}
          suggestedIntent={decisionPromptData.suggestedIntent}
          reason={decisionPromptData.reason}
        />
      )}

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
