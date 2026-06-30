create table if not exists bakeries (
  id text primary key,
  name text not null,
  city text not null,
  address text,
  notes text,
  stop_order integer default 999,
  created_at timestamptz default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  bakery_id text references bakeries(id) on delete cascade,
  reviewer text not null,
  shell integer not null check (shell between 1 and 10),
  ricotta integer not null check (ricotta between 1 and 10),
  pistachio integer not null check (pistachio between 1 and 10),
  freshness integer not null check (freshness between 1 and 10),
  wow integer not null check (wow between 1 and 10),
  notes text,
  photo_url text,
  created_at timestamptz default now()
);

alter table bakeries enable row level security;
alter table reviews enable row level security;

create policy "public read bakeries" on bakeries for select using (true);
create policy "public insert bakeries" on bakeries for insert with check (true);
create policy "public read reviews" on reviews for select using (true);
create policy "public insert reviews" on reviews for insert with check (true);
