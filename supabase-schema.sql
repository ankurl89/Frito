-- Run this entire file in your Supabase SQL Editor
-- Go to: supabase.com > your project > SQL Editor > New Query > paste this > Run

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Brands table (Brand DNA)
create table if not exists brands (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  tagline text,
  story text,
  niche text,
  target_audience text,
  brand_values text[] default '{}',
  voice_tone text,
  price_tier text default 'mid',
  palette jsonb default '{}',
  typography jsonb default '{}',
  logo_url text,
  logo_prompt text,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Products table
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  brand_id uuid references brands(id) on delete cascade not null,
  name text not null,
  description text,
  category text,
  qikink_product_id text,
  qikink_product_name text,
  base_cost numeric(10,2) default 0,
  sell_price numeric(10,2) default 0,
  design_prompt text,
  design_url text,
  mockup_url text,
  sku text unique,
  variants jsonb default '[]',
  listing_title text,
  listing_description text,
  seo_tags text[] default '{}',
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Orders table
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  brand_id uuid references brands(id) on delete cascade not null,
  product_id uuid references products(id),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_address jsonb not null,
  variant jsonb default '{}',
  quantity integer default 1,
  total_amount numeric(10,2) default 0,
  cost_amount numeric(10,2) default 0,
  profit_amount numeric(10,2) default 0,
  status text default 'pending',
  qikink_order_id text,
  tracking_number text,
  courier text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  onboarding_complete boolean default false,
  created_at timestamptz default now()
);

-- Row Level Security
alter table brands enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table profiles enable row level security;

-- RLS Policies
create policy "Users can manage their own brands"
  on brands for all using (auth.uid() = user_id);

create policy "Users can manage products of their brands"
  on products for all using (
    brand_id in (select id from brands where user_id = auth.uid())
  );

create policy "Users can manage orders of their brands"
  on orders for all using (
    brand_id in (select id from brands where user_id = auth.uid())
  );

create policy "Users can manage their own profile"
  on profiles for all using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger brands_updated_at before update on brands
  for each row execute procedure update_updated_at();

create trigger products_updated_at before update on products
  for each row execute procedure update_updated_at();

create trigger orders_updated_at before update on orders
  for each row execute procedure update_updated_at();
