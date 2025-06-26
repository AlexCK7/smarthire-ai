import React, { useState } from 'react';
import axios from 'axios';

const ResumeUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ matchPercentage: number; topJobs: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await axios.post("http://localhost:5000/upload", formData);
      setResult(res.data.results);
    } catch (err) {
      console.error(err);
      setError("Upload failed. Please try again.");
    }
  };

  return (
    <div className="p-4 border rounded shadow w-full max-w-md mx-auto my-8">
      <h2 className="text-xl font-bold mb-4">Upload Resume</h2>
      <input type="file" accept=".pdf,.doc,.docx" onChange={handleChange} className="mb-4" />
      <button
        onClick={handleUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Upload
      </button>

            {result && (
        <div className="mt-4 p-3 bg-green-100 rounded">
          <p><strong>Match %:</strong> {result.matchPercentage}%</p>
          <p><strong>Top Job:</strong> {result.topJobs.join(', ')}</p>

          <div className="mt-4 flex gap-2">
            <button
              onClick={async () => {
                try {
                  await axios.delete("http://localhost:5000/history");
                  alert("History cleared.");
                } catch (err) {
                  console.error(err);
                  alert("Failed to clear history.");
                }
              }}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Clear History
            </button>

            <button
              onClick={() => window.location.reload()}
              className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
            >
              Refresh
            </button>
          </div>
        </div>
      )}


      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default ResumeUploader;
