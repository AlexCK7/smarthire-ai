// Load environment variables
import express, { Request, Response } from 'express';
import multer from 'multer';
import dotenv from 'dotenv';
import cors from 'cors';
import { Pool } from 'pg';
import fs from 'fs';

function generateFeedback(score: number, role: string): string[] {
  const tips: string[] = [];

  if (score < 50) {
    tips.push("Consider tailoring your resume more to the role's keywords.");
    tips.push("Try adding measurable achievements related to the position.");
  } else if (score < 80) {
    tips.push("Good job! You can improve it further with more industry-specific terms.");
  } else {
    tips.push("Excellent match! Keep this version for applying.");
  }

  if (role.toLowerCase().includes("data")) {
    tips.push("Add tools like SQL, Excel, Python, or Tableau if relevant.");
  } else if (role.toLowerCase().includes("software")) {
    tips.push("Mention projects with specific tech stacks or languages.");
  } else if (role.toLowerCase().includes("web")) {
    tips.push("Include frontend/backend frameworks like React, Node.js, or Next.js.");
  }

  return tips;
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Set up PostgreSQL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Middleware
app.use(cors());
app.use(express.json());

// File upload config using multer
const upload = multer({ dest: 'uploads/' });

/** Simple keyword matching score calculator */
function calculateScore(text: string, role: string): number {
  const keywords: { [key: string]: string[] } = {
    'Software Engineer': ['javascript', 'typescript', 'react', 'node', 'api', 'sql'],
    'Data Analyst': ['sql', 'python', 'excel', 'pandas', 'tableau', 'data'],
    'Web Developer': ['html', 'css', 'javascript', 'react', 'frontend'],
  };

  const targetWords = keywords[role] || [];
  const lowerText = text.toLowerCase();
  let matchCount = 0;

  for (const word of targetWords) {
    if (lowerText.includes(word)) matchCount++;
  }

  const score = Math.floor((matchCount / targetWords.length) * 100);
  return isNaN(score) ? 0 : score;
}

/** Simple top role prediction based on most keyword matches */
function getTopJobRole(text: string): string {
  const roles = ['Software Engineer', 'Data Analyst', 'Web Developer'];
  let bestScore = -1;
  let bestRole = '';

  for (const role of roles) {
    const score = calculateScore(text, role);
    if (score > bestScore) {
      bestScore = score;
      bestRole = role;
    }
  }

  return bestRole || 'Unknown';
}

// Upload resume endpoint
app.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    const file = req.file;
    const role = req.body.role || 'Software Engineer';

    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const filename = file.originalname;

    // Scoring simulation (later will improve)
    const score = Math.floor(Math.random() * 100) + 1;
    const topJob = score > 60 ? role : ['Data Analyst', 'Web Developer', 'Software Engineer'][Math.floor(Math.random() * 3)];

    const feedback = generateFeedback(score, role);

    await pool.query(
      'INSERT INTO resume_history (filename, score, top_job, created_at) VALUES ($1, $2, $3, NOW())',
      [filename, score, topJob]
    );

    const rawResult = { filename, score, topJob, feedback };
    res.json(rawResult);

    return;
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
    return;
  }
});


// Get resume history
app.get('/history', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM resume_history ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Clear resume history
app.delete('/history', async (_req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM resume_history');
    res.json({ message: 'History cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

// Start server
app.get('/health', (_req, res) => {
  res.json({ ok: true, status: 'SmartHire AI backend running' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

pool.query('SELECT NOW()')
  .then(() => console.log('✅ Connected to database'))
  .catch((err) => console.error('❌ Database connection error:', err));
