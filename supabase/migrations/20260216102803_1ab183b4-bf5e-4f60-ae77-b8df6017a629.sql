
-- Allow executors to view orders they're assigned to (via order_stages)
CREATE POLICY "Executors can view assigned orders"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.order_stages
    WHERE order_stages.order_id = orders.id
    AND order_stages.assigned_executor_id = auth.uid()
  )
);

-- Allow executors to update orders they're assigned to
CREATE POLICY "Executors can update assigned orders"
ON public.orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.order_stages
    WHERE order_stages.order_id = orders.id
    AND order_stages.assigned_executor_id = auth.uid()
  )
);

-- Allow executors to view stages assigned to them
CREATE POLICY "Executors can view assigned stages"
ON public.order_stages
FOR SELECT
USING (assigned_executor_id = auth.uid());

-- Allow executors to update stages assigned to them
CREATE POLICY "Executors can update assigned stages"
ON public.order_stages
FOR UPDATE
USING (assigned_executor_id = auth.uid());

-- Allow executors to view escrow for their assigned orders
CREATE POLICY "Executors can view assigned order escrow"
ON public.escrow_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.order_stages
    WHERE order_stages.order_id = escrow_transactions.order_id
    AND order_stages.assigned_executor_id = auth.uid()
  )
);

-- Allow executors to view order items for assigned orders
CREATE POLICY "Executors can view assigned order items"
ON public.order_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.order_stages
    WHERE order_stages.order_id = order_items.order_id
    AND order_stages.assigned_executor_id = auth.uid()
  )
);

-- Allow executors to send chat messages
CREATE POLICY "Executors can send messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.order_stages
    WHERE order_stages.order_id = chat_messages.order_id
    AND order_stages.assigned_executor_id = auth.uid()
  )
);

-- Allow executors to view chat messages
CREATE POLICY "Executors can view messages"
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.order_stages
    WHERE order_stages.order_id = chat_messages.order_id
    AND order_stages.assigned_executor_id = auth.uid()
  )
);
