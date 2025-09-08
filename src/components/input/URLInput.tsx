'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Youtube, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

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
    <div className={`premium-card p-8 ${className} animate-fade-in-up hover:scale-[1.02] transition-all duration-300`}>
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500 via-pink-500 to-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
          <Youtube className="h-10 w-10 text-white drop-shadow-sm" />
        </div>
        <h3 className="text-3xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          YouTube Video Input
        </h3>
        <p className="text-lg text-gray-600 leading-relaxed max-w-md mx-auto">
          Transform any YouTube video into viral social media content with AI
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <Label htmlFor="youtube-url" className="text-xl font-semibold text-gray-900 block">
            YouTube URL
          </Label>
          <div className="relative group">
            <Input
              id="youtube-url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              value={url}
              onChange={handleUrlChange}
              disabled={loading || validating}
              className="h-16 text-lg pl-6 pr-14 rounded-2xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all bg-white/90 backdrop-blur-sm shadow-sm group-hover:shadow-md"
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 transition-all">
              {getValidationIcon()}
            </div>
          </div>
        </div>

        {/* Video preview when validated */}
        {validation?.isValid && validation.metadata && (
          <div className="premium-card p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 animate-fade-in-up">
            <div className="flex items-start gap-4">
              {validation.metadata.thumbnails?.[0] && (
                <img
                  src={validation.metadata.thumbnails[0]}
                  alt="Video thumbnail"
                  className="w-24 h-18 object-cover rounded-xl shadow-md"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-green-900 text-lg mb-1 truncate">
                  {validation.metadata.title}
                </h4>
                <p className="text-green-700 font-medium mb-1">
                  by {validation.metadata.author}
                </p>
                {validation.metadata.duration && (
                  <p className="text-green-600 text-sm">
                    Duration: {validation.metadata.duration}
                  </p>
                )}
              </div>
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 drop-shadow-sm" />
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <Alert variant="destructive" className="rounded-2xl border-red-200 bg-red-50/80 backdrop-blur-sm">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          disabled={loading || validating || !url.trim() || (validation !== null && !validation.isValid)}
          className="w-full h-16 text-lg font-semibold rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <>
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              Processing Video...
            </>
          ) : (
            <>
              <Sparkles className="mr-3 h-5 w-5" />
              Extract & Generate Content
            </>
          )}
        </Button>
      </form>

      {/* Usage examples */}
      <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-purple-50/30 rounded-2xl border border-gray-100">
        <p className="font-semibold text-gray-900 mb-3 text-lg">Supported formats:</p>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-center text-sm">
            <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
            https://www.youtube.com/watch?v=VIDEO_ID
          </li>
          <li className="flex items-center text-sm">
            <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
            https://youtu.be/VIDEO_ID
          </li>
          <li className="flex items-center text-sm">
            <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
            https://www.youtube.com/embed/VIDEO_ID
          </li>
        </ul>
      </div>
    </div>
  );
}