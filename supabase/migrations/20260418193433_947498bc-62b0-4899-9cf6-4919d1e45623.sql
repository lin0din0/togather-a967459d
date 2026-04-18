-- 1. Add external sync columns to events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'app';

CREATE UNIQUE INDEX IF NOT EXISTS events_user_external_unique
  ON public.events (user_id, source, external_id)
  WHERE external_id IS NOT NULL;

-- 2. Event attendees (for RSVP collection)
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rsvp_status text NOT NULL DEFAULT 'pending',
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, person_id)
);

ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own event_attendees"
  ON public.event_attendees FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own event_attendees"
  ON public.event_attendees FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own event_attendees"
  ON public.event_attendees FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own event_attendees"
  ON public.event_attendees FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS event_attendees_event_idx ON public.event_attendees(event_id);
CREATE INDEX IF NOT EXISTS event_attendees_user_idx ON public.event_attendees(user_id);

-- 3. Group meeting proposals
CREATE TABLE IF NOT EXISTS public.group_meeting_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Group meetup',
  attendee_person_ids uuid[] NOT NULL DEFAULT '{}',
  date_range_start date NOT NULL,
  date_range_end date NOT NULL,
  suggested_slots jsonb NOT NULL DEFAULT '[]'::jsonb,
  rsvp_responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open',
  confirmed_event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.group_meeting_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own proposals"
  ON public.group_meeting_proposals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own proposals"
  ON public.group_meeting_proposals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own proposals"
  ON public.group_meeting_proposals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own proposals"
  ON public.group_meeting_proposals FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS group_meeting_proposals_updated_at ON public.group_meeting_proposals;
CREATE TRIGGER group_meeting_proposals_updated_at
  BEFORE UPDATE ON public.group_meeting_proposals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();