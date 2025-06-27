import React, { useState } from 'react';
import axios from 'axios';
import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';

const ResumeUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [role, setRole] = useState<string>('Software Engineer');
  const [result, setResult] = useState<{
    score: number;
    topJob: string;
    feedback: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useA4, setUseA4] = useState<boolean>(false); // 🆕 PDF page size toggle

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
    const page = doc.addPage(useA4 ? PageSizes.A4 : [600, 600]); // 🆕 conditional page size

    const font = await doc.embedFont(StandardFonts.Helvetica);
    const { height } = page.getSize();
    const fontSize = 12;

    let y = height - 50;
    const lineGap = 20;

    const drawLine = (text: string) => {
      page.drawText(text, {
        x: 50,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
      y -= lineGap;
    };

    drawLine('SmartHire AI Resume Analysis Report');
    y -= 10;
    drawLine(`Target Role: ${role}`);
    drawLine(`Predicted Best Match: ${result.topJob}`);
    drawLine(`Match Score: ${result.score}%`);

    // Confidence rating
    let confidence = 'Low';
    if (result.score >= 80) confidence = 'High';
    else if (result.score >= 50) confidence = 'Moderate';

    drawLine(`Confidence Level: ${confidence}`);
    drawLine(' '); // spacing

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
    <div className="p-4 border rounded shadow w-full max-w-md mx-auto my-8 bg-white">
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

      {/* Explanation Blurb */}
      <div className="text-sm text-gray-700 mb-4 bg-gray-100 rounded p-3">
        {role === "Software Engineer" && (
          <p><strong>Software Engineer:</strong> Builds and maintains software using programming languages, frameworks, and tools. Works on backend systems, APIs, or client-side apps.</p>
        )}
        {role === "Data Analyst" && (
          <p><strong>Data Analyst:</strong> Interprets data, runs statistical analysis, and creates dashboards or reports to help businesses make informed decisions.</p>
        )}
        {role === "Web Developer" && (
          <p><strong>Web Developer:</strong> Designs and develops websites or web apps using technologies like HTML, CSS, JavaScript, and frameworks like React or Node.</p>
        )}
      </div>

      <input type="file" accept=".pdf,.doc,.docx" onChange={handleChange} className="mb-4" />
      
      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Upload
      </button>

      <p className="text-sm text-gray-600 italic">
        You selected <strong>{role}</strong> as your target role.
      </p>

      {/* Toggle for PDF size */}
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

          {/* Download Buttons */}
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
  );
};

export default ResumeUploader;
