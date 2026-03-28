
-- 1. Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Create RPC for opening premium packs (bypasses RLS credit restriction)
CREATE OR REPLACE FUNCTION public.open_premium_pack(cost integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  SELECT credits INTO v_credits FROM profiles WHERE user_id = auth.uid() FOR UPDATE;
  IF v_credits IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;
  IF v_credits < cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough credits');
  END IF;
  UPDATE profiles SET credits = credits - cost WHERE user_id = auth.uid();
  RETURN jsonb_build_object('success', true, 'new_credits', v_credits - cost);
END;
$$;

-- 3. Create RPC for updating marketplace listing price
CREATE OR REPLACE FUNCTION public.update_listing_price(listing_id uuid, new_price integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_listing marketplace_listings%ROWTYPE;
BEGIN
  SELECT * INTO v_listing FROM marketplace_listings WHERE id = listing_id AND status = 'active' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing not found');
  END IF;
  IF v_listing.seller_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not your listing');
  END IF;
  IF new_price <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid price');
  END IF;
  UPDATE marketplace_listings SET price = new_price WHERE id = listing_id;
  RETURN jsonb_build_object('success', true);
END;
$$;
