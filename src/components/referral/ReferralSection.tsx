import { useLang } from '@/contexts/LangContext';
import { useReferrals } from '@/hooks/useReferrals';
import { Copy, Share2, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ReferralSection() {
  const { lang } = useLang();
  const { referral, shareViaWhatsApp, shareGeneral, copyCode } = useReferrals();
  const [copied, setCopied] = useState(false);

  if (!referral) return null;

  const handleCopy = async () => {
    await copyCode();
    setCopied(true);
    toast.success(lang === 'ar' ? 'تم نسخ الكود' : 'Code copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="space-y-3">
      <h3 className="font-bold text-sm flex items-center gap-2">
        <Share2 className="h-4 w-4 text-primary" />
        {lang === 'ar' ? 'ادعُ صديق واحصل على رصيد' : 'Invite & Earn'}
      </h3>

      {/* Code card */}
      <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 space-y-3">
        <p className="text-xs text-muted-foreground">
          {lang === 'ar' ? 'شارك كودك وخلّ أصدقائك يجربون YA' : 'Share your code with friends'}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-card border rounded-xl px-4 py-3 font-mono font-bold text-lg tracking-widest text-center">
            {referral.code}
          </div>
          <button onClick={handleCopy} className="p-3 rounded-xl border hover:bg-muted transition-colors">
            {copied ? <Check className="h-5 w-5 text-success" /> : <Copy className="h-5 w-5 text-muted-foreground" />}
          </button>
        </div>

        {/* Sharing buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={shareViaWhatsApp}
            className="py-2.5 rounded-xl bg-[hsl(142,76%,36%)] text-white text-sm font-bold flex items-center justify-center gap-2 hover:brightness-95 transition-all"
          >
            WhatsApp
          </button>
          <button
            onClick={shareGeneral}
            className="py-2.5 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 hover:bg-muted transition-all"
          >
            <Share2 className="h-4 w-4" />
            {lang === 'ar' ? 'مشاركة' : 'Share'}
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="text-center">
            <p className="text-lg font-bold">{referral.referredCount}</p>
            <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'دعوات' : 'Invites'}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-primary">{referral.earnedCredits} <span className="text-xs">{lang === 'ar' ? 'ر.س' : 'SAR'}</span></p>
            <p className="text-xs text-muted-foreground">{lang === 'ar' ? 'رصيد مكتسب' : 'Earned'}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
