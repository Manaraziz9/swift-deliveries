import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SmartOrderFlow from '@/components/order/SmartOrderFlow';
import ServiceTemplateSelector from '@/components/order/ServiceTemplateSelector';
import DynamicServiceForm from '@/components/order/DynamicServiceForm';
import AIOrderChat from '@/components/order/AIOrderChat';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LangContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, LogIn, Bot, LayoutGrid } from 'lucide-react';
import { type ServiceTemplate } from '@/lib/serviceTemplates';
import { useCreateOrder } from '@/hooks/useOrders';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type FlowMode = 'choose' | 'template' | 'smart' | 'ai_chat';

export default function CreateOrderPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const merchantId = params.get('merchant') || undefined;
  const branchId = params.get('branch') || undefined;
  const { user, loading } = useAuth();
  const { lang, dir } = useLang();
  const createOrder = useCreateOrder();

  const [mode, setMode] = useState<FlowMode>(merchantId ? 'smart' : 'choose');
  const [selectedTemplate, setSelectedTemplate] = useState<ServiceTemplate | null>(null);

  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <LogIn className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">
            {lang === 'ar' ? 'سجّل دخولك أولاً' : 'Please Sign In First'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {lang === 'ar'
              ? 'تحتاج تسجيل الدخول لإنشاء طلب جديد'
              : 'You need to sign in to create a new order'}
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold shadow-ya-accent hover:brightness-95 transition-all"
          >
            <LogIn className="h-5 w-5" />
            {lang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
          </Link>
          <Link
            to="/"
            className="block mt-4 text-sm text-muted-foreground hover:text-foreground"
          >
            <BackArrow className="h-4 w-4 inline me-1" />
            {lang === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
          </Link>
        </div>
      </div>
    );
  }

  // Template form completed → create order
  const handleTemplateSubmit = async (values: Record<string, any>, summary: string) => {
    if (!selectedTemplate) return;
    try {
      const details = Object.entries(values)
        .filter(([, v]) => v !== undefined && v !== '' && v !== null)
        .map(([key, val]) => {
          const field = selectedTemplate.fields.find(f => f.id === key);
          const fieldLabel = field ? (lang === 'ar' ? field.label_ar : field.label_en) : key;
          if (Array.isArray(val)) {
            const labels = val.map(v => {
              const opt = field?.options?.find(o => o.value === v);
              return opt ? (lang === 'ar' ? opt.label_ar : opt.label_en) : v;
            });
            return `${fieldLabel}: ${labels.join(', ')}`;
          }
          if (typeof val === 'boolean') return val ? `✓ ${fieldLabel}` : '';
          const opt = field?.options?.find(o => o.value === val);
          const displayVal = opt ? (lang === 'ar' ? opt.label_ar : opt.label_en) : val;
          return `${fieldLabel}: ${displayVal}`;
        })
        .filter(Boolean)
        .join('\n');

      const result = await createOrder.mutateAsync({
        order: {
          order_type: 'DIRECT',
          notes: `[${lang === 'ar' ? selectedTemplate.title_ar : selectedTemplate.title_en}]\n${summary}\n\n${details}`,
          status: 'draft',
          totals_json: { template_id: selectedTemplate.id, template_values: values },
        },
        items: [{
          item_mode: 'free_text',
          catalog_item_id: null,
          free_text_description: summary,
          quantity: 1,
          unit: null,
          photo_urls: [],
        }],
      });
      
      toast.success(lang === 'ar' ? 'تم إنشاء الطلب بنجاح!' : 'Order created successfully!');
      navigate(`/orders/${result.id}`);
    } catch (error: any) {
      toast.error(error.message || (lang === 'ar' ? 'حدث خطأ' : 'Error'));
    }
  };

  // AI Chat mode
  if (mode === 'ai_chat') {
    return <AIOrderChat />;
  }

  // Smart flow (from merchant)
  if (mode === 'smart') {
    return <SmartOrderFlow merchantId={merchantId} branchId={branchId} />;
  }

  // Template form
  if (mode === 'template' && selectedTemplate) {
    return (
      <DynamicServiceForm
        template={selectedTemplate}
        onSubmit={handleTemplateSubmit}
        onBack={() => { setSelectedTemplate(null); setMode('choose'); }}
      />
    );
  }

  // Choose mode: template selector + AI toggle
  const isChooseMode = mode === 'choose' || mode === 'template';
  return (
    <div className="min-h-screen bg-background">
      {/* Mode Toggle at top */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ms-2 text-muted-foreground hover:text-foreground">
            <BackArrow className="h-5 w-5" />
          </button>
          <div className="flex-1 flex bg-muted rounded-2xl p-1">
            <button
              onClick={() => setMode('choose')}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                isChooseMode
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              {lang === 'ar' ? 'القوالب' : 'Templates'}
            </button>
            <button
              onClick={() => setMode('ai_chat')}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                !isChooseMode
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Bot className="h-4 w-4" />
              {lang === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}
            </button>
          </div>
          <span className="text-lg font-bold font-en text-primary">YA</span>
        </div>
      </div>

      {/* Template selector content */}
      <ServiceTemplateSelector
        embedded
        onSelect={(template) => {
          setSelectedTemplate(template);
          setMode('template');
        }}
      />
    </div>
  );
}
