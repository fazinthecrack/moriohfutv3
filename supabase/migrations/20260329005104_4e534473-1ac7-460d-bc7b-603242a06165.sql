
CREATE OR REPLACE FUNCTION public.admin_set_credits(target_user_id uuid, new_credits integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE profiles SET credits = new_credits WHERE user_id = target_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;
  RETURN jsonb_build_object('success', true, 'credits', new_credits);
END;
$$;
