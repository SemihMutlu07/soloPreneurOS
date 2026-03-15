CREATE TABLE IF NOT EXISTS runway_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_tl numeric NOT NULL DEFAULT 0,
  cash_usd numeric NOT NULL DEFAULT 0,
  monthly_burn numeric NOT NULL DEFAULT 0,
  runway_months numeric GENERATED ALWAYS AS (
    CASE WHEN monthly_burn > 0 THEN (cash_tl + cash_usd * 38) / monthly_burn ELSE 0 END
  ) STORED,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE runway_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_access" ON runway_data FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "service_role_access" ON runway_data FOR ALL TO service_role USING (true) WITH CHECK (true);
