
-- Fix 1: Restrict profiles SELECT to authenticated users only
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

-- Fix 2: Replace broad UPDATE policy with one that prevents credits modification
-- We use a WITH CHECK that ensures credits remain unchanged
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND credits = (SELECT p.credits FROM public.profiles p WHERE p.user_id = auth.uid()));
