import express from 'express';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { Request, Response } from 'express';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage(); // store files in memory for now
const upload = multer({ storage });

const sampleJobs = [
  "Software Engineer at OpenAI",
  "Frontend Developer at Meta",
  "Full Stack Engineer at Stripe",
  "DevOps Engineer at Netflix",
  "Data Scientist at Amazon",
  "Backend Developer at Google",
  "ML Engineer at Tesla"
];

function getRandomJobs(count = 3) {
  const shuffled = sampleJobs.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

app.post('/upload', upload.single('resume'), (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }

  const matchScore = Math.floor(Math.random() * 50) + 50; // returns a % between 50–100
  const matchedJobs = getRandomJobs();

  res.status(200).json({
    message: 'Resume received',
    results: {
      matchPercentage: matchScore,
      topJobs: matchedJobs,
    }
  });
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
