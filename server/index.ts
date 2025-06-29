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
    const resumeEmbedding = await getEmbedding(resumeText);
    const jdEmbedding = await getEmbedding(jobDescription);
    const semanticScore = cosineSimilarity(resumeEmbedding, jdEmbedding) * 100;

    /**
     * Keyword-based scoring function (can be expanded for FAANG++ detailed scoring)
     */
    function calculateScore(resumeText: string, role: string, jobDescription: string): number {
      let score = 0;
      const keywords = jobDescription
        ? jobDescription.split(/\W+/).filter(word => word.length > 3)
        : role.split(/\W+/);
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        if (regex.test(resumeText)) score += 5;
      }
      return Math.min(score, 100);
    }

    const score = calculateScore(resumeText, role, jobDescription);
    const topJob = role; // placeholder, implement dynamic top job prediction logic later

    // 💾 Save results to DB
    await pool.query(
      'INSERT INTO resume_history (filename, score, top_job, created_at) VALUES ($1, $2, $3, NOW())',
      [file.originalname, semanticScore.toFixed(2), topJob]
    );

    res.json({ filename: file.originalname, semanticScore, score, topJob, feedback: ["Sample feedback generated."] });

  } catch (err: any) {
    handleError(res, err, err.status || 500);
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
