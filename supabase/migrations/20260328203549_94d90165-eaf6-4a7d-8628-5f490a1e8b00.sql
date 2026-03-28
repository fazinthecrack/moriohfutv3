
-- Division system for 1v1
CREATE TABLE public.user_divisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  division integer NOT NULL DEFAULT 10,
  points integer NOT NULL DEFAULT 0,
  wins integer NOT NULL DEFAULT 0,
  losses integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_divisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all divisions" ON public.user_divisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own division" ON public.user_divisions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own division" ON public.user_divisions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Match history
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL,
  opponent_id uuid NOT NULL,
  player_overall integer NOT NULL DEFAULT 0,
  opponent_overall integer NOT NULL DEFAULT 0,
  player_won boolean NOT NULL,
  credits_earned integer NOT NULL DEFAULT 0,
  points_change integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matches" ON public.matches FOR SELECT TO authenticated USING (auth.uid() = player_id);
CREATE POLICY "Users can insert own matches" ON public.matches FOR INSERT TO authenticated WITH CHECK (auth.uid() = player_id);

-- Trigger for updated_at on user_divisions
CREATE TRIGGER update_user_divisions_updated_at
  BEFORE UPDATE ON public.user_divisions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
