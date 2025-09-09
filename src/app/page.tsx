'use client';

import { useState } from 'react';
import { URLInput } from '@/components/input/URLInput';
import { ManualTranscriptInput } from '@/components/input/ManualTranscriptInput';
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
  Zap,
  Copy
} from 'lucide-react';
import type { TwitterThread } from '@/lib/generators/twitter-generator';
import type { LinkedInPost } from '@/lib/generators/linkedin-generator';
import type { TranscriptAnalysis } from '@/lib/transcript-analyzer';
import { TranscriptAnalysisComponent } from '@/components/analysis/TranscriptAnalysis';

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
  linkedin?: LinkedInPost;
  instagram?: Record<string, unknown>;
  blog?: Record<string, unknown>;
}

export default function HomePage() {
  const [step, setStep] = useState<'input' | 'processing' | 'analysis' | 'generated'>('input');
  const [inputType, setInputType] = useState<'url' | 'manual'>('url');
  const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null);
  const [analysis, setAnalysis] = useState<TranscriptAnalysis | null>(null);
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
        setAnalysis(data.data.analysis);
        
        // If we have analysis, show analysis step, otherwise skip to generated
        if (data.data.analysis) {
          setStep('analysis');
        } else {
          setStep('generated');
        }
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

    console.log('About to generate content for:', platform);
    console.log('Full transcript being sent:', extractedContent.fullTranscript.substring(0, 200) + '...');
    console.log('Full transcript length:', extractedContent.fullTranscript.length);
    console.log('Is fallback message?', extractedContent.fullTranscript.includes('[No transcript available'));

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

  const handleManualTranscriptSubmit = async (transcript: string, metadata?: { title?: string; author?: string }) => {
    setLoading(true);
    setError(null);
    setStep('processing');

    try {
      const response = await fetch('/api/process-manual-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript, metadata })
      });

      const data = await response.json();

      if (data.success) {
        setExtractedContent(data.data.content);
        setAnalysis(data.data.analysis);
        
        // If we have analysis, show analysis step, otherwise skip to generated
        if (data.data.analysis) {
          setStep('analysis');
        } else {
          setStep('generated');
        }
      } else {
        throw new Error(data.error || 'Failed to process transcript');
      }
    } catch (err) {
      console.error('Error processing manual transcript:', err);
      setError(err instanceof Error ? err.message : 'Failed to process transcript');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const proceedToGeneration = () => {
    setStep('generated');
  };

  const resetApp = () => {
    setStep('input');
    setInputType('url');
    setExtractedContent(null);
    setAnalysis(null);
    setGenerations({});
    setError(null);
    setLoading(false);
    setGeneratingPlatform(null);
  };

  if (step === 'input') {
    return (
      <div className="min-h-screen bg-premium-gradient relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-3xl animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-white/20 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-2xl animate-float" style={{ animationDelay: '0.8s' }}></div>
          <div className="absolute top-1/4 right-1/4 w-60 h-60 bg-gradient-to-br from-blue-200/20 to-cyan-200/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '2.2s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          {/* Premium Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/30 animate-bounce-in">
              <Sparkles className="h-4 w-4 text-white animate-glow" />
              <span className="text-sm font-medium text-white">AI-Powered Content Creation</span>
            </div>
            <h1 className="text-6xl font-bold mb-6 text-white leading-tight animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Content<span className="text-transparent bg-gradient-to-r from-yellow-200 to-pink-200 bg-clip-text animate-shimmer">Flow</span> AI
            </h1>
            <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              Transform YouTube videos into engaging social media content with AI. 
              Extract, repurpose, and optimize your content for every platform in seconds.
            </p>
          </div>

          {/* Premium Features Grid */}
          <div className="grid md:grid-cols-4 gap-8 mb-16">
            {[
              { 
                icon: Video, 
                title: 'Smart Extract', 
                desc: 'AI-powered YouTube transcript extraction with metadata',
                containerGradient: 'from-red-500 via-pink-500 to-rose-500',
                iconColor: 'text-white',
                delay: '0ms'
              },
              { 
                icon: Sparkles, 
                title: 'AI Generate', 
                desc: 'Advanced GPT-4 powered content generation',
                containerGradient: 'from-purple-500 via-violet-500 to-indigo-500',
                iconColor: 'text-white',
                delay: '100ms'
              },
              { 
                icon: Twitter, 
                title: 'Multi-Platform', 
                desc: 'Optimized for Twitter, LinkedIn, Instagram',
                containerGradient: 'from-blue-500 via-cyan-500 to-teal-500',
                iconColor: 'text-white',
                delay: '200ms'
              },
              { 
                icon: Zap, 
                title: 'Instant Scale', 
                desc: 'Generate content for multiple platforms simultaneously',
                containerGradient: 'from-yellow-500 via-orange-500 to-red-500',
                iconColor: 'text-white',
                delay: '300ms'
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="premium-card p-8 text-center group hover:scale-105 animate-fade-in-up"
                style={{ animationDelay: feature.delay }}
              >
                <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br ${feature.containerGradient} flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-xl`}>
                  <feature.icon className={`h-9 w-9 ${feature.iconColor} drop-shadow-sm`} />
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Premium Input Section */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                Get Started in Seconds
              </h2>
              <p className="text-white/80 text-lg">
                Extract from YouTube URLs or paste your own transcript for AI-powered content generation
              </p>
              
              {/* Input Type Selector */}
              <div className="mt-6 flex items-center justify-center gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-full p-1 flex">
                  <button
                    onClick={() => setInputType('url')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                      inputType === 'url'
                        ? 'bg-white text-purple-700 shadow-md'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    YouTube URL
                  </button>
                  <button
                    onClick={() => setInputType('manual')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                      inputType === 'manual'
                        ? 'bg-white text-purple-700 shadow-md'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    Manual Input
                  </button>
                </div>
              </div>
            </div>
            
            {inputType === 'url' ? (
              <URLInput 
                onSubmit={handleYouTubeSubmit}
                loading={loading}
                className="animate-fade-in-up"
                style={{ animationDelay: '400ms' }}
              />
            ) : (
              <ManualTranscriptInput 
                onSubmit={handleManualTranscriptSubmit}
                loading={loading}
                className="animate-fade-in-up"
              />
            )}

            {error && (
              <div className="mt-6 premium-card p-4 border-l-4 border-red-500 bg-red-50">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                  <div className="text-red-800 font-medium">{error}</div>
                </div>
              </div>
            )}
          </div>

          {/* Social Proof */}
          <div className="max-w-4xl mx-auto text-center">
            <div className="premium-card p-8 animate-fade-in-up hover:scale-105 transition-all duration-300" style={{ animationDelay: '500ms' }}>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="group cursor-pointer">
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                    10,000+
                  </div>
                  <div className="text-gray-600 group-hover:text-purple-600 transition-colors duration-300">Videos Processed</div>
                  <div className="w-12 h-1 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto mt-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="group cursor-pointer">
                  <div className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                    50,000+
                  </div>
                  <div className="text-gray-600 group-hover:text-pink-600 transition-colors duration-300">Social Posts Generated</div>
                  <div className="w-12 h-1 bg-gradient-to-r from-pink-400 to-purple-400 mx-auto mt-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="group cursor-pointer">
                  <div className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
                    95%
                  </div>
                  <div className="text-gray-600 group-hover:text-green-600 transition-colors duration-300">Time Saved</div>
                  <div className="w-12 h-1 bg-gradient-to-r from-green-400 to-teal-400 mx-auto mt-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>
            </div>
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

  if (step === 'analysis' && analysis && extractedContent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="max-w-6xl mx-auto mb-8">
            <div className="flex items-center justify-between mb-4">
              <Button onClick={resetApp} variant="outline">
                ← Start Over
              </Button>
              <Button onClick={proceedToGeneration} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Proceed to Content Generation →
              </Button>
            </div>
            
            {/* Video Info */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {extractedContent.metadata.thumbnails?.[0] && (
                    <img
                      src={extractedContent.metadata.thumbnails[0]}
                      alt="Video thumbnail"
                      className="w-32 h-24 object-cover rounded-lg shadow-md"
                    />
                  )}
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {extractedContent.metadata.title}
                    </h1>
                    <p className="text-gray-600 mb-2">by {extractedContent.metadata.author}</p>
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>Duration: {extractedContent.metadata.duration}</span>
                      <span>•</span>
                      <span>Transcript: {analysis.wordCount.toLocaleString()} words</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analysis Component */}
          <div className="max-w-6xl mx-auto">
            <TranscriptAnalysisComponent
              analysis={analysis}
              fullTranscript={extractedContent.fullTranscript}
              onAnalysisUpdate={(updatedAnalysis) => setAnalysis(updatedAnalysis)}
            />
          </div>

          {/* Footer Actions */}
          <div className="max-w-6xl mx-auto mt-8 text-center">
            <p className="text-gray-600 mb-4">
              Review the analysis above, then proceed to generate platform-specific content
            </p>
            <Button onClick={proceedToGeneration} size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Generate Content for All Platforms
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header with video info and transcript display */}
        {extractedContent && (
          <div className="mb-8 space-y-6">
            {/* Video Info Card */}
            <Card className="bg-white border-gray-200">
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
                    <h1 className="text-xl font-semibold mb-2 text-gray-900">
                      {extractedContent.metadata.title}
                    </h1>
                    <p className="text-gray-600 text-sm mb-2">
                      by {extractedContent.metadata.author} • {extractedContent.metadata.duration}
                    </p>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                        {extractedContent.fullTranscript.split(' ').length} words
                      </Badge>
                      <Button size="sm" variant="outline" onClick={resetApp} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                        New Video
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transcript Display */}
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <FileText className="h-5 w-5" />
                  Extracted Transcript
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {extractedContent.fullTranscript.includes('[No transcript available') ? (
                    <div className="space-y-6">
                      <div className="text-blue-700 bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-5 w-5" />
                          <strong>Manual transcript input required</strong>
                        </div>
                        <p className="text-sm mb-3">
                          YouTube&apos;s automatic transcript extraction is currently limited. To generate high-quality content, please paste the video transcript below.
                        </p>
                        <details className="text-xs text-blue-600">
                          <summary className="cursor-pointer hover:text-blue-800">How to get the transcript manually</summary>
                          <div className="mt-2 pl-4 border-l-2 border-blue-300">
                            <p>1. Open the YouTube video in a browser</p>
                            <p>2. Click the &quot;...&quot; menu below the video</p>
                            <p>3. Select &quot;Show transcript&quot;</p>
                            <p>4. Copy the text and paste it below</p>
                          </div>
                        </details>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="block text-base font-semibold text-gray-900">
                          Paste Video Transcript:
                        </label>
                        <textarea
                          className="w-full p-4 border-2 border-blue-300 rounded-lg bg-white text-gray-900 min-h-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Paste the complete video transcript here...

For best results, include the full transcript with natural breaks between sentences. This will be used to generate engaging content for your social media platforms."
                          onChange={(e) => {
                            const newTranscript = e.target.value;
                            if (newTranscript.trim()) {
                              setExtractedContent(prev => prev ? {
                                ...prev,
                                fullTranscript: newTranscript,
                                transcript: [{ text: newTranscript, offset: 0, duration: 0 }]
                              } : null);
                            }
                          }}
                        />
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Content generation will use this transcript</span>
                          <span className="text-xs text-gray-500">💡 Longer transcripts = better content</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {extractedContent.fullTranscript}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Platform Generation Buttons */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[
            { 
              key: 'twitter', 
              icon: Twitter, 
              label: 'Twitter Thread',
              gradient: 'from-blue-500 to-cyan-500',
              bgGradient: 'from-blue-50 to-cyan-50'
            },
            { 
              key: 'linkedin', 
              icon: Linkedin, 
              label: 'LinkedIn Post',
              gradient: 'from-blue-600 to-blue-700',
              bgGradient: 'from-blue-50 to-indigo-50'
            },
            { 
              key: 'instagram', 
              icon: Instagram, 
              label: 'Instagram Post',
              gradient: 'from-pink-500 via-purple-500 to-orange-500',
              bgGradient: 'from-pink-50 to-purple-50'
            },
            { 
              key: 'blog', 
              icon: FileText, 
              label: 'Blog Article',
              gradient: 'from-gray-600 to-gray-800',
              bgGradient: 'from-gray-50 to-slate-50'
            }
          ].map(({ key, icon: Icon, label, gradient, bgGradient }) => (
            <div key={key} className={`premium-card p-6 cursor-pointer hover:scale-105 transition-all duration-200 ${
              generations[key as keyof GenerationState] 
                ? `bg-gradient-to-r ${bgGradient} border-2 border-green-200` 
                : 'bg-white/95 hover:bg-white'
            }`}>
              <Button
                className="w-full h-auto p-4 flex flex-col items-center gap-3 bg-transparent hover:bg-transparent border-none shadow-none"
                onClick={() => generateContent(key as 'twitter' | 'linkedin' | 'instagram' | 'blog')}
                disabled={generatingPlatform !== null}
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                  {generatingPlatform === key ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : generations[key as keyof GenerationState] ? (
                    <CheckCircle className="h-6 w-6 text-white drop-shadow-sm" />
                  ) : (
                    <Icon className="h-6 w-6 text-white drop-shadow-sm" />
                  )}
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900 text-base mb-1">{label}</div>
                  {generations[key as keyof GenerationState] ? (
                    <div className="text-sm text-green-600 font-medium">Generated ✓</div>
                  ) : generatingPlatform === key ? (
                    <div className="text-sm text-purple-600 font-medium">Generating...</div>
                  ) : (
                    <div className="text-sm text-gray-500">Click to generate</div>
                  )}
                </div>
              </Button>
            </div>
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
            <div className="premium-card p-8 animate-fade-in-up">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                    <Linkedin className="h-5 w-5 text-white drop-shadow-sm" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    LinkedIn Post
                  </h2>
                </div>
                <p className="text-gray-600 text-lg">
                  Professional content ready to share on LinkedIn
                </p>
              </div>
              
              <div className="premium-card p-6 bg-gradient-to-r from-blue-50 to-indigo-50/50 border border-blue-100/50">
                <div className="text-gray-900 leading-relaxed">
                  <pre className="whitespace-pre-wrap font-sans text-base">
                    {generations.linkedin.content}
                  </pre>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => handleCopy(generations.linkedin?.content || '', 'thread')}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Post
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Instagram Content Display */}
          {generations.instagram && (
            <div className="premium-card p-8 animate-fade-in-up">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500 flex items-center justify-center shadow-lg">
                    <Instagram className="h-5 w-5 text-white drop-shadow-sm" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Instagram Post
                  </h2>
                </div>
                <p className="text-gray-600 text-lg">
                  Engaging post content optimized for Instagram&apos;s visual platform
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-xl border border-pink-100">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Instagram className="h-4 w-4" />
                    Instagram Post
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {(generations.instagram as Record<string, unknown>)?.content as string || 'Generated Instagram content'}
                    </p>
                  </div>
                </div>

                {!!(generations.instagram as Record<string, unknown>)?.hashtags && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Hashtags:</h4>
                    <div className="flex flex-wrap gap-2">
                      {((generations.instagram as Record<string, unknown>).hashtags as string[]).map((tag: string, index: number) => (
                        <span key={index} className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {!!(generations.instagram as Record<string, unknown>)?.engagementTips && (
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-orange-900 mb-2">💡 Engagement Tips:</h4>
                    <ul className="text-orange-800 text-sm space-y-1">
                      {((generations.instagram as Record<string, unknown>).engagementTips as string[]).map((tip: string, index: number) => (
                        <li key={index}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => handleCopy((generations.instagram as Record<string, unknown>)?.content as string || '', 'thread')}
                    className="bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 hover:from-pink-600 hover:via-purple-600 hover:to-orange-600 text-white rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Content
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Blog Content Display */}
          {generations.blog && (
            <div className="premium-card p-8 animate-fade-in-up">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center shadow-lg">
                    <FileText className="h-5 w-5 text-white drop-shadow-sm" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Blog Article
                  </h2>
                </div>
                <p className="text-gray-600 text-lg">
                  Complete blog post ready for publication
                </p>
              </div>

              <div className="space-y-6">
                {!!(generations.blog as Record<string, unknown>)?.title && (
                  <div className="border-l-4 border-gray-500 pl-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
{String((generations.blog as Record<string, unknown>).title || '')}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {!!(generations.blog as Record<string, unknown>)?.wordCount && (
                        <span>📝 {String((generations.blog as Record<string, unknown>).wordCount || '')} words</span>
                      )}
                      {!!(generations.blog as Record<string, unknown>)?.readTime && (
                        <span>⏱️ {String((generations.blog as Record<string, unknown>).readTime || '')}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <div className="prose prose-lg max-w-none">
                    <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {(generations.blog as Record<string, unknown>)?.content as string || 'Generated blog content'}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => handleCopy((generations.blog as Record<string, unknown>)?.content as string || '', 'thread')}
                    className="bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Article
                  </Button>
                </div>
              </div>
            </div>
          )}
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