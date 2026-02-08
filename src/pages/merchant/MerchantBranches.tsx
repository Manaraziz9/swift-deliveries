import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useLang } from '@/contexts/LangContext';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Plus, Pencil, Trash2, Loader2, Phone, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MerchantContext {
  merchant: { id: string };
}

interface Branch {
  id: string;
  branch_name: string | null;
  address_text: string | null;
  address_text_ar: string | null;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  open_now: boolean;
}

export default function MerchantBranches() {
  const { merchant } = useOutletContext<MerchantContext>();
  const { lang } = useLang();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    branch_name: '',
    address_text: '',
    address_text_ar: '',
    phone: '',
    lat: '',
    lng: '',
    open_now: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, [merchant]);

  const fetchBranches = async () => {
    const { data, error } = await supabase
      .from('merchant_branches')
      .select('*')
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBranches(data);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      branch_name: '',
      address_text: '',
      address_text_ar: '',
      phone: '',
      lat: '',
      lng: '',
      open_now: true,
    });
    setEditingBranch(null);
    setShowForm(false);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      branch_name: branch.branch_name || '',
      address_text: branch.address_text || '',
      address_text_ar: branch.address_text_ar || '',
      phone: branch.phone || '',
      lat: branch.lat?.toString() || '',
      lng: branch.lng?.toString() || '',
      open_now: branch.open_now,
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.address_text.trim() && !formData.address_text_ar.trim()) {
      toast.error(lang === 'ar' ? 'العنوان مطلوب' : 'Address is required');
      return;
    }

    setSubmitting(true);

    const payload = {
      merchant_id: merchant.id,
      branch_name: formData.branch_name.trim() || null,
      address_text: formData.address_text.trim() || null,
      address_text_ar: formData.address_text_ar.trim() || null,
      phone: formData.phone.trim() || null,
      lat: formData.lat ? parseFloat(formData.lat) : null,
      lng: formData.lng ? parseFloat(formData.lng) : null,
      open_now: formData.open_now,
    };

    try {
      if (editingBranch) {
        const { error } = await supabase
          .from('merchant_branches')
          .update(payload)
          .eq('id', editingBranch.id);
        if (error) throw error;
        toast.success(lang === 'ar' ? 'تم التحديث بنجاح' : 'Updated successfully');
      } else {
        const { error } = await supabase.from('merchant_branches').insert(payload);
        if (error) throw error;
        toast.success(lang === 'ar' ? 'تمت الإضافة بنجاح' : 'Added successfully');
      }
      resetForm();
      fetchBranches();
    } catch (err) {
      console.error(err);
      toast.error(lang === 'ar' ? 'حدث خطأ' : 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?')) return;

    const { error } = await supabase.from('merchant_branches').delete().eq('id', id);
    if (error) {
      toast.error(lang === 'ar' ? 'حدث خطأ' : 'An error occurred');
    } else {
      toast.success(lang === 'ar' ? 'تم الحذف' : 'Deleted');
      fetchBranches();
    }
  };

  const toggleOpenNow = async (branch: Branch) => {
    const { error } = await supabase
      .from('merchant_branches')
      .update({ open_now: !branch.open_now })
      .eq('id', branch.id);

    if (!error) {
      fetchBranches();
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
            {lang === 'ar' ? 'الفروع' : 'Branches'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'ar' ? 'إدارة فروعك ومواقعها' : 'Manage your branches and locations'}
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-gradient-gold text-primary-foreground gap-2"
        >
          <Plus className="h-4 w-4" />
          {lang === 'ar' ? 'إضافة فرع' : 'Add Branch'}
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <h3 className="font-bold text-lg mb-4">
              {editingBranch
                ? (lang === 'ar' ? 'تعديل الفرع' : 'Edit Branch')
                : (lang === 'ar' ? 'إضافة فرع جديد' : 'Add New Branch')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {lang === 'ar' ? 'اسم الفرع' : 'Branch Name'}
                </label>
                <Input
                  value={formData.branch_name}
                  onChange={e => setFormData(prev => ({ ...prev, branch_name: e.target.value }))}
                  placeholder={lang === 'ar' ? 'الفرع الرئيسي' : 'Main Branch'}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  {lang === 'ar' ? 'العنوان (إنجليزي)' : 'Address (English)'}
                </label>
                <Input
                  value={formData.address_text}
                  onChange={e => setFormData(prev => ({ ...prev, address_text: e.target.value }))}
                  placeholder="123 Main Street, Riyadh"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  {lang === 'ar' ? 'العنوان (عربي)' : 'Address (Arabic)'}
                </label>
                <Input
                  value={formData.address_text_ar}
                  onChange={e => setFormData(prev => ({ ...prev, address_text_ar: e.target.value }))}
                  placeholder="شارع الرئيسي، الرياض"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  {lang === 'ar' ? 'رقم الهاتف' : 'Phone'}
                </label>
                <Input
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+966 5XX XXX XXXX"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    {lang === 'ar' ? 'خط العرض' : 'Latitude'}
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.lat}
                    onChange={e => setFormData(prev => ({ ...prev, lat: e.target.value }))}
                    placeholder="24.7136"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    {lang === 'ar' ? 'خط الطول' : 'Longitude'}
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.lng}
                    onChange={e => setFormData(prev => ({ ...prev, lng: e.target.value }))}
                    placeholder="46.6753"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {lang === 'ar' ? 'مفتوح الآن' : 'Open Now'}
                </span>
                <Switch
                  checked={formData.open_now}
                  onCheckedChange={checked => setFormData(prev => ({ ...prev, open_now: checked }))}
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

      {/* Branches List */}
      {branches.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">
            {lang === 'ar' ? 'لا توجد فروع بعد' : 'No branches yet'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {branches.map(branch => (
            <div
              key={branch.id}
              className="bg-card rounded-xl shadow-card p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">
                      {branch.branch_name || (lang === 'ar' ? 'فرع' : 'Branch')}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {lang === 'ar' && branch.address_text_ar
                        ? branch.address_text_ar
                        : branch.address_text || '-'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleOpenNow(branch)}
                  className={cn(
                    'flex items-center gap-1 text-xs px-2 py-1 rounded-full',
                    branch.open_now
                      ? 'bg-emerald/20 text-emerald'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Clock className="h-3 w-3" />
                  {branch.open_now
                    ? (lang === 'ar' ? 'مفتوح' : 'Open')
                    : (lang === 'ar' ? 'مغلق' : 'Closed')}
                </button>
              </div>

              {branch.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Phone className="h-3.5 w-3.5" />
                  <span dir="ltr">{branch.phone}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(branch)}
                  className="flex-1 gap-1"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {lang === 'ar' ? 'تعديل' : 'Edit'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(branch.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
