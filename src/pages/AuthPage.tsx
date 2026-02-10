import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLang } from '@/contexts/LangContext';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthPage() {
  const { t, lang, dir } = useLang();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const BackArrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { name },
          },
        });
        if (error) throw error;
        toast.success(lang === 'ar' ? 'تم إنشاء الحساب بنجاح! تحقق من بريدك الإلكتروني' : 'Account created! Check your email');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(lang === 'ar' ? 'تم تسجيل الدخول بنجاح' : 'Logged in successfully');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-foreground flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="p-4 relative z-10">
        <Link to="/" className="inline-flex items-center gap-1 text-background/50 text-sm hover:text-background/80">
          <BackArrow className="h-4 w-4" />
          {t('home')}
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 relative z-10">
        <div className="max-w-sm mx-auto w-full">
          <h1 className="text-3xl font-bold text-background mb-2 text-center">
            {t('appName')}
          </h1>
          <p className="text-background/50 text-center mb-8">
            {mode === 'login'
              ? (lang === 'ar' ? 'سجّل دخولك للمتابعة' : 'Sign in to continue')
              : (lang === 'ar' ? 'أنشئ حساباً جديداً' : 'Create a new account')
            }
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-background/40" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={lang === 'ar' ? 'الاسم' : 'Name'}
                  className="w-full rounded-xl bg-background/10 border border-background/20 ps-11 pe-4 py-3.5 text-background placeholder:text-background/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-background/40" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                className="w-full rounded-xl bg-background/10 border border-background/20 ps-11 pe-4 py-3.5 text-background placeholder:text-background/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-background/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={lang === 'ar' ? 'كلمة المرور' : 'Password'}
                className="w-full rounded-xl bg-background/10 border border-background/20 ps-11 pe-11 py-3.5 text-background placeholder:text-background/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-background/40 hover:text-background/60"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-bold shadow-ya-accent hover:brightness-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' 
                    ? (lang === 'ar' ? 'دخول' : 'Sign In')
                    : (lang === 'ar' ? 'إنشاء حساب' : 'Sign Up')
                  }
                  <Arrow className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-background/50 text-sm hover:text-background/80"
            >
              {mode === 'login'
                ? (lang === 'ar' ? 'ما عندك حساب؟ سجّل الآن' : "Don't have an account? Sign up")
                : (lang === 'ar' ? 'عندك حساب؟ سجّل دخولك' : 'Already have an account? Sign in')
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
