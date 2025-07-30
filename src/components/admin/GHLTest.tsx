import React, { useState } from 'react';
import { Card, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { ghlService } from '../../services/ghlService';

export const GHLTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleTestWebhook = async () => {
    setLoading(true);
    setResult('');
    
    try {
      await ghlService.sendTestNotification();
      setResult('Test webhook sent! Check your GoHighLevel dashboard and browser console for details.');
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">GoHighLevel Webhook Test</h3>
        <p className="text-sm text-gray-600 mb-4">
          Send a test webhook payload to verify your GoHighLevel integration is working.
        </p>
        
        <Button 
          onClick={handleTestWebhook}
          isLoading={loading}
          disabled={loading}
          fullWidth
        >
          Send Test Webhook
        </Button>
        
        {result && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">{result}</p>
          </div>
        )}
        
        <div className="mt-4 text-xs text-gray-500">
          <p>Check the browser console for detailed logs.</p>
          <p>Environment variable: VITE_GHL_WEBHOOK_URL</p>
        </div>
      </CardContent>
    </Card>
  );
}; 