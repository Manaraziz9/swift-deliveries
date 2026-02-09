import { useLang } from '@/contexts/LangContext';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HeroSection() {
  const { t, dir } = useLang();
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <section className="relative overflow-hidden bg-ya-gradient px-4 py-14 sm:py-20">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -end-24 h-80 w-80 rounded-full bg-ya-accent/30 blur-3xl animate-pulse-soft" />
        <div className="absolute top-1/2 -start-32 h-64 w-64 rounded-full bg-ya-accent/10 blur-3xl" />
        <div className="absolute -bottom-20 end-1/4 h-56 w-56 rounded-full bg-ya-highlight/10 blur-3xl" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(171 78% 40%) 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>
      
      <div className="container relative">
        {/* YA Badge */}
        <div 
          className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 animate-fade-in border border-white/10"
        >
          <span className="w-2 h-2 rounded-full bg-ya-accent animate-pulse-soft" />
          <span className="text-sm font-medium text-white/90">
            {dir === 'rtl' ? 'قل YA. والباقي علينا' : 'Say YA. Done.'}
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 animate-fade-in-up text-balance leading-tight font-en">
          {t('welcome')}
        </h2>
        
        <p 
          className="text-white/70 text-base sm:text-lg mb-10 max-w-lg animate-fade-in leading-relaxed"
          style={{ animationDelay: '0.15s' }}
        >
          {t('heroSubtitle')}
        </p>
        
        <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: '0.25s' }}>
          <Link
            to="/create-order"
            className="btn-ya inline-flex items-center gap-2.5"
          >
            {t('createOrder')}
            <Arrow className="h-4 w-4" />
          </Link>
          
          <Link
            to="/search"
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-6 py-3 rounded-ya-md font-semibold border border-white/20 hover:bg-white/20 transition-all duration-200"
          >
            {t('exploreNow')}
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
              <div className="text-2xl sm:text-3xl font-bold text-ya-gradient">{stat.value}</div>
              <div className="text-xs sm:text-sm text-white/60">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
