import { useSearchParams } from 'react-router-dom';
import SmartOrderFlow from '@/components/order/SmartOrderFlow';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LangContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, LogIn } from 'lucide-react';

export default function CreateOrderPage() {
  const [params] = useSearchParams();
  const merchantId = params.get('merchant') || undefined;
  const branchId = params.get('branch') || undefined;
  const { user, loading } = useAuth();
  const { lang, dir } = useLang();

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

  return <SmartOrderFlow merchantId={merchantId} branchId={branchId} />;
}
