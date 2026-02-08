import { useLang } from '@/contexts/LangContext';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  const { t, dir } = useLang();
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <section className="relative overflow-hidden bg-gradient-navy px-4 py-12 sm:py-16">
      {/* Decorative circles */}
      <div className="absolute -top-20 -end-20 h-64 w-64 rounded-full bg-gradient-gold opacity-10 blur-3xl" />
      <div className="absolute -bottom-16 -start-16 h-48 w-48 rounded-full bg-gradient-gold opacity-5 blur-2xl" />
      
      <div className="container relative">
        <h2 className="text-3xl sm:text-4xl font-bold text-secondary-foreground mb-3 animate-fade-in">
          {t('welcome')}
        </h2>
        <p className="text-secondary-foreground/70 text-base sm:text-lg mb-8 max-w-md animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {t('heroSubtitle')}
        </p>
        <Link
          to="/search"
          className="inline-flex items-center gap-2 bg-gradient-gold text-primary-foreground px-6 py-3 rounded-lg font-semibold shadow-gold hover:opacity-90 transition-opacity animate-fade-in"
          style={{ animationDelay: '0.2s' }}
        >
          {t('exploreNow')}
          <Arrow className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
