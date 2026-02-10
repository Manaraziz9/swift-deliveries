import { useState } from 'react';
import { useLang } from '@/contexts/LangContext';
import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const { dir } = useLang();
  const navigate = useNavigate();
  const [pressed, setPressed] = useState(false);

  const handleCTA = () => {
    setPressed(true);
    setTimeout(() => navigate('/create-order'), 600);
  };

  return (
    <section className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-16 bg-[linear-gradient(180deg,hsl(222_38%_19%)_0%,hsl(222_32%_26%)_100%)]">
      {/* YA• — Hero of the scene */}
      <div className="flex items-center gap-1 animate-hero-ya">
        <span className="text-[5.5rem] sm:text-[7rem] lg:text-[9rem] font-bold text-white tracking-tight font-en leading-none">
          YA
        </span>
        <span className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 rounded-full bg-ya-highlight mt-3 sm:mt-4 animate-hero-dot" />
      </div>

      {/* Taglines — English first, Arabic second */}
      <div className="text-center mt-8 sm:mt-10 space-y-2 animate-hero-text">
        <p className="text-white/90 text-lg sm:text-xl lg:text-2xl font-medium font-en tracking-wide">
          When you call, we act.
        </p>
        <p className="text-white/70 text-base sm:text-lg font-ar">
          قل يا… والباقي علينا
        </p>
      </div>

      {/* Single CTA — Pill shape */}
      <button
        onClick={handleCTA}
        disabled={pressed}
        className="mt-10 sm:mt-12 bg-ya-accent text-white text-lg sm:text-xl font-bold px-12 sm:px-16 py-4 sm:py-5 rounded-full shadow-ya-accent transition-all duration-200 animate-hero-cta hover:brightness-[0.94] hover:shadow-ya-md active:scale-[0.98]"
      >
        {pressed
          ? (dir === 'rtl' ? 'YA شغّالة…' : 'YA is on it…')
          : (dir === 'rtl' ? 'قل YA' : 'Say YA')}
      </button>
    </section>
  );
}
