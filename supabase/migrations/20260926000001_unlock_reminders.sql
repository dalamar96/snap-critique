-- Tracks when a user was last sent an "unlock your critique" reminder from the
-- admin Maintenance panel, so the same person isn't emailed repeatedly.
-- Idempotent. NOT applied automatically.
alter table public.profiles
  add column if not exists last_unlock_reminder_at timestamptz;
