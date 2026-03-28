
CREATE OR REPLACE FUNCTION public.quick_sell_card(card_id uuid, sell_price integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_card user_cards%ROWTYPE;
BEGIN
  SELECT * INTO v_card FROM user_cards WHERE id = card_id AND user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Card not found');
  END IF;

  IF v_card.is_listed THEN
    RETURN jsonb_build_object('success', false, 'error', 'Card is listed on market');
  END IF;

  IF NOT v_card.is_tradeable THEN
    RETURN jsonb_build_object('success', false, 'error', 'Card is not tradeable');
  END IF;

  DELETE FROM user_cards WHERE id = card_id;
  UPDATE profiles SET credits = credits + sell_price WHERE user_id = auth.uid();

  RETURN jsonb_build_object('success', true, 'credits_earned', sell_price);
END;
$$;
