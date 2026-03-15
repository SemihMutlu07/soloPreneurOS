alter table candidates
  add column if not exists decision_result text
    check (decision_result is null or decision_result in ('GÖRÜŞ', 'GEÇME', 'BEKLET'));

create index if not exists idx_candidates_decision on candidates(decision_result);
