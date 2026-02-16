
-- Escrow transactions table for step-by-step fund management
CREATE TABLE public.escrow_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id),
  stage_id UUID REFERENCES public.order_stages(id),
  transaction_type TEXT NOT NULL DEFAULT 'hold', -- hold, release, refund
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'SAR',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order owner can view escrow" ON public.escrow_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = escrow_transactions.order_id AND orders.customer_id = auth.uid())
  );

CREATE POLICY "Order owner can create escrow" ON public.escrow_transactions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = escrow_transactions.order_id AND orders.customer_id = auth.uid())
  );

-- Add escrow_status to orders for quick reference
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS escrow_status TEXT DEFAULT 'none';

-- Enable realtime for escrow updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.escrow_transactions;
