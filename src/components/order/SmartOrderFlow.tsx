import { useState, useCallback, useMemo } from 'react';
import { useLang } from '@/contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Loader2, Camera, MapPin, Navigation, Clock, Users, Zap, CreditCard, PhoneOff, Home, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateOrder } from '@/hooks/useOrders';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useMerchant, useBranches } from '@/hooks/useMerchants';
import { useUserLocations, SavedLocation } from '@/hooks/useUserLocations';
import { toast } from 'sonner';
import PaymentModal from '@/components/payment/PaymentModal';
import PaymentSuccessModal from '@/components/payment/PaymentSuccessModal';

interface SmartOrderFlowProps {
  merchantId?: string;
  branchId?: string;
}

type FlowStep = 'confirm' | 'what' | 'where' | 'purchase' | 'extra_step' | 'urgency' | 'review';

interface StepData {
  description: string;
  photos: string[];
  deliveryType: 'my_location' | 'other' | 'saved';
  selectedLocationId: string | null;
  dropoffAddress: string;
  dropoffLat: number | null;
  dropoffLng: number | null;
  hasPurchase: boolean;
  priceCap: number | null;
  substitutionPolicy: 'NONE' | 'SAME_CATEGORY' | 'WITHIN_PRICE';
  extraSteps: { description: string; recipientName: string; recipientPhone: string; address: string }[];
  isUrgent: boolean;
  splitExecutors: boolean;
  noContact: boolean;
  paymentMethod: string;
}

const initialStepData: StepData = {
  description: '',
  photos: [],
  deliveryType: 'my_location',
  selectedLocationId: null,
  dropoffAddress: '',
  dropoffLat: null,
  dropoffLng: null,
  hasPurchase: false,
  priceCap: null,
  substitutionPolicy: 'NONE',
  extraSteps: [],
  isUrgent: false,
  splitExecutors: false,
  noContact: false,
  paymentMethod: 'mada',
};

export default function SmartOrderFlow({ merchantId, branchId }: SmartOrderFlowProps) {
  const { lang, dir } = useLang();
  const navigate = useNavigate();
  const [step, setStep] = useState<FlowStep>('confirm');
  const [data, setData] = useState<StepData>(initialStepData);
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');
  const [addingStep, setAddingStep] = useState(false);
  const [newStep, setNewStep] = useState({ description: '', recipientName: '', recipientPhone: '', address: '' });

  const createOrder = useCreateOrder();
  const { latitude, longitude, loading: geoLoading, requestLocation, hasLocation } = useGeolocation();
  const { data: merchant } = useMerchant(merchantId);
  const { data: branches } = useBranches(merchantId);
  const { locations: savedLocations, defaultLocation } = useUserLocations();

  const ArrowBack = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const ArrowNext = dir === 'rtl' ? ArrowLeft : ArrowRight;

  // Price estimate
  const priceEstimate = useMemo(() => {
    let base = 15;
    if (data.hasPurchase) base += 10;
    if (data.extraSteps.length > 0) base += data.extraSteps.length * 8;
    if (data.isUrgent) base = Math.round(base * 1.5);
    const low = base;
    const high = Math.round(base * 1.6);
    return { low, high };
  }, [data.hasPurchase, data.extraSteps.length, data.isUrgent]);

  const ICON_MAP: Record<string, any> = { home: Home, work: Briefcase, 'map-pin': MapPin };

  const merchantName = merchant
    ? (lang === 'ar' && merchant.business_name_ar ? merchant.business_name_ar : merchant.business_name)
    : '';

  const update = (partial: Partial<StepData>) => setData(prev => ({ ...prev, ...partial }));

  const flowSteps: FlowStep[] = ['confirm', 'what', 'where', 'purchase', 'extra_step', 'urgency', 'review'];

  const goNext = () => {
    const idx = flowSteps.indexOf(step);
    // Skip purchase step if no purchase
    if (step === 'where' && !data.hasPurchase) {
      setStep('extra_step');
      return;
    }
    if (idx < flowSteps.length - 1) setStep(flowSteps[idx + 1]);
  };

  const goBack = () => {
    const idx = flowSteps.indexOf(step);
    if (step === 'extra_step' && !data.hasPurchase) {
      setStep('where');
      return;
    }
    if (idx > 0) setStep(flowSteps[idx - 1]);
    else navigate(-1);
  };

  // Determine order type from answers
  const getOrderType = () => {
    if (data.extraSteps.length > 0) return 'CHAIN' as const;
    if (data.hasPurchase) return 'PURCHASE_DELIVER' as const;
    return 'DIRECT' as const;
  };

  const handleSubmit = async () => {
    try {
      const orderType = getOrderType();
      const result = await createOrder.mutateAsync({
        order: {
          order_type: orderType,
          source_merchant_id: merchantId || null,
          source_branch_id: branchId || branches?.[0]?.id || null,
          pickup_address: '',
          pickup_lat: null,
          pickup_lng: null,
          dropoff_address: data.dropoffAddress,
          dropoff_lat: data.dropoffLat,
          dropoff_lng: data.dropoffLng,
          recipient_name: '',
          recipient_phone: '',
          purchase_price_cap: data.priceCap,
          substitution_policy: data.substitutionPolicy,
          notes: data.description,
          status: 'draft',
          totals_json: {
            payment_method: data.paymentMethod,
            is_urgent: data.isUrgent,
            split_executors: data.splitExecutors,
          },
        },
        items: [{
          item_mode: 'free_text',
          catalog_item_id: null,
          free_text_description: data.description,
          quantity: 1,
          unit: null,
          photo_urls: data.photos,
        }],
      });
      setCreatedOrderId(result.id);
      setShowSuccess(true);
    } catch (error: any) {
      toast.error(error.message || (lang === 'ar' ? 'حدث خطأ' : 'An error occurred'));
    }
  };

  const handleUseLocation = () => {
    requestLocation();
    if (latitude && longitude) {
      update({
        deliveryType: 'my_location',
        dropoffLat: latitude,
        dropoffLng: longitude,
        dropoffAddress: lang === 'ar' ? 'موقعي الحالي' : 'My Current Location',
      });
    }
  };

  const addExtraStep = () => {
    if (!newStep.description.trim()) return;
    update({ extraSteps: [...data.extraSteps, { ...newStep }] });
    setNewStep({ description: '', recipientName: '', recipientPhone: '', address: '' });
    setAddingStep(false);
  };

  // Progress indicator
  const currentIdx = flowSteps.indexOf(step);
  const progress = ((currentIdx + 1) / flowSteps.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-3 flex items-center justify-between">
          <button onClick={goBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowBack className="h-4 w-4" />
            {lang === 'ar' ? 'رجوع' : 'Back'}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold font-en">YA</span>
            <span className="w-1.5 h-1.5 rounded-full bg-ya-highlight" />
          </div>
          <div className="w-16" />
        </div>
        {/* Progress */}
        <div className="h-1 bg-muted">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 container py-6 pb-28">
        {/* Step 0 — Confirm */}
        {step === 'confirm' && (
          <div className="text-center space-y-6 pt-8">
            <h2 className="text-xl font-bold">
              {lang === 'ar' ? 'تأكيد الطلب' : 'Confirm Order'}
            </h2>
            <p className="text-muted-foreground">
              {lang === 'ar' 
                ? `تبغى تطلب من ${merchantName}؟`
                : `Order from ${merchantName}?`}
            </p>
            {merchant?.logo_url && (
              <img src={merchant.logo_url} alt="" className="w-20 h-20 rounded-2xl object-cover mx-auto border-2 border-border" />
            )}
          </div>
        )}

        {/* Step 1 — What */}
        {step === 'what' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">
              {lang === 'ar' ? 'وش تبغى؟' : 'What do you need?'}
            </h2>
            <textarea
              value={data.description}
              onChange={e => update({ description: e.target.value })}
              placeholder={lang === 'ar' ? 'اكتب طلبك باختصار...' : 'Describe your request briefly...'}
              className="w-full rounded-2xl border-2 bg-card px-4 py-3 text-sm min-h-[120px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              autoFocus
            />
            <button className="flex items-center gap-2 text-sm text-primary font-medium px-4 py-2 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors">
              <Camera className="h-4 w-4" />
              {lang === 'ar' ? 'إضافة صورة' : 'Add photo'}
            </button>
          </div>
        )}

        {/* Step 2 — Where */}
        {step === 'where' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">
              {lang === 'ar' ? 'التوصيل وين؟' : 'Where to deliver?'}
            </h2>
            
            {/* Default / My location */}
            <button
              onClick={() => {
                if (defaultLocation) {
                  update({ deliveryType: 'saved', selectedLocationId: defaultLocation.id, dropoffAddress: defaultLocation.address_text || '', dropoffLat: defaultLocation.lat, dropoffLng: defaultLocation.lng });
                } else {
                  handleUseLocation();
                }
              }}
              disabled={geoLoading}
              className={cn(
                "w-full p-4 rounded-2xl border-2 flex items-center gap-3 transition-all",
                (data.deliveryType === 'my_location' || (data.deliveryType === 'saved' && data.selectedLocationId === defaultLocation?.id))
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50"
              )}
            >
              {geoLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Navigation className="h-5 w-5 text-primary" />}
              <div className="text-start">
                <span className="font-medium block">{lang === 'ar' ? 'موقعي' : 'My location'}</span>
                {defaultLocation && (
                  <span className="text-xs text-muted-foreground">{defaultLocation.label} — {defaultLocation.address_text}</span>
                )}
              </div>
            </button>

            {/* Saved locations */}
            {savedLocations.filter(l => l.id !== defaultLocation?.id).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground px-1">{lang === 'ar' ? 'مواقع محفوظة' : 'Saved locations'}</p>
                {savedLocations.filter(l => l.id !== defaultLocation?.id).map(loc => {
                  const IconComp = ICON_MAP[loc.icon || 'map-pin'] || MapPin;
                  return (
                    <button
                      key={loc.id}
                      onClick={() => update({ deliveryType: 'saved', selectedLocationId: loc.id, dropoffAddress: loc.address_text || '', dropoffLat: loc.lat, dropoffLng: loc.lng })}
                      className={cn(
                        "w-full p-3 rounded-xl border flex items-center gap-3 transition-all",
                        data.selectedLocationId === loc.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      )}
                    >
                      <IconComp className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="text-start min-w-0">
                        <p className="text-sm font-medium">{loc.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{lang === 'ar' ? loc.address_text_ar || loc.address_text : loc.address_text}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Other location */}
            <button
              onClick={() => update({ deliveryType: 'other', selectedLocationId: null })}
              className={cn(
                "w-full p-4 rounded-2xl border-2 flex items-center gap-3 transition-all",
                data.deliveryType === 'other'
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <MapPin className="h-5 w-5 text-primary" />
              <span className="font-medium">{lang === 'ar' ? 'موقع ثاني' : 'Another location'}</span>
            </button>
            {data.deliveryType === 'other' && (
              <textarea
                value={data.dropoffAddress}
                onChange={e => update({ dropoffAddress: e.target.value })}
                placeholder={lang === 'ar' ? 'أدخل العنوان بالتفصيل...' : 'Enter detailed address...'}
                className="w-full rounded-2xl border-2 bg-card px-4 py-3 text-sm min-h-[80px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            )}
          </div>
        )}

        {/* Step 3 — Purchase? */}
        {step === 'purchase' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">
              {lang === 'ar' ? 'هل لازم نشتري شي؟' : 'Need us to purchase something?'}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => update({ hasPurchase: true })}
                className={cn(
                  "p-6 rounded-2xl border-2 text-center font-bold transition-all",
                  data.hasPurchase ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                {lang === 'ar' ? 'ايه' : 'Yes'}
              </button>
              <button
                onClick={() => update({ hasPurchase: false })}
                className={cn(
                  "p-6 rounded-2xl border-2 text-center font-bold transition-all",
                  !data.hasPurchase ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                {lang === 'ar' ? 'لا' : 'No'}
              </button>
            </div>
            {data.hasPurchase && (
              <div className="space-y-3 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {lang === 'ar' ? 'الحد الأعلى للشراء' : 'Purchase price cap'}
                  </label>
                  <input
                    type="number"
                    value={data.priceCap || ''}
                    onChange={e => update({ priceCap: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder={lang === 'ar' ? 'مثال: 500 ريال' : 'e.g. 500 SAR'}
                    className="w-full rounded-2xl border-2 bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {lang === 'ar' ? 'بدائل؟' : 'Substitutions?'}
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'NONE' as const, label: lang === 'ar' ? 'بدون بديل' : 'No substitution' },
                      { value: 'SAME_CATEGORY' as const, label: lang === 'ar' ? 'بديل بنفس النوع' : 'Same category' },
                      { value: 'WITHIN_PRICE' as const, label: lang === 'ar' ? 'بديل بنفس السعر' : 'Within price' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => update({ substitutionPolicy: opt.value })}
                        className={cn(
                          "w-full p-3 rounded-xl border text-start text-sm transition-all",
                          data.substitutionPolicy === opt.value ? "border-primary bg-primary/5 font-medium" : "border-border"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4 — Extra Steps */}
        {step === 'extra_step' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">
              {lang === 'ar' ? 'فيه خطوة ثانية؟' : 'Any additional steps?'}
            </h2>

            {data.extraSteps.map((s, i) => (
              <div key={i} className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm">
                <p className="font-medium">{lang === 'ar' ? `خطوة ${i + 2}` : `Step ${i + 2}`}: {s.description}</p>
                {s.recipientName && <p className="text-xs text-muted-foreground mt-1">{s.recipientName} • {s.recipientPhone}</p>}
              </div>
            ))}

            {addingStep ? (
              <div className="space-y-3 animate-fade-in">
                <input
                  value={newStep.description}
                  onChange={e => setNewStep(p => ({ ...p, description: e.target.value }))}
                  placeholder={lang === 'ar' ? 'وصف الخطوة...' : 'Step description...'}
                  className="w-full rounded-xl border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
                <input
                  value={newStep.recipientName}
                  onChange={e => setNewStep(p => ({ ...p, recipientName: e.target.value }))}
                  placeholder={lang === 'ar' ? 'اسم المستلم (اختياري)' : 'Recipient name (optional)'}
                  className="w-full rounded-xl border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  value={newStep.recipientPhone}
                  onChange={e => setNewStep(p => ({ ...p, recipientPhone: e.target.value }))}
                  placeholder={lang === 'ar' ? 'رقم الهاتف (اختياري)' : 'Phone (optional)'}
                  className="w-full rounded-xl border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  dir="ltr"
                />
                <div className="flex gap-2">
                  <button onClick={() => setAddingStep(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium">
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button onClick={addExtraStep} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
                    {lang === 'ar' ? 'إضافة' : 'Add'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setAddingStep(true)}
                  className="p-6 rounded-2xl border-2 border-dashed border-primary/30 text-center font-bold text-primary hover:bg-primary/5 transition-all"
                >
                  {lang === 'ar' ? 'نعم، أضف خطوة' : 'Yes, add step'}
                </button>
                <button
                  onClick={goNext}
                  className="p-6 rounded-2xl border-2 text-center font-bold border-border hover:border-primary/50 transition-all"
                >
                  {lang === 'ar' ? 'لا' : 'No'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 5 — Urgency + Preferences */}
        {step === 'urgency' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">
              {lang === 'ar' ? 'مستعجل؟' : 'Is it urgent?'}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => update({ isUrgent: false })}
                className={cn(
                  "p-6 rounded-2xl border-2 text-center transition-all",
                  !data.isUrgent ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <span className="font-bold">{lang === 'ar' ? 'عادي' : 'Normal'}</span>
              </button>
              <button
                onClick={() => update({ isUrgent: true })}
                className={cn(
                  "p-6 rounded-2xl border-2 text-center transition-all",
                  data.isUrgent ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <Zap className="h-6 w-6 mx-auto mb-2 text-primary" />
                <span className="font-bold">{lang === 'ar' ? 'مستعجل' : 'Urgent'}</span>
              </button>
            </div>
            {data.isUrgent && data.extraSteps.length > 0 && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in">
                <p className="text-sm font-medium mb-3">
                  {lang === 'ar' ? 'نقدر نقسم المهام على أكثر من مندوب عشان تخلص أسرع' : 'We can split tasks between executors for faster delivery'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => update({ splitExecutors: true })}
                    className={cn("flex-1 py-2.5 rounded-xl border text-sm font-medium", data.splitExecutors ? "bg-primary text-primary-foreground" : "border-border")}
                  >
                    {lang === 'ar' ? 'موافق' : 'Yes'}
                  </button>
                  <button
                    onClick={() => update({ splitExecutors: false })}
                    className={cn("flex-1 py-2.5 rounded-xl border text-sm font-medium", !data.splitExecutors ? "bg-primary text-primary-foreground" : "border-border")}
                  >
                    {lang === 'ar' ? 'لا' : 'No'}
                  </button>
                </div>
              </div>
            )}

            {/* No-contact preference */}
            <button
              onClick={() => update({ noContact: !data.noContact })}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                data.noContact ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
              )}
            >
              <PhoneOff className={cn("h-5 w-5 shrink-0", data.noContact ? "text-primary" : "text-muted-foreground")} />
              <div className="text-start flex-1">
                <p className="text-sm font-medium">{lang === 'ar' ? 'ما أحب المكالمات' : "Don't call me"}</p>
                <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'المندوب يلتزم بالتعليمات فقط' : 'Executor follows instructions only'}</p>
              </div>
              <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", data.noContact ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                {data.noContact && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
            </button>

            {/* Price estimate hint */}
            <div className="rounded-2xl bg-ya-highlight/10 border border-ya-highlight/20 p-4">
              <p className="text-sm font-medium text-foreground">
                {lang === 'ar' ? 'التكلفة المتوقعة:' : 'Estimated cost:'}
                <span className="font-bold text-primary ms-2">
                  {priceEstimate.low} – {priceEstimate.high} {lang === 'ar' ? 'ر.س' : 'SAR'}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {lang === 'ar' ? 'السعر النهائي يحدد بعد المراجعة' : 'Final price determined after review'}
              </p>
            </div>
          </div>
        )}

        {/* Step 6 — Review */}
        {step === 'review' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">
              {lang === 'ar' ? 'مراجعة الطلب' : 'Review Order'}
            </h2>

            <div className="rounded-2xl bg-card border p-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'الجهة' : 'From'}</p>
                <p className="font-bold">{merchantName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'الطلب' : 'Request'}</p>
                <p className="text-sm">{data.description || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'التوصيل' : 'Delivery'}</p>
                <p className="text-sm">
                  {data.deliveryType === 'saved' 
                    ? savedLocations.find(l => l.id === data.selectedLocationId)?.label || data.dropoffAddress
                    : data.deliveryType === 'my_location' 
                      ? (lang === 'ar' ? 'موقعي' : 'My location') 
                      : data.dropoffAddress}
                </p>
              </div>
              {data.hasPurchase && (
                <div>
                  <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'شراء' : 'Purchase'}</p>
                  <p className="text-sm">{lang === 'ar' ? 'نعم' : 'Yes'} • {lang === 'ar' ? 'سقف' : 'Cap'}: {data.priceCap || '—'} {lang === 'ar' ? 'ر.س' : 'SAR'}</p>
                </div>
              )}
              {data.extraSteps.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'خطوات إضافية' : 'Extra steps'}</p>
                  {data.extraSteps.map((s, i) => (
                    <p key={i} className="text-sm">{i + 2}. {s.description}</p>
                  ))}
                </div>
              )}
              {data.isUrgent && (
                <div className="flex items-center gap-2 text-primary text-sm font-medium">
                  <Zap className="h-4 w-4" />
                  {lang === 'ar' ? 'مستعجل' : 'Urgent'}
                </div>
              )}
              {data.noContact && (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <PhoneOff className="h-4 w-4" />
                  {lang === 'ar' ? 'بدون اتصال' : 'No calls'}
                </div>
              )}
            </div>

            {/* Price estimate */}
            <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 text-center">
              <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'التكلفة المتوقعة' : 'Estimated cost'}</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {priceEstimate.low} – {priceEstimate.high} {lang === 'ar' ? 'ر.س' : 'SAR'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 inset-x-0 bg-background border-t border-border p-4">
        <div className="container">
          {step === 'confirm' ? (
            <div className="flex gap-3">
              <button onClick={() => navigate(-1)} className="flex-1 py-3 rounded-xl border font-medium">
                {lang === 'ar' ? 'رجوع' : 'Back'}
              </button>
              <button onClick={goNext} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold">
                {lang === 'ar' ? 'نعم' : 'Yes'}
              </button>
            </div>
          ) : step === 'review' ? (
            <button
              onClick={handleSubmit}
              disabled={createOrder.isPending}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {createOrder.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  {lang === 'ar' ? 'تأكيد الطلب' : 'Confirm Order'}
                </>
              )}
            </button>
          ) : step === 'extra_step' ? (
            // Extra step has its own buttons
            !addingStep && data.extraSteps.length > 0 ? (
              <button onClick={goNext} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2">
                {lang === 'ar' ? 'التالي' : 'Next'}
                <ArrowNext className="h-4 w-4" />
              </button>
            ) : null
          ) : (
            <button
              onClick={goNext}
              disabled={step === 'what' && !data.description.trim()}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {lang === 'ar' ? 'كمّل' : 'Continue'}
              <ArrowNext className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={(method) => {
          setShowPayment(false);
          handleSubmit();
        }}
        amount={50}
        currency={lang === 'ar' ? 'ر.س' : 'SAR'}
      />

      <PaymentSuccessModal
        open={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          navigate(`/orders/${createdOrderId}`);
        }}
        orderId={createdOrderId}
        amount={50}
        currency={lang === 'ar' ? 'ر.س' : 'SAR'}
        paymentMethod={data.paymentMethod}
      />
    </div>
  );
}
