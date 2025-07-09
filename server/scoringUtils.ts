// scoringUtils.ts

export function calculateKeywordScore(resumeText: string, jdKeywords: string[]): number {
  const found = jdKeywords.filter(keyword =>
    new RegExp(`\\b${keyword}\\b`, 'gi').test(resumeText)
  ).length;
  const score = (found / jdKeywords.length) * 100;
  return Math.min(Math.round(score), 100);
}

export function calculateCompanyTierScore(experience: { company: string, years: number, techStack: string[] }[]): number {
  let score = 0;
  for (const exp of experience) {
    if (exp.company.toLowerCase().includes("google")) score += 40;
    else if (exp.company.toLowerCase().includes("amazon")) score += 30;
    else if (exp.company.toLowerCase().includes("microsoft")) score += 25;
    else score += 10;
  }
  return Math.min(score, 100);
}

export function calculateExperienceScore(experience: { years: number }[]): number {
  const totalYears = experience.reduce((sum, exp) => sum + exp.years, 0);
  const normalized = (totalYears / 10) * 100; // Assuming 10+ years caps at 100
  return Math.min(Math.round(normalized), 100);
}

export function calculateFinalScore(keyword: number, company: number, experience: number): number {
  const weighted = (keyword * 0.5) + (company * 0.3) + (experience * 0.2);
  return Math.round(weighted);
}
