-- Migration: create cross_module_insights table
-- Purpose: Persistent storage for AI-generated cross-module intelligence insights.
--          Rows are upserted daily by the intelligence cron pipeline (Phase 4 Plan 3).
--          Soft-delete via dismissed_at; content-addressed PK enables idempotent upserts.

CREATE TABLE IF NOT EXISTS cross_module_insights (
  id              text        PRIMARY KEY,           -- SHA256 content-addressed key (e.g. 'R1-2026-03-15')
  rule_id         text        NOT NULL,              -- 'R1' through 'R7', or 'LLM' for narrative
  severity        text        NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  module_tags     text[]      NOT NULL DEFAULT '{}',
  evidence        text        NOT NULL,              -- human-readable sentence explaining why the insight fired
  generated_at    timestamptz NOT NULL DEFAULT now(),
  dismissed_at    timestamptz,                       -- NULL = active; non-NULL = soft-deleted
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Index for Phase 6 GET /insights filtering WHERE dismissed_at IS NULL
CREATE INDEX IF NOT EXISTS idx_insights_dismissed_at ON cross_module_insights (dismissed_at);

-- Index for Phase 6 ordering results by recency
CREATE INDEX IF NOT EXISTS idx_insights_generated_at ON cross_module_insights (generated_at DESC);
