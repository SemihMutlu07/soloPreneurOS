import { describe, it, expect, vi } from "vitest";
import type { CrossModuleSnapshot } from "./types";

describe("buildCrossModuleSnapshot", () => {
  it.todo("returns an object with sales, hire, finance, errors, and generated_at keys");
  it.todo("sets finance: null and pushes to errors[] when finance query throws");
  it.todo("sets sales: null and pushes to errors[] when sales query throws");
  it.todo("returns empty arrays (not null) when a module returns zero records");
  it.todo("returns a valid snapshot when all three modules succeed");
  it.todo("generated_at is an ISO string");
});
