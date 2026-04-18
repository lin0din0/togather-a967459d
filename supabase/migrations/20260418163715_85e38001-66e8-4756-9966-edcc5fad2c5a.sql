
-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Friend',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- People
CREATE TABLE public.people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relation TEXT NOT NULL DEFAULT 'Friend',
  connection_type TEXT NOT NULL DEFAULT 'Close family',
  goal TEXT DEFAULT '',
  example_idea TEXT DEFAULT '',
  cadence TEXT DEFAULT '1×/month',
  last_met TEXT DEFAULT '',
  status TEXT DEFAULT '',
  avatar_color TEXT NOT NULL DEFAULT '14 88% 62%',
  initials TEXT NOT NULL DEFAULT '?',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own people" ON public.people FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own people" ON public.people FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own people" ON public.people FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own people" ON public.people FOR DELETE USING (auth.uid() = user_id);

-- Schedule blocks
CREATE TABLE public.schedule_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_hour INT NOT NULL CHECK (start_hour BETWEEN 0 AND 23),
  end_hour INT NOT NULL CHECK (end_hour BETWEEN 1 AND 24),
  label TEXT NOT NULL DEFAULT 'Busy',
  kind TEXT NOT NULL DEFAULT 'personal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own blocks" ON public.schedule_blocks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own blocks" ON public.schedule_blocks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own blocks" ON public.schedule_blocks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own blocks" ON public.schedule_blocks FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
