import { useLang } from '@/contexts/LangContext';
import { useMerchants } from '@/hooks/useMerchants';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { TrendingUp, ArrowLeft, ArrowRight } from 'lucide-react';

export default function PopularTodaySection() {
  const { lang, dir } = useLang();
  const navigate = useNavigate();
  const { data: merchants, isLoading } = useMerchants();
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const { data: branches } = useQuery({
    queryKey: ['all-branches'],
    queryFn: async () => {
      const { data, error } = await supabase.from('merchant_branches').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Shuffle for "popular today" effect — take different slice
  const popular = (merchants || []).slice(0, 6);

  return (
    <section className="py-8">
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-ya-highlight/15 flex items-center justify-center">
              <TrendingUp className="h-4.5 w-4.5 text-ya-highlight" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              {lang === 'ar' ? 'شائع اليوم' : 'Popular Today'}
            </h3>
          </div>
          <Link
            to="/search"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {lang === 'ar' ? 'عرض الكل' : 'View All'}
            <Arrow className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 sm:px-6 snap-x">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[160px] rounded-2xl bg-card border border-border/40 p-3 animate-pulse">
                <div className="w-full aspect-square rounded-xl bg-muted mb-3" />
                <div className="h-4 w-3/4 bg-muted rounded mb-2" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            ))
          : popular.map((m) => {
              const branch = branches?.find((b) => b.merchant_id === m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => navigate(`/merchant/${m.id}`)}
                  className="min-w-[160px] max-w-[160px] rounded-2xl bg-card border border-border/40 p-3 text-start snap-start transition-all hover:shadow-ya-sm hover:-translate-y-0.5"
                >
                  <div className="w-full aspect-square rounded-xl bg-muted mb-3 overflow-hidden">
                    {m.logo_url && (
                      <img src={m.logo_url} alt={m.business_name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {lang === 'ar' ? (m.business_name_ar || m.business_name) : m.business_name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {lang === 'ar'
                      ? branch?.address_text_ar || 'خدمة'
                      : branch?.address_text || 'Service'}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/create-order?merchant=${m.id}`);
                    }}
                    className="mt-3 w-full text-xs font-bold bg-primary text-primary-foreground py-1.5 rounded-full hover:brightness-95 transition-all"
                  >
                    {lang === 'ar' ? 'اطلب' : 'Order'}
                  </button>
                </button>
              );
            })}
        {!isLoading && popular.length === 0 && (
          <div className="w-full text-center py-8 text-muted-foreground text-sm">
            {lang === 'ar' ? 'لا توجد خيارات حالياً' : 'No options yet'}
          </div>
        )}
      </div>
    </section>
  );
}
