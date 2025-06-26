import ResumeUploader from './components/ResumeUploader';
import ResumeHistory from './components/ResumeHistory';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-center pt-6">SmartHire AI</h1>
      <ResumeUploader />
      <ResumeHistory />
    </div>
  );
}

export default App;
