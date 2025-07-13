export interface ResumeEvaluationResult {
  score: number;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Tier 4';
  flags: string[];
  suggestions: string[];
  breakdown: {
    keywords: number;
    formatting: number;
    alignment: number;
    github: number;
    fundamentals: number;
  };
}

export function evaluateResume(resumeText: string, targetRole: string, jobDescription?: string) {
  const lowerText = resumeText.toLowerCase();
  const flags: string[] = [];
  const suggestions: string[] = [];
  const breakdown = {
    keywords: 0,
    formatting: 0,
    alignment: 0,
    github: 0,
    fundamentals: 0
  };

  const roleKeywords = getKeywordsForRole(targetRole);
  const keywordMatches = roleKeywords.filter(kw => lowerText.includes(kw));
  breakdown.keywords = Math.min(100, Math.floor((keywordMatches.length / roleKeywords.length) * 100));
  if (breakdown.keywords < 50) {
    flags.push("Low keyword match");
    suggestions.push("Use more keywords relevant to the target role.");
  }

  if (lowerText.includes("github.com")) {
    breakdown.github = 100;
  } else {
    flags.push("No GitHub or project links");
    suggestions.push("Include GitHub links next to your projects.");
  }

  const fundamentals = ['object oriented programming', 'data structures', 'algorithms', 'systems', 'cs fundamentals'];
  const fundamentalsCount = fundamentals.filter(f => lowerText.includes(f)).length;
  breakdown.fundamentals = Math.min(100, (fundamentalsCount / fundamentals.length) * 100);
  if (breakdown.fundamentals < 50) {
    flags.push("Missing CS fundamentals");
    suggestions.push("Mention coursework like OOP, Data Structures, or Algorithms.");
  }

  const formattingScore = [
    lowerText.includes('experience'),
    lowerText.includes('education'),
    lowerText.includes('skills'),
    lowerText.includes('projects'),
    lowerText.includes('certifications'),
  ].filter(Boolean).length * 20;
  breakdown.formatting = formattingScore;
  if (formattingScore < 60) {
    flags.push("Poor formatting or missing sections");
    suggestions.push("Use clear sections like 'Experience', 'Projects', and 'Skills'.");
  }

  if (jobDescription) {
    const jd = jobDescription.toLowerCase();
    const jdKeywords = jd.split(/\W+/).filter(w => w.length > 4);
    const jdMatchCount = jdKeywords.filter(word => lowerText.includes(word)).length;
    breakdown.alignment = Math.min(100, Math.floor(jdMatchCount / jdKeywords.length * 100));
    if (breakdown.alignment < 50) {
      flags.push("Low job description alignment");
      suggestions.push("Add more keywords from the job description.");
    }
  } else {
    breakdown.alignment = 70;
  }

  const score = Math.round(
    breakdown.keywords * 0.25 +
    breakdown.github * 0.15 +
    breakdown.fundamentals * 0.2 +
    breakdown.formatting * 0.2 +
    breakdown.alignment * 0.2
  );

  let tier: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'Tier 4';
  if (score >= 90) tier = 'Tier 1';
  else if (score >= 75) tier = 'Tier 2';
  else if (score >= 50) tier = 'Tier 3';
  else tier = 'Tier 4';

  return { score, tier, flags, suggestions, breakdown };
}

function getKeywordsForRole(role: string): string[] {
  const map: { [key: string]: string[] } = {
    'Software Engineer': ['python', 'java', 'typescript', 'oop', 'algorithms', 'api', 'backend', 'frontend'],
    'Data Analyst': ['sql', 'python', 'excel', 'tableau', 'data cleaning', 'dashboard', 'reporting'],
    'Web Developer': ['html', 'css', 'react', 'node', 'responsive', 'accessibility', 'typescript'],
    'Backend Engineer': ['node', 'express', 'sql', 'database', 'api', 'authentication', 'docker'],
    'ML Engineer': ['python', 'tensorflow', 'pytorch', 'models', 'inference', 'mlops', 'data pipeline'],
    'DevOps Engineer': ['ci/cd', 'aws', 'docker', 'kubernetes', 'monitoring', 'infrastructure'],
    'Full Stack Developer': ['react', 'node', 'typescript', 'mongo', 'rest', 'graphql', 'testing'],
    'AI Researcher': ['llm', 'transformer', 'attention', 'fine-tuning', 'gpt', 'embedding', 'rag']
  };

  return map[role] || [];
}
