-- إضافة سياسة INSERT لجدول order_stages للسماح للعميل بإنشاء مراحل طلبه
CREATE POLICY "Stages insertable by order owner"
ON public.order_stages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_stages.order_id
    AND orders.customer_id = auth.uid()
  )
);

-- إضافة سياسة UPDATE لجدول order_stages
CREATE POLICY "Stages updatable by order owner"
ON public.order_stages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_stages.order_id
    AND orders.customer_id = auth.uid()
  )
);