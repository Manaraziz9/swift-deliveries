import { useState } from 'react';
import { useLang } from '@/contexts/LangContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, X, ShoppingBag, Truck, Wrench, Mic } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const shortcuts = [
  { code: 'BUY', icon: ShoppingBag, labelAr: 'اشترِ لي', labelEn: 'Buy', color: 'bg-orange-500' },
  { code: 'TASK', icon: Truck, labelAr: 'وصّل', labelEn: 'Deliver', color: 'bg-blue-500' },
  { code: 'COORDINATE', icon: Wrench, labelAr: 'مهمة', labelEn: 'Task', color: 'bg-emerald-500' },
];

export default function QuickOrderFAB() {
  const [open, setOpen] = useState(false);
  const { lang } = useLang();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleAction = (code: string) => {
    setOpen(false);
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate(`/create-order?intent=${code}`);
  };

  return (
    <div className="fixed bottom-24 end-4 z-50 flex flex-col items-end gap-2">
      {/* Expanded shortcuts */}
      <AnimatePresence>
        {open && shortcuts.map(({ code, icon: Icon, labelAr, labelEn, color }, i) => (
          <motion.button
            key={code}
            onClick={() => handleAction(code)}
            className="flex items-center gap-2 pe-4 ps-2 py-2 rounded-full bg-card border border-border shadow-xl"
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.2, delay: (shortcuts.length - 1 - i) * 0.05 }}
          >
            <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white", color)}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-foreground whitespace-nowrap">
              {lang === 'ar' ? labelAr : labelEn}
            </span>
          </motion.button>
        ))}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shadow-2xl",
          "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
          "hover:shadow-primary/30 hover:shadow-xl transition-shadow duration-300"
        )}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </motion.button>
    </div>
  );
}
