-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  role text,
  tax_rate numeric check (tax_rate >= 0 and tax_rate <= 100),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- USAGE QUOTAS
create table if not exists public.usage_quotas (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  ai_scans_used int default 0 not null,
  ai_scans_limit int default 30 not null,
  reset_date timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.usage_quotas enable row level security;
create policy "Users can view own quotas" on usage_quotas for select using (auth.uid() = user_id);

-- Trigger to create profile on sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  -- Insert default usage quota
  insert into public.usage_quotas (user_id, ai_scans_limit, reset_date)
  values (new.id, 30, now() + interval '1 month');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it exists to be safe
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- SUBSCRIPTIONS
create table if not exists public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  tier text default 'free',
  current_period_end timestamptz,
  created_at timestamptz default now() not null
);

alter table public.subscriptions enable row level security;
create policy "Users can view own subscriptions" on subscriptions for select using (auth.uid() = user_id);

-- RECEIPTS
create table if not exists public.receipts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  image_url text not null,
  merchant_name text,
  total_amount numeric,
  tax_amount numeric,
  parsed_data jsonb,
  status text default 'pending',
  created_at timestamptz default now() not null
);

alter table public.receipts enable row level security;
create policy "Users can CRUD own receipts" on receipts for all using (auth.uid() = user_id);

-- TRANSACTIONS
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric not null,
  currency text default 'USD' not null,
  date timestamptz not null,
  category_id text,
  merchant text,
  description text,
  receipt_id uuid references public.receipts(id) on delete set null,
  is_business boolean default true,
  created_at timestamptz default now() not null
);

alter table public.transactions enable row level security;
create policy "Users can CRUD own transactions" on transactions for all using (auth.uid() = user_id);

-- MILEAGE LOGS
create table if not exists public.mileage_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date timestamptz not null,
  start_location text,
  end_location text,
  distance_miles numeric not null,
  purpose text,
  created_at timestamptz default now() not null
);

alter table public.mileage_logs enable row level security;
create policy "Users can CRUD own mileage logs" on mileage_logs for all using (auth.uid() = user_id);
