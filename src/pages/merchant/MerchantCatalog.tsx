import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useLang } from '@/contexts/LangContext';
import { supabase } from '@/integrations/supabase/client';
import { Package, Plus, Pencil, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MerchantContext {
  merchant: { id: string };
}

interface CatalogItem {
  id: string;
  name: string;
  name_ar: string | null;
  description: string | null;
  item_type: string;
  price_fixed: number | null;
  price_min: number | null;
  price_max: number | null;
  price_type: string | null;
  active: boolean;
  photos: string[];
}

export default function MerchantCatalog() {
  const { merchant } = useOutletContext<MerchantContext>();
  const { lang } = useLang();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    description: '',
    item_type: 'product',
    price_fixed: '',
    active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [merchant]);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('catalog_items')
      .select('*')
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setItems(data.map(item => ({
        ...item,
        photos: Array.isArray(item.photos) ? item.photos as string[] : [],
      })));
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      name_ar: '',
      description: '',
      item_type: 'product',
      price_fixed: '',
      active: true,
    });
    setEditingItem(null);
    setShowForm(false);
  };

  const handleEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      name_ar: item.name_ar || '',
      description: item.description || '',
      item_type: item.item_type,
      price_fixed: item.price_fixed?.toString() || '',
      active: item.active,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error(lang === 'ar' ? 'الاسم مطلوب' : 'Name is required');
      return;
    }

    setSubmitting(true);

    const payload = {
      merchant_id: merchant.id,
      name: formData.name.trim(),
      name_ar: formData.name_ar.trim() || null,
      description: formData.description.trim() || null,
      item_type: formData.item_type,
      price_fixed: formData.price_fixed ? parseFloat(formData.price_fixed) : null,
      price_type: 'fixed',
      active: formData.active,
    };

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('catalog_items')
          .update(payload)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success(lang === 'ar' ? 'تم التحديث بنجاح' : 'Updated successfully');
      } else {
        const { error } = await supabase.from('catalog_items').insert(payload);
        if (error) throw error;
        toast.success(lang === 'ar' ? 'تمت الإضافة بنجاح' : 'Added successfully');
      }
      resetForm();
      fetchItems();
    } catch (err) {
      console.error(err);
      toast.error(lang === 'ar' ? 'حدث خطأ' : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) return;

    const { error } = await supabase.from('catalog_items').delete().eq('id', id);
    if (error) {
      toast.error(lang === 'ar' ? 'حدث خطأ' : 'An error occurred');
    } else {
      toast.success(lang === 'ar' ? 'تم الحذف' : 'Deleted');
      fetchItems();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            {lang === 'ar' ? 'الكتالوج' : 'Catalog'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'ar' ? 'إدارة منتجاتك وخدماتك' : 'Manage your products and services'}
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-gold text-primary-foreground gap-2"
        >
          <Plus className="h-4 w-4" />
          {lang === 'ar' ? 'إضافة' : 'Add'}
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <h3 className="font-bold text-lg mb-4">
              {editingItem
                ? (lang === 'ar' ? 'تعديل' : 'Edit')
                : (lang === 'ar' ? 'إضافة جديد' : 'Add New')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {lang === 'ar' ? 'الاسم (إنجليزي)' : 'Name (English)'}
                </label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Product name"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  {lang === 'ar' ? 'الاسم (عربي)' : 'Name (Arabic)'}
                </label>
                <Input
                  value={formData.name_ar}
                  onChange={e => setFormData(prev => ({ ...prev, name_ar: e.target.value }))}
                  placeholder="اسم المنتج"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  {lang === 'ar' ? 'الوصف' : 'Description'}
                </label>
                <Textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={lang === 'ar' ? 'وصف مختصر...' : 'Brief description...'}
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  {lang === 'ar' ? 'النوع' : 'Type'}
                </label>
                <div className="flex gap-2">
                  {['product', 'service'].map(type => (
                    <button
                      key={type}
                      onClick={() => setFormData(prev => ({ ...prev, item_type: type }))}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                        formData.item_type === type
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {type === 'product'
                        ? (lang === 'ar' ? 'منتج' : 'Product')
                        : (lang === 'ar' ? 'خدمة' : 'Service')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  {lang === 'ar' ? 'السعر (ر.س)' : 'Price (SAR)'}
                </label>
                <Input
                  type="number"
                  value={formData.price_fixed}
                  onChange={e => setFormData(prev => ({ ...prev, price_fixed: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 bg-gradient-gold text-primary-foreground"
                >
                  {submitting
                    ? (lang === 'ar' ? 'جاري الحفظ...' : 'Saving...')
                    : (lang === 'ar' ? 'حفظ' : 'Save')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Items Grid */}
      {items.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">
            {lang === 'ar' ? 'لا توجد منتجات أو خدمات بعد' : 'No products or services yet'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(item => (
            <div
              key={item.id}
              className={cn(
                'bg-card rounded-xl shadow-card overflow-hidden',
                !item.active && 'opacity-50'
              )}
            >
              <div className="aspect-video bg-muted flex items-center justify-center">
                {item.photos[0] ? (
                  <img
                    src={item.photos[0]}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm">
                      {lang === 'ar' && item.name_ar ? item.name_ar : item.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.item_type === 'product'
                        ? (lang === 'ar' ? 'منتج' : 'Product')
                        : (lang === 'ar' ? 'خدمة' : 'Service')}
                    </p>
                  </div>
                  {item.price_fixed && (
                    <p className="font-bold text-primary text-sm">
                      {item.price_fixed} {lang === 'ar' ? 'ر.س' : 'SAR'}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                    className="flex-1 gap-1"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {lang === 'ar' ? 'تعديل' : 'Edit'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
