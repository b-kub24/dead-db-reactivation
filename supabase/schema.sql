-- ReActivate Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- Enable required extensions
create extension if not exists "pgcrypto";

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  business_name text,
  brand_voice text,
  default_market_area text,
  twilio_number text,
  phone text,
  created_at timestamptz default now()
);

-- Enable RLS on users
alter table public.users enable row level security;

create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- Contacts table
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  first_name text,
  last_name text,
  email text,
  phone text,
  last_contact_at date,
  source text,
  notes text,
  segment text,
  status text default 'pending' check (status in ('pending','active','replied','opted_out','reactivated','dead')),
  created_at timestamptz default now()
);

-- Enable RLS on contacts
alter table public.contacts enable row level security;

create policy "Users can view own contacts" on public.contacts
  for select using (auth.uid() = user_id);

create policy "Users can insert own contacts" on public.contacts
  for insert with check (auth.uid() = user_id);

create policy "Users can update own contacts" on public.contacts
  for update using (auth.uid() = user_id);

create policy "Users can delete own contacts" on public.contacts
  for delete using (auth.uid() = user_id);

-- Campaigns table
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  status text default 'draft' check (status in ('draft','active','paused','completed')),
  cadence jsonb default '[{"day":0,"channel":"sms"},{"day":7,"channel":"email"},{"day":21,"channel":"sms"},{"day":45,"channel":"email"}]'::jsonb,
  created_at timestamptz default now()
);

-- Enable RLS on campaigns
alter table public.campaigns enable row level security;

create policy "Users can view own campaigns" on public.campaigns
  for select using (auth.uid() = user_id);

create policy "Users can insert own campaigns" on public.campaigns
  for insert with check (auth.uid() = user_id);

create policy "Users can update own campaigns" on public.campaigns
  for update using (auth.uid() = user_id);

create policy "Users can delete own campaigns" on public.campaigns
  for delete using (auth.uid() = user_id);

-- Campaign contacts junction table
create table public.campaign_contacts (
  campaign_id uuid references public.campaigns(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  current_step int default 0,
  next_send_at timestamptz,
  paused boolean default false,
  primary key (campaign_id, contact_id)
);

-- Enable RLS on campaign_contacts
alter table public.campaign_contacts enable row level security;

create policy "Users can view own campaign_contacts" on public.campaign_contacts
  for select using (
    exists (
      select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()
    )
  );

create policy "Users can insert own campaign_contacts" on public.campaign_contacts
  for insert with check (
    exists (
      select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()
    )
  );

create policy "Users can update own campaign_contacts" on public.campaign_contacts
  for update using (
    exists (
      select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()
    )
  );

-- Touches table (message log)
create table public.touches (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.campaigns(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  step int,
  channel text check (channel in ('sms','email')),
  direction text check (direction in ('outbound','inbound')),
  body text,
  subject text,
  sent_at timestamptz default now()
);

-- Enable RLS on touches
alter table public.touches enable row level security;

create policy "Users can view own touches" on public.touches
  for select using (
    exists (
      select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()
    )
  );

create policy "Users can insert own touches" on public.touches
  for insert with check (
    exists (
      select 1 from public.campaigns c where c.id = campaign_id and c.user_id = auth.uid()
    )
  );

-- Indexes for performance
create index idx_contacts_user_id on public.contacts(user_id);
create index idx_contacts_segment on public.contacts(segment);
create index idx_contacts_status on public.contacts(status);
create index idx_campaigns_user_id on public.campaigns(user_id);
create index idx_campaigns_status on public.campaigns(status);
create index idx_campaign_contacts_next_send on public.campaign_contacts(next_send_at) where paused = false;
create index idx_touches_campaign_id on public.touches(campaign_id);
create index idx_touches_contact_id on public.touches(contact_id);
create index idx_contacts_phone on public.contacts(phone);

-- Function to auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auto-creating user profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
