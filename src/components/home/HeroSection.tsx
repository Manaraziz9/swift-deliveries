import { useLang } from '@/contexts/LangContext';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  const { dir } = useLang();

  return (
    <section className="min-h-[85vh] flex flex-col items-center justify-center bg-ya-primary px-4 py-16">
      {/* YA• — Hero of the scene */}
      <div className="flex items-center gap-1 animate-hero-ya">
        <span className="text-7xl sm:text-8xl lg:text-9xl font-bold text-white tracking-tight font-en">
          YA
        </span>
        <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-ya-highlight mt-2 animate-hero-dot" />
      </div>

      {/* Taglines */}
      <div className="text-center mt-8 sm:mt-10 space-y-2 animate-hero-text">
        <p className="text-white/90 text-lg sm:text-xl lg:text-2xl font-medium font-en tracking-wide">
          When you call, we act.
        </p>
        <p className="text-white/70 text-base sm:text-lg font-ar">
          قل يا… والباقي علينا
        </p>
      </div>

      {/* Single CTA */}
      <Link
        to="/create-order"
        className="mt-10 sm:mt-12 bg-ya-accent text-white text-lg sm:text-xl font-bold px-10 sm:px-14 py-4 sm:py-5 rounded-ya-md shadow-ya-accent hover:brightness-110 transition-all duration-200 animate-hero-cta"
      >
        {dir === 'rtl' ? 'قل YA' : 'Say YA'}
      </Link>
    </section>
  );
}
