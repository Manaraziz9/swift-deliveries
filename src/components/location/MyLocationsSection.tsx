import { useState } from 'react';
import { MapPin, Home, Briefcase, Plus, Trash2, Check, Edit2, Star, X } from 'lucide-react';
import { useLang } from '@/contexts/LangContext';
import { useUserLocations, SavedLocation } from '@/hooks/useUserLocations';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ICON_MAP: Record<string, any> = {
  home: Home,
  work: Briefcase,
  'map-pin': MapPin,
};

const ICON_OPTIONS = [
  { value: 'home', label: '🏠', labelAr: 'المنزل' },
  { value: 'work', label: '💼', labelAr: 'العمل' },
  { value: 'map-pin', label: '📍', labelAr: 'آخر' },
];

export default function MyLocationsSection() {
  const { lang } = useLang();
  const { locations, loading, addLocation, updateLocation, deleteLocation, setDefault } = useUserLocations();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ label: '', address: '', icon: 'map-pin' });

  const handleAdd = async () => {
    if (!form.label.trim()) return;
    const success = await addLocation({
      label: form.label,
      address_text: form.address || null,
      address_text_ar: form.address || null,
      lat: null,
      lng: null,
      is_default: locations.length === 0,
      icon: form.icon,
    });
    if (success) {
      toast.success(lang === 'ar' ? 'تم حفظ الموقع' : 'Location saved');
      setForm({ label: '', address: '', icon: 'map-pin' });
      setAdding(false);
    }
  };

  const handleUpdate = async (id: string) => {
    const success = await updateLocation(id, {
      label: form.label,
      address_text: form.address || null,
      address_text_ar: form.address || null,
      icon: form.icon,
    });
    if (success) {
      toast.success(lang === 'ar' ? 'تم التحديث' : 'Updated');
      setEditing(null);
      setForm({ label: '', address: '', icon: 'map-pin' });
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteLocation(id);
    if (success) toast.success(lang === 'ar' ? 'تم الحذف' : 'Deleted');
  };

  const handleSetDefault = async (id: string) => {
    const success = await setDefault(id);
    if (success) toast.success(lang === 'ar' ? 'تم تعيينه كافتراضي' : 'Set as default');
  };

  const startEdit = (loc: SavedLocation) => {
    setEditing(loc.id);
    setForm({ label: loc.label, address: loc.address_text || '', icon: loc.icon || 'map-pin' });
  };

  if (loading) {
    return <div className="h-20 bg-muted rounded-xl animate-pulse" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="font-bold">{lang === 'ar' ? 'مواقعي' : 'My Locations'}</h3>
      </div>

      {/* Locations list */}
      {locations.map(loc => {
        const IconComp = ICON_MAP[loc.icon || 'map-pin'] || MapPin;
        const isEditing = editing === loc.id;

        if (isEditing) {
          return (
            <div key={loc.id} className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 space-y-3 animate-fade-in">
              <div className="flex gap-2">
                {ICON_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setForm(f => ({ ...f, icon: opt.value }))}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                      form.icon === opt.value ? "bg-primary/20 ring-2 ring-primary" : "bg-muted"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <input
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                placeholder={lang === 'ar' ? 'اسم الموقع' : 'Location name'}
                className="w-full rounded-xl border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <input
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder={lang === 'ar' ? 'العنوان' : 'Address'}
                className="w-full rounded-xl border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex gap-2">
                <button onClick={() => setEditing(null)} className="flex-1 py-2 rounded-xl border text-sm font-medium">
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button onClick={() => handleUpdate(loc.id)} className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
                  {lang === 'ar' ? 'حفظ' : 'Save'}
                </button>
              </div>
            </div>
          );
        }

        return (
          <div key={loc.id} className="rounded-xl bg-card shadow-ya-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <IconComp className="h-5 w-5 text-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-sm">{loc.label}</p>
                {loc.is_default && (
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                    {lang === 'ar' ? 'افتراضي' : 'Default'}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {lang === 'ar' ? loc.address_text_ar || loc.address_text : loc.address_text}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!loc.is_default && (
                <button onClick={() => handleSetDefault(loc.id)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title={lang === 'ar' ? 'تعيين كافتراضي' : 'Set as default'}>
                  <Star className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => startEdit(loc)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Edit2 className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(loc.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}

      {/* Add new */}
      {adding ? (
        <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 space-y-3 animate-fade-in">
          <div className="flex gap-2">
            {ICON_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setForm(f => ({ ...f, icon: opt.value }))}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                  form.icon === opt.value ? "bg-primary/20 ring-2 ring-primary" : "bg-muted"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <input
            value={form.label}
            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
            placeholder={lang === 'ar' ? 'اسم الموقع (مثال: البيت، الدوام، أمي)' : 'Location name (e.g. Home, Work)'}
            className="w-full rounded-xl border bg-card px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            autoFocus
          />
          <input
            value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            placeholder={lang === 'ar' ? 'العنوان التفصيلي' : 'Detailed address'}
            className="w-full rounded-xl border bg-card px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="flex gap-2">
            <button onClick={() => { setAdding(false); setForm({ label: '', address: '', icon: 'map-pin' }); }} className="flex-1 py-2.5 rounded-xl border text-sm font-medium">
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button onClick={handleAdd} disabled={!form.label.trim()} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50">
              {lang === 'ar' ? 'حفظ الموقع' : 'Save Location'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full rounded-xl border-2 border-dashed border-muted-foreground/20 p-4 flex items-center gap-3 hover:border-primary/30 hover:bg-primary/5 transition-colors"
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
  );
}
