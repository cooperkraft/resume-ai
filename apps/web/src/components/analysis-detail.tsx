"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnalysisResults } from "@/components/analysis-results";
import { getAnalysis, getPdfUrl } from "@/lib/api";
import type { Analysis } from "@/lib/types";

type State =
  | { status: "loading" }
  | { status: "done"; analysis: Analysis }
  | { status: "error"; message: string };

function formatDate(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AnalysisDetail({ id }: { id: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    getAnalysis(id)
      .then((analysis) => setState({ status: "done", analysis }))
      .catch((err) =>
        setState({
          status: "error",
          message:
            err instanceof Error ? err.message : "Failed to load analysis.",
        })
      );
  }, [id]);

  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded border border-border bg-muted/50"
          />
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-4">
        <div className="rounded border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.message}
        </div>
        <Link href="/history">
          <Button variant="outline" size="sm">
            Back to history
          </Button>
        </Link>
      </div>
    );
  }

  const { analysis } = state;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            Analysis
          </p>
          <h1 className="truncate text-lg font-semibold tracking-tight">
            {analysis.pdf_filename}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(analysis.created_at)}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <a href={getPdfUrl(id)} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="text-[11px] uppercase tracking-wider">
              View PDF
            </Button>
          </a>
          <Link href="/history">
            <Button variant="ghost" size="sm" className="text-[11px] uppercase tracking-wider">
              Back
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded border border-border bg-card px-4 py-3">
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Job Description
        </p>
        <p className="text-sm leading-relaxed text-foreground line-clamp-4">
          {analysis.job_description}
        </p>
      </div>

      {analysis.result ? (
        <AnalysisResults result={analysis.result} />
      ) : (
        <div className="rounded border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          No results stored for this analysis.
        </div>
      )}
    </div>
  );
}
