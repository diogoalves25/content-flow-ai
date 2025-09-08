'use client';

import { useState } from 'react';
import { URLInput } from '@/components/input/URLInput';
import { TwitterOutput } from '@/components/generators/TwitterOutput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Sparkles, 
  Video, 
  Twitter, 
  Linkedin, 
  Instagram, 
  FileText,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Zap
} from 'lucide-react';
import type { TwitterThread } from '@/lib/generators/twitter-generator';

interface ExtractedContent {
  videoId: string;
  url: string;
  metadata: {
    title: string;
    author: string;
    duration: string;
    thumbnails?: string[];
  };
  transcript: Array<{
    text: string;
    offset: number;
    duration: number;
  }>;
  fullTranscript: string;
}

interface GenerationState {
  twitter?: TwitterThread;
  linkedin?: Record<string, unknown>;
  instagram?: Record<string, unknown>;
  blog?: Record<string, unknown>;
}

export default function HomePage() {
  const [step, setStep] = useState<'input' | 'processing' | 'generated'>('input');
  const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null);
  const [generations, setGenerations] = useState<GenerationState>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatingPlatform, setGeneratingPlatform] = useState<string | null>(null);

  const handleYouTubeSubmit = async (url: string) => {
    setLoading(true);
    setError(null);
    setStep('processing');

    try {
      const response = await fetch('/api/process-youtube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      if (data.success) {
        setExtractedContent(data.data.content);
        setStep('generated');
      } else {
        throw new Error(data.error || 'Failed to process video');
      }
    } catch (err) {
      console.error('Error processing YouTube video:', err);
      setError(err instanceof Error ? err.message : 'Failed to process video');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async (platform: 'twitter' | 'linkedin' | 'instagram' | 'blog') => {
    if (!extractedContent) return;

    setGeneratingPlatform(platform);

    try {
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: extractedContent.fullTranscript,
          platform,
          options: {
            tone: 'educational',
            includeHashtags: true,
            includeCallToAction: true
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setGenerations(prev => ({
          ...prev,
          [platform]: data.data.content
        }));
      } else {
        throw new Error(data.error || `Failed to generate ${platform} content`);
      }
    } catch (err) {
      console.error(`Error generating ${platform} content:`, err);
      setError(err instanceof Error ? err.message : `Failed to generate ${platform} content`);
    } finally {
      setGeneratingPlatform(null);
    }
  };

  const handleCopy = (content: string, type: 'thread' | 'tweet') => {
    // Could add analytics tracking here
    console.log(`Copied ${type}:`, content.slice(0, 50) + '...');
  };

  const resetApp = () => {
    setStep('input');
    setExtractedContent(null);
    setGenerations({});
    setError(null);
    setLoading(false);
    setGeneratingPlatform(null);
  };

  if (step === 'input') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ContentFlow AI
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform YouTube videos into engaging social media content with AI. 
              Extract, repurpose, and optimize your content for every platform.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {[
              { icon: Video, title: 'Extract', desc: 'YouTube transcripts' },
              { icon: Sparkles, title: 'Generate', desc: 'AI-powered content' },
              { icon: Twitter, title: 'Optimize', desc: 'Platform-specific' },
              { icon: Zap, title: 'Scale', desc: 'Multiple formats' }
            ].map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <feature.icon className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Input Section */}
          <div className="max-w-2xl mx-auto">
            <URLInput 
              onSubmit={handleYouTubeSubmit}
              loading={loading}
            />

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Example */}
          <div className="max-w-2xl mx-auto mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-2">Try with this example:</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleYouTubeSubmit('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}
            >
              Use Example Video
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <Card>
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                    <Video className="h-8 w-8 text-blue-600 animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">Processing Video</h2>
                  <p className="text-muted-foreground">
                    Extracting transcript and analyzing content...
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>YouTube video detected</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span>Extracting transcript...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header with video info */}
        {extractedContent && (
          <div className="mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {extractedContent.metadata.thumbnails?.[0] && (
                    <img
                      src={extractedContent.metadata.thumbnails[0]}
                      alt="Video thumbnail"
                      className="w-24 h-18 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h1 className="text-xl font-semibold mb-2">
                      {extractedContent.metadata.title}
                    </h1>
                    <p className="text-muted-foreground text-sm mb-2">
                      by {extractedContent.metadata.author} • {extractedContent.metadata.duration}
                    </p>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">
                        {extractedContent.fullTranscript.split(' ').length} words
                      </Badge>
                      <Button size="sm" variant="outline" onClick={resetApp}>
                        New Video
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Platform Generation Buttons */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { key: 'twitter', icon: Twitter, label: 'Twitter Thread' },
            { key: 'linkedin', icon: Linkedin, label: 'LinkedIn Post' },
            { key: 'instagram', icon: Instagram, label: 'Instagram Caption' },
            { key: 'blog', icon: FileText, label: 'Blog Article' }
          ].map(({ key, icon: Icon, label }) => (
            <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <Button
                  className="w-full"
                  variant={generations[key as keyof GenerationState] ? 'secondary' : 'outline'}
                  onClick={() => generateContent(key as 'twitter' | 'linkedin' | 'instagram' | 'blog')}
                  disabled={generatingPlatform !== null}
                >
                  {generatingPlatform === key ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  ) : generations[key as keyof GenerationState] ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <Icon className="h-4 w-4 mr-2" />
                  )}
                  {label}
                  {!generations[key as keyof GenerationState] && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Generated Content */}
        <div className="space-y-8">
          {generations.twitter && (
            <TwitterOutput
              thread={generations.twitter}
              onCopy={handleCopy}
            />
          )}

          {generations.linkedin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Linkedin className="h-5 w-5 text-blue-600" />
                  LinkedIn Post
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm">
                    {generations.linkedin.content}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add other platform outputs here */}
        </div>

        {error && (
          <Alert variant="destructive" className="mt-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}