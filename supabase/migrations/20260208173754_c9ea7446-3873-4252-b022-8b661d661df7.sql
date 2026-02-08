-- Create storage bucket for merchant and product images
INSERT INTO storage.buckets (id, name, public) VALUES ('merchant-images', 'merchant-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Allow public read access to merchant images
CREATE POLICY "Public can view merchant images"
ON storage.objects FOR SELECT
USING (bucket_id = 'merchant-images');

-- Allow public read access to product images  
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated users to upload to merchant images (for merchants)
CREATE POLICY "Authenticated can upload merchant images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'merchant-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to upload to product images
CREATE POLICY "Authenticated can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- Update merchants with sample cover/logo URLs (using placeholder images)
UPDATE merchants SET 
  logo_url = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop',
  cover_url = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop'
WHERE business_name = 'Al-Haramain Fabrics';

UPDATE merchants SET 
  logo_url = 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=200&fit=crop',
  cover_url = 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&h=400&fit=crop'
WHERE business_name = 'Riyadh Couture';

UPDATE merchants SET 
  logo_url = 'https://images.unsplash.com/photo-1559563458-527698bf5295?w=200&h=200&fit=crop',
  cover_url = 'https://images.unsplash.com/photo-1517705008128-361805f42e86?w=800&h=400&fit=crop'
WHERE business_name = 'Quick Errands';

-- Add sample catalog items with photos
INSERT INTO catalog_items (merchant_id, name, name_ar, description, description_ar, item_type, price_type, price_fixed, photos, active)
SELECT 
  id,
  'Premium Silk Fabric',
  'قماش حرير فاخر',
  'High quality imported silk fabric, perfect for special occasions',
  'قماش حرير مستورد عالي الجودة، مثالي للمناسبات الخاصة',
  'product',
  'fixed',
  150,
  '["https://images.unsplash.com/photo-1558171813-4c088753af8f?w=400&h=400&fit=crop"]'::jsonb,
  true
FROM merchants WHERE business_name = 'Al-Haramain Fabrics';

INSERT INTO catalog_items (merchant_id, name, name_ar, description, description_ar, item_type, price_type, price_min, price_max, photos, active)
SELECT 
  id,
  'Cotton Collection',
  'مجموعة قطن',
  'Various cotton fabrics in different colors and patterns',
  'أقمشة قطنية متنوعة بألوان وأنماط مختلفة',
  'product',
  'range',
  50,
  200,
  '["https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=400&fit=crop", "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&h=400&fit=crop"]'::jsonb,
  true
FROM merchants WHERE business_name = 'Al-Haramain Fabrics';

INSERT INTO catalog_items (merchant_id, name, name_ar, description, description_ar, item_type, price_type, price_fixed, photos, active)
SELECT 
  id,
  'Custom Tailoring Service',
  'خدمة تفصيل مخصصة',
  'Professional custom tailoring for all occasions',
  'خدمة تفصيل احترافية لجميع المناسبات',
  'service',
  'range',
  500,
  '["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop"]'::jsonb,
  true
FROM merchants WHERE business_name = 'Riyadh Couture';