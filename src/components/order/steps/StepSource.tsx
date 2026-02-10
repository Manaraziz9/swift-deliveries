import { useState } from 'react';
import { useLang } from '@/contexts/LangContext';
import { MapPin, Store, Navigation, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderFormData } from '../OrderWizard';
import { useMerchants, useBranches } from '@/hooks/useMerchants';
import { useGeolocation } from '@/hooks/useGeolocation';

interface StepSourceProps {
  formData: OrderFormData;
  updateFormData: (data: Partial<OrderFormData>) => void;
}

export default function StepSource({ formData, updateFormData }: StepSourceProps) {
  const { lang } = useLang();
  const [sourceType, setSourceType] = useState<'merchant' | 'custom'>(
    formData.sourceMerchantId ? 'merchant' : 'custom'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const { data: merchants } = useMerchants();
  const { data: branches } = useBranches(formData.sourceMerchantId || undefined);
  const { latitude, longitude, loading: geoLoading, requestLocation } = useGeolocation();

  const filteredMerchants = (merchants || []).filter(m =>
    m.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.business_name_ar && m.business_name_ar.includes(searchQuery))
  );

  const handleUseCurrentLocation = () => {
    requestLocation();
    if (latitude && longitude) {
      updateFormData({
        pickupLat: latitude,
        pickupLng: longitude,
        pickupAddress: lang === 'ar' ? 'موقعي الحالي' : 'My Current Location',
      });
    }
  };

  const handleSelectMerchant = (merchantId: string) => {
    updateFormData({
      sourceMerchantId: merchantId,
      sourceBranchId: null,
    });
  };

  const handleSelectBranch = (branchId: string) => {
    const branch = branches?.find(b => b.id === branchId);
    if (branch) {
      updateFormData({
        sourceBranchId: branchId,
        pickupAddress: lang === 'ar' ? branch.address_text_ar || branch.address_text || '' : branch.address_text || '',
        pickupLat: branch.lat,
        pickupLng: branch.lng,
      });
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Source Type Toggle */}
      <div className="flex rounded-xl border overflow-hidden">
        <button
          onClick={() => setSourceType('merchant')}
          className={cn(
            "flex-1 py-3 text-sm font-medium transition-colors",
            sourceType === 'merchant'
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Store className="h-4 w-4 mx-auto mb-1" />
          {lang === 'ar' ? 'اختر محل' : 'Choose Store'}
        </button>
        <button
          onClick={() => setSourceType('custom')}
          className={cn(
            "flex-1 py-3 text-sm font-medium transition-colors",
            sourceType === 'custom'
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          <MapPin className="h-4 w-4 mx-auto mb-1" />
          {lang === 'ar' ? 'أو خلّنا نقترح' : 'Or let us suggest'}
        </button>
      </div>

      {sourceType === 'merchant' ? (
        <div className="space-y-4">
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={lang === 'ar' ? 'ابحث عن محل...' : 'Search stores...'}
            className="w-full rounded-xl border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          {/* Merchants List */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filteredMerchants.slice(0, 10).map(merchant => (
              <button
                key={merchant.id}
                onClick={() => handleSelectMerchant(merchant.id)}
                className={cn(
                  "w-full p-3 rounded-xl border text-start transition-all",
                  formData.sourceMerchantId === merchant.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <p className="font-medium">
                  {lang === 'ar' && merchant.business_name_ar
                    ? merchant.business_name_ar
                    : merchant.business_name}
                </p>
              </button>
            ))}
          </div>

          {/* Branches */}
          {formData.sourceMerchantId && branches && branches.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">
                {lang === 'ar' ? 'اختر الفرع' : 'Select Branch'}
              </p>
              <div className="space-y-2">
                {branches.map(branch => (
                  <button
                    key={branch.id}
                    onClick={() => handleSelectBranch(branch.id)}
                    className={cn(
                      "w-full p-3 rounded-xl border text-start transition-all",
                      formData.sourceBranchId === branch.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <p className="text-sm font-medium">{branch.branch_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {lang === 'ar' ? branch.address_text_ar : branch.address_text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Use Current Location */}
          <button
            onClick={handleUseCurrentLocation}
            disabled={geoLoading}
            className="w-full p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center gap-3 hover:bg-primary/10 transition-colors"
          >
            {geoLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <Navigation className="h-5 w-5 text-primary" />
            )}
            <span className="font-medium">
              {lang === 'ar' ? 'استخدم موقعي الحالي' : 'Use My Current Location'}
            </span>
          </button>

          {/* Manual Address Input */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {lang === 'ar' ? 'أو أدخل العنوان' : 'Or enter address'}
            </label>
            <textarea
              value={formData.pickupAddress}
              onChange={e => updateFormData({ pickupAddress: e.target.value })}
              placeholder={lang === 'ar' ? 'أدخل عنوان الاستلام...' : 'Enter pickup address...'}
              className="w-full rounded-xl border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[100px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
