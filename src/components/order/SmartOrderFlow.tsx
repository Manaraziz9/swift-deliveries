import { useState, useMemo } from 'react';
import { useLang } from '@/contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Plus, Minus, Trash2, Search,
  MapPin, Navigation, Zap, Clock, Check, Loader2,
  PhoneOff, Users, Home, Briefcase, Package, FileText,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateOrder } from '@/hooks/useOrders';
import { useMerchant, useBranches, useCatalogItems } from '@/hooks/useMerchants';
import { useUserLocations } from '@/hooks/useUserLocations';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { toast } from 'sonner';
import VoiceInputButton from '@/components/shared/VoiceInputButton';
import PrayerTimeNotice from '@/components/order/PrayerTimeNotice';
import StepConfirmationView from './StepConfirmationView';
import FinalCheckoutView from './FinalCheckoutView';
import PickupOptionsView from './PickupOptionsView';
import { useOrderSession, type CompletedOrderStep } from '@/hooks/useOrderSession';
import { AnimatePresence, motion } from 'framer-motion';

interface SmartOrderFlowProps {
  merchantId?: string;
  branchId?: string;
}

interface CartItem {
  id: string;
  type: 'catalog' | 'custom';
  catalogItemId?: string;
  description: string;
  price?: number;
  quantity: number;
  unit?: string;
  specification?: string;
  notes?: string;
}

type Phase = 'shopping' | 'step_confirmed' | 'checkout' | 'pickup_options';

export default function SmartOrderFlow({ merchantId, branchId }: SmartOrderFlowProps) {
  const { lang, dir } = useLang();
  const navigate = useNavigate();
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const session = useOrderSession();

  // Data hooks
  const { data: merchant } = useMerchant(merchantId);
  const { data: branches } = useBranches(merchantId);
  const { data: catalogItems } = useCatalogItems(merchantId);
  const { locations: savedLocations, defaultLocation } = useUserLocations();
  const { latitude, longitude, loading: geoLoading, requestLocation } = useGeolocation();
  const createOrder = useCreateOrder();
  const catalogVoice = useVoiceInput({ lang, onResult: (text) => setCatalogSearch(text) });
  const customVoice = useVoiceInput({ lang, onResult: (text) => setCustomText(prev => prev + ' ' + text) });

  // Phase state
  const [phase, setPhase] = useState<Phase>('shopping');
  const [completedSteps, setCompletedSteps] = useState<CompletedOrderStep[]>(() => session.getSteps());

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState('');
  const [deliveryType, setDeliveryType] = useState<'my_location' | 'other' | 'saved'>('my_location');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(defaultLocation?.id || null);
  const [otherAddress, setOtherAddress] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [noContact, setNoContact] = useState(false);
  const [showDelivery, setShowDelivery] = useState(true);
  const [showUrgency, setShowUrgency] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');

  const ICON_MAP: Record<string, any> = { home: Home, work: Briefcase, 'map-pin': MapPin };

  const merchantName = merchant
    ? (lang === 'ar' && merchant.business_name_ar ? merchant.business_name_ar : merchant.business_name)
    : '';

  // Filtered catalog
  const filteredCatalog = useMemo(() => {
    if (!catalogItems) return [];
    if (!catalogSearch.trim()) return catalogItems;
    const q = catalogSearch.toLowerCase();
    return catalogItems.filter(i =>
      i.name.toLowerCase().includes(q) ||
      (i.name_ar && i.name_ar.includes(q)) ||
      (i.description && i.description.toLowerCase().includes(q))
    );
  }, [catalogItems, catalogSearch]);

  // Cart helpers
  const getCartItem = (catalogItemId: string) => cart.find(c => c.type === 'catalog' && c.catalogItemId === catalogItemId);
  const getCartQuantity = (catalogItemId: string) => getCartItem(catalogItemId)?.quantity || 0;

  const addCatalogItem = (item: typeof catalogItems extends (infer T)[] | null ? T : never) => {
    if (!item) return;
    const existing = cart.find(c => c.type === 'catalog' && c.catalogItemId === item.id);
    if (existing) {
      setCart(cart.map(c => c.catalogItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, {
        id: crypto.randomUUID(),
        type: 'catalog',
        catalogItemId: item.id,
        description: lang === 'ar' && item.name_ar ? item.name_ar : item.name,
        price: item.price_fixed || item.price_min || undefined,
        quantity: 1,
        unit: undefined,
        specification: '',
        notes: '',
      }]);
    }
  };

  const decrementCatalogItem = (catalogItemId: string) => {
    const existing = cart.find(c => c.type === 'catalog' && c.catalogItemId === catalogItemId);
    if (!existing) return;
    if (existing.quantity <= 1) {
      setCart(cart.filter(c => c.catalogItemId !== catalogItemId));
    } else {
      setCart(cart.map(c => c.catalogItemId === catalogItemId ? { ...c, quantity: c.quantity - 1 } : c));
    }
  };

  const updateCartItemField = (catalogItemId: string, field: 'specification' | 'notes', value: string) => {
    setCart(cart.map(c => c.catalogItemId === catalogItemId ? { ...c, [field]: value } : c));
  };

  const addCustomItem = () => {
    if (!customText.trim()) return;
    setCart([...cart, {
      id: crypto.randomUUID(),
      type: 'custom',
      description: customText.trim(),
      quantity: 1,
    }]);
    setCustomText('');
    setShowCustomInput(false);
  };

  const removeCartItem = (id: string) => setCart(cart.filter(c => c.id !== id));

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.id !== id) return c;
      const newQty = c.quantity + delta;
      return newQty > 0 ? { ...c, quantity: newQty } : c;
    }).filter(c => c.quantity > 0));
  };

  // Price estimate
  const priceEstimate = useMemo(() => {
    let base = 15;
    const hasPurchase = cart.some(c => c.type === 'catalog');
    if (hasPurchase) base += 10;
    if (isUrgent) base = Math.round(base * 1.5);
    const itemsTotal = cart.reduce((sum, c) => sum + (c.price || 0) * c.quantity, 0);
    const stepsExtra = completedSteps.length * 8;
    const low = base + itemsTotal + stepsExtra;
    const high = Math.round((base * 1.6) + itemsTotal + stepsExtra);
    return { low, high };
  }, [cart, isUrgent, completedSteps.length]);

  // Confirm current step
  const handleConfirmStep = () => {
    if (cart.length === 0) {
      toast.error(lang === 'ar' ? 'أضف منتج أو طلب على الأقل' : 'Add at least one item');
      return;
    }
    const step: CompletedOrderStep = {
      id: crypto.randomUUID(),
      merchantId,
      merchantName: merchantName || (lang === 'ar' ? 'طلب مخصص' : 'Custom Order'),
      branchId,
      items: cart.map(c => ({
        description: c.description,
        quantity: c.quantity,
        price: c.price,
        specification: c.specification,
        notes: c.notes,
        type: c.type,
      })),
      deliveryType,
      isUrgent,
      estimatedPrice: priceEstimate,
    };
    const newSteps = [...completedSteps, step];
    setCompletedSteps(newSteps);
    session.addStep(step);
    setPhase('step_confirmed');
  };

  // Handle adding next step
  const handleAddNextStep = () => {
    navigate('/search');
  };

  // Handle checkout
  const handleGoToCheckout = () => {
    setPhase('checkout');
  };

  // Handle payment
  const handlePay = async (method: string) => {
    setIsProcessing(true);
    try {
      // Create the order with all steps
      const firstStep = completedSteps[0];
      const result = await createOrder.mutateAsync({
        order: {
          order_type: completedSteps.length > 1 ? 'CHAIN' : (firstStep?.items.some(i => i.type === 'catalog') ? 'PURCHASE_DELIVER' : 'DIRECT'),
          source_merchant_id: firstStep?.merchantId || null,
          source_branch_id: firstStep?.branchId || null,
          pickup_address: '',
          pickup_lat: null,
          pickup_lng: null,
          dropoff_address: '',
          dropoff_lat: null,
          dropoff_lng: null,
          notes: completedSteps.map((s, i) =>
            `[${lang === 'ar' ? 'خطوة' : 'Step'} ${i + 1}] ${s.merchantName}: ${s.items.map(item => item.description).join(', ')}`
          ).join('\n'),
          status: 'paid',
          totals_json: {
            steps: completedSteps.length,
            payment_method: method,
          },
        },
        items: completedSteps.flatMap(s => s.items.map(item => ({
          item_mode: item.type === 'catalog' ? 'catalog_item' : 'free_text',
          catalog_item_id: null,
          free_text_description: `${item.description}${item.specification ? ` — ${item.specification}` : ''}${item.notes ? ` (${item.notes})` : ''}`,
          quantity: item.quantity,
          unit: null,
          photo_urls: [],
        }))),
      });
      setCreatedOrderId(result.id);
      session.clearSession();
      setPhase('pickup_options');
    } catch (error: any) {
      toast.error(error.message || (lang === 'ar' ? 'حدث خطأ' : 'Error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const hasCatalog = catalogItems && catalogItems.length > 0;
  const canSubmit = cart.length > 0;

  // ━━━ PHASE ROUTING ━━━
  if (phase === 'step_confirmed') {
    return (
      <StepConfirmationView
        currentStep={completedSteps[completedSteps.length - 1]}
        allSteps={completedSteps}
        onAddStep={handleAddNextStep}
        onCheckout={handleGoToCheckout}
      />
    );
  }

  if (phase === 'checkout') {
    return (
      <FinalCheckoutView
        steps={completedSteps}
        onPay={handlePay}
        onBack={() => setPhase('step_confirmed')}
        isProcessing={isProcessing}
      />
    );
  }

  if (phase === 'pickup_options') {
    return (
      <PickupOptionsView
        orderId={createdOrderId}
        onComplete={() => navigate(`/orders/${createdOrderId}`)}
      />
    );
  }

  // ━━━ PHASE: SHOPPING ━━━
  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ms-2 text-muted-foreground hover:text-foreground">
            <BackArrow className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold truncate">
              {completedSteps.length > 0
                ? `${lang === 'ar' ? 'الخطوة' : 'Step'} ${completedSteps.length + 1}`
                : merchantName || (lang === 'ar' ? 'طلب جديد' : 'New Order')}
            </h1>
            {merchant && <p className="text-xs text-muted-foreground truncate">{merchantName}</p>}
          </div>
          {completedSteps.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold">
              {completedSteps.length} {lang === 'ar' ? 'خطوة سابقة' : 'prev steps'}
            </span>
          )}
          <span className="text-lg font-bold font-en text-primary">YA</span>
        </div>
      </div>

      <div className="container py-4 space-y-6">

        {/* ━━━ 1️⃣ PRODUCTS (Marketplace) ━━━ */}
        {hasCatalog && (
          <section className="space-y-3">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={catalogSearch}
                onChange={e => setCatalogSearch(e.target.value)}
                placeholder={lang === 'ar' ? 'ابحث عن منتج أو اكتب اللي تبيه' : 'Search for a product'}
                className="w-full ps-10 pe-12 py-3 rounded-2xl border-2 bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <div className="absolute end-2 top-1/2 -translate-y-1/2">
                <VoiceInputButton isListening={catalogVoice.isListening} isSupported={catalogVoice.isSupported} onToggle={catalogVoice.toggle} />
              </div>
            </div>

            <div className="space-y-2">
              {filteredCatalog.map(item => {
                const photos = item.photos as string[] | null;
                const qty = getCartQuantity(item.id);
                const price = item.price_type === 'fixed' ? item.price_fixed : item.price_min;
                const name = lang === 'ar' && item.name_ar ? item.name_ar : item.name;
                const cartItem = getCartItem(item.id);

                return (
                  <div key={item.id} className="rounded-2xl border bg-card overflow-hidden hover:shadow-sm transition-shadow">
                    <div className="flex items-center gap-3 p-3">
                      {photos && photos.length > 0 ? (
                        <img src={photos[0]} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{name}</p>
                        {price != null && (
                          <p className="text-sm text-primary font-medium">
                            {price} {lang === 'ar' ? 'ر.س' : 'SAR'}
                          </p>
                        )}
                      </div>
                      {qty === 0 ? (
                        <button
                          onClick={() => addCatalogItem(item)}
                          className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:brightness-95 transition-all shrink-0"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => decrementCatalogItem(item.id)} className="w-8 h-8 rounded-lg border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-bold text-sm">{qty}</span>
                          <button onClick={() => addCatalogItem(item)} className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Inline specification & notes for selected items */}
                    {qty > 0 && cartItem && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-3 pb-3"
                      >
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={cartItem.specification || ''}
                            onChange={e => updateCartItemField(item.id, 'specification', e.target.value)}
                            placeholder={lang === 'ar' ? 'وصف ما تريد — مثال: ثوب أبيض مقاس XL' : 'Describe what you want — e.g. White thobe size XL'}
                            className="flex-1 rounded-xl border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                          <input
                            type="text"
                            value={cartItem.notes || ''}
                            onChange={e => updateCartItemField(item.id, 'notes', e.target.value)}
                            placeholder={lang === 'ar' ? 'ملاحظات — مثال: لو ما لقيت الأبيض خذ الكحلي' : 'Notes — e.g. If not available, get navy'}
                            className="flex-1 rounded-xl border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ━━━ 2️⃣ CUSTOM REQUEST ━━━ */}
        <section className="space-y-3">
          {hasCatalog && (
            <p className="text-sm text-muted-foreground font-medium">
              {lang === 'ar' ? 'ما لقيت اللي تبيه؟' : "Didn't find what you need?"}
            </p>
          )}

          {showCustomInput ? (
            <div className="space-y-3 p-4 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5">
              <div className="relative">
                <textarea
                  value={customText}
                  onChange={e => setCustomText(e.target.value)}
                  placeholder={lang === 'ar' ? 'اكتب تفاصيل طلبك هنا… مثال: توصيل ملف، شراء منتج غير موجود' : 'Describe your request here...'}
                  className="w-full rounded-xl border bg-background px-4 py-3 pe-12 text-sm min-h-[80px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  autoFocus
                />
                <div className="absolute end-2 top-2">
                  <VoiceInputButton isListening={customVoice.isListening} isSupported={customVoice.isSupported} onToggle={customVoice.toggle} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowCustomInput(false); setCustomText(''); }} className="flex-1 py-2.5 rounded-xl border text-sm font-medium">
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button onClick={addCustomItem} disabled={!customText.trim()} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50">
                  {lang === 'ar' ? 'إضافة' : 'Add'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCustomInput(true)}
              className="w-full py-3.5 rounded-2xl border-2 border-dashed border-primary/30 text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all"
            >
              <Plus className="h-5 w-5" />
              {lang === 'ar' ? 'أضف طلب مخصص' : 'Add Custom Request'}
            </button>
          )}
        </section>

        {/* ━━━ 3️⃣ CART ━━━ */}
        {cart.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-bold flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              {lang === 'ar' ? 'طلبك' : 'Your Order'}
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ms-auto">
                {cart.reduce((s, c) => s + c.quantity, 0)} {lang === 'ar' ? 'عنصر' : 'items'}
              </span>
            </h3>
            <div className="space-y-2">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", item.type === 'catalog' ? "bg-primary/10" : "bg-muted")}>
                    {item.type === 'catalog' ? <Package className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.description}</p>
                    {item.price != null && <p className="text-xs text-primary">{item.price * item.quantity} {lang === 'ar' ? 'ر.س' : 'SAR'}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => updateCartQuantity(item.id, -1)} className="w-7 h-7 rounded-lg border flex items-center justify-center text-muted-foreground hover:bg-muted">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateCartQuantity(item.id, 1)} className="w-7 h-7 rounded-lg border flex items-center justify-center text-muted-foreground hover:bg-muted">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button onClick={() => removeCartItem(item.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ━━━ PRAYER TIME NOTICE ━━━ */}
        <PrayerTimeNotice />

        {/* ━━━ 4️⃣ DELIVERY ━━━ */}
        <section className="space-y-3">
          <button onClick={() => setShowDelivery(!showDelivery)} className="w-full flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              {lang === 'ar' ? 'التوصيل وين؟' : 'Where to deliver?'}
            </h3>
            {showDelivery ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {showDelivery && (
            <div className="space-y-2">
              <button
                onClick={() => {
                  setDeliveryType('my_location');
                  setSelectedLocationId(defaultLocation?.id || null);
                  if (!defaultLocation) requestLocation();
                }}
                disabled={geoLoading}
                className={cn(
                  "w-full p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all text-start",
                  deliveryType === 'my_location' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                {geoLoading ? <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" /> : <Navigation className="h-5 w-5 text-primary shrink-0" />}
                <div className="min-w-0">
                  <p className="font-medium text-sm">{lang === 'ar' ? 'موقعي' : 'My location'}</p>
                  {defaultLocation && <p className="text-xs text-muted-foreground truncate">{defaultLocation.label} — {defaultLocation.address_text}</p>}
                </div>
              </button>

              {savedLocations.filter(l => l.id !== defaultLocation?.id).map(loc => {
                const IconComp = ICON_MAP[loc.icon || 'map-pin'] || MapPin;
                return (
                  <button
                    key={loc.id}
                    onClick={() => { setDeliveryType('saved'); setSelectedLocationId(loc.id); }}
                    className={cn(
                      "w-full p-3 rounded-xl border flex items-center gap-3 transition-all text-start",
                      deliveryType === 'saved' && selectedLocationId === loc.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    )}
                  >
                    <IconComp className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{loc.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{lang === 'ar' ? loc.address_text_ar || loc.address_text : loc.address_text}</p>
                    </div>
                  </button>
                );
              })}

              <button
                onClick={() => setDeliveryType('other')}
                className={cn(
                  "w-full p-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all",
                  deliveryType === 'other' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                )}
              >
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span className="font-medium text-sm">{lang === 'ar' ? 'موقع ثاني' : 'Another location'}</span>
              </button>
              {deliveryType === 'other' && (
                <textarea
                  value={otherAddress}
                  onChange={e => setOtherAddress(e.target.value)}
                  placeholder={lang === 'ar' ? 'أدخل العنوان بالتفصيل...' : 'Enter detailed address...'}
                  className="w-full rounded-xl border bg-card px-4 py-3 text-sm min-h-[60px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              )}
            </div>
          )}
        </section>

        {/* ━━━ 5️⃣ URGENCY ━━━ */}
        <section className="space-y-3">
          <button onClick={() => setShowUrgency(!showUrgency)} className="w-full flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              {lang === 'ar' ? 'مستعجل؟' : 'Urgent?'}
            </h3>
            {showUrgency ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {showUrgency && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsUrgent(false)}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-center transition-all",
                    !isUrgent ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  )}
                >
                  <Clock className="h-5 w-5 mx-auto mb-1.5 text-muted-foreground" />
                  <span className="text-sm font-bold">{lang === 'ar' ? 'عادي' : 'Normal'}</span>
                </button>
                <button
                  onClick={() => setIsUrgent(true)}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-center transition-all",
                    isUrgent ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  )}
                >
                  <Zap className="h-5 w-5 mx-auto mb-1.5 text-primary" />
                  <span className="text-sm font-bold">{lang === 'ar' ? 'مستعجل' : 'Urgent'}</span>
                </button>
              </div>

              <button
                onClick={() => setNoContact(!noContact)}
                className={cn(
                  "w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all",
                  noContact ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                )}
              >
                <PhoneOff className={cn("h-4 w-4 shrink-0", noContact ? "text-primary" : "text-muted-foreground")} />
                <span className="text-sm font-medium flex-1 text-start">{lang === 'ar' ? 'ما أحب المكالمات' : "Don't call me"}</span>
                <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", noContact ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                  {noContact && <Check className="h-3 w-3 text-primary-foreground" />}
                </div>
              </button>
            </div>
          )}
        </section>
      </div>

      {/* ━━━ STICKY BOTTOM BAR ━━━ */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-background border-t border-border p-4 safe-area-bottom">
        <div className="container flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'الإجمالي التقريبي' : 'Estimated total'}</p>
            <p className="font-bold text-primary">
              {priceEstimate.low} – {priceEstimate.high} {lang === 'ar' ? 'ر.س' : 'SAR'}
            </p>
          </div>
          <button
            onClick={handleConfirmStep}
            disabled={!canSubmit || createOrder.isPending}
            className="px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center gap-2 disabled:opacity-50 hover:brightness-95 transition-all shrink-0"
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
        </div>
      </div>
    </div>
  );
}
