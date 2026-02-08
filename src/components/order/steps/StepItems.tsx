import { useState } from 'react';
import { useLang } from '@/contexts/LangContext';
import { Plus, Trash2, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderFormData } from '../OrderWizard';
import { useCatalogItems } from '@/hooks/useMerchants';

interface StepItemsProps {
  formData: OrderFormData;
  updateFormData: (data: Partial<OrderFormData>) => void;
}

export default function StepItems({ formData, updateFormData }: StepItemsProps) {
  const { lang } = useLang();
  const [mode, setMode] = useState<'catalog' | 'free_text'>('free_text');

  const { data: catalogItems } = useCatalogItems(formData.sourceMerchantId || undefined);

  const addItem = (item: OrderFormData['items'][0]) => {
    updateFormData({
      items: [...formData.items, item],
    });
  };

  const removeItem = (index: number) => {
    updateFormData({
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    unit: '',
  });

  const handleAddFreeTextItem = () => {
    if (!newItem.description.trim()) return;
    addItem({
      mode: 'free_text',
      description: newItem.description,
      quantity: newItem.quantity,
      unit: newItem.unit,
    });
    setNewItem({ description: '', quantity: 1, unit: '' });
  };

  const handleAddCatalogItem = (catalogItem: any) => {
    addItem({
      mode: 'catalog_item',
      catalogItemId: catalogItem.id,
      description: lang === 'ar' && catalogItem.name_ar ? catalogItem.name_ar : catalogItem.name,
      quantity: 1,
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Mode Toggle */}
      {formData.sourceMerchantId && catalogItems && catalogItems.length > 0 && (
        <div className="flex rounded-xl border overflow-hidden">
          <button
            onClick={() => setMode('catalog')}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium transition-colors",
              mode === 'catalog'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {lang === 'ar' ? 'من الكتالوج' : 'From Catalog'}
          </button>
          <button
            onClick={() => setMode('free_text')}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium transition-colors",
              mode === 'free_text'
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {lang === 'ar' ? 'وصف حر' : 'Free Text'}
          </button>
        </div>
      )}

      {/* Added Items */}
      {formData.items.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-2">
            {lang === 'ar' ? 'المنتجات المضافة' : 'Added Items'} ({formData.items.length})
          </h4>
          <div className="space-y-2">
            {formData.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-xl bg-card border"
              >
                <div>
                  <p className="text-sm font-medium">{item.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {lang === 'ar' ? 'الكمية:' : 'Qty:'} {item.quantity} {item.unit}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(index)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Catalog Items */}
      {mode === 'catalog' && catalogItems && catalogItems.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-2">
            {lang === 'ar' ? 'اختر من الكتالوج' : 'Select from Catalog'}
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {catalogItems.map(item => {
              const photos = item.photos as string[] | null;
              return (
                <button
                  key={item.id}
                  onClick={() => handleAddCatalogItem(item)}
                  className="w-full p-3 rounded-xl border hover:border-primary/50 transition-all flex items-center gap-3 text-start"
                >
                  {photos && photos.length > 0 ? (
                    <img
                      src={photos[0]}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Image className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {lang === 'ar' && item.name_ar ? item.name_ar : item.name}
                    </p>
                    <p className="text-xs text-primary">
                      {item.price_type === 'fixed'
                        ? `${item.price_fixed} ${lang === 'ar' ? 'ر.س' : 'SAR'}`
                        : `${item.price_min}–${item.price_max} ${lang === 'ar' ? 'ر.س' : 'SAR'}`}
                    </p>
                  </div>
                  <Plus className="h-5 w-5 text-primary shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Free Text Input */}
      {mode === 'free_text' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {lang === 'ar' ? 'وصف المنتج/الخدمة' : 'Item Description'}
            </label>
            <textarea
              value={newItem.description}
              onChange={e => setNewItem({ ...newItem, description: e.target.value })}
              placeholder={lang === 'ar' ? 'مثال: قماش حرير أزرق 3 أمتار' : 'e.g., Blue silk fabric 3 meters'}
              className="w-full rounded-xl border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">
                {lang === 'ar' ? 'الكمية' : 'Quantity'}
              </label>
              <input
                type="number"
                min={1}
                value={newItem.quantity}
                onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                className="w-full rounded-xl border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {lang === 'ar' ? 'الوحدة' : 'Unit'}
              </label>
              <input
                type="text"
                value={newItem.unit}
                onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                placeholder={lang === 'ar' ? 'متر، قطعة...' : 'meter, piece...'}
                className="w-full rounded-xl border bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <button
            onClick={handleAddFreeTextItem}
            disabled={!newItem.description.trim()}
            className="w-full py-3 rounded-xl border-2 border-dashed border-primary/30 text-primary font-medium flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            <Plus className="h-5 w-5" />
            {lang === 'ar' ? 'إضافة منتج' : 'Add Item'}
          </button>
        </div>
      )}
    </div>
  );
}
