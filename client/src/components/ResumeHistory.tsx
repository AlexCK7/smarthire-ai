import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface ResumeEntry {
  id: number;
  filename: string;
  score: number;
  top_job: string;
  created_at: string;
}

const ResumeHistory: React.FC = () => {
  const [history, setHistory] = useState<ResumeEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get<ResumeEntry[]>('http://localhost:5000/history');
        setHistory(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch history.");
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Resume History</h2>

      {error && <p className="text-red-600">{error}</p>}

      {history.length === 0 && <p>No history available.</p>}

      {history.map(entry => (
        <div key={entry.id} className="bg-white shadow-md rounded p-4 mb-4">
          <p><strong>Filename:</strong> {entry.filename}</p>
          <p><strong>Score:</strong> {entry.score}%</p>
          <p><strong>Top Job:</strong> {entry.top_job}</p>
          <p className="text-sm text-gray-500">
            Uploaded on: {new Date(entry.created_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
};

export default ResumeHistory;
