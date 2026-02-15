import { useState } from 'react';
import { useLang } from '@/contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { Store, MapPin, FileText, Plus } from 'lucide-react';
import { useOrderSession } from '@/hooks/useOrderSession';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManualMerchantEntry() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const session = useOrderSession();
  const [expanded, setExpanded] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeLocation, setStoreLocation] = useState('');
  const [storeRequest, setStoreRequest] = useState('');

  const handleSubmit = () => {
    if (!storeName.trim() || !storeRequest.trim()) return;

    // Save as a completed step
    session.addStep({
      id: crypto.randomUUID(),
      merchantName: storeName.trim(),
      items: [{
        description: storeRequest.trim(),
        quantity: 1,
        type: 'custom',
      }],
      deliveryType: 'my_location',
      isUrgent: false,
      estimatedPrice: { low: 20, high: 45 },
    });

    // Navigate to create-order to show step confirmation
    navigate('/create-order');
  };

  return (
    <div className="mt-6">
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-primary/30 text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all"
        >
          <Store className="h-5 w-5" />
          {lang === 'ar' ? 'ما لقيت المحل؟ أضف يدوياً' : "Can't find the store? Add manually"}
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl border-2 border-primary/20 bg-card space-y-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <Store className="h-5 w-5 text-primary" />
            <h4 className="font-bold text-sm">
              {lang === 'ar' ? 'ما لقيت المحل؟' : "Can't find the store?"}
            </h4>
          </div>

          <div>
            <label className="text-xs font-bold mb-1 block flex items-center gap-1">
              <Store className="h-3 w-3 text-primary" />
              {lang === 'ar' ? 'اسم المحل' : 'Store Name'}
            </label>
            <input
              type="text"
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              placeholder={lang === 'ar' ? 'مثال: محل الراشد لقطع الغيار' : 'e.g. Al Rashed Auto Parts'}
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold mb-1 block flex items-center gap-1">
              <MapPin className="h-3 w-3 text-primary" />
              {lang === 'ar' ? 'الموقع أو الوصف' : 'Location or description'}
            </label>
            <input
              type="text"
              value={storeLocation}
              onChange={e => setStoreLocation(e.target.value)}
              placeholder={lang === 'ar' ? 'مثال: شارع الملك فهد، بجانب محطة الوقود' : 'e.g. King Fahd Road, next to gas station'}
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold mb-1 block flex items-center gap-1">
              <FileText className="h-3 w-3 text-primary" />
              {lang === 'ar' ? 'وش تبي من هالمحل؟' : 'What do you need from this store?'}
            </label>
            <textarea
              value={storeRequest}
              onChange={e => setStoreRequest(e.target.value)}
              placeholder={lang === 'ar' ? 'مثال: فلتر زيت لسيارة كامري 2020' : 'e.g. Oil filter for 2020 Camry'}
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm min-h-[70px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setExpanded(false); setStoreName(''); setStoreLocation(''); setStoreRequest(''); }}
              className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
            >
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!storeName.trim() || !storeRequest.trim()}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <Plus className="h-4 w-4" />
              {lang === 'ar' ? 'أضف' : 'Add'}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
