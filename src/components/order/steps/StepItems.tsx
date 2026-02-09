import { useState } from 'react';
import { useLang } from '@/contexts/LangContext';
import { Plus, Trash2, Image, Package, FileText, StickyNote, Edit2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderFormData } from '../OrderWizard';
import { useCatalogItems } from '@/hooks/useMerchants';

interface StepItemsProps {
  formData: OrderFormData;
  updateFormData: (data: Partial<OrderFormData>) => void;
}

type ItemWithNote = OrderFormData['items'][0] & {
  notes?: string;
};

export default function StepItems({ formData, updateFormData }: StepItemsProps) {
  const { lang } = useLang();
  const [mode, setMode] = useState<'catalog' | 'free_text'>('free_text');
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);

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

  const updateItemNote = (index: number, notes: string) => {
    const updated = formData.items.map((item, i) => 
      i === index ? { ...item, notes } : item
    );
    updateFormData({ items: updated });
  };

  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    unit: '',
    notes: '',
  });

  const handleAddFreeTextItem = () => {
    if (!newItem.description.trim()) return;
    addItem({
      mode: 'free_text',
      description: newItem.description,
      quantity: newItem.quantity,
      unit: newItem.unit,
    });
    setNewItem({ description: '', quantity: 1, unit: '', notes: '' });
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold">
          <Package className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-bold">
            {lang === 'ar' ? 'المنتجات' : 'Items'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {lang === 'ar' ? 'أضف المنتجات أو الخدمات المطلوبة' : 'Add products or services'}
          </p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-2xl border-2 overflow-hidden">
        {formData.sourceMerchantId && catalogItems && catalogItems.length > 0 && (
          <button
            onClick={() => setMode('catalog')}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2",
              mode === 'catalog'
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
          >
            <Image className="h-4 w-4" />
            {lang === 'ar' ? 'من الكتالوج' : 'From Catalog'}
          </button>
        )}
        <button
          onClick={() => setMode('free_text')}
          className={cn(
            "flex-1 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2",
            mode === 'free_text'
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          <FileText className="h-4 w-4" />
          {lang === 'ar' ? 'وصف حر' : 'Free Text'}
        </button>
      </div>

      {/* Added Items */}
      {formData.items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              {lang === 'ar' ? 'المنتجات المضافة' : 'Added Items'} 
            </h4>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
              {formData.items.length} {lang === 'ar' ? 'منتج' : 'items'}
            </span>
          </div>
          <div className="space-y-3">
            {formData.items.map((item, index) => {
              const itemWithNote = item as ItemWithNote;
              return (
                <div
                  key={index}
                  className="card-premium p-4 space-y-3"
                >
                  {/* Item Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{item.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {lang === 'ar' ? 'الكمية:' : 'Qty:'} {item.quantity} {item.unit}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Item Note */}
                  {editingNoteIndex === index ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={itemWithNote.notes || ''}
                        onChange={(e) => updateItemNote(index, e.target.value)}
                        placeholder={lang === 'ar' ? 'أضف ملاحظة...' : 'Add a note...'}
                        className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        autoFocus
                      />
                      <button
                        onClick={() => setEditingNoteIndex(null)}
                        className="p-2 rounded-xl bg-emerald text-white"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingNoteIndex(index)}
                      className={cn(
                        "w-full flex items-center gap-2 p-2 rounded-xl border border-dashed text-sm transition-colors",
                        itemWithNote.notes 
                          ? "border-primary/30 bg-primary/5 text-foreground"
                          : "border-border text-muted-foreground hover:border-primary/30 hover:bg-primary/5"
                      )}
                    >
                      <StickyNote className="h-4 w-4 text-primary shrink-0" />
                      {itemWithNote.notes || (lang === 'ar' ? 'إضافة ملاحظة' : 'Add note')}
                      <Edit2 className="h-3 w-3 ms-auto opacity-50" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Catalog Items */}
      {mode === 'catalog' && catalogItems && catalogItems.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-bold text-sm">
            {lang === 'ar' ? 'اختر من الكتالوج' : 'Select from Catalog'}
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {catalogItems.map(item => {
              const photos = item.photos as string[] | null;
              return (
                <button
                  key={item.id}
                  onClick={() => handleAddCatalogItem(item)}
                  className="w-full p-3 rounded-2xl border-2 hover:border-primary/50 transition-all flex items-center gap-3 text-start group hover:shadow-md"
                >
                  {photos && photos.length > 0 ? (
                    <img
                      src={photos[0]}
                      alt=""
                      className="w-14 h-14 rounded-xl object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                      <Image className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">
                      {lang === 'ar' && item.name_ar ? item.name_ar : item.name}
                    </p>
                    <p className="text-sm text-primary font-medium">
                      {item.price_type === 'fixed'
                        ? `${item.price_fixed} ${lang === 'ar' ? 'ر.س' : 'SAR'}`
                        : `${item.price_min}–${item.price_max} ${lang === 'ar' ? 'ر.س' : 'SAR'}`}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Plus className="h-5 w-5" />
                  </div>
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
            <label className="block text-sm font-bold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              {lang === 'ar' ? 'وصف المنتج/الخدمة' : 'Item Description'}
            </label>
            <textarea
              value={newItem.description}
              onChange={e => setNewItem({ ...newItem, description: e.target.value })}
              placeholder={lang === 'ar' ? 'مثال: قماش حرير أزرق 3 أمتار' : 'e.g., Blue silk fabric 3 meters'}
              className="w-full rounded-2xl border-2 bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary min-h-[80px] transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-bold mb-2">
                {lang === 'ar' ? 'الكمية' : 'Quantity'}
              </label>
              <input
                type="number"
                min={1}
                value={newItem.quantity}
                onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                className="w-full rounded-2xl border-2 bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">
                {lang === 'ar' ? 'الوحدة' : 'Unit'}
              </label>
              <input
                type="text"
                value={newItem.unit}
                onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                placeholder={lang === 'ar' ? 'متر، قطعة...' : 'meter, piece...'}
                className="w-full rounded-2xl border-2 bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Note field for new item */}
          <div>
            <label className="block text-sm font-bold mb-2 flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-primary" />
              {lang === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (optional)'}
            </label>
            <input
              type="text"
              value={newItem.notes}
              onChange={e => setNewItem({ ...newItem, notes: e.target.value })}
              placeholder={lang === 'ar' ? 'مثال: أفضل اللون الغامق' : 'e.g., Prefer dark color'}
              className="w-full rounded-2xl border-2 bg-card px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          <button
            onClick={handleAddFreeTextItem}
            disabled={!newItem.description.trim()}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-primary/30 text-primary font-bold flex items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-5 w-5" />
            {lang === 'ar' ? 'إضافة منتج' : 'Add Item'}
          </button>
        </div>
      )}

      {/* Empty state */}
      {formData.items.length === 0 && (
        <div className="text-center py-8 rounded-2xl bg-muted/30 border border-dashed border-muted-foreground/20">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground text-sm">
            {lang === 'ar' 
              ? 'لم تضف أي منتجات بعد. أضف منتجاً باستخدام النموذج أعلاه.'
              : 'No items added yet. Add items using the form above.'}
          </p>
        </div>
      )}
    </div>
  );
}
