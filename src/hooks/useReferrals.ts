import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Referral {
  code: string;
  referredCount: number;
  earnedCredits: number;
}

export function useReferrals() {
  const { user } = useAuth();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [loading, setLoading] = useState(true);

  // Generate a deterministic referral code from user id
  const generateCode = useCallback((userId: string) => {
    return 'YA' + userId.slice(0, 6).toUpperCase();
  }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    // For MVP, code is derived from user ID — no extra table needed
    setReferral({
      code: generateCode(user.id),
      referredCount: 0,
      earnedCredits: 0,
    });
    setLoading(false);
  }, [user, generateCode]);

  const shareViaWhatsApp = useCallback(() => {
    if (!referral) return;
    const message = encodeURIComponent(
      `جرّب تطبيق YA! استخدم كود الدعوة: ${referral.code}\nحمّل التطبيق الآن 👇\nhttps://ya.app/invite/${referral.code}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  }, [referral]);

  const shareGeneral = useCallback(async () => {
    if (!referral) return;
    const shareData = {
      title: 'YA — طلباتك أوامر',
      text: `جرّب YA! كود الدعوة: ${referral.code}`,
      url: `https://ya.app/invite/${referral.code}`,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
    }
  }, [referral]);

  const copyCode = useCallback(async () => {
    if (!referral) return;
    await navigator.clipboard.writeText(referral.code);
  }, [referral]);

  return { referral, loading, shareViaWhatsApp, shareGeneral, copyCode };
}
