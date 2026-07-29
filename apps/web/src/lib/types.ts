export type AnalysisResult = {
  score: number;
  missingKeywords: string[];
  skillsToHighlight: string[];
  rewrittenBullets: string[];
  interviewQuestions: string[];
};

export type Analysis = {
  id: string;
  pdf_filename: string;
  created_at: number;
  job_description: string;
  result?: AnalysisResult;
};
