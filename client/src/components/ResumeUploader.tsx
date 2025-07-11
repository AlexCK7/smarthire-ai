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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
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
    formData.append('jobDescription', jobDesc); // 🆕 send job description

    try {
      const res = await axios.post('http://localhost:5000/upload', formData);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      setError('Upload failed. Please try again.');
    }
  };

  const generatePDF = async () => {
    if (!result) return;

    const doc = await PDFDocument.create();
    const page = doc.addPage(useA4 ? PageSizes.A4 : [600, 600]);

    const font = await doc.embedFont(StandardFonts.Helvetica);
    const { height } = page.getSize();
    const fontSize = 12;

    let y = height - 50;
    const lineGap = 20;

    const drawLine = (text: string) => {
      page.drawText(text, { x: 50, y, size: fontSize, font, color: rgb(0, 0, 0) });
      y -= lineGap;
    };

    drawLine('SmartHire AI Resume Analysis Report');
    y -= 10;
    drawLine(`Target Role: ${role}`);
    drawLine(`Predicted Best Match: ${result.topJob}`);
    drawLine(`Match Score: ${result.score}%`);

    let confidence = 'Low';
    if (result.score >= 80) confidence = 'High';
    else if (result.score >= 50) confidence = 'Moderate';

    drawLine(`Confidence Level: ${confidence}`);
    drawLine(' ');

    drawLine('Tips for Improvement:');
    (result.feedback || []).forEach((tip) => drawLine(`• ${tip}`));

    const now = new Date().toLocaleString();
    drawLine(' ');
    drawLine(`Timestamp: ${now}`);

    const pdfBytes = await doc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${role.replace(/\s+/g, '_')}_resume_report.pdf`;
    a.click();
    URL.revokeObjectURL(url);
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
      <small className="text-gray-500">Improve matching by pasting the full job description here.</small>

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
          </div>
        </div>
      )}
    </div>
  </div>
  );
}

export default ResumeUploader;
