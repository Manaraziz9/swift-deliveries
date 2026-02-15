import { useLang } from '@/contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

const easeOut = [0.25, 0.46, 0.45, 0.94] as const;

export default function HeroSection() {
  const { dir } = useLang();
  const navigate = useNavigate();



  return (
    <section className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-16 bg-background">
      {/* YA• */}
      <motion.div
        className="flex items-center gap-1"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: easeOut }}
      >
        <span className="text-[5.5rem] sm:text-[7rem] lg:text-[9rem] font-bold text-foreground tracking-tight font-en leading-none">
          YA
        </span>
        <motion.span
          className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 rounded-full bg-ya-highlight mt-3 sm:mt-4"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: [0, 1.4, 0.9, 1.15, 1] }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
        />
      </motion.div>

      {/* Taglines */}
      <motion.div
        className="text-center mt-8 sm:mt-10 space-y-2"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5, ease: easeOut }}
      >
        <p className="text-foreground text-xl sm:text-2xl lg:text-3xl font-bold font-ar">
          طلباتك أوامر
        </p>
        <p className="text-muted-foreground text-base sm:text-lg font-en tracking-wide">
          When you call, we act.
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        onClick={() => navigate('/search')}
        className="mt-8 sm:mt-10 w-full max-w-md mx-auto flex items-center gap-3 bg-card border border-border rounded-full px-5 py-3 cursor-pointer hover:border-primary/40 transition-colors"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.7, ease: easeOut }}
      >
        <Search className="w-5 h-5 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground text-sm sm:text-base font-ar">
          {dir === 'rtl' ? 'وش تبغى نخلّصه؟' : 'What do you need done?'}
        </span>
      </motion.div>

    </section>
  );
}
