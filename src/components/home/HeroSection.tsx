import { useState } from 'react';
import { useLang } from '@/contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function HeroSection() {
  const { dir } = useLang();
  const navigate = useNavigate();
  const [pressed, setPressed] = useState(false);

  const handleCTA = () => {
    setPressed(true);
    setTimeout(() => navigate('/create-order'), 600);
  };

  return (
    <section className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-16 bg-background">
      {/* YA• */}
      <div className="flex items-center gap-1 animate-hero-ya">
        <span className="text-[5.5rem] sm:text-[7rem] lg:text-[9rem] font-bold text-foreground tracking-tight font-en leading-none">
          YA
        </span>
        <span className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 rounded-full bg-ya-highlight mt-3 sm:mt-4 animate-hero-dot" />
      </div>

      {/* Taglines */}
      <div className="text-center mt-8 sm:mt-10 space-y-2 animate-hero-text">
        <p className="text-foreground text-xl sm:text-2xl lg:text-3xl font-bold font-ar">
          طلباتك أوامر
        </p>
        <p className="text-muted-foreground text-base sm:text-lg font-en tracking-wide">
          When you call, we act.
        </p>
      </div>

      {/* Search Bar */}
      <div
        onClick={() => navigate('/search')}
        className="mt-8 sm:mt-10 w-full max-w-md mx-auto flex items-center gap-3 bg-card border border-border rounded-full px-5 py-3 cursor-pointer hover:border-primary/40 transition-colors"
      >
        <Search className="w-5 h-5 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground text-sm sm:text-base font-ar">
          {dir === 'rtl' ? 'وش تبغى نخلّصه؟' : 'What do you need done?'}
        </span>
      </div>

      {/* Single CTA — Muted Orange pill */}
      <button
        onClick={handleCTA}
        disabled={pressed}
        className="mt-6 sm:mt-8 bg-primary text-primary-foreground text-lg sm:text-xl font-bold px-12 sm:px-16 py-4 sm:py-5 rounded-full shadow-ya-accent transition-all duration-200 animate-hero-cta hover:brightness-95 hover:shadow-ya-md active:scale-[0.98]"
      >
        {pressed
          ? dir === 'rtl' ? 'YA شغّالة…' : 'YA is on it…'
          : dir === 'rtl' ? 'اطلب الآن' : 'Order Now'}
      </button>
    </section>
  );
}
