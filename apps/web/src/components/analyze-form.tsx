"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AnalysisResults } from "@/components/analysis-results";
import { analyzeResume } from "@/lib/api";
import { extractPdfText } from "@/lib/pdf";
import type { AnalysisResult } from "@/lib/types";

type State =
  | { status: "idle" }
  | { status: "extracting" }
  | { status: "streaming"; accumulated: string }
  | { status: "done"; result: AnalysisResult }
  | { status: "error"; message: string };

export function AnalyzeForm() {
  const [state, setState] = useState<State>({ status: "idle" });
  const [jobDescription, setJobDescription] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const busy =
    state.status === "extracting" || state.status === "streaming";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setState({ status: "error", message: "Only PDF files are supported." });
      return;
    }
    setState({ status: "idle" });
    setPdfFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pdfFile || !jobDescription.trim()) return;

    try {
      setState({ status: "extracting" });
      const extractedText = await extractPdfText(pdfFile);

      if (!extractedText) {
        setState({
          status: "error",
          message:
            "No text could be extracted from this PDF. Please use a PDF with selectable text rather than a scanned image.",
        });
        return;
      }

      setState({ status: "streaming", accumulated: "" });

      const result = await analyzeResume({
        pdfFile,
        extractedText,
        jobDescription,
        onChunk: (accumulated) =>
          setState({ status: "streaming", accumulated }),
      });

      setState({ status: "done", result });
    } catch (err) {
      setState({
        status: "error",
        message:
          err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    }
  }

  function reset() {
    setState({ status: "idle" });
    setPdfFile(null);
    setJobDescription("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* File upload zone */}
        <div className="space-y-2">
          <label
            className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground"
            htmlFor="pdf-upload"
          >
            Resume
          </label>
          <button
            type="button"
            className="group flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded border border-dashed border-border bg-card px-6 py-10 transition-colors hover:border-primary/40 hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
          >
            <input
              ref={fileInputRef}
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={handleFileChange}
              disabled={busy}
            />
            {pdfFile ? (
              <>
                <svg
                  className="h-5 w-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div className="text-center">
                  <p className="text-sm font-medium">{pdfFile.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {(pdfFile.size / 1024).toFixed(0)} KB · Click to change
                  </p>
                </div>
              </>
            ) : (
              <>
                <svg
                  className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Drop your resume or click to browse
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">PDF only</p>
                </div>
              </>
            )}
          </button>
        </div>

        {/* Job description */}
        <div className="space-y-2">
          <label
            className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground"
            htmlFor="job-description"
          >
            Job Description
          </label>
          <Textarea
            id="job-description"
            placeholder="Paste the full job description here…"
            className="min-h-48 resize-y bg-card text-sm"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            disabled={busy}
          />
        </div>

        <Button
          type="submit"
          className="w-full text-[11px] font-medium uppercase tracking-wider"
          disabled={busy || !pdfFile || !jobDescription.trim()}
        >
          {state.status === "extracting"
            ? "Reading PDF…"
            : state.status === "streaming"
              ? "Analyzing…"
              : "Analyze"}
        </Button>
      </form>

      {state.status === "error" && (
        <div className="rounded border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.message}
        </div>
      )}

      {state.status === "streaming" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Generating analysis
              </span>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            </div>
            <div className="h-px w-full overflow-hidden bg-border">
              <div
                className="h-full w-1/4 bg-primary"
                style={{ animation: "scan 1.4s ease-in-out infinite" }}
              />
            </div>
          </div>
          {state.accumulated && (
            <pre className="max-h-40 overflow-auto rounded border border-border bg-muted/50 p-4 font-mono text-xs leading-relaxed text-muted-foreground">
              {state.accumulated.slice(-600)}
            </pre>
          )}
        </div>
      )}

      {state.status === "done" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-t border-border pt-6">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Analysis complete
            </span>
            <button
              onClick={reset}
              className="text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
            >
              Start over
            </button>
          </div>
          <AnalysisResults result={state.result} />
        </div>
      )}
    </div>
  );
}
