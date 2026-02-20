
-- Create a SECURITY DEFINER function to check if a user is assigned as executor on an order
-- This avoids infinite recursion between orders and order_stages RLS policies
CREATE OR REPLACE FUNCTION public.is_executor_of_order(_order_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.order_stages
    WHERE order_id = _order_id AND assigned_executor_id = auth.uid()
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_executor_of_order FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_executor_of_order TO authenticated;

-- Drop the problematic policies on orders
DROP POLICY IF EXISTS "Executors can view assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Executors can update assigned orders" ON public.orders;

-- Recreate them using the SECURITY DEFINER function
CREATE POLICY "Executors can view assigned orders"
ON public.orders
FOR SELECT
TO authenticated
USING (public.is_executor_of_order(id));

CREATE POLICY "Executors can update assigned orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (public.is_executor_of_order(id));
