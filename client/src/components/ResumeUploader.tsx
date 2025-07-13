import React, { useState } from 'react';
import axios from 'axios';
import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';

const ResumeUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [role, setRole] = useState<string>('Software Engineer');
  const [jobDesc, setJobDesc] = useState<string>('');
  const [result, setResult] = useState<{
    score: number;
    topJob: string;
    feedback: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useA4, setUseA4] = useState<boolean>(false);

  // 🧠 New: Gemini results state
  const [geminiResults, setGeminiResults] = useState<{
    suggestions: string[];
    scoreBreakdown: {
      keywordMatch: number;
      formatting: number;
      roleAlignment: number;
      overallFitScore: number;
    };
  } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setGeminiResults(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('role', role);
    formData.append('jobDescription', jobDesc);

    try {
      const res = await axios.post('http://localhost:5000/upload', formData);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError('Upload failed. Please try again.');
    }
  };

  const handleGeminiAnalyze = async () => {
    if (!result || !role) {
      setError('Missing result or role.');
      return;
    }

    setAnalyzing(true);
    try {
      const res = await axios.post('http://localhost:5000/gemini-analyze', {
        resumeText: 'Experienced developer with background in AWS, Python, and PostgreSQL', // simulate for now
        role,
      });
      setGeminiResults(res.data);
    } catch (err) {
      console.error(err);
      setError('Gemini analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const generatePDF = async () => {
  if (!result || !geminiResults) return;

  const doc = await PDFDocument.create();
  const page = doc.addPage(PageSizes.A4);

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const { height } = page.getSize();
  let y = height - 50;
  const fontSize = 12;
  const lineGap = 20;

  const drawLine = (text: string, color = rgb(0, 0, 0), size = fontSize) => {
    page.drawText(text, {
      x: 50,
      y,
      size,
      font,
      color,
    });
    y -= lineGap;
  };

  // Branding
  drawLine('SmartHire™ Resume Report', rgb(0.1, 0.2, 0.6), 16);
  drawLine(`Powered by LucidHire™`, rgb(0.4, 0.4, 0.4), 10);
  drawLine(' ');

  drawLine(`Target Role: ${role}`);
  drawLine(`Top Match: ${result.topJob}`);
  drawLine(`Score: ${result.score}%`);

  let confidence = 'Low';
  if (result.score >= 80) confidence = 'High';
  else if (result.score >= 50) confidence = 'Moderate';

  drawLine(`Confidence Level: ${confidence}`);
  drawLine(' ');

  // Score Breakdown
  drawLine('Score Breakdown:', rgb(0.2, 0.2, 0.2), 13);
  for (const [label, value] of Object.entries(geminiResults.scoreBreakdown)) {
    drawLine(`${label.replace(/([A-Z])/g, ' $1')}: ${value}%`);
  }

  drawLine(' ');
  drawLine('Suggestions:', rgb(0.2, 0.2, 0.2), 13);
  geminiResults.suggestions.forEach((sugg) => drawLine(`• ${sugg}`));

  drawLine(' ');
  drawLine(`Timestamp: ${new Date().toLocaleString()}`);

  // Save PDF
  const pdfBytes = await doc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${role.replace(/\s+/g, '_')}_resume_report.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};


  const getBarColor = (value: number) => {
  if (value >= 80) return 'bg-green-500';
  if (value >= 50) return 'bg-yellow-400';
  return 'bg-red-500';
};


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
        <h2 className="text-xl font-bold mb-4">Upload Resume</h2>

        <label className="block mb-2 font-semibold">Select Target Role:</label>
        <select
          className="mb-2 p-2 border rounded w-full"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="Software Engineer">Software Engineer</option>
          <option value="Data Analyst">Data Analyst</option>
          <option value="Web Developer">Web Developer</option>
        </select>

        <label className="block mt-4 mb-2 font-semibold">Paste Job Description (optional):</label>
        <textarea
          value={jobDesc}
          onChange={(e) => setJobDesc(e.target.value)}
          className="w-full p-2 border rounded mb-4"
          rows={4}
          placeholder="Paste the job description here to refine matching..."
        />

        <input type="file" accept=".pdf,.doc,.docx" onChange={handleChange} className="mb-4" />

        <button
          onClick={handleUpload}
          disabled={!file}
          className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${!file ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Upload
        </button>

        <div className="my-2">
          <label className="text-sm mr-2">Use A4 PDF size:</label>
          <input
            type="checkbox"
            checked={useA4}
            onChange={() => setUseA4(!useA4)}
          />
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-4 p-3 bg-green-100 rounded">
            <p><strong>Your resume most aligns with:</strong> {result.topJob}</p>
            <p><strong>Match Score:</strong> {result.score}%</p>

            <div className="mt-2">
              <p className="font-semibold">Confidence Level:</p>
              <div className="w-full bg-gray-300 rounded h-4">
                <div
                  className={`h-4 rounded ${result.score >= 80 ? 'bg-green-600' : result.score >= 50 ? 'bg-yellow-500' : 'bg-red-600'}`}
                  style={{ width: `${result.score}%` }}
                ></div>
              </div>
            </div>

            {result.feedback && (
              <div className="mt-2">
                <p className="font-semibold">Tips for Improvement:</p>
                <ul className="list-disc ml-5 text-sm">
                  {result.feedback.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="bg-gray-700 text-white px-3 py-1 rounded hover:bg-gray-800"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${role.replace(/\s+/g, '_')}_resume_report.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download Report (JSON)
              </button>

              <button
                className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                onClick={generatePDF}
              >
                Download Report (PDF)
              </button>

              <button
                onClick={handleGeminiAnalyze}
                disabled={analyzing}
                className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
              >
                {analyzing ? 'Analyzing...' : '🧠 Run Gemini Analysis'}
              </button>
            </div>
          </div>
        )}

        {geminiResults && (
  <div className="mt-6 p-4 bg-white shadow rounded text-left border border-indigo-200">
    <h3 className="text-lg font-semibold text-indigo-700 mb-2">
      🧠 SmartHire™ Insight Report — Powered by <span className="italic">LucidHire™</span>
    </h3>

    <p className="text-sm mb-4 text-gray-700">
      Clara, your virtual recruiter, reviewed your resume for the <strong>{role}</strong> role. Here’s what she noticed:
    </p>

    <h4 className="font-semibold mb-1">🔍 Suggestions & Flags:</h4>
    <ul className="list-disc ml-5 text-sm mb-4">
      {geminiResults.suggestions.map((sugg, i) => (
        <li key={i}>
          {sugg.includes('quantifiable') && '🚩 '}
          {sugg.includes('tools') && '🧰 '}
          {sugg.includes('keywords') && '🧠 '}
          {sugg}
        </li>
      ))}
    </ul>

    <h4 className="font-semibold mt-3 mb-1">📊 Score Breakdown:</h4>
    {Object.entries(geminiResults.scoreBreakdown).map(([label, value], i) => (
      <div key={i} className="mb-3">
        <p className="text-sm font-medium capitalize">{label.replace(/([A-Z])/g, ' $1')}</p>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
  className={`h-4 rounded-full ${getBarColor(value)} transition-all duration-1000 ease-out`}
  style={{ width: `${value}%` }}
></div>

        </div>
        <p className="text-xs text-right text-gray-600 mt-1">{value}%</p>
      </div>
    ))}

    {/* Confidence Meter */}
<h4 className="font-semibold mt-4 mb-1">📶 Confidence Level:</h4>
<div className="w-full bg-gray-200 rounded-full h-4 mb-2">
  <div
    className={`h-4 rounded-full ${
      result!.score >= 80 ? 'bg-green-500'
      : result!.score >= 50 ? 'bg-yellow-400'
      : 'bg-red-500'
    } transition-all duration-1000 ease-out`}
    style={{ width: `${result!.score}%` }}
  ></div>
</div>
<p className="text-sm text-gray-700">
  {result!.score >= 80
    ? 'High Confidence'
    : result!.score >= 50
    ? 'Moderate Confidence'
    : 'Low Confidence'}
</p>


    <h4 className="font-semibold mt-4 mb-1">🎯 Top Roles You May Qualify For:</h4>
    <ul className="list-disc ml-5 text-sm">
      <li>Backend Engineer @ AWS</li>
      <li>Platform Developer @ Atlassian</li>
      <li>Infrastructure SRE @ Stripe</li>
      <li>Software Engineer II @ Duolingo</li>
      <li>Cloud Ops Engineer @ Snowflake</li>
    </ul>
  </div>
)}


      </div>
    </div>
  );
};

export default ResumeUploader;
