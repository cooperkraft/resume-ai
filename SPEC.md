# Resume AI — Product Spec

**Status:** Ready for agent
**Date:** 2026-07-29
**Author:** Cooper Kraft

---

## Problem Statement

Job seekers — especially students applying for internships — have no reliable way to know whether their resume is a strong match for a specific role. They submit applications blind: unsure which keywords they're missing, which skills to emphasize, and how their experience should be framed for that position. Manual tailoring is time-consuming and based on guesswork, with no feedback loop until a rejection arrives weeks later.

---

## Solution

An AI-powered resume analyzer where users upload their PDF resume and paste a job description. The app delivers a real-time streaming analysis: a match score (0–100), the top missing keywords, skills to highlight, three rewritten experience bullets optimized for the role, and five tailored interview questions. Users can return to their scan history to review past analyses and compare how different resume versions performed against specific roles.

---

## User Stories

### Analyze flow

1. As a job seeker, I want to upload my PDF resume, so that the app can analyze its content against a job description.
2. As a job seeker, I want to paste a job description into a text field, so that the app knows what role I'm targeting.
3. As a job seeker, I want to click a single Analyze button to trigger the full analysis, so that I'm not navigating a multi-step wizard.
4. As a job seeker, I want to complete a Turnstile challenge invisibly before my analysis runs, so that the service is protected from abuse without friction.
5. As a job seeker, I want analysis results to stream in progressively, so that I don't stare at a blank screen while waiting for Claude to finish.
6. As a job seeker, I want to see a match score from 0–100, so that I can quickly gauge how well my resume fits the role.
7. As a job seeker, I want to see the top missing keywords, so that I know exactly what terms to add to my resume.
8. As a job seeker, I want to see which of my existing skills to highlight, so that I can reorder or emphasize the right sections.
9. As a job seeker, I want to see three rewritten experience bullets tailored to the job description, so that I have concrete language I can copy directly into my resume.
10. As a job seeker, I want to see five interview questions tailored to the role, so that I can prepare for the topics this employer is likely to ask about.
11. As a job seeker, I want to use the tool without creating an account, so that there is no barrier to trying it.

### History

12. As a returning user on the same device, I want to see a list of my past scans on a dedicated History page, so that I can review previous analyses without re-uploading my resume.
13. As a returning user, I want each history entry to show the PDF filename, date, and a snippet of the job description, so that I can identify which scan is which at a glance.
14. As a returning user, I want to click a past scan to view its full results, so that I can revisit insights I may have missed the first time.
15. As a returning user, I want to view or download the PDF I submitted with a past scan, so that I can confirm which version of my resume was analyzed.
16. As a returning user, I want my history to persist across browser sessions on the same device, so that I don't lose my scans when I close the tab.

### Errors & edge cases

17. As a job seeker, I want a clear error message if I upload a file that isn't a PDF, so that I understand why the upload was rejected.
18. As a job seeker, I want a clear error message if my PDF has no extractable text (e.g. a scanned image), so that I know to use a different file.
19. As a job seeker, I want a visible error state if the analysis fails mid-stream, so that I'm not left with a partial result and no indication of what went wrong.
20. As a job seeker, I want cached results returned instantly when I resubmit the same resume and job description, so that I don't wait unnecessarily for an identical analysis.

---

## Implementation Decisions

1. **PDF text extraction is browser-side** using `pdfjs-dist`. The Worker never performs text extraction. The browser sends both the extracted plain text (for AI analysis) and the raw PDF bytes (for R2 storage) in a single multipart request to the Worker.

2. **AI provider is Claude (Anthropic) via Cloudflare AI Gateway.** A single structured prompt requests all five outputs — match score, missing keywords, skills to highlight, three rewritten bullets, and five interview questions — as a typed JSON object. AI Gateway provides observability and infrastructure-level caching on top of the Claude API calls.

3. **Analysis results are streamed as Server-Sent Events (SSE).** The Worker opens a streaming connection to Claude and forwards tokens to the browser in real time. The browser renders results progressively as they arrive.

4. **Identity is an anonymous UUID stored in `localStorage`.** Generated on first visit, sent as an `X-Session-ID` request header on all Worker requests. There is no server-side session creation step. History is device-local: clearing storage or switching devices loses access to past scans.

5. **D1 schema — one table: `analyses`.** Columns: `id` (UUID, primary key), `session_id` (indexed), `created_at` (Unix timestamp), `pdf_filename`, `r2_key`, `job_description`, `result` (JSON blob). Drizzle is used for schema definition, migrations, and queries.

6. **R2 stores the raw PDF binary** keyed at `{sessionId}/{analysisId}.pdf`. Served back through the Worker on demand for the history PDF viewer.

7. **KV caches analysis results by content hash.** Before calling Claude, the Worker computes a SHA-256 hash of the concatenated resume text and job description and checks KV. A cache hit returns the stored JSON result directly (not as SSE). A cache miss proceeds with the full Claude call; on completion the result is written to KV with a 24-hour TTL.

8. **Turnstile gates the Analyze action.** The Turnstile widget is embedded in the analysis form. Its token is submitted alongside the resume and job description. The Worker verifies it against the Turnstile `/siteverify` API before proceeding. A failed verification returns `403`.

9. **D1 and KV writes happen after the stream, via `ctx.waitUntil()`.** The browser does not wait for persistence to complete. If the Worker process exits before the write lands (rare), the analysis result is not stored in history.

10. **Worker API surface:**

    | Method + Path | Purpose |
    |---|---|
    | `POST /api/analyze` | Receive multipart form (PDF bytes + extracted text + job description + session ID + Turnstile token). Stream SSE analysis result. |
    | `GET /api/analyses` | Return list of analyses for the requesting session ID, ordered by `created_at` descending. |
    | `GET /api/analyses/:id` | Return the full result JSON for a single analysis (session-scoped). |
    | `GET /api/analyses/:id/pdf` | Stream the R2 PDF object for the given analysis (session-scoped). |

11. **Frontend: Next.js 16, Tailwind v4, shadcn/ui (default theme).** Two routes: `/` (analyze form + streaming results) and `/history` (past scans list). A minimal header links between them. Note: Next.js 16 is already installed — the originally planned v15 was not used.

---

## Testing Decisions

A good test verifies observable HTTP behavior — status codes, response shape, SSE event sequence — not internal function calls or row counts. Tests should be indifferent to refactors that don't change the API contract.

Tests live in `apps/worker` and run using `@cloudflare/vitest-pool-workers`, which executes tests inside the actual Workers runtime. D1 and KV use the real in-memory implementations provided by the test pool. R2 and the Claude/AI Gateway binding are mocked via `env` overrides.

There are no existing tests in the codebase; these are the first.

**Key scenarios:**

- `POST /api/analyze` (cache miss) — returns an SSE stream; after stream closes, D1 record and R2 object exist.
- `POST /api/analyze` (cache hit) — returns cached JSON without invoking the Claude mock.
- `POST /api/analyze` (invalid Turnstile token) — returns `403` before any storage or AI call.
- `GET /api/analyses` — returns only analyses belonging to the requesting session ID, not those of other sessions.
- `GET /api/analyses/:id/pdf` — returns the correct R2 object; returns `404` for an ID belonging to a different session.

---

## Out of Scope

- Real user accounts or authentication
- Side-by-side before/after bullet comparison
- Export to PDF
- Chat about your resume
- Cover letter generation
- Resume version history comparison
- Workers AI (Claude is used exclusively)
- Direct-to-R2 upload via presigned URLs
- Multiple Claude prompts per analysis
- Real ATS scoring algorithm

---

## Further Notes

- History is device-local by design. Users who clear `localStorage` or switch devices lose access to past scans. This is a known, accepted limitation of the anonymous session model for MVP.
- AI Gateway caching (infrastructure-level) is separate from the application-level KV cache. Both may be active simultaneously. AI Gateway cache hits will not trigger a KV write.
- If the Worker process exits between stream completion and the `waitUntil` write landing, the analysis result will not appear in history. This is an acceptable edge case for MVP.
