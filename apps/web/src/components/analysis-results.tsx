import type { AnalysisResult } from "@/lib/types";

function ScoreDisplay({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const cx = 100, cy = 105, r = 90;
  const θ = (clamped / 100) * Math.PI;
  const ex = +(cx - r * Math.cos(θ)).toFixed(2);
  const ey = +(cy - r * Math.sin(θ)).toFixed(2);
  const largeArc = clamped > 50 ? 1 : 0;

  // Score-driven color: deep green / amber / red
  const arcColor =
    clamped >= 70 ? "#137547" : clamped >= 40 ? "#8B5E00" : "#B91C1C";

  return (
    <div className="flex flex-col items-center py-4">
      <svg
        viewBox="0 0 200 140"
        className="w-64"
        aria-label={`Match score: ${clamped} out of 100`}
      >
        {/* Background track */}
        <path
          d={`M ${cx - r},${cy} A ${r},${r} 0 0,1 ${cx + r},${cy}`}
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          className="text-border"
        />
        {/* Filled score arc */}
        {clamped > 0 && (
          <path
            d={`M ${cx - r},${cy} A ${r},${r} 0 ${largeArc},1 ${ex},${ey}`}
            stroke={arcColor}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        )}
        {/* Track end caps */}
        <circle
          cx={cx - r}
          cy={cy}
          r="3"
          fill="currentColor"
          className="text-border"
        />
        <circle
          cx={cx + r}
          cy={cy}
          r="3"
          fill="currentColor"
          className="text-border"
        />
        {/* Score position marker */}
        {clamped > 0 && clamped < 100 && (
          <circle cx={ex} cy={ey} r="5.5" fill={arcColor} />
        )}
        {/* The signature element: Instrument Serif score number inside the arc */}
        <text
          x={cx}
          y="133"
          textAnchor="middle"
          fill={arcColor}
          style={{
            fontFamily: "var(--font-instrument-serif)",
            fontSize: "88px",
          }}
        >
          {clamped}
        </text>
      </svg>
      <p className="-mt-1 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        Match Score
      </p>
    </div>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

export function AnalysisResults({ result }: { result: AnalysisResult }) {
  return (
    <div className="space-y-8">
      <ScoreDisplay score={result.score} />

      <div className="space-y-8 border-t border-border pt-8">
        <Section label="Missing Keywords">
          <div className="flex flex-wrap gap-2">
            {result.missingKeywords.map((kw) => (
              <span
                key={kw}
                className="rounded border border-border px-2 py-0.5 font-mono text-xs text-muted-foreground"
              >
                {kw}
              </span>
            ))}
          </div>
        </Section>

        <div className="border-t border-border" />

        <Section label="Skills to Highlight">
          <div className="flex flex-wrap gap-2">
            {result.skillsToHighlight.map((skill) => (
              <span
                key={skill}
                className="rounded bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        </Section>

        <div className="border-t border-border" />

        <Section label="Rewritten Experience Bullets">
          <ol className="space-y-4">
            {result.rewrittenBullets.map((bullet, i) => (
              <li
                key={i}
                className="grid grid-cols-[1.25rem_1fr] gap-3 text-sm leading-relaxed"
              >
                <span className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {i + 1}.
                </span>
                <span>{bullet}</span>
              </li>
            ))}
          </ol>
        </Section>

        <div className="border-t border-border" />

        <Section label="Interview Questions to Prepare">
          <ol className="space-y-4">
            {result.interviewQuestions.map((q, i) => (
              <li
                key={i}
                className="grid grid-cols-[1.25rem_1fr] gap-3 text-sm leading-relaxed"
              >
                <span className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {i + 1}.
                </span>
                <span>{q}</span>
              </li>
            ))}
          </ol>
        </Section>
      </div>
    </div>
  );
}
