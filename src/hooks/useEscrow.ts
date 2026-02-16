import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface EscrowTransaction {
  id: string;
  order_id: string;
  stage_id: string | null;
  transaction_type: string;
  amount: number;
  currency: string;
  status: string;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
}

export function useEscrow(orderId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: transactions = [], ...query } = useQuery({
    queryKey: ['escrow', orderId],
    enabled: !!user && !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as EscrowTransaction[];
    },
  });

  const holdFunds = useMutation({
    mutationFn: async ({ amount, currency = 'SAR' }: { amount: number; currency?: string }) => {
      const { data, error } = await supabase
        .from('escrow_transactions')
        .insert({
          order_id: orderId,
          transaction_type: 'hold',
          amount,
          currency,
          status: 'completed',
          completed_at: new Date().toISOString(),
          notes: 'Initial escrow hold',
        })
        .select()
        .single();
      if (error) throw error;

      // Update order escrow status
      await supabase.from('orders').update({ escrow_status: 'held' }).eq('id', orderId);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['escrow', orderId] }),
  });

  const releaseFunds = useMutation({
    mutationFn: async ({ stageId, amount }: { stageId: string; amount: number }) => {
      const { data, error } = await supabase
        .from('escrow_transactions')
        .insert({
          order_id: orderId,
          stage_id: stageId,
          transaction_type: 'release',
          amount,
          status: 'completed',
          completed_at: new Date().toISOString(),
          notes: 'Stage completion release',
        })
        .select()
        .single();
      if (error) throw error;

      // Check if all funds released
      const { data: allTx } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('order_id', orderId);

      const held = (allTx || []).filter(t => t.transaction_type === 'hold').reduce((s, t) => s + Number(t.amount), 0);
      const released = (allTx || []).filter(t => t.transaction_type === 'release').reduce((s, t) => s + Number(t.amount), 0);

      if (released >= held) {
        await supabase.from('orders').update({ escrow_status: 'released' }).eq('id', orderId);
      } else {
        await supabase.from('orders').update({ escrow_status: 'partial' }).eq('id', orderId);
      }

      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['escrow', orderId] }),
  });

  // Calculate summary
  const totalHeld = transactions.filter(t => t.transaction_type === 'hold').reduce((s, t) => s + Number(t.amount), 0);
  const totalReleased = transactions.filter(t => t.transaction_type === 'release').reduce((s, t) => s + Number(t.amount), 0);
  const totalRefunded = transactions.filter(t => t.transaction_type === 'refund').reduce((s, t) => s + Number(t.amount), 0);
  const remaining = totalHeld - totalReleased - totalRefunded;

  return {
    transactions,
    totalHeld,
    totalReleased,
    totalRefunded,
    remaining,
    holdFunds,
    releaseFunds,
    ...query,
  };
}
