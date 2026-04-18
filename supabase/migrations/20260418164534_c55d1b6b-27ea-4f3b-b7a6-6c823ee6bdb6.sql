
-- profiles: add new fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS member_since DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS interests TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS challenge TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS budget_kr INT NOT NULL DEFAULT 200,
  ADD COLUMN IF NOT EXISTS free_days_per_week INT NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS protected_days TEXT[] NOT NULL DEFAULT ARRAY['S']::TEXT[],
  ADD COLUMN IF NOT EXISTS activity_prefs TEXT[] NOT NULL DEFAULT ARRAY['Outdoor','Free / low cost']::TEXT[],
  ADD COLUMN IF NOT EXISTS calendar_provider TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS notifications_on BOOLEAN NOT NULL DEFAULT TRUE;

-- people: add email
ALTER TABLE public.people
  ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';

-- events
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_id UUID REFERENCES public.people(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TEXT NOT NULL DEFAULT '10:00',
  end_time TEXT NOT NULL DEFAULT '11:00',
  location TEXT DEFAULT '',
  cost_label TEXT DEFAULT 'Free',
  status TEXT NOT NULL DEFAULT 'confirmed',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own events" ON public.events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own events" ON public.events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own events" ON public.events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own events" ON public.events FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_events_user_date ON public.events(user_id, event_date);

-- chat_messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'me',
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own messages" ON public.chat_messages FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_chat_user_person ON public.chat_messages(user_id, person_id, created_at);
