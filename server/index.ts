import type { ResumeEvaluationResult } from './utils/resumeEvaluator';
import { evaluateResume } from './utils/resumeEvaluator';

import {
  calculateKeywordScore,
  calculateCompanyTierScore,
  calculateExperienceScore,
  calculateFinalScore
} from './scoringUtils';

import fetch from 'node-fetch'; // make sure this import is at the top

// Load environment variables
import express, { Request, Response } from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import cors from 'cors';
import { Pool } from 'pg';
import fs from 'fs';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse'; // @ts-ignore

import OpenAI from "openai";
const openai = new OpenAI();

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * PostgreSQL setup with graceful error handling
 */
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.on('error', (err) => {
  console.error(`[${new Date().toISOString()}] ❌ Unexpected DB error:`, err);
});

/**
 * Helper: generate semantic embeddings using OpenAI
 */
async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });
  return response.data[0].embedding;
}

/**
 * Simple in-memory cache (upgrade to Redis for production)
 */
const embeddingCache = new Map<string, number[]>();

async function getCachedEmbedding(text: string): Promise<number[]> {
  const hash = Buffer.from(text).toString('base64');
  if (embeddingCache.has(hash)) {
    console.log("✅ Using cached embedding.");
    return embeddingCache.get(hash)!;
  }
  const embedding = await getEmbedding(text);
  embeddingCache.set(hash, embedding);
  return embedding;
}


/**
 * Helper: calculate cosine similarity between two embedding vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB);
}

/**
 * Middleware
 */
app.use(cors());
app.use(express.json());

/**
 * Multer file upload config – accepts only PDF or DOCX
 */
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowed.includes(file.mimetype)) {
      const err = new Error('Only PDF or DOCX files are allowed');
      // @ts-ignore
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  }
});

/**
 * Helper: standardized error handler
 */
function handleError(res: Response, error: any, status = 500) {
  console.error(`[${new Date().toISOString()}] ❌ Error:`, error);
  res.status(status).json({ error: error.message || 'Server error' });
}

/**
 * Health check endpoint
 */
app.get('/health', (_req, res) => {
  res.json({ ok: true, status: 'SmartHire AI backend running' });
});

/**
 * Upload resume endpoint with semantic embedding scoring
 */
app.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    const file = req.file;
    const role = req.body.role || 'Software Engineer';
    const jobDescription = req.body.jobDescription || '';

    if (!file) {
      return handleError(res, new Error('No file uploaded'), 400);
    }

    let resumeText = "";

    // 🔎 Extract text based on file type
    if (file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(file.path);
      const pdfData = await pdfParse(dataBuffer);
      resumeText = pdfData.text;
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const data = await mammoth.extractRawText({ path: file.path });
      resumeText = data.value;
    }

    // ✨ Validation checks
    const hasSections = /experience|education|skills/i.test(resumeText);
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

    if (!resumeText || resumeText.length < 300 || !hasSections || !emailRegex.test(resumeText)) {
      console.log("Validation failed for:", file.originalname, {
        length: resumeText.length,
        hasSections,
        hasEmail: emailRegex.test(resumeText),
      });
      return handleError(res, new Error("Invalid resume. Include Experience, Education, Skills sections with your email."), 400);
    }

    // ✅ Semantic embedding-based scoring
    // const resumeEmbedding = await getEmbedding(resumeText);
    // const jdEmbedding = await getEmbedding(jobDescription);
    // const semanticScore = cosineSimilarity(resumeEmbedding, jdEmbedding) * 100;
    const semanticScore = 75; // dummy static score for local testing

    // Example usage (adapt to your logic):
    
    const jdKeywords = jobDescription.split(/\W+/).filter((word: string) => word.length > 2); // simple split for now

const experienceData = [
  { company: "Google", years: 2, techStack: ["Python", "TensorFlow"] },
  { company: "Amazon", years: 1, techStack: ["JavaScript", "AWS"] }
];

const keywordScore = calculateKeywordScore(resumeText, jdKeywords);
const companyScore = calculateCompanyTierScore(experienceData);
const experienceScore = calculateExperienceScore(experienceData);
const finalScore = calculateFinalScore(keywordScore, companyScore, experienceScore);

console.log("Keyword Score:", keywordScore);
console.log("Company Score:", companyScore);
console.log("Experience Score:", experienceScore);
console.log("Final Combined Score:", finalScore);

    
const results = evaluateResume(resumeText, role, jobDescription);
const score = results.score;
const topJob = role; // placeholder

    // 💾 Save results to DB
    await pool.query(
  'INSERT INTO resume_history (filename, score, top_job, created_at) VALUES ($1, $2, $3, NOW())',
  [file.originalname, Math.round(semanticScore), topJob]
);

    res.json({
  filename: file.originalname,
  score,
  topJob,
  semanticScore,
  tier: results.tier,
  scoreBreakdown: results.breakdown,
  feedback: results.suggestions
});

  } catch (err: any) {
    handleError(res, err, err.status || 500);
  }
});

app.get('/ollama-test', async (_req, res) => {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Ollama Test Error:", err);
    res.status(500).json({ error: "Failed to connect to Ollama" });
  }
});

/**
 * Get resume history
 */
app.get('/history', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM resume_history ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    handleError(res, err);
  }
});

/**
 * Clear resume history
 */
app.delete('/history', async (_req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM resume_history');
    res.json({ message: 'History cleared' });
  } catch (err) {
    handleError(res, err);
  }
});

// ✅ Unified evaluation route — uses evaluateResume safely with typed output
app.post('/evaluate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { resumeText, role, jobDescription } = req.body;

    if (!resumeText || !role) {
      res.status(400).json({ error: "Missing resumeText or role" });
      return;
    }

    const results: ResumeEvaluationResult = evaluateResume(resumeText, role, jobDescription);

    const suggestions = [
      `For the role of ${role}, consider adding more quantifiable achievements.`,
      `Mention specific tools or technologies commonly required for ${role}.`,
      `Your resume lacks keywords such as “team collaboration” and “problem-solving”.`,
    ];

    const scoreBreakdown = {
      keywordMatch: results.breakdown.keywords,
      formatting: results.breakdown.formatting,
      roleAlignment: results.breakdown.alignment,
      github: results.breakdown.github,
      fundamentals: results.breakdown.fundamentals,
      overallFitScore: results.score
    };

    res.json({
      ...results,
      suggestions,
      scoreBreakdown,
    });

  } catch (err) {
    console.error('❌ Error in /evaluate:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Start server with DB connection validation
 */
(async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log(`[${new Date().toISOString()}] ✅ Connected to database`);

    app.listen(PORT, () => {
      console.log(`[${new Date().toISOString()}] ✅ Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error(`[${new Date().toISOString()}] ❌ Failed to connect to DB on startup`, err);
    process.exit(1);
  }
})();

