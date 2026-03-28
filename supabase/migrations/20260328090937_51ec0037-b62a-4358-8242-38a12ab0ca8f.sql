
-- Create update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  credits INTEGER NOT NULL DEFAULT 500,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User cards (inventory)
CREATE TABLE public.user_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  emoji TEXT NOT NULL DEFAULT '⚔️',
  image_url TEXT,
  stat_atk INTEGER NOT NULL DEFAULT 0,
  stat_def INTEGER NOT NULL DEFAULT 0,
  stat_vit INTEGER NOT NULL DEFAULT 0,
  stat_int INTEGER NOT NULL DEFAULT 0,
  is_listed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all cards" ON public.user_cards FOR SELECT USING (true);
CREATE POLICY "Users can insert own cards" ON public.user_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cards" ON public.user_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cards" ON public.user_cards FOR DELETE USING (auth.uid() = user_id);

-- Pack opening tracking
CREATE TABLE public.pack_opens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pack_opens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pack opens" ON public.pack_opens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pack opens" ON public.pack_opens FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Marketplace listings
CREATE TABLE public.marketplace_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.user_cards(id) ON DELETE CASCADE,
  price INTEGER NOT NULL CHECK (price > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
  buyer_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sold_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active listings" ON public.marketplace_listings FOR SELECT USING (true);
CREATE POLICY "Sellers can create listings" ON public.marketplace_listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own listings" ON public.marketplace_listings FOR UPDATE USING (auth.uid() = seller_id);

-- Buy card function (atomic transaction)
CREATE OR REPLACE FUNCTION public.buy_card(listing_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_listing marketplace_listings%ROWTYPE;
  v_buyer_credits INTEGER;
BEGIN
  SELECT * INTO v_listing FROM marketplace_listings WHERE id = listing_id AND status = 'active' FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Listing not found or already sold');
  END IF;

  IF v_listing.seller_id = auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot buy your own card');
  END IF;

  SELECT credits INTO v_buyer_credits FROM profiles WHERE user_id = auth.uid() FOR UPDATE;
  IF v_buyer_credits < v_listing.price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough credits');
  END IF;

  UPDATE profiles SET credits = credits - v_listing.price WHERE user_id = auth.uid();
  UPDATE profiles SET credits = credits + v_listing.price WHERE user_id = v_listing.seller_id;
  UPDATE user_cards SET user_id = auth.uid(), is_listed = false WHERE id = v_listing.card_id;
  UPDATE marketplace_listings SET status = 'sold', buyer_id = auth.uid(), sold_at = now() WHERE id = listing_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Playlist songs
CREATE TABLE public.playlist_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('spotify', 'youtube')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view songs" ON public.playlist_songs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add songs" ON public.playlist_songs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own songs" ON public.playlist_songs FOR DELETE USING (auth.uid() = user_id);
