import express, { Request, Response } from 'express';
import fileUpload from 'express-fileupload';
import dotenv from 'dotenv';
import cors from 'cors';
import { Pool } from 'pg';
import { RequestHandler } from 'express';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload());


const handleUpload: RequestHandler<any, any, any, any, Record<string, any>> = async (req, res) => {
  try {
    if (
      !req.files ||
      !(req.files as fileUpload.FileArray).resume
    ) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const resume = (req.files as fileUpload.FileArray).resume as fileUpload.UploadedFile;
    const resumeText = resume.data.toString('utf8');

    const score = Math.floor(Math.random() * 101);
    const topJobs = ['Software Engineer', 'Data Analyst', 'Web Developer'];
    const topJob = topJobs[Math.floor(Math.random() * topJobs.length)];

    await pool.query(
      `INSERT INTO resume_history (filename, score, top_job)
       VALUES ($1, $2, $3)`,
      [resume.name, score, topJob]
    );

    res.json({
      results: {
        matchPercentage: score,
        topJobs: [topJob],
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }


};

app.post('/upload', handleUpload);

  app.get('/history', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM resume_history ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.delete('/history', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM resume_history');
    res.json({ message: 'History cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

pool.query('SELECT NOW()')
  .then(() => console.log('✅ Connected to database'))
  .catch((err) => console.error('❌ Database connection error:', err));

