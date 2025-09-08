'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Youtube, CheckCircle, AlertCircle } from 'lucide-react';

interface URLInputProps {
  onSubmit: (url: string, metadata?: Record<string, unknown>) => void;
  loading?: boolean;
  className?: string;
}

interface ValidationResult {
  isValid: boolean;
  metadata?: {
    title: string;
    author: string;
    duration: string;
    thumbnails?: string[];
  };
  error?: string;
}

export function URLInput({ onSubmit, loading = false, className = '' }: URLInputProps) {
  const [url, setUrl] = useState('');
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateUrl = async (inputUrl: string) => {
    if (!inputUrl.trim()) {
      setValidation(null);
      setError(null);
      return;
    }

    setValidating(true);
    setError(null);

    try {
      const response = await fetch(`/api/process-youtube?url=${encodeURIComponent(inputUrl)}`);
      const data = await response.json();

      if (data.success) {
        setValidation({
          isValid: true,
          metadata: data.data.metadata
        });
      } else {
        setValidation({
          isValid: false,
          error: data.details || data.error
        });
        setError(data.error);
      }
    } catch {
      const errorMsg = 'Failed to validate URL';
      setValidation({
        isValid: false,
        error: errorMsg
      });
      setError(errorMsg);
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (validation && !validation.isValid) {
      setError(validation.error || 'Invalid URL');
      return;
    }

    onSubmit(url, validation?.metadata);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    // Debounce validation
    const timeoutId = setTimeout(() => {
      if (newUrl.trim()) {
        validateUrl(newUrl);
      } else {
        setValidation(null);
        setError(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const getValidationIcon = () => {
    if (validating) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    
    if (validation?.isValid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    if (validation && !validation.isValid) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    
    return <Youtube className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="h-5 w-5 text-red-500" />
          YouTube Video Input
        </CardTitle>
        <CardDescription>
          Enter a YouTube URL to extract content and generate social media posts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="youtube-url">YouTube URL</Label>
            <div className="relative">
              <Input
                id="youtube-url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={handleUrlChange}
                disabled={loading || validating}
                className="pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {getValidationIcon()}
              </div>
            </div>
          </div>

          {/* Video preview when validated */}
          {validation?.isValid && validation.metadata && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {validation.metadata.thumbnails?.[0] && (
                    <img
                      src={validation.metadata.thumbnails[0]}
                      alt="Video thumbnail"
                      className="w-20 h-15 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-green-800 truncate">
                      {validation.metadata.title}
                    </h4>
                    <p className="text-sm text-green-600">
                      by {validation.metadata.author}
                    </p>
                    {validation.metadata.duration && (
                      <p className="text-xs text-green-500">
                        Duration: {validation.metadata.duration}
                      </p>
                    )}
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading || validating || !url.trim() || (validation !== null && !validation.isValid)}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Video...
              </>
            ) : (
              'Extract & Generate Content'
            )}
          </Button>
        </form>

        {/* Usage examples */}
        <div className="mt-6 text-sm text-muted-foreground">
          <p className="font-medium mb-2">Supported formats:</p>
          <ul className="space-y-1 text-xs">
            <li>• https://www.youtube.com/watch?v=VIDEO_ID</li>
            <li>• https://youtu.be/VIDEO_ID</li>
            <li>• https://www.youtube.com/embed/VIDEO_ID</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}