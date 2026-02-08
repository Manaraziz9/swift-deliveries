
-- Enums
CREATE TYPE public.order_type AS ENUM ('DIRECT', 'PURCHASE_DELIVER', 'CHAIN');
CREATE TYPE public.order_status AS ENUM ('draft', 'payment_pending', 'paid', 'in_progress', 'completed', 'canceled');
CREATE TYPE public.stage_type AS ENUM ('pickup', 'purchase', 'dropoff', 'handover', 'onsite');
CREATE TYPE public.stage_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'failed');
CREATE TYPE public.substitution_policy AS ENUM ('NONE', 'SAME_CATEGORY', 'WITHIN_PRICE', 'CUSTOM_RULES');
CREATE TYPE public.dispute_type AS ENUM ('LATE', 'WRONG_ITEM', 'DAMAGED', 'NO_SHOW', 'FRAUD', 'OTHER');
CREATE TYPE public.dispute_status AS ENUM ('open', 'in_review', 'resolved', 'rejected');
CREATE TYPE public.app_role AS ENUM ('admin', 'customer', 'executor', 'merchant_admin');

-- Users profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role app_role NOT NULL DEFAULT 'customer',
  name TEXT,
  phone TEXT,
  language TEXT DEFAULT 'ar',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public profiles readable" ON public.profiles FOR SELECT USING (true);

-- Merchants
CREATE TABLE public.merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  business_name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  logo_url TEXT,
  cover_url TEXT,
  verification_status TEXT DEFAULT 'pending',
  tags JSONB DEFAULT '[]',
  domain_id TEXT,
  category_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchants publicly readable" ON public.merchants FOR SELECT USING (true);
CREATE POLICY "Owner can update merchant" ON public.merchants FOR UPDATE USING (auth.uid() = owner_user_id);

-- Branches
CREATE TABLE public.merchant_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE NOT NULL,
  branch_name TEXT,
  address_text TEXT,
  address_text_ar TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  hours_json JSONB DEFAULT '{}',
  phone TEXT,
  open_now BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.merchant_branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Branches publicly readable" ON public.merchant_branches FOR SELECT USING (true);

-- Catalog Items
CREATE TABLE public.catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE NOT NULL,
  branch_id UUID REFERENCES public.merchant_branches(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL DEFAULT 'product',
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  description_ar TEXT,
  price_type TEXT DEFAULT 'fixed',
  price_fixed NUMERIC,
  price_min NUMERIC,
  price_max NUMERIC,
  photos JSONB DEFAULT '[]',
  attributes_json JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Catalog publicly readable" ON public.catalog_items FOR SELECT USING (true);

-- Quality scores
CREATE TABLE public.quality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  composite_score NUMERIC DEFAULT 0,
  internal_avg NUMERIC DEFAULT 0,
  internal_count INTEGER DEFAULT 0,
  external_rating NUMERIC,
  external_review_count INTEGER,
  external_source TEXT,
  external_fetched_at TIMESTAMPTZ,
  components_json JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);
ALTER TABLE public.quality_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Quality scores publicly readable" ON public.quality_scores FOR SELECT USING (true);

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_type order_type NOT NULL DEFAULT 'DIRECT',
  domain_id TEXT,
  category_id TEXT,
  status order_status NOT NULL DEFAULT 'draft',
  source_merchant_id UUID REFERENCES public.merchants(id),
  source_branch_id UUID REFERENCES public.merchant_branches(id),
  pickup_address TEXT,
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  dropoff_address TEXT,
  dropoff_lat DOUBLE PRECISION,
  dropoff_lng DOUBLE PRECISION,
  recipient_name TEXT,
  recipient_phone TEXT,
  purchase_price_cap NUMERIC,
  substitution_policy substitution_policy DEFAULT 'NONE',
  notes TEXT,
  totals_json JSONB DEFAULT '{}',
  currency TEXT DEFAULT 'SAR',
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers view own orders" ON public.orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customers create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customers update own orders" ON public.orders FOR UPDATE USING (auth.uid() = customer_id);

-- Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  item_mode TEXT DEFAULT 'free_text',
  catalog_item_id UUID REFERENCES public.catalog_items(id),
  free_text_description TEXT,
  quantity INTEGER DEFAULT 1,
  unit TEXT,
  photo_urls JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Order items viewable by order owner" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
);
CREATE POLICY "Order items insertable by order owner" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
);

-- Order stages
CREATE TABLE public.order_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  stage_type stage_type NOT NULL,
  sequence_no INTEGER NOT NULL DEFAULT 1,
  status stage_status NOT NULL DEFAULT 'pending',
  assigned_executor_id UUID REFERENCES auth.users(id),
  address_text TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  policy_json JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stages viewable by order owner" ON public.order_stages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_stages.order_id AND orders.customer_id = auth.uid())
);

-- Internal ratings
CREATE TABLE public.internal_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  rater_id UUID REFERENCES auth.users(id) NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  scores_json JSONB NOT NULL DEFAULT '{}',
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.internal_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ratings publicly readable" ON public.internal_ratings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can rate" ON public.internal_ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- Domains/Categories taxonomy
CREATE TABLE public.taxonomy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  parent_code TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true
);
ALTER TABLE public.taxonomy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Taxonomy publicly readable" ON public.taxonomy FOR SELECT USING (true);

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON public.merchants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_quality_scores_updated_at BEFORE UPDATE ON public.quality_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
