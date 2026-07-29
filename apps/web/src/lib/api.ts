import { getOrCreateSessionId } from "./session";
import type { Analysis, AnalysisResult } from "./types";

const PLACEHOLDER_TURNSTILE_TOKEN = "placeholder-turnstile-token";

function sessionHeaders(): Record<string, string> {
  return { "X-Session-ID": getOrCreateSessionId() };
}

function parseSSEBody(body: string): AnalysisResult {
  let json = "";
  for (const line of body.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    const data = line.slice(6).trim();
    if (data === "[DONE]") break;
    json += data;
  }
  return JSON.parse(json) as AnalysisResult;
}

export async function analyzeResume({
  pdfFile,
  extractedText,
  jobDescription,
  onChunk,
}: {
  pdfFile: File;
  extractedText: string;
  jobDescription: string;
  onChunk: (accumulated: string) => void;
}): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("pdf", pdfFile);
  formData.append("text", extractedText);
  formData.append("jobDescription", jobDescription);
  formData.append("turnstileToken", PLACEHOLDER_TURNSTILE_TOKEN);

  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: sessionHeaders(),
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let accumulated = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    accumulated += decoder.decode(value, { stream: true });
    onChunk(accumulated);
  }

  return parseSSEBody(accumulated);
}

export async function getAnalyses(): Promise<Analysis[]> {
  const response = await fetch("/api/analyses", { headers: sessionHeaders() });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json() as Promise<Analysis[]>;
}

export async function getAnalysis(id: string): Promise<Analysis> {
  const response = await fetch(`/api/analyses/${id}`, {
    headers: sessionHeaders(),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json() as Promise<Analysis>;
}

export function getPdfUrl(id: string): string {
  const sessionId = getOrCreateSessionId();
  return `/api/analyses/${id}/pdf?session_id=${sessionId}`;
}
