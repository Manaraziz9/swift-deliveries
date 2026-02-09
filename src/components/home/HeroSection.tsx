import { useLang } from '@/contexts/LangContext';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  const { t, dir } = useLang();
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <section className="relative overflow-hidden bg-gradient-navy px-4 py-14 sm:py-20">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -end-24 h-80 w-80 rounded-full bg-gradient-gold-static opacity-15 blur-3xl animate-pulse-glow" />
        <div className="absolute top-1/2 -start-32 h-64 w-64 rounded-full bg-gold/10 blur-3xl animate-float" />
        <div className="absolute -bottom-20 end-1/4 h-56 w-56 rounded-full bg-emerald/10 blur-3xl" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--gold)) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>
      
      <div className="container relative">
        {/* Badge */}
        <div 
          className="inline-flex items-center gap-2 bg-gradient-glass rounded-full px-4 py-2 mb-6 animate-fade-in"
        >
          <Sparkles className="h-4 w-4 text-gold" />
          <span className="text-sm font-medium text-secondary-foreground/90">
            {dir === 'rtl' ? 'منصة الخدمات الموحدة' : 'Unified Services Platform'}
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-secondary-foreground mb-4 animate-fade-in-up text-balance leading-tight">
          {t('welcome')}
        </h2>
        
        <p 
          className="text-secondary-foreground/70 text-base sm:text-lg mb-10 max-w-lg animate-fade-in leading-relaxed"
          style={{ animationDelay: '0.15s' }}
        >
          {t('heroSubtitle')}
        </p>
        
        <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <Link
            to="/search"
            className="btn-premium inline-flex items-center gap-2.5"
          >
            {t('exploreNow')}
            <Arrow className="h-4 w-4" />
          </Link>
          
          <Link
            to="/create-order"
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-secondary-foreground px-6 py-3 rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all duration-300"
          >
            {dir === 'rtl' ? 'طلب جديد' : 'New Order'}
          </Link>
        </div>

        {/* Stats row */}
        <div 
          className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-white/10 animate-fade-in"
          style={{ animationDelay: '0.35s' }}
        >
          {[
            { value: '500+', label: dir === 'rtl' ? 'محل' : 'Merchants' },
            { value: '10K+', label: dir === 'rtl' ? 'طلب' : 'Orders' },
            { value: '4.8', label: dir === 'rtl' ? 'تقييم' : 'Rating' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gradient-gold">{stat.value}</div>
              <div className="text-xs sm:text-sm text-secondary-foreground/60">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
