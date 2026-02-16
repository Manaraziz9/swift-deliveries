import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type OrderItemInsert = Database['public']['Tables']['order_items']['Insert'];

interface CreateOrderData {
  order: Omit<OrderInsert, 'customer_id'>;
  items: Omit<OrderItemInsert, 'order_id'>[];
}

export function useOrders() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*), order_stages(*)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ order, items }: CreateOrderData) => {
      if (!user) throw new Error('User not authenticated');

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          ...order,
          customer_id: user.id,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      if (items.length > 0) {
        const orderItems = items.map(item => ({
          ...item,
          order_id: orderData.id,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      // Create order stages based on order type
      const stages = [];
      
      if (order.order_type === 'PURCHASE_DELIVER' || order.order_type === 'CHAIN') {
        stages.push({
          order_id: orderData.id,
          stage_type: 'purchase' as const,
          sequence_no: 1,
          status: 'pending' as const,
          lat: order.pickup_lat,
          lng: order.pickup_lng,
          address_text: order.pickup_address,
        });
      }

      stages.push({
        order_id: orderData.id,
        stage_type: 'dropoff' as const,
        sequence_no: stages.length + 1,
        status: 'pending' as const,
        lat: order.dropoff_lat,
        lng: order.dropoff_lng,
        address_text: order.dropoff_address,
      });

      if (stages.length > 0) {
        const { error: stagesError } = await supabase
          .from('order_stages')
          .insert(stages);

        if (stagesError) throw stagesError;
      }

      // Create escrow hold for the total amount
      const totals = order.totals_json as any;
      if (totals?.total && order.status !== 'draft') {
        await supabase.from('escrow_transactions').insert({
          order_id: orderData.id,
          transaction_type: 'hold',
          amount: totals.total,
          currency: order.currency || 'SAR',
          status: 'completed',
          completed_at: new Date().toISOString(),
          notes: 'Initial escrow hold on payment',
        });
        await supabase.from('orders').update({ escrow_status: 'held' }).eq('id', orderData.id);
      }

      return orderData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
