"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface InterviewActionProps {
  candidateId: string;
  candidateName: string;
  disabled?: boolean;
}

export function InterviewAction({
  candidateId,
  candidateName,
  disabled,
}: InterviewActionProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function handleSend() {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/hiring/candidates/${candidateId}/interview`,
        { method: "POST" },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (sent) {
    return (
      <div className="flex items-center gap-2 text-accent-green text-sm">
        <Send size={14} />
        Interview email sent
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSend}
        disabled={loading || disabled}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          confirming
            ? "bg-accent-green text-bg"
            : "bg-accent-green/10 text-accent-green hover:bg-accent-green/20"
        } disabled:opacity-50`}
      >
        <Send size={14} />
        {loading
          ? "Sending..."
          : confirming
            ? `Confirm: Send to ${candidateName}?`
            : "Send Interview Email"}
      </button>
      {confirming && !loading && (
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-text-muted hover:text-text-secondary"
        >
          Cancel
        </button>
      )}
      {error && (
        <p className="text-xs text-accent-red">{error}</p>
      )}
    </div>
  );
}
