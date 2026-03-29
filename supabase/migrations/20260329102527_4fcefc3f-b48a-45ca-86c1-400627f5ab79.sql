
-- Game sessions for real-time 1v1
CREATE TABLE public.game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL,
  guest_id uuid,
  status text NOT NULL DEFAULT 'waiting',
  host_overall integer NOT NULL DEFAULT 0,
  guest_overall integer NOT NULL DEFAULT 0,
  round integer NOT NULL DEFAULT 0,
  host_tactics jsonb NOT NULL DEFAULT '[]'::jsonb,
  guest_tactics jsonb NOT NULL DEFAULT '[]'::jsonb,
  host_score integer NOT NULL DEFAULT 0,
  guest_score integer NOT NULL DEFAULT 0,
  winner_id uuid,
  credits_reward integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View game sessions" ON public.game_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Create game sessions" ON public.game_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Update game sessions" ON public.game_sessions FOR UPDATE TO authenticated USING (auth.uid() = host_id OR auth.uid() = guest_id);
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;

-- XP and evolution columns
ALTER TABLE public.user_cards ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0;
ALTER TABLE public.user_cards ADD COLUMN IF NOT EXISTS evolution_level integer NOT NULL DEFAULT 0;

-- Custom card pool for admin imports
CREATE TABLE public.custom_card_pool (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rarity text NOT NULL DEFAULT 'common',
  emoji text NOT NULL DEFAULT '⚔️',
  position text NOT NULL DEFAULT 'BU',
  overall integer NOT NULL DEFAULT 0,
  stats_rap integer NOT NULL DEFAULT 0,
  stats_tir integer NOT NULL DEFAULT 0,
  stats_pas integer NOT NULL DEFAULT 0,
  stats_dri integer NOT NULL DEFAULT 0,
  stats_def integer NOT NULL DEFAULT 0,
  stats_phy integer NOT NULL DEFAULT 0,
  image_url text,
  quick_sell_min integer NOT NULL DEFAULT 500,
  quick_sell_max integer NOT NULL DEFAULT 1000,
  free_odds integer NOT NULL DEFAULT 500,
  premium_odds integer NOT NULL DEFAULT 250,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_card_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view custom cards" ON public.custom_card_pool FOR SELECT USING (true);
CREATE POLICY "Auth can insert custom cards" ON public.custom_card_pool FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth can update custom cards" ON public.custom_card_pool FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth can delete custom cards" ON public.custom_card_pool FOR DELETE TO authenticated USING (true);

-- Join game RPC
CREATE OR REPLACE FUNCTION public.join_game(session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_session game_sessions%ROWTYPE;
  v_guest_overall integer;
  v_card_count integer;
BEGIN
  SELECT * INTO v_session FROM game_sessions WHERE id = session_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Session introuvable'); END IF;
  IF v_session.status != 'waiting' THEN RETURN jsonb_build_object('success', false, 'error', 'Match déjà en cours'); END IF;
  IF v_session.host_id = auth.uid() THEN RETURN jsonb_build_object('success', false, 'error', 'Tu ne peux pas rejoindre ton propre match'); END IF;
  SELECT COUNT(*) INTO v_card_count FROM user_cards WHERE user_id = auth.uid() AND is_listed = false;
  IF v_card_count < 11 THEN RETURN jsonb_build_object('success', false, 'error', 'Il te faut au moins 11 cartes'); END IF;
  SELECT ROUND(AVG(sub.overall))::integer INTO v_guest_overall
  FROM (SELECT overall FROM user_cards WHERE user_id = auth.uid() AND is_listed = false ORDER BY overall DESC LIMIT 11) sub;
  UPDATE game_sessions SET guest_id = auth.uid(), guest_overall = COALESCE(v_guest_overall, 0), status = 'playing', round = 1 WHERE id = session_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Submit tactic RPC
CREATE OR REPLACE FUNCTION public.submit_tactic(session_id uuid, tactic text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_s game_sessions%ROWTYPE;
  v_is_host boolean;
  v_ht jsonb; v_gt jsonb;
  v_rc boolean;
  v_ha integer; v_ga integer;
  v_hs integer; v_gs integer;
  v_nr integer; v_ns text;
  v_w uuid; v_r integer;
  v_ht_cur text; v_gt_cur text;
BEGIN
  IF tactic NOT IN ('attaque', 'equilibre', 'defense') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tactique invalide');
  END IF;
  SELECT * INTO v_s FROM game_sessions WHERE id = session_id FOR UPDATE;
  IF NOT FOUND OR v_s.status != 'playing' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session invalide');
  END IF;
  v_is_host := (auth.uid() = v_s.host_id);
  IF NOT v_is_host AND auth.uid() != v_s.guest_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pas dans cette session');
  END IF;
  IF v_is_host AND jsonb_array_length(v_s.host_tactics) >= v_s.round THEN
    RETURN jsonb_build_object('success', false, 'error', 'Déjà soumis');
  END IF;
  IF NOT v_is_host AND jsonb_array_length(v_s.guest_tactics) >= v_s.round THEN
    RETURN jsonb_build_object('success', false, 'error', 'Déjà soumis');
  END IF;
  IF v_is_host THEN
    v_ht := v_s.host_tactics || jsonb_build_array(tactic);
    v_gt := v_s.guest_tactics;
  ELSE
    v_ht := v_s.host_tactics;
    v_gt := v_s.guest_tactics || jsonb_build_array(tactic);
  END IF;
  v_rc := (jsonb_array_length(v_ht) >= v_s.round AND jsonb_array_length(v_gt) >= v_s.round);
  v_hs := v_s.host_score; v_gs := v_s.guest_score;
  v_nr := v_s.round; v_ns := v_s.status; v_w := NULL; v_r := 0;
  IF v_rc THEN
    v_ha := v_s.host_overall; v_ga := v_s.guest_overall;
    v_ht_cur := v_ht->>(v_s.round - 1);
    v_gt_cur := v_gt->>(v_s.round - 1);
    IF (v_ht_cur = 'attaque' AND v_gt_cur = 'defense') OR (v_ht_cur = 'defense' AND v_gt_cur = 'equilibre') OR (v_ht_cur = 'equilibre' AND v_gt_cur = 'attaque') THEN
      v_ha := v_ha + 3;
    ELSIF (v_gt_cur = 'attaque' AND v_ht_cur = 'defense') OR (v_gt_cur = 'defense' AND v_ht_cur = 'equilibre') OR (v_gt_cur = 'equilibre' AND v_ht_cur = 'attaque') THEN
      v_ga := v_ga + 3;
    END IF;
    v_ha := v_ha + floor(random() * 5)::integer - 2;
    v_ga := v_ga + floor(random() * 5)::integer - 2;
    IF v_ha >= v_ga THEN v_hs := v_hs + 1; ELSE v_gs := v_gs + 1; END IF;
    IF v_hs >= 2 OR v_gs >= 2 OR v_nr >= 3 THEN
      v_ns := 'finished'; v_r := 2000;
      IF v_hs > v_gs THEN v_w := v_s.host_id;
      ELSIF v_gs > v_hs THEN v_w := v_s.guest_id; END IF;
      IF v_w IS NOT NULL THEN
        UPDATE profiles SET credits = credits + 2000 WHERE user_id = v_w;
        UPDATE profiles SET credits = credits + 500 WHERE user_id = CASE WHEN v_w = v_s.host_id THEN v_s.guest_id ELSE v_s.host_id END;
      ELSE
        UPDATE profiles SET credits = credits + 1000 WHERE user_id IN (v_s.host_id, v_s.guest_id);
      END IF;
      UPDATE user_cards SET xp = xp + 10 WHERE id IN (SELECT id FROM user_cards WHERE user_id = v_s.host_id AND is_listed = false ORDER BY overall DESC LIMIT 11);
      UPDATE user_cards SET xp = xp + 10 WHERE id IN (SELECT id FROM user_cards WHERE user_id = v_s.guest_id AND is_listed = false ORDER BY overall DESC LIMIT 11);
    ELSE
      v_nr := v_nr + 1;
    END IF;
  END IF;
  UPDATE game_sessions SET host_tactics = v_ht, guest_tactics = v_gt, host_score = v_hs, guest_score = v_gs, round = v_nr, status = v_ns, winner_id = v_w, credits_reward = v_r WHERE id = session_id;
  RETURN jsonb_build_object('success', true, 'round_complete', v_rc, 'status', v_ns, 'host_score', v_hs, 'guest_score', v_gs);
END;
$$;

-- Evolve card RPC
CREATE OR REPLACE FUNCTION public.evolve_card(card_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_card user_cards%ROWTYPE;
  v_needed integer;
BEGIN
  SELECT * INTO v_card FROM user_cards WHERE id = card_id AND user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'Carte non trouvée'); END IF;
  CASE v_card.evolution_level
    WHEN 0 THEN v_needed := 50;
    WHEN 1 THEN v_needed := 150;
    WHEN 2 THEN v_needed := 300;
    ELSE RETURN jsonb_build_object('success', false, 'error', 'Niveau max atteint');
  END CASE;
  IF v_card.xp < v_needed THEN
    RETURN jsonb_build_object('success', false, 'error', 'XP insuffisant (' || v_card.xp || '/' || v_needed || ')');
  END IF;
  UPDATE user_cards SET
    evolution_level = evolution_level + 1,
    overall = overall + 1,
    stat_rap = stat_rap + 1, stat_tir = stat_tir + 1, stat_pas = stat_pas + 1,
    stat_dri = stat_dri + 1, stat_def = stat_def + 1, stat_phy = stat_phy + 1
  WHERE id = card_id;
  RETURN jsonb_build_object('success', true, 'new_level', v_card.evolution_level + 1);
END;
$$;
