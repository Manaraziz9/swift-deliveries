import { useState } from 'react';
import { MapPin, Navigation, Home, Briefcase, Plus, Check, X, Loader2, ChevronDown } from 'lucide-react';
import { useLang } from '@/contexts/LangContext';
import { useUserLocations, SavedLocation } from '@/hooks/useUserLocations';
import { useGeolocation } from '@/hooks/useGeolocation';
import { cn } from '@/lib/utils';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';

interface LocationPickerProps {
  onSelect?: (location: SavedLocation | { label: string; address_text: string | null; lat: number | null; lng: number | null }) => void;
  trigger?: React.ReactNode;
  showInHeader?: boolean;
}

const ICON_MAP: Record<string, any> = {
  home: Home,
  work: Briefcase,
  'map-pin': MapPin,
};

export default function LocationPicker({ onSelect, trigger, showInHeader }: LocationPickerProps) {
  const { lang } = useLang();
  const { locations, loading, defaultLocation, addLocation } = useUserLocations();
  const { latitude, longitude, loading: geoLoading, requestLocation, hasLocation } = useGeolocation();
  const [open, setOpen] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const handleUseCurrentLocation = async () => {
    requestLocation();
    if (latitude && longitude) {
      const loc = {
        label: lang === 'ar' ? 'موقعي الحالي' : 'Current Location',
        address_text: lang === 'ar' ? 'موقعي الحالي' : 'Current Location',
        lat: latitude,
        lng: longitude,
      };
      onSelect?.(loc as any);
      setOpen(false);
    }
  };

  const handleSelectSaved = (loc: SavedLocation) => {
    onSelect?.(loc);
    setOpen(false);
  };

  const handleAddNew = async () => {
    if (!newLabel.trim()) return;
    const success = await addLocation({
      label: newLabel,
      address_text: newAddress || null,
      address_text_ar: newAddress || null,
      lat: latitude,
      lng: longitude,
      is_default: locations.length === 0,
      icon: 'map-pin',
    });
    if (success) {
      setNewLabel('');
      setNewAddress('');
      setAddingNew(false);
    }
  };

  const defaultTrigger = showInHeader ? (
    <button className="flex items-center gap-1.5 text-start max-w-[180px]">
      <MapPin className="h-4 w-4 text-primary shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground leading-none">
          {lang === 'ar' ? 'موقعي' : 'My Location'}
        </p>
        <p className="text-xs font-medium truncate leading-tight mt-0.5">
          {defaultLocation
            ? (lang === 'ar' ? defaultLocation.address_text_ar || defaultLocation.address_text : defaultLocation.address_text) || defaultLocation.label
            : (lang === 'ar' ? 'حدد موقعك' : 'Set location')}
        </p>
      </div>
      <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
    </button>
  ) : null;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {trigger || defaultTrigger}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-center">
            {lang === 'ar' ? 'اختر موقعك' : 'Choose your location'}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-8 space-y-3 max-h-[60vh] overflow-y-auto">
          {/* Current location */}
          <button
            onClick={handleUseCurrentLocation}
            disabled={geoLoading}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            {geoLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
            ) : (
              <Navigation className="h-5 w-5 text-primary shrink-0" />
            )}
            <div className="text-start">
              <p className="font-bold text-sm">{lang === 'ar' ? 'موقعي الحالي' : 'My Current Location'}</p>
              <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'استخدام GPS' : 'Use GPS'}</p>
            </div>
          </button>

          {/* Saved locations */}
          {locations.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                {lang === 'ar' ? 'مواقعي المحفوظة' : 'Saved Locations'}
              </p>
              <div className="space-y-2">
                {locations.map(loc => {
                  const IconComp = ICON_MAP[loc.icon || 'map-pin'] || MapPin;
                  return (
                    <button
                      key={loc.id}
                      onClick={() => handleSelectSaved(loc)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border hover:border-primary/30 hover:bg-primary/5 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <IconComp className="h-5 w-5 text-foreground" />
                      </div>
                      <div className="text-start flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-sm">{loc.label}</p>
                          {loc.is_default && (
                            <Check className="h-3 w-3 text-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {lang === 'ar' ? loc.address_text_ar || loc.address_text : loc.address_text}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add new */}
          {addingNew ? (
            <div className="space-y-3 p-4 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 animate-fade-in">
              <input
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder={lang === 'ar' ? 'اسم الموقع (مثال: البيت)' : 'Location name (e.g. Home)'}
                className="w-full rounded-xl border bg-card px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
              <input
                value={newAddress}
                onChange={e => setNewAddress(e.target.value)}
                placeholder={lang === 'ar' ? 'العنوان' : 'Address'}
                className="w-full rounded-xl border bg-card px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex gap-2">
                <button onClick={() => setAddingNew(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium">
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={handleAddNew}
                  disabled={!newLabel.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50"
                >
                  {lang === 'ar' ? 'حفظ الموقع' : 'Save Location'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingNew(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium text-sm text-primary">
                {lang === 'ar' ? 'إضافة موقع جديد' : 'Add new location'}
              </span>
            </button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
