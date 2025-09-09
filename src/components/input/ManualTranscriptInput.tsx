'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Sparkles, AlertCircle, InfoIcon } from 'lucide-react';

interface ManualTranscriptInputProps {
  onSubmit: (transcript: string, metadata?: { title?: string; author?: string }) => void;
  loading?: boolean;
  className?: string;
}

export function ManualTranscriptInput({ onSubmit, loading = false, className = '' }: ManualTranscriptInputProps) {
  const [transcript, setTranscript] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transcript.trim()) {
      setError('Please enter a transcript');
      return;
    }

    if (transcript.trim().length < 50) {
      setError('Transcript is too short. Please enter at least 50 characters.');
      return;
    }

    setError(null);
    onSubmit(transcript.trim(), {
      title: title.trim() || 'Manual Transcript Input',
      author: author.trim() || 'Unknown Author'
    });
  };

  const handleTranscriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setTranscript(value);
    
    if (error && value.trim().length >= 50) {
      setError(null);
    }
  };

  const getWordCount = () => {
    return transcript.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getEstimatedReadTime = () => {
    const wordCount = getWordCount();
    return Math.ceil(wordCount / 250); // Average reading speed
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="premium-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Manual Transcript Input</CardTitle>
              <p className="text-gray-600 mt-1">Paste your transcript for AI-powered content generation</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <InfoIcon className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>How to get YouTube transcripts:</strong>
              <ol className="mt-2 space-y-1 text-sm">
                <li>1. Go to the YouTube video</li>
                <li>2. Click the &quot;...&quot; (more) button below the video</li>
                <li>3. Select &quot;Show transcript&quot;</li>
                <li>4. Copy the full transcript text</li>
                <li>5. Paste it in the textarea below</li>
              </ol>
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Optional metadata */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Video Title (Optional)
                </Label>
                <input
                  id="title"
                  type="text"
                  placeholder="Enter video title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
              
              <div>
                <Label htmlFor="author" className="text-sm font-medium text-gray-700">
                  Author/Channel (Optional)
                </Label>
                <input
                  id="author"
                  type="text"
                  placeholder="Enter author or channel name..."
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Transcript input */}
            <div>
              <Label htmlFor="transcript" className="text-sm font-medium text-gray-700 mb-2 block">
                Transcript Content *
              </Label>
              <Textarea
                id="transcript"
                placeholder="Paste your transcript here... 

Example:
Hello everyone, welcome to my channel. Today we're going to discuss the importance of artificial intelligence in modern business. AI has become a crucial tool for companies looking to stay competitive in today's market..."
                value={transcript}
                onChange={handleTranscriptChange}
                disabled={loading}
                className="min-h-[300px] text-sm leading-relaxed"
              />
              
              {/* Stats */}
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <div className="flex gap-4">
                  <span>{getWordCount()} words</span>
                  <span>{transcript.length} characters</span>
                  <span>~{getEstimatedReadTime()} min read</span>
                </div>
                <div>
                  {transcript.length >= 50 ? (
                    <span className="text-green-600 font-medium">✓ Ready</span>
                  ) : (
                    <span className="text-gray-400">Minimum 50 characters</span>
                  )}
                </div>
              </div>
            </div>

            {/* Error display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={loading || !transcript.trim() || transcript.trim().length < 50}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing Transcript...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Generate AI Analysis & Content
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}