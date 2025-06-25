import { useState } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleUpload = async () => {
    if (!file) return alert('Please select a file.');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-purple-600 to-blue-500 text-white">
      <h1 className="text-3xl font-bold mb-6">SmartHire AI</h1>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="text-black mb-4"
      />

      <button
        onClick={handleUpload}
        className="px-6 py-2 bg-white text-blue-600 rounded hover:bg-gray-200"
      >
        Upload Resume
      </button>

      {result && (
        <div className="mt-6 bg-white text-black p-4 rounded shadow-md w-full max-w-md">
          <h3 className="text-lg font-semibold">
            Match Score: {result.results?.matchPercentage}%
          </h3>
          <ul className="list-disc mt-2 ml-5">
            {result.results?.topJobs.map((job: string, idx: number) => (
              <li key={idx}>{job}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}

export default App;
