import { useLang } from '@/contexts/LangContext';
import { Navigation, MapPin, Loader2 } from 'lucide-react';
import { OrderFormData } from '../OrderWizard';
import { useGeolocation } from '@/hooks/useGeolocation';

interface StepDestinationProps {
  formData: OrderFormData;
  updateFormData: (data: Partial<OrderFormData>) => void;
}

export default function StepDestination({ formData, updateFormData }: StepDestinationProps) {
  const { lang } = useLang();
  const { latitude, longitude, loading: geoLoading, requestLocation } = useGeolocation();

  const handleUseCurrentLocation = () => {
    requestLocation();
    if (latitude && longitude) {
      updateFormData({
        dropoffLat: latitude,
        dropoffLng: longitude,
        dropoffAddress: lang === 'ar' ? 'موقعي الحالي' : 'My Current Location',
      });
    }
  };

  return (
    <div className="space-y-6 pb-20">
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

      {/* Address Input */}
      <div>
        <label className="block text-sm font-medium mb-2">
          <MapPin className="h-4 w-4 inline me-1" />
          {lang === 'ar' ? 'عنوان التوصيل' : 'Delivery Address'}
        </label>
        <textarea
          value={formData.dropoffAddress}
          onChange={e => updateFormData({ dropoffAddress: e.target.value })}
          placeholder={lang === 'ar' ? 'أدخل عنوان التوصيل بالتفصيل...' : 'Enter detailed delivery address...'}
          className="w-full rounded-xl border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[100px]"
        />
      </div>

      {/* Recipient Info */}
      <div className="space-y-4">
        <h4 className="font-medium">
          {lang === 'ar' ? 'معلومات المستلم' : 'Recipient Information'}
        </h4>

        <div>
          <label className="block text-sm font-medium mb-2">
            {lang === 'ar' ? 'اسم المستلم' : 'Recipient Name'}
          </label>
          <input
            type="text"
            value={formData.recipientName}
            onChange={e => updateFormData({ recipientName: e.target.value })}
            placeholder={lang === 'ar' ? 'أدخل اسم المستلم' : 'Enter recipient name'}
            className="w-full rounded-xl border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
          </label>
          <input
            type="tel"
            value={formData.recipientPhone}
            onChange={e => updateFormData({ recipientPhone: e.target.value })}
            placeholder="+966 5XX XXX XXXX"
            className="w-full rounded-xl border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            dir="ltr"
          />
        </div>
      </div>
    </div>
  );
}
