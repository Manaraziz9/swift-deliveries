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
import PaymentModal from '@/components/payment/PaymentModal';
import PaymentSuccessModal from '@/components/payment/PaymentSuccessModal';
import VoiceInputButton from '@/components/shared/VoiceInputButton';
import PrayerTimeNotice from '@/components/order/PrayerTimeNotice';

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
}

interface ExtraStep {
  description: string;
  recipientName: string;
  recipientPhone: string;
  address: string;
}

export default function SmartOrderFlow({ merchantId, branchId }: SmartOrderFlowProps) {
  const { lang, dir } = useLang();
  const navigate = useNavigate();
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  // Data hooks
  const { data: merchant } = useMerchant(merchantId);
  const { data: branches } = useBranches(merchantId);
  const { data: catalogItems } = useCatalogItems(merchantId);
  const { locations: savedLocations, defaultLocation } = useUserLocations();
  const { latitude, longitude, loading: geoLoading, requestLocation } = useGeolocation();
  const createOrder = useCreateOrder();
  const catalogVoice = useVoiceInput({ lang, onResult: (text) => setCatalogSearch(text) });
  const customVoice = useVoiceInput({ lang, onResult: (text) => setCustomText(prev => prev + ' ' + text) });
  // State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customText, setCustomText] = useState('');
  const [extraSteps, setExtraSteps] = useState<ExtraStep[]>([]);
  const [addingStep, setAddingStep] = useState(false);
  const [newStep, setNewStep] = useState<ExtraStep>({ description: '', recipientName: '', recipientPhone: '', address: '' });
  const [deliveryType, setDeliveryType] = useState<'my_location' | 'other' | 'saved'>('my_location');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(defaultLocation?.id || null);
  const [otherAddress, setOtherAddress] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [splitExecutors, setSplitExecutors] = useState(false);
  const [noContact, setNoContact] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState('');
  const [showDelivery, setShowDelivery] = useState(true);
  const [showUrgency, setShowUrgency] = useState(true);

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
  const getCartQuantity = (catalogItemId: string) => {
    const item = cart.find(c => c.type === 'catalog' && c.catalogItemId === catalogItemId);
    return item?.quantity || 0;
  };

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

  const removeCartItem = (id: string) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.id !== id) return c;
      const newQty = c.quantity + delta;
      return newQty > 0 ? { ...c, quantity: newQty } : c;
    }).filter(c => c.quantity > 0));
  };

  // Extra steps
  const addExtraStep = () => {
    if (!newStep.description.trim()) return;
    setExtraSteps([...extraSteps, { ...newStep }]);
    setNewStep({ description: '', recipientName: '', recipientPhone: '', address: '' });
    setAddingStep(false);
  };

  const removeExtraStep = (i: number) => setExtraSteps(extraSteps.filter((_, idx) => idx !== i));

  // Price estimate
  const priceEstimate = useMemo(() => {
    let base = 15;
    const hasPurchase = cart.some(c => c.type === 'catalog');
    if (hasPurchase) base += 10;
    if (extraSteps.length > 0) base += extraSteps.length * 8;
    if (isUrgent) base = Math.round(base * 1.5);
    const itemsTotal = cart.reduce((sum, c) => sum + (c.price || 0) * c.quantity, 0);
    const low = base + itemsTotal;
    const high = Math.round((base * 1.6) + itemsTotal);
    return { low, high };
  }, [cart, extraSteps.length, isUrgent]);

  // Order type detection
  const getOrderType = () => {
    if (extraSteps.length > 0) return 'CHAIN' as const;
    if (cart.some(c => c.type === 'catalog')) return 'PURCHASE_DELIVER' as const;
    return 'DIRECT' as const;
  };

  // Delivery info
  const getDropoff = () => {
    if (deliveryType === 'saved' && selectedLocationId) {
      const loc = savedLocations.find(l => l.id === selectedLocationId);
      return { address: loc?.address_text || '', lat: loc?.lat || null, lng: loc?.lng || null };
    }
    if (deliveryType === 'my_location') {
      if (defaultLocation) return { address: defaultLocation.address_text || '', lat: defaultLocation.lat, lng: defaultLocation.lng };
      return { address: lang === 'ar' ? 'موقعي الحالي' : 'My Current Location', lat: latitude, lng: longitude };
    }
    return { address: otherAddress, lat: null, lng: null };
  };

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error(lang === 'ar' ? 'أضف منتج أو طلب على الأقل' : 'Add at least one item');
      return;
    }
    const dropoff = getDropoff();
    if (!dropoff.address && deliveryType === 'other') {
      toast.error(lang === 'ar' ? 'حدد عنوان التوصيل' : 'Enter delivery address');
      return;
    }

    try {
      const result = await createOrder.mutateAsync({
        order: {
          order_type: getOrderType(),
          source_merchant_id: merchantId || null,
          source_branch_id: branchId || branches?.[0]?.id || null,
          pickup_address: '',
          pickup_lat: null,
          pickup_lng: null,
          dropoff_address: dropoff.address,
          dropoff_lat: dropoff.lat,
          dropoff_lng: dropoff.lng,
          notes: cart.filter(c => c.type === 'custom').map(c => c.description).join('\n') || null,
          status: 'draft',
          totals_json: {
            estimated_low: priceEstimate.low,
            estimated_high: priceEstimate.high,
            is_urgent: isUrgent,
            split_executors: splitExecutors,
            no_contact: noContact,
          },
        },
        items: cart.map(c => ({
          item_mode: c.type === 'catalog' ? 'catalog_item' : 'free_text',
          catalog_item_id: c.catalogItemId || null,
          free_text_description: c.description,
          quantity: c.quantity,
          unit: c.unit || null,
          photo_urls: [],
        })),
      });
      setCreatedOrderId(result.id);
      setShowSuccess(true);
    } catch (error: any) {
      toast.error(error.message || (lang === 'ar' ? 'حدث خطأ' : 'Error'));
    }
  };

  const hasCatalog = catalogItems && catalogItems.length > 0;
  const canSubmit = cart.length > 0;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ms-2 text-muted-foreground hover:text-foreground">
            <BackArrow className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold truncate">{merchantName || (lang === 'ar' ? 'طلب جديد' : 'New Order')}</h1>
            {merchant && <p className="text-xs text-muted-foreground truncate">{lang === 'ar' ? 'اختر المنتجات أو أضف طلب مخصص' : 'Select products or add custom request'}</p>}
          </div>
          <span className="text-lg font-bold font-en text-primary">YA</span>
        </div>
      </div>

      <div className="container py-4 space-y-6">

        {/* ━━━ 1️⃣ PRODUCTS (Marketplace) ━━━ */}
        {hasCatalog && (
          <section className="space-y-3">
            {/* Search within merchant */}
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

            {/* Product grid */}
            <div className="space-y-2">
              {filteredCatalog.map(item => {
                const photos = item.photos as string[] | null;
                const qty = getCartQuantity(item.id);
                const price = item.price_type === 'fixed' ? item.price_fixed : item.price_min;
                const name = lang === 'ar' && item.name_ar ? item.name_ar : item.name;

                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl border bg-card hover:shadow-sm transition-shadow">
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
                );
              })}
            </div>
          </section>
        )}

        {/* ━━━ 2️⃣ CUSTOM REQUEST (Open Task) ━━━ */}
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

        {/* ━━━ 3️⃣ CART (Live Summary) ━━━ */}
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

        {/* ━━━ 4️⃣ EXTRA STEPS ━━━ */}
        <section className="space-y-3">
          {extraSteps.length > 0 && (
            <div className="space-y-2">
              {extraSteps.map((s, i) => (
                <div key={i} className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 2}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{s.description}</p>
                    {s.recipientName && <p className="text-xs text-muted-foreground">{s.recipientName} • {s.recipientPhone}</p>}
                  </div>
                  <button onClick={() => removeExtraStep(i)} className="p-1 text-destructive hover:bg-destructive/10 rounded-lg shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {addingStep ? (
            <div className="space-y-3 p-4 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5">
              <input
                value={newStep.description}
                onChange={e => setNewStep(p => ({ ...p, description: e.target.value }))}
                placeholder={lang === 'ar' ? 'وصف الخطوة...' : 'Step description...'}
                className="w-full rounded-xl border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
              <input
                value={newStep.recipientName}
                onChange={e => setNewStep(p => ({ ...p, recipientName: e.target.value }))}
                placeholder={lang === 'ar' ? 'اسم المستلم (اختياري)' : 'Recipient name (optional)'}
                className="w-full rounded-xl border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                value={newStep.recipientPhone}
                onChange={e => setNewStep(p => ({ ...p, recipientPhone: e.target.value }))}
                placeholder={lang === 'ar' ? 'رقم الهاتف (اختياري)' : 'Phone (optional)'}
                className="w-full rounded-xl border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                dir="ltr"
              />
              <div className="flex gap-2">
                <button onClick={() => setAddingStep(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium">
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button onClick={addExtraStep} disabled={!newStep.description.trim()} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50">
                  {lang === 'ar' ? 'إضافة' : 'Add'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingStep(true)}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-border text-muted-foreground font-medium flex items-center justify-center gap-2 hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all text-sm"
            >
              <Plus className="h-4 w-4" />
              {lang === 'ar' ? 'إضافة خطوة ثانية' : 'Add Another Step'}
            </button>
          )}
        </section>

        {/* ━━━ PRAYER TIME NOTICE ━━━ */}
        <PrayerTimeNotice />

        {/* ━━━ 5️⃣ DELIVERY ━━━ */}
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
              {/* My location / default */}
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

              {/* Saved locations */}
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

              {/* Other */}
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

        {/* ━━━ 6️⃣ URGENCY & PREFERENCES ━━━ */}
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

              {/* Smart split suggestion */}
              {isUrgent && extraSteps.length > 0 && (
                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                  <p className="text-sm font-medium">
                    <Users className="h-4 w-4 inline me-1 text-primary" />
                    {lang === 'ar' ? 'نقدر نقسم المهام لتخلص أسرع' : 'Split tasks for faster delivery'}
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-colors", splitExecutors ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                      {splitExecutors && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="text-sm">{lang === 'ar' ? 'تقسيم المهام' : 'Split tasks'}</span>
                  </label>
                </div>
              )}

              {/* No-contact */}
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

      {/* ━━━ 7️⃣ STICKY BOTTOM BAR ━━━ */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-background border-t border-border p-4 safe-area-bottom">
        <div className="container flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'الإجمالي التقريبي' : 'Estimated total'}</p>
            <p className="font-bold text-primary">
              {priceEstimate.low} – {priceEstimate.high} {lang === 'ar' ? 'ر.س' : 'SAR'}
            </p>
          </div>
          <button
            onClick={handleSubmit}
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

      {/* Modals */}
      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={(method) => {
          setShowPayment(false);
          handleSubmit();
        }}
        amount={priceEstimate.high}
        currency={lang === 'ar' ? 'ر.س' : 'SAR'}
      />
      <PaymentSuccessModal
        open={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          navigate(`/orders/${createdOrderId}`);
        }}
        orderId={createdOrderId}
        amount={priceEstimate.high}
        currency={lang === 'ar' ? 'ر.س' : 'SAR'}
        paymentMethod="mada"
      />
    </div>
  );
}
