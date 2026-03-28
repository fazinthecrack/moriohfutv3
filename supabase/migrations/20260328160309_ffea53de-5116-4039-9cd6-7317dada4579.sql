CREATE TABLE public.user_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  team_name text NOT NULL DEFAULT 'Mon Équipe',
  logo_url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own team" ON public.user_teams FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own team" ON public.user_teams FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own team" ON public.user_teams FOR UPDATE TO authenticated USING (auth.uid() = user_id);