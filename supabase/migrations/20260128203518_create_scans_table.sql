-- Create the scans table
create table if not exists public.scans (
  id uuid default gen_random_uuid() primary key,
  product_name text not null,
  trust_score numeric,
  verdict text,
  status text check (status in ('verified', 'caution', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.scans enable row level security;

-- Create Policy: Allow Public Read Access (Hackathon Mode)
create policy "Enable read access for all users"
on public.scans for select
using (true);

-- Create Policy: Allow Public Insert Access (Hackathon Mode)
create policy "Enable insert for all users"
on public.scans for insert
with check (true);

-- Enable Realtime for this table
alter publication supabase_realtime add table public.scans;
