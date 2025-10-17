
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Mail, Loader2 } from 'lucide-react';

export function EmailTestPanel() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const testEmailConnection = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/test-email');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to test email connection. Check server logs.',
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Service Configuration
        </CardTitle>
        <CardDescription>
          Test your SMTP email configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testEmailConnection} 
          disabled={testing}
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : (
            <>
              <Mail className="mr-2 h-4 w-4" />
              Test Email Connection
            </>
          )}
        </Button>

        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            {result.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {result.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-semibold">Required Environment Variables:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>SMTP_HOST (e.g., smtp.gmail.com)</li>
            <li>SMTP_PORT (e.g., 587)</li>
            <li>SMTP_USER (your email)</li>
            <li>SMTP_PASSWORD (app password)</li>
          </ul>
          <p className="text-xs mt-2">
            Set these in Replit Secrets (🔒 icon in sidebar)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
