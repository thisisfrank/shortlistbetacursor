import React, { useEffect, useState } from 'react';
import { formatAllJobDescriptions } from '../utils/retroactiveJobFormatter';

export const FormatJobsPage: React.FC = () => {
  const [status, setStatus] = useState<string>('Initializing...');
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);

  useEffect(() => {
    const runFormatting = async () => {
      try {
        setStatus('🚀 Starting formatting process...');
        
        const formatResults = await formatAllJobDescriptions();
        
        setResults(formatResults);
        setStatus('✅ Formatting complete!');
        setIsComplete(true);
        
        // Auto-redirect after 3 seconds
        setTimeout(() => {
          window.location.href = '/admin';
        }, 3000);
        
      } catch (error) {
        setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('Formatting error:', error);
      }
    };

    // Auto-run on mount
    runFormatting();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-shadowforce via-shadowforce-light to-shadowforce flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-shadowforce-light border border-supernova/30 rounded-lg p-8">
        <h1 className="text-4xl font-anton text-supernova mb-6 text-center uppercase">
          Formatting Job Descriptions
        </h1>
        
        <div className="bg-shadowforce rounded-lg p-6 font-mono text-sm">
          <div className="text-white-knight mb-4">{status}</div>
          
          {results && (
            <div className="space-y-2">
              <div className="text-green-400">✅ Successfully formatted: {results.success}</div>
              {results.failed > 0 && (
                <div className="text-red-400">❌ Failed: {results.failed}</div>
              )}
            </div>
          )}
          
          {isComplete && (
            <div className="mt-4 text-guardian text-xs">
              Redirecting to admin panel in 3 seconds...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

