import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useProviderOrders() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['provider-orders', user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Get all stages assigned to this executor
      const { data: stages, error: stagesError } = await supabase
        .from('order_stages')
        .select('order_id')
        .eq('assigned_executor_id', user!.id);

      if (stagesError) throw stagesError;
      if (!stages?.length) return [];

      const orderIds = [...new Set(stages.map(s => s.order_id))];

      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*), order_stages(*)')
        .in('id', orderIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useUpdateStageStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stageId, status }: { stageId: string; status: string }) => {
      const updates: any = { status };
      if (status === 'in_progress') updates.started_at = new Date().toISOString();
      if (status === 'completed') updates.completed_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('order_stages')
        .update(updates)
        .eq('id', stageId)
        .select()
        .single();

      if (error) throw error;

      // If stage completed, check if all stages done → update order status
      if (status === 'completed' && data) {
        const { data: allStages } = await supabase
          .from('order_stages')
          .select('status')
          .eq('order_id', data.order_id);

        const allDone = allStages?.every(s => s.status === 'completed');
        if (allDone) {
          await supabase.from('orders').update({ status: 'completed' }).eq('id', data.order_id);
        } else {
          await supabase.from('orders').update({ status: 'in_progress' }).eq('id', data.order_id);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-orders'] });
    },
  });
}
