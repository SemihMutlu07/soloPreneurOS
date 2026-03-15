create table invoices (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id),
  client_name text not null,
  client_vkn text,
  description text not null,
  gross_amount numeric not null,
  kdv_rate int not null default 20,
  kdv_amount numeric not null,
  stopaj_rate int,
  stopaj_amount numeric,
  net_amount numeric not null,
  invoice_type text not null
    check (invoice_type in ('e-arsiv', 'e-smm')),
  status text not null default 'beklemede'
    check (status in ('odendi', 'beklemede', 'gecmis')),
  created_at timestamptz not null default now()
);

create table tax_provisions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id),
  period text not null,
  kdv_payable numeric not null,
  gecici_vergi_estimate numeric not null,
  sgk_amount numeric not null,
  total_provision numeric not null,
  created_at timestamptz not null default now()
);

create table expenses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id),
  description text not null,
  amount numeric not null,
  kdv_paid numeric not null default 0,
  category text not null,
  date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Indexes
create index idx_invoices_status on invoices(status);
create index idx_invoices_user on invoices(user_id);
create index idx_expenses_user on expenses(user_id);

-- RLS
alter table invoices enable row level security;
alter table tax_provisions enable row level security;
alter table expenses enable row level security;

create policy "auth_read_invoices" on invoices for select to authenticated using (true);
create policy "auth_insert_invoices" on invoices for insert to authenticated with check (true);
create policy "auth_update_invoices" on invoices for update to authenticated using (true);
create policy "auth_read_tax_provisions" on tax_provisions for select to authenticated using (true);
create policy "auth_insert_tax_provisions" on tax_provisions for insert to authenticated with check (true);
create policy "auth_update_tax_provisions" on tax_provisions for update to authenticated using (true);
create policy "auth_read_expenses" on expenses for select to authenticated using (true);
create policy "auth_insert_expenses" on expenses for insert to authenticated with check (true);
create policy "auth_update_expenses" on expenses for update to authenticated using (true);
