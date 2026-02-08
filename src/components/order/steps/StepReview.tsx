import { useLang } from '@/contexts/LangContext';
import { Package, MapPin, ShoppingBag, FileText, AlertCircle } from 'lucide-react';
import { OrderFormData } from '../OrderWizard';
import { useMerchant, useBranches } from '@/hooks/useMerchants';

interface StepReviewProps {
  formData: OrderFormData;
}

export default function StepReview({ formData }: StepReviewProps) {
  const { lang } = useLang();
  const { data: merchant } = useMerchant(formData.sourceMerchantId || undefined);
  const { data: branches } = useBranches(formData.sourceMerchantId || undefined);

  const selectedBranch = branches?.find(b => b.id === formData.sourceBranchId);

  const orderTypeLabels = {
    DIRECT: lang === 'ar' ? 'توصيل مباشر' : 'Direct Delivery',
    PURCHASE_DELIVER: lang === 'ar' ? 'شراء وتوصيل' : 'Purchase & Deliver',
    CHAIN: lang === 'ar' ? 'سلسلة مهام' : 'Chain Order',
  };

  const substitutionLabels = {
    NONE: lang === 'ar' ? 'لا استبدال' : 'No Substitution',
    SAME_CATEGORY: lang === 'ar' ? 'نفس الفئة' : 'Same Category',
    WITHIN_PRICE: lang === 'ar' ? 'ضمن السعر' : 'Within Price',
    CUSTOM_RULES: lang === 'ar' ? 'قواعد مخصصة' : 'Custom Rules',
  };

  return (
    <div className="space-y-4 pb-24">
      <h3 className="text-lg font-bold">
        {lang === 'ar' ? 'مراجعة الطلب' : 'Review Order'}
      </h3>

      {/* Order Type */}
      <div className="rounded-xl bg-card border p-4">
        <div className="flex items-center gap-2 text-sm font-medium mb-2">
          <Package className="h-4 w-4 text-primary" />
          {lang === 'ar' ? 'نوع الطلب' : 'Order Type'}
        </div>
        <p className="text-sm">{orderTypeLabels[formData.orderType]}</p>
      </div>

      {/* Source */}
      <div className="rounded-xl bg-card border p-4">
        <div className="flex items-center gap-2 text-sm font-medium mb-2">
          <MapPin className="h-4 w-4 text-primary" />
          {lang === 'ar' ? 'المصدر' : 'Source'}
        </div>
        {merchant ? (
          <div>
            <p className="text-sm font-medium">
              {lang === 'ar' && merchant.business_name_ar
                ? merchant.business_name_ar
                : merchant.business_name}
            </p>
            {selectedBranch && (
              <p className="text-xs text-muted-foreground">
                {lang === 'ar' ? selectedBranch.address_text_ar : selectedBranch.address_text}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm">{formData.pickupAddress || '—'}</p>
        )}
      </div>

      {/* Items */}
      <div className="rounded-xl bg-card border p-4">
        <div className="flex items-center gap-2 text-sm font-medium mb-2">
          <ShoppingBag className="h-4 w-4 text-primary" />
          {lang === 'ar' ? 'المنتجات' : 'Items'} ({formData.items.length})
        </div>
        {formData.items.length > 0 ? (
          <ul className="space-y-1">
            {formData.items.map((item, i) => (
              <li key={i} className="text-sm flex justify-between">
                <span>{item.description}</span>
                <span className="text-muted-foreground">
                  {item.quantity} {item.unit}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {lang === 'ar' ? 'لم تضف منتجات' : 'No items added'}
          </p>
        )}
      </div>

      {/* Destination */}
      <div className="rounded-xl bg-card border p-4">
        <div className="flex items-center gap-2 text-sm font-medium mb-2">
          <MapPin className="h-4 w-4 text-emerald" />
          {lang === 'ar' ? 'الوجهة' : 'Destination'}
        </div>
        <p className="text-sm">{formData.dropoffAddress || '—'}</p>
        {formData.recipientName && (
          <p className="text-xs text-muted-foreground mt-1">
            {formData.recipientName} • {formData.recipientPhone}
          </p>
        )}
      </div>

      {/* Policies */}
      {(formData.orderType === 'PURCHASE_DELIVER' || formData.orderType === 'CHAIN') && (
        <div className="rounded-xl bg-card border p-4">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <FileText className="h-4 w-4 text-primary" />
            {lang === 'ar' ? 'السياسات' : 'Policies'}
          </div>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">
                {lang === 'ar' ? 'سقف الشراء:' : 'Price Cap:'}
              </span>{' '}
              {formData.priceCap
                ? `${formData.priceCap} ${lang === 'ar' ? 'ر.س' : 'SAR'}`
                : lang === 'ar' ? 'غير محدد' : 'Not set'}
            </p>
            <p>
              <span className="text-muted-foreground">
                {lang === 'ar' ? 'الاستبدال:' : 'Substitution:'}
              </span>{' '}
              {substitutionLabels[formData.substitutionPolicy]}
            </p>
          </div>
        </div>
      )}

      {/* Notes */}
      {formData.notes && (
        <div className="rounded-xl bg-card border p-4">
          <div className="flex items-center gap-2 text-sm font-medium mb-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            {lang === 'ar' ? 'ملاحظات' : 'Notes'}
          </div>
          <p className="text-sm text-muted-foreground">{formData.notes}</p>
        </div>
      )}

      {/* Warning */}
      <div className="rounded-xl bg-warning/10 border border-warning/30 p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
        <p className="text-sm text-warning-foreground">
          {lang === 'ar'
            ? 'بالضغط على تأكيد الطلب، ستتم إضافة الطلب كمسودة. سيتم تحديد التكلفة النهائية بعد المراجعة.'
            : 'By confirming, the order will be added as a draft. Final cost will be determined after review.'}
        </p>
      </div>
    </div>
  );
}
