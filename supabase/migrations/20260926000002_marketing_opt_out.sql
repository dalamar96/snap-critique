-- Marketing/reminder email opt-out. Set when a user clicks the unsubscribe link
-- in a reminder email; the admin Maintenance tools never email opted-out users.
-- Idempotent. NOT applied automatically.
alter table public.profiles
  add column if not exists marketing_opt_out boolean not null default false,
  add column if not exists marketing_opt_out_at timestamptz;
