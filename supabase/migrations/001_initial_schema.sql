create extension if not exists "uuid-ossp";

create table candidates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  role text not null,
  applied_at timestamptz not null default now(),
  pdf_url text not null,
  status text not null default 'pending'
    check (status in ('pending', 'analyzed', 'reviewed')),
  previous_application_id uuid references candidates(id),
  gmail_message_id text unique,
  created_at timestamptz not null default now(),
  unique(email, role)
);

create table evaluations (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  strong_signals text[] not null default '{}',
  risk_flags text[] not null default '{}',
  critical_question text,
  recommendation text not null
    check (recommendation in ('GÖRÜŞ', 'GEÇME', 'BEKLET')),
  raw_score jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table roles (
  id text primary key,
  title text not null,
  rubric text not null,
  task text not null,
  active boolean default true,
  created_at timestamptz default now()
);

-- Indexes
create index idx_candidates_status on candidates(status);
create index idx_candidates_email on candidates(email);
create index idx_evaluations_candidate on evaluations(candidate_id);

-- RLS
alter table candidates enable row level security;
alter table evaluations enable row level security;
alter table roles enable row level security;

create policy "auth_read_candidates" on candidates for select to authenticated using (true);
create policy "auth_insert_candidates" on candidates for insert to authenticated with check (true);
create policy "auth_update_candidates" on candidates for update to authenticated using (true);
create policy "auth_read_evaluations" on evaluations for select to authenticated using (true);
create policy "auth_insert_evaluations" on evaluations for insert to authenticated with check (true);
create policy "auth_read_roles" on roles for select to authenticated using (true);
create policy "auth_all_roles" on roles for all to authenticated using (true);
