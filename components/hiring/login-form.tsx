"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Lock, Mail } from "lucide-react";

export function LoginForm({ redirect }: { redirect: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    window.location.href = redirect;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm">
      {error && (
        <div className="text-sm text-accent-red bg-accent-red/10 rounded-lg px-4 py-2">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <label className="text-sm text-text-secondary flex items-center gap-2">
          <Mail size={14} />
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-teal transition-colors"
          placeholder="you@company.com"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm text-text-secondary flex items-center gap-2">
          <Lock size={14} />
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-teal transition-colors"
          placeholder="Enter password"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-accent-teal text-bg font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
