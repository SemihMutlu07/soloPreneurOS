-- Sales-OS schema
-- Pipeline stages: new, qualified, contacted, demo, proposal, negotiation, won, lost, nurture

create table leads (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  company text,
  email text unique not null,
  phone text,
  source text not null default 'manual'
    check (source in ('gmail_scan', 'manual', 'referral', 'website')),
  source_email_subject text,
  source_email_snippet text,
  source_email_date timestamptz,
  status text not null default 'new'
    check (status in ('new', 'qualified', 'contacted', 'demo', 'proposal', 'negotiation', 'won', 'lost', 'nurture')),
  ai_score int
    check (ai_score is null or (ai_score >= 0 and ai_score <= 100)),
  ai_summary text,
  ai_signals jsonb,
  ai_suggested_action text
    check (ai_suggested_action is null or ai_suggested_action in ('send_demo', 'follow_up', 'nurture', 'disqualify')),
  ai_draft_response text,
  assigned_to uuid,
  deal_value numeric,
  currency text not null default 'TRY',
  notes text,
  last_contact_at timestamptz,
  next_follow_up_at timestamptz,
  lost_reason text,
  previous_lead_id uuid references leads(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table lead_activities (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references leads(id) on delete cascade,
  type text not null
    check (type in ('email_received', 'email_sent', 'note', 'status_change', 'call', 'meeting')),
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  created_by text not null default 'system'
    check (created_by in ('system', 'ai', 'user'))
);

create table sales_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  subject_template text not null,
  body_template text not null,
  stage text
    check (stage is null or stage in ('new', 'qualified', 'contacted', 'demo', 'proposal', 'negotiation', 'won', 'lost', 'nurture')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_leads_status on leads(status);
create index idx_leads_ai_score on leads(ai_score);
create index idx_leads_email on leads(email);
create index idx_lead_activities_lead_id on lead_activities(lead_id);

-- RLS
alter table leads enable row level security;
alter table lead_activities enable row level security;
alter table sales_templates enable row level security;

-- Leads policies
create policy "auth_select_leads" on leads for select to authenticated using (true);
create policy "auth_insert_leads" on leads for insert to authenticated with check (true);
create policy "auth_update_leads" on leads for update to authenticated using (true);
create policy "auth_delete_leads" on leads for delete to authenticated using (true);

-- Lead activities policies
create policy "auth_select_lead_activities" on lead_activities for select to authenticated using (true);
create policy "auth_insert_lead_activities" on lead_activities for insert to authenticated with check (true);
create policy "auth_update_lead_activities" on lead_activities for update to authenticated using (true);
create policy "auth_delete_lead_activities" on lead_activities for delete to authenticated using (true);

-- Sales templates policies
create policy "auth_select_sales_templates" on sales_templates for select to authenticated using (true);
create policy "auth_insert_sales_templates" on sales_templates for insert to authenticated with check (true);
create policy "auth_update_sales_templates" on sales_templates for update to authenticated using (true);
create policy "auth_delete_sales_templates" on sales_templates for delete to authenticated using (true);
