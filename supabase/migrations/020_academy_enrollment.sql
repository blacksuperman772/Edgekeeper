-- Academy enrollment fields on user_profiles
-- Tracks which product stream the user belongs to and their Academy track

alter table public.user_profiles
  add column if not exists academy_track        text    default null,
  add column if not exists academy_enrolled_at  timestamptz default null;

-- product_stream distinguishes mentorship users from academy-only users
-- Values: 'mentor' | 'academy' | null (legacy / not yet classified)
alter table public.user_profiles
  add column if not exists product_stream  text  default null;
