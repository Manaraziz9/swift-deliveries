-- Chat messages table for order conversations
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL DEFAULT 'customer',
  message TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies: order owner and assigned executor can read/write
CREATE POLICY "Order participants can view messages"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = chat_messages.order_id AND orders.customer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM order_stages WHERE order_stages.order_id = chat_messages.order_id AND order_stages.assigned_executor_id = auth.uid()
    )
  );

CREATE POLICY "Order participants can send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      EXISTS (
        SELECT 1 FROM orders WHERE orders.id = chat_messages.order_id AND orders.customer_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM order_stages WHERE order_stages.order_id = chat_messages.order_id AND order_stages.assigned_executor_id = auth.uid()
      )
    )
  );

-- Index for fast lookup
CREATE INDEX idx_chat_messages_order_id ON public.chat_messages(order_id, created_at);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;