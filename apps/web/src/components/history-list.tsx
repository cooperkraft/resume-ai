"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAnalyses } from "@/lib/api";
import type { Analysis } from "@/lib/types";

type State =
  | { status: "loading" }
  | { status: "done"; analyses: Analysis[] }
  | { status: "error"; message: string };

function formatDate(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ScorePill({ score }: { score: number }) {
  const colorClass =
    score >= 70
      ? "text-[#137547] dark:text-[#2DB872]"
      : score >= 40
        ? "text-[#8B5E00] dark:text-[#C88800]"
        : "text-[#B91C1C] dark:text-[#EF5350]";

  return (
    <span
      className={`shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-medium tabular-nums ${colorClass}`}
    >
      {score}
    </span>
  );
}

export function HistoryList() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    getAnalyses()
      .then((analyses) => setState({ status: "done", analyses }))
      .catch((err) =>
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Failed to load history.",
        })
      );
  }, []);

  if (state.status === "loading") {
    return (
      <div className="space-y-px">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded border border-border bg-muted/50"
          />
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {state.message}
      </div>
    );
  }

  if (state.analyses.length === 0) {
    return (
      <div className="rounded border border-border bg-card px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">No analyses yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          <Link
            href="/"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Analyze a resume
          </Link>{" "}
          to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded border border-border bg-card">
      {state.analyses.map((analysis, idx) => (
        <Link
          key={analysis.id}
          href={`/history/${analysis.id}`}
          className={`flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/50 ${idx > 0 ? "border-t border-border" : ""}`}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {analysis.pdf_filename}
            </p>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {analysis.job_description}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {analysis.result != null && (
              <ScorePill score={analysis.result.score} />
            )}
            <span className="text-[10px] text-muted-foreground">
              {formatDate(analysis.created_at)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
