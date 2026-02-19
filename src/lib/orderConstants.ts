import { CheckCircle, Clock, XCircle } from 'lucide-react';

export const ORDER_STATUS_LABELS: Record<string, { ar: string; en: string; icon: any; color: string }> = {
  draft: { ar: 'مسودة', en: 'Draft', icon: Clock, color: 'text-muted-foreground' },
  payment_pending: { ar: 'بانتظار الدفع', en: 'Payment Pending', icon: Clock, color: 'text-primary' },
  paid: { ar: 'مدفوع', en: 'Paid', icon: Clock, color: 'text-primary' },
  in_progress: { ar: 'قيد التنفيذ', en: 'In Progress', icon: Clock, color: 'text-emerald-500' },
  completed: { ar: 'مكتمل', en: 'Completed', icon: CheckCircle, color: 'text-emerald-500' },
  canceled: { ar: 'ملغي', en: 'Canceled', icon: XCircle, color: 'text-destructive' },
};

export const STAGE_LABELS: Record<string, { ar: string; en: string }> = {
  purchase: { ar: 'الشراء', en: 'Purchase' },
  pickup: { ar: 'الاستلام', en: 'Pickup' },
  dropoff: { ar: 'التوصيل', en: 'Delivery' },
  handover: { ar: 'التسليم', en: 'Handover' },
  onsite: { ar: 'في الموقع', en: 'On-site' },
};
