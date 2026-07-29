import { AnalyzeForm } from "@/components/analyze-form";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
          Resume Analysis
        </p>
        <h1 className="text-xl font-semibold tracking-tight">
          How well does your resume fit this role?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload your resume and the job description. Get a match score, missing keywords, and interview questions calibrated to the gap.
        </p>
      </div>
      <AnalyzeForm />
    </div>
  );
}
